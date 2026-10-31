import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, todayKey } from './dates';
import { BOARD, CHECKS, DEEP, EVENING, GrowthData, SCORES } from './growth';
import { SECTIONS } from './sections';
import { Entries, entryKey } from './store';

// AI coach chat through the Google Gemini API, which has a free tier. The API
// key is the user's own, made in Google AI Studio, entered on the 我的 page and
// kept only on this device: it is never synced to Google Drive or written into
// backups. Gemini allows calls straight from the browser, so the web version
// needs no server of its own.

export type AiSettings = { apiKey: string; model: string };
export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** Google's alias for its newest Flash model, which is on the free tier. */
export const DEFAULT_MODEL = 'gemini-flash-latest';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const SETTINGS_KEY = 'ai.settings.v1';
const CHAT_KEY = 'ai.chat.v1';
/** How many past messages are sent along, so long chats stay cheap. */
const HISTORY_LIMIT = 20;
/** How many days of check-ins and reflections the coach sees. */
const CONTEXT_DAYS = 7;

export async function loadAiSettings(): Promise<AiSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  const saved = raw ? (JSON.parse(raw) as Partial<AiSettings>) : {};
  return { apiKey: saved.apiKey ?? '', model: saved.model || DEFAULT_MODEL };
}

export async function saveAiSettings(settings: AiSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadChat(): Promise<ChatMessage[]> {
  const raw = await AsyncStorage.getItem(CHAT_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveChat(messages: ChatMessage[]): Promise<void> {
  await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(messages));
}

/** The user's blueprint and the last week of check-ins and reflections, as plain text. */
export function buildContext(entries: Entries, growth: GrowthData): string {
  const lines: string[] = [];
  const bp = growth.blueprint;
  if (bp) {
    const board = BOARD.filter((b) => bp[b.key].trim()).map((b) => `- ${b.name}：${bp[b.key].trim()}`);
    if (board.length) lines.push('【人生蓝图】', ...board);
    const deep = DEEP.flatMap((g) => g.qs)
      .filter(([k]) => (bp.deep[k] ?? '').trim())
      .map(([k, q]) => `- ${q} ${bp.deep[k].trim()}`);
    if (deep.length) lines.push('【深度挖掘】', ...deep);
  }

  const today = todayKey();
  for (let i = CONTEXT_DAYS - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const day: string[] = [];
    for (const s of SECTIONS) {
      const e = entries[entryKey(date, s.key)];
      if (e && !e.deleted) day.push(`- ${s.title}：${e.note.trim() || '（只拍了照片）'}`);
    }
    const g = growth.days[date];
    if (g) {
      g.levers.forEach((l, j) => l.trim() && day.push(`- 关键动作：${l.trim()}${g.done[j] ? '（已完成）' : ''}`));
      for (const c of [...CHECKS, ...EVENING]) {
        const a = (g.notes[c.key] ?? '').trim();
        if (a) day.push(`- ${c.q} ${a}`);
      }
      for (const s of SCORES) if (g.score[s.key]) day.push(`- 自评「${s.label}」：${g.score[s.key]}/5`);
    }
    if (day.length) lines.push(`【${date}${date === today ? ' 今天' : ''}】`, ...day);
  }
  return lines.join('\n');
}

function systemPrompt(context: string): string {
  return [
    '你是「优我」app 里的成长教练，用中文回答，语气温暖但直接，回答简短具体。',
    '用户在用 Dan Koe《How to fix your entire life in 1 day》的方法：写反愿景和愿景，拆成 1 年目标、1 个月项目和每日杠杆，白天自问打断自动驾驶，晚上反思。',
    '用户还每天在学习、读书、运动、健康饮食、休息、冥想六个版面打卡。',
    '帮用户看清模式、指出逃避和旧信念，并给出下一步可以做的小行动。不要编造用户没写过的内容。',
    context ? `以下是用户最近的记录：\n${context}` : '用户还没有写任何记录。',
  ].join('\n');
}

export async function askAi(settings: AiSettings, history: ChatMessage[], context: string): Promise<string> {
  const url = `${API_BASE}/${encodeURIComponent(settings.model)}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt(context) }] },
      contents: history.slice(-HISTORY_LIMIT).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.error?.message ?? res.statusText;
    if (res.status === 400 && /API key/i.test(detail)) throw new Error(`API Key 无效（${detail}）`);
    if (res.status === 403) throw new Error(`API Key 没有权限（${detail}）`);
    if (res.status === 429) throw new Error('今天的免费额度用完了，或者发得太快，稍等一会儿再试');
    throw new Error(`Gemini 返回错误 ${res.status}：${detail}`);
  }
  const parts: { text?: string }[] = body?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? '').join('');
  if (!text.trim()) throw new Error('Gemini 没有返回内容，换个说法再试试');
  return text.trim();
}
