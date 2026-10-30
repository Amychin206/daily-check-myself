import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { GrowthArt, GrowthArtKind } from '../../src/components/GrowthArt';
import { addDays, formatDateLabel, todayKey } from '../../src/dates';
import { notify } from '../../src/dialogs';
import {
  answeredCount,
  averageScore,
  BOARD,
  CHECKS,
  currentCheckIndex,
  DEEP,
  EVENING,
  GAME_NOTE,
  GAME_TABLE,
  GrowthDay,
  READING,
  SCORES,
  SUMMARY,
} from '../../src/growth';
import { useGrowth } from '../../src/growthStore';
import { loadGrowthReminders, setGrowthReminders } from '../../src/reminders';
import { Theme, useTheme } from '../../src/theme';

// 成长: a daily identity practice. Four views: today's run sheet, the life
// blueprint (written once, revisited monthly), past days, and reading notes.

type View_ = 'today' | 'board' | 'history' | 'read';

const VIEWS: { key: View_; label: string }[] = [
  { key: 'today', label: '今天' },
  { key: 'board', label: '蓝图' },
  { key: 'history', label: '记录' },
  { key: 'read', label: '精读' },
];

const ANTI = { bg: 'rgba(226,110,70,0.14)', fg: '#D0602F' };
const VISION = { bg: 'rgba(18,160,126,0.14)', fg: '#12A07E' };

export default function GrowthScreen() {
  const theme = useTheme();
  const { data } = useGrowth();
  const [view, setView] = useState<View_>('today');
  const today = todayKey();
  const streak = practiceStreak(data.days, today);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={[styles.date, { color: theme.muted }]}>{formatDateLabel(today)}</Text>
        {streak > 0 && <Text style={styles.streak}>连续练习 {streak} 天</Text>}
      </View>
      <View style={[styles.segment, { backgroundColor: theme.empty }]}>
        {VIEWS.map((v) => (
          <Pressable
            key={v.key}
            style={[styles.segmentItem, view === v.key && { backgroundColor: theme.card }]}
            onPress={() => setView(v.key)}
          >
            <Text
              style={{ color: view === v.key ? theme.text : theme.muted, fontWeight: view === v.key ? '700' : '500' }}
            >
              {v.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {view === 'today' && <TodayView theme={theme} date={today} onOpenBoard={() => setView('board')} />}
      {view === 'board' && <BoardView theme={theme} />}
      {view === 'history' && <HistoryView theme={theme} />}
      {view === 'read' && <ReadView theme={theme} />}
    </ScrollView>
  );
}

function hasContent(day: GrowthDay | undefined): boolean {
  return !!day && (answeredCount(day) > 0 || day.done.some(Boolean) || Object.keys(day.score).length > 0);
}

/** Consecutive days with something written, counting back from today (or yesterday if today is still empty). */
function practiceStreak(days: Record<string, GrowthDay>, today: string): number {
  let date = hasContent(days[today]) ? today : addDays(today, -1);
  let n = 0;
  while (hasContent(days[date])) {
    n++;
    date = addDays(date, -1);
  }
  return n;
}

function Card({
  theme,
  title,
  hint,
  art,
  children,
}: {
  theme: Theme;
  title?: string;
  hint?: string;
  /** A banner illustration across the top of the card, with the title on it. */
  art?: GrowthArtKind;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      {art ? (
        <View style={styles.banner}>
          <GrowthArt kind={art} style={StyleSheet.absoluteFill} />
          {title ? <Text style={styles.bannerTitle}>{title}</Text> : null}
        </View>
      ) : title ? (
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      ) : null}
      {hint ? <Text style={[styles.hint, { color: theme.muted }]}>{hint}</Text> : null}
      {children}
    </View>
  );
}

function Field({
  theme,
  value,
  onChange,
  placeholder,
  lines = 2,
}: {
  theme: Theme;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  lines?: number;
}) {
  return (
    <TextInput
      style={[
        styles.input,
        { minHeight: 20 + lines * 22, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={theme.muted}
      multiline
      textAlignVertical="top"
    />
  );
}

function TodayView({ theme, date, onOpenBoard }: { theme: Theme; date: string; onOpenBoard: () => void }) {
  const { data, getDay, updateDay } = useGrowth();
  const day = getDay(date);
  const bp = data.blueprint;
  const now = currentCheckIndex();
  const setNote = (key: string, v: string) => updateDay(date, { notes: { ...day.notes, [key]: v } });

  return (
    <>
      <Card theme={theme} art="morning" title="早上 · 先看清方向">
        <View style={styles.lens}>
          <Lens theme={theme} colors={ANTI} label="我绝不再变成" text={bp?.anti} onEmpty={onOpenBoard} />
          <Lens theme={theme} colors={VISION} label="我正在打造" text={bp?.vision} onEmpty={onOpenBoard} />
        </View>
        {bp?.month?.trim() ? (
          <Text style={[styles.hint, { color: theme.muted, marginTop: 10, marginBottom: 0 }]}>
            本月 Boss 战：{bp.month.trim()}
          </Text>
        ) : null}
      </Card>

      <Card theme={theme} art="levers" title="今天的 2～3 件事" hint="理想中的我，今天自然会做的事。">
        {day.levers.map((text, i) => (
          <View key={i} style={styles.lever}>
            <Pressable
              hitSlop={8}
              style={[styles.checkbox, { borderColor: theme.accent }, day.done[i] && { backgroundColor: theme.accent }]}
              onPress={() => {
                const done = [...day.done];
                done[i] = !done[i];
                updateDay(date, { done });
              }}
            >
              {day.done[i] ? <Text style={styles.tick}>✓</Text> : null}
            </Pressable>
            <TextInput
              style={[
                styles.leverInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg },
                day.done[i] && { textDecorationLine: 'line-through', color: theme.muted },
              ]}
              value={text}
              placeholder={`第 ${i + 1} 件事`}
              placeholderTextColor={theme.muted}
              onChangeText={(v) => {
                const levers = [...day.levers];
                levers[i] = v;
                updateDay(date, { levers });
              }}
            />
          </View>
        ))}
      </Card>

      <Card theme={theme} art="day" title="白天 · 打断自动驾驶" hint="到点停一下，写一句就好。">
        {Platform.OS !== 'web' && <GrowthReminderSwitch theme={theme} />}
        {CHECKS.map((c, i) => (
          <View key={c.key} style={[styles.question, i > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
            <View style={styles.questionHead}>
              <Text style={[styles.time, { color: i === now ? theme.accent : theme.muted }]}>{c.time}</Text>
              <Text style={[styles.q, { color: theme.text }, i === now && { fontWeight: '700' }]}>{c.q}</Text>
            </View>
            {i === now && (
              <View style={[styles.pill, { backgroundColor: theme.accent }]}>
                <Text style={styles.pillText}>现在</Text>
              </View>
            )}
            <Field theme={theme} value={day.notes[c.key] ?? ''} onChange={(v) => setNote(c.key, v)} />
          </View>
        ))}
      </Card>

      <Card theme={theme} art="score" title="今日自检" hint="睡前打个分，1 最低，5 最高。">
        {SCORES.map((s) => (
          <View key={s.key} style={styles.scoreRow}>
            <Text style={[styles.scoreLabel, { color: theme.text }]}>{s.label}</Text>
            <View style={styles.scoreButtons}>
              {[1, 2, 3, 4, 5].map((v) => {
                const on = day.score[s.key] === v;
                return (
                  <Pressable
                    key={v}
                    style={[
                      styles.scoreButton,
                      { borderColor: on ? theme.accent : theme.border, backgroundColor: on ? theme.accent : theme.bg },
                    ]}
                    onPress={() => updateDay(date, { score: { ...day.score, [s.key]: v } })}
                  >
                    <Text style={{ color: on ? '#fff' : theme.text, fontWeight: on ? '700' : '400' }}>{v}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </Card>

      <Card theme={theme} art="evening" title="晚上 · 整合">
        {EVENING.map((c, i) => (
          <View key={c.key} style={[styles.question, i > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
            <Text style={[styles.q, { color: theme.text, marginBottom: 8 }]}>{c.q}</Text>
            <Field theme={theme} value={day.notes[c.key] ?? ''} onChange={(v) => setNote(c.key, v)} />
          </View>
        ))}
      </Card>
      <Text style={[styles.footnote, { color: theme.muted }]}>写的内容会自动保存。</Text>
    </>
  );
}

function Lens({
  theme,
  colors,
  label,
  text,
  onEmpty,
}: {
  theme: Theme;
  colors: { bg: string; fg: string };
  label: string;
  text?: string;
  onEmpty: () => void;
}) {
  const value = text?.trim();
  return (
    <Pressable style={[styles.lensBox, { backgroundColor: colors.bg }]} onPress={value ? undefined : onEmpty}>
      <Text style={[styles.kicker, { color: colors.fg }]}>{label}</Text>
      <Text style={{ color: value ? theme.text : theme.muted, fontStyle: value ? 'normal' : 'italic', lineHeight: 22 }}>
        {value || '还没写。点这里去「蓝图」填一句。'}
      </Text>
    </Pressable>
  );
}

function GrowthReminderSwitch({ theme }: { theme: Theme }) {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    loadGrowthReminders().then(setOn);
  }, []);
  if (on === null) return null;
  return (
    <View style={[styles.reminderRow, { backgroundColor: theme.bg }]}>
      <Text style={{ color: theme.text, flex: 1 }}>到点提醒我（早上 8:00、白天 4 次、睡前 21:30）</Text>
      <Switch
        value={on}
        onValueChange={async (next) => {
          setOn(next);
          if (!(await setGrowthReminders(next))) {
            setOn(false);
            await setGrowthReminders(false);
            notify('无法发送提醒', '请在系统设置里允许本应用发送通知。');
          }
        }}
      />
    </View>
  );
}

function BoardView({ theme }: { theme: Theme }) {
  const { data, updateBlueprint } = useGrowth();
  const bp = data.blueprint;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <Card theme={theme} art="board" title="人生游戏蓝图" hint="写一次，每月回看。前两项会显示在「今天」页顶部。">
        {BOARD.map((s) => (
          <View key={s.key} style={styles.slot}>
            <Text style={[styles.kicker, { color: theme.text }]}>{s.name}</Text>
            <Text style={[styles.role, { color: theme.muted }]}>{s.role}</Text>
            <Field
              theme={theme}
              value={bp?.[s.key] ?? ''}
              onChange={(v) => updateBlueprint({ [s.key]: v })}
              lines={s.key === 'levers' ? 3 : 2}
            />
          </View>
        ))}
      </Card>
      <Card theme={theme} art="deep" title="一日重启 · 深度挖掘" hint="第一次用，留半天按顺序写完，再回来填蓝图。">
        {DEEP.map((g, gi) => (
          <View key={g.group} style={[styles.group, gi > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
            <Pressable onPress={() => setOpen(open === gi ? null : gi)} style={styles.groupHead}>
              <Text style={[styles.groupTitle, { color: theme.text }]}>{g.group}</Text>
              <Text style={{ color: theme.muted }}>{open === gi ? '收起' : '展开'}</Text>
            </Pressable>
            {open === gi &&
              g.qs.map(([key, q]) => (
                <View key={key} style={styles.slot}>
                  <Text style={[styles.q, { color: theme.text, marginBottom: 6 }]}>{q}</Text>
                  <Field
                    theme={theme}
                    value={bp?.deep[key] ?? ''}
                    onChange={(v) => updateBlueprint({ deep: { ...(bp?.deep ?? {}), [key]: v } })}
                    lines={3}
                  />
                </View>
              ))}
          </View>
        ))}
      </Card>
    </>
  );
}

function HistoryView({ theme }: { theme: Theme }) {
  const { data } = useGrowth();
  const [selected, setSelected] = useState<string | null>(null);
  const days = Object.values(data.days)
    .filter(hasContent)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!days.length) {
    return (
      <Card theme={theme} title="过往记录">
        <Text style={{ color: theme.muted }}>今天开始写，明天这里就会有第一条记录。</Text>
      </Card>
    );
  }

  return (
    <Card theme={theme} title="过往记录" hint="点一天查看当天写的内容。">
      {days.map((d) => {
        const avg = averageScore(d);
        const done = d.done.filter(Boolean).length;
        const isOpen = selected === d.date;
        return (
          <View key={d.date}>
            <Pressable
              style={[styles.histRow, { borderColor: theme.border }]}
              onPress={() => setSelected(isOpen ? null : d.date)}
            >
              <Text style={{ color: theme.text, fontWeight: '600' }}>{formatDateLabel(d.date)}</Text>
              <Text style={{ color: theme.muted, fontSize: 13 }}>
                反思 {answeredCount(d)}/7 · 完成 {done} 件{avg !== null ? ` · 自检 ${avg.toFixed(1)}` : ''}
              </Text>
            </Pressable>
            {isOpen && <DayDetail theme={theme} day={d} />}
          </View>
        );
      })}
    </Card>
  );
}

function DayDetail({ theme, day }: { theme: Theme; day: GrowthDay }) {
  const items: [string, string][] = [];
  day.levers.forEach((t, i) => {
    if (t.trim()) items.push([`今天的事 ${i + 1}${day.done[i] ? ' ✓' : ''}`, t]);
  });
  for (const c of [...CHECKS, ...EVENING]) {
    const a = day.notes[c.key]?.trim();
    if (a) items.push([c.q, a]);
  }
  for (const s of SCORES) {
    if (day.score[s.key]) items.push([s.label, `${day.score[s.key]} / 5`]);
  }
  return (
    <View style={[styles.detail, { backgroundColor: theme.bg }]}>
      {items.map(([q, a], i) => (
        <View key={i} style={{ marginBottom: 10 }}>
          <Text style={[styles.detailQ, { color: theme.muted }]}>{q}</Text>
          <Text style={{ color: theme.text, lineHeight: 22 }}>{a}</Text>
        </View>
      ))}
    </View>
  );
}

/** Renders **bold** spans inside a paragraph. */
function Rich({ text, color }: { text: string; color: string }) {
  return (
    <Text style={[styles.para, { color }]}>
      {text.split(/\*\*(.+?)\*\*/).map((part, i) =>
        i % 2 ? (
          <Text key={i} style={{ fontWeight: '700' }}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

function ReadView({ theme }: { theme: Theme }) {
  return (
    <>
      <Card theme={theme} art="read" title="一天重启人生 · 精读">
        <Text style={[styles.kicker, { color: theme.muted, marginBottom: 0 }]}>
          DAN KOE · HOW TO FIX YOUR ENTIRE LIFE IN 1 DAY
        </Text>
      </Card>
      {READING.map((block) => (
        <Card key={block.title} theme={theme} title={block.title}>
          {block.body.map((p, i) => (
            <Rich key={i} text={p} color={theme.text} />
          ))}
        </Card>
      ))}
      <Card theme={theme} title="六、把人生变成一场游戏">
        <View style={[styles.table, { backgroundColor: theme.bg }]}>
          {GAME_TABLE.map(([k, v]) => (
            <View key={k} style={styles.tableRow}>
              <Text style={[styles.tableKey, { color: theme.accent }]}>{k}</Text>
              <Text style={{ color: theme.text, flex: 1 }}>{v}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.para, { color: theme.text, marginTop: 10 }]}>{GAME_NOTE}</Text>
      </Card>
      <View style={[styles.card, { backgroundColor: VISION.bg }]}>
        <Rich text={'**一句话总结：**' + SUMMARY} color={theme.text} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  date: { fontSize: 14 },
  streak: { color: '#C08A00', fontWeight: '700', fontSize: 13 },
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3, marginBottom: 14 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  card: { borderRadius: 14, padding: 16, marginBottom: 14, overflow: 'hidden' },
  banner: {
    height: 124,
    marginTop: -16,
    marginHorizontal: -16,
    marginBottom: 12,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 14,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 13, marginBottom: 10, lineHeight: 19 },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  lens: { gap: 10 },
  lensBox: { borderRadius: 10, padding: 12 },
  lever: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#fff', fontWeight: '800', fontSize: 14 },
  leverInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 },
  question: { paddingVertical: 12 },
  questionHead: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  time: { fontWeight: '700', fontVariant: ['tabular-nums'], width: 48 },
  q: { flex: 1, fontSize: 15, lineHeight: 22 },
  pill: {
    alignSelf: 'flex-start',
    marginLeft: 58,
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15, lineHeight: 22 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 10, gap: 8, marginBottom: 4 },
  scoreRow: { marginTop: 10, gap: 8 },
  scoreLabel: { fontSize: 15 },
  scoreButtons: { flexDirection: 'row', gap: 8 },
  scoreButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: { textAlign: 'center', fontSize: 12, marginTop: 4 },
  slot: { marginTop: 12 },
  role: { fontSize: 13, marginBottom: 6, marginTop: -2 },
  group: { paddingTop: 4 },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  groupTitle: { fontSize: 15, fontWeight: '700' },
  histRow: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8, gap: 2 },
  detail: { borderRadius: 10, padding: 12, marginTop: 6 },
  detailQ: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  para: { fontSize: 15, lineHeight: 24, marginTop: 6 },
  table: { borderRadius: 10, padding: 12, gap: 8, marginTop: 6 },
  tableRow: { flexDirection: 'row', gap: 14 },
  tableKey: { fontWeight: '700', width: 76 },
});
