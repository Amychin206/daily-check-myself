import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { confirmDestructive, errorMessage } from '../../src/dialogs';
import { askGrok, buildContext, ChatMessage, GrokSettings, loadChat, loadGrokSettings, saveChat } from '../../src/grok';
import { useGrowth } from '../../src/growthStore';
import { useStore } from '../../src/store';
import { useTheme } from '../../src/theme';

// Grok: a coaching chat that sees the blueprint and the last week of records.

const STARTERS = ['看看我这一周，有什么模式？', '我今天在逃避什么？', '帮我把这个月的项目拆成明天能做的一步'];

export default function GrokScreen() {
  const theme = useTheme();
  const { entries } = useStore();
  const growth = useGrowth();
  const [settings, setSettings] = useState<GrokSettings | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);

  // Re-read on focus, since the key is entered on the 我的 page.
  useFocusEffect(
    useCallback(() => {
      loadGrokSettings().then(setSettings);
    }, []),
  );

  useEffect(() => {
    loadChat().then(setMessages);
  }, []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || !settings?.apiKey) return;
    const history: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(history);
    setDraft('');
    setError(null);
    setBusy(true);
    try {
      const reply = await askGrok(settings, history, buildContext(entries, growth.snapshot()));
      const next: ChatMessage[] = [...history, { role: 'assistant', content: reply }];
      setMessages(next);
      saveChat(next).catch(() => {});
    } catch (err) {
      setError(errorMessage(err));
      saveChat(history).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (await confirmDestructive('清空对话？', '只会删除和 Grok 的聊天记录，打卡和成长记录不受影响。', '清空')) {
      setMessages([]);
      setError(null);
      saveChat([]).catch(() => {});
    }
  }

  if (!settings) return null;

  if (!settings.apiKey) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>连接 Grok</Text>
        <Text style={[styles.emptyText, { color: theme.muted }]}>
          在「我的」页面填入你的 xAI API Key，就可以和 Grok 聊你的蓝图、每日反思和打卡记录。
        </Text>
        <Pressable
          style={[styles.button, { backgroundColor: theme.accent }]}
          onPress={() => router.navigate('/settings')}
        >
          <Text style={styles.buttonText}>去设置</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View>
            <Text style={[styles.hint, { color: theme.muted }]}>
              Grok 会看到你的人生蓝图和最近 7 天的打卡与反思。可以这样开始：
            </Text>
            {STARTERS.map((s) => (
              <Pressable
                key={s}
                style={[styles.starter, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => send(s)}
              >
                <Text style={{ color: theme.text }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              m.role === 'user'
                ? { alignSelf: 'flex-end', backgroundColor: theme.accent }
                : { alignSelf: 'flex-start', backgroundColor: theme.card },
            ]}
          >
            <Text selectable style={{ color: m.role === 'user' ? '#fff' : theme.text, lineHeight: 21 }}>
              {m.content}
            </Text>
          </View>
        ))}
        {busy && <ActivityIndicator style={{ alignSelf: 'flex-start', margin: 8 }} color={theme.muted} />}
        {error && <Text style={{ color: theme.danger, marginTop: 8 }}>{error}</Text>}
        {messages.length > 0 && !busy && (
          <Pressable onPress={clear} style={{ alignSelf: 'center', marginTop: 12 }}>
            <Text style={{ color: theme.muted, fontSize: 13 }}>清空对话</Text>
          </Pressable>
        )}
      </ScrollView>
      <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
          value={draft}
          onChangeText={setDraft}
          placeholder="问 Grok…"
          placeholderTextColor={theme.muted}
          multiline
        />
        <Pressable
          style={[styles.send, { backgroundColor: theme.accent, opacity: busy || !draft.trim() ? 0.5 : 1 }]}
          onPress={() => send(draft)}
          disabled={busy || !draft.trim()}
        >
          <Text style={styles.buttonText}>发送</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { textAlign: 'center', lineHeight: 21, marginBottom: 16 },
  button: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, paddingBottom: 24 },
  hint: { lineHeight: 20, marginBottom: 12 },
  starter: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginBottom: 8 },
  bubble: { maxWidth: '85%', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  send: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
});
