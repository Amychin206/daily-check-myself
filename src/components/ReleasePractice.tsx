import { ArrowRight, Check, EyeClosed, Feather, RotateCcw } from 'lucide-react-native';
import { ReactNode, useRef, useState } from 'react';
import { Appear, PressScale } from './Motion';
import { Animated, Easing, LayoutAnimation, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { todayKey } from '../dates';
import { RELEASE_QUESTIONS, RELEASE_STAGES, ReleaseSession } from '../growth';
import { useGrowth } from '../growthStore';
import { Theme } from '../theme';

// The Sedona release practice, one step at a time: name the feeling and rate
// it, feel it, answer the three release questions, check again (looping as
// many rounds as needed), then rate what is left and record the session.

const NATIVE = Platform.OS !== 'web';

type Step = { kind: 'setup' } | { kind: 'feel' } | { kind: 'ask'; i: number } | { kind: 'check' } | { kind: 'after' };

const STEP_NUMBER: Record<Step['kind'], number> = { setup: 1, feel: 2, ask: 3, check: 4, after: 5 };

/** Smoothly resizes the card when the next step is taller or shorter. */
function morphLayout() {
  if (NATIVE) LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity'));
}

function Scale({ theme, value, onChange }: { theme: Theme; value: number | null; onChange: (v: number) => void }) {
  return (
    <View style={styles.scale}>
      {Array.from({ length: 11 }, (_, v) => {
        const on = value === v;
        return (
          <PressScale
            key={v}
            grow
            onPress={() => onChange(v)}
            style={[
              styles.scaleButton,
              { borderColor: on ? theme.accent : theme.border, backgroundColor: on ? theme.accent : theme.bg },
            ]}
          >
            <Text style={{ color: on ? '#fff' : theme.text, fontWeight: on ? '700' : '400', fontSize: 13 }}>{v}</Text>
          </PressScale>
        );
      })}
    </View>
  );
}

function Button({
  theme,
  label,
  icon,
  onPress,
  disabled,
  kind = 'primary',
}: {
  theme: Theme;
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  kind?: 'primary' | 'secondary';
}) {
  const primary = kind === 'primary';
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        primary
          ? { backgroundColor: theme.accent }
          : { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 },
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? '#fff' : theme.text }]}>{label}</Text>
      {icon}
    </PressScale>
  );
}

export function ReleasePractice({ theme }: { theme: Theme }) {
  const { getDay, updateDay } = useGrowth();
  const today = todayKey();
  const sessions = getDay(today).release ?? [];

  const [step, setStep] = useState<Step>({ kind: 'setup' });
  const [stage, setStage] = useState<string | null>(null);
  const [feeling, setFeeling] = useState('');
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [rounds, setRounds] = useState(1);

  // 0 = waiting to enter, 1 = shown, 2 = left. `dir` is +1 going forward, -1 going back.
  const phase = useRef(new Animated.Value(1)).current;
  const dir = useRef(new Animated.Value(1)).current;
  const busy = useRef(false);

  const go = (next: Step, back = false, beforeEnter?: () => void) => {
    if (busy.current) return;
    busy.current = true;
    dir.setValue(back ? -1 : 1);
    Animated.timing(phase, {
      toValue: 2,
      duration: 170,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start(() => {
      beforeEnter?.();
      morphLayout();
      setStep(next);
      phase.setValue(0);
      Animated.timing(phase, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: NATIVE,
      }).start(() => {
        busy.current = false;
      });
    });
  };

  const reset = () => {
    setStage(null);
    setFeeling('');
    setBefore(null);
    setAfter(null);
    setRounds(1);
  };

  const finish = () => {
    if (stage === null || before === null || after === null) return;
    const session: ReleaseSession = {
      at: new Date().toISOString(),
      stage,
      feeling: feeling.trim(),
      before,
      after,
      rounds,
    };
    const date = todayKey();
    morphLayout();
    updateDay(date, { release: [...(getDay(date).release ?? []), session] });
    go({ kind: 'setup' }, false, reset);
  };

  const slide = Animated.multiply(phase.interpolate({ inputRange: [0, 1, 2], outputRange: [28, 0, -28] }), dir);
  const stepStyle = {
    opacity: phase.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 0] }),
    transform: [
      { translateX: slide },
      { scale: phase.interpolate({ inputRange: [0, 1, 2], outputRange: [0.97, 1, 0.97] }) },
    ],
  };

  const n = STEP_NUMBER[step.kind];
  const summary = [stage, feeling.trim(), before !== null ? `强度 ${before}` : ''].filter(Boolean).join(' · ');

  return (
    <View>
      <View style={styles.progressRow}>
        <View style={styles.dots}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= n ? theme.accent : theme.border },
                i === n && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Text style={[styles.small, { color: theme.muted }]}>
          第 {n} / 5 步{rounds > 1 ? ` · 第 ${rounds} 轮` : ''}
        </Text>
        <View style={{ flex: 1 }} />
        {step.kind !== 'setup' && (
          <PressScale onPress={() => go({ kind: 'setup' }, true, reset)} style={styles.restart}>
            <Text style={[styles.small, { color: theme.muted }]}>重来</Text>
          </PressScale>
        )}
      </View>

      <Animated.View style={stepStyle}>
        {step.kind === 'setup' && (
          <View>
            <Text style={[styles.label, { color: theme.text }]}>确认情绪阶段</Text>
            <View style={styles.chips}>
              {RELEASE_STAGES.map((s) => {
                const on = stage === s;
                return (
                  <PressScale
                    key={s}
                    onPress={() => {
                      morphLayout();
                      setStage(s);
                    }}
                    style={[
                      styles.chip,
                      { borderColor: on ? theme.accent : theme.border, backgroundColor: on ? theme.accent : theme.bg },
                    ]}
                  >
                    <Text style={{ color: on ? '#fff' : theme.text, fontWeight: on ? '700' : '400' }}>{s}</Text>
                  </PressScale>
                );
              })}
            </View>
            <Text style={[styles.label, { color: theme.text }]}>具体情绪或感受</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
              value={feeling}
              onChangeText={setFeeling}
              placeholder="例如 担心客户不续保"
              placeholderTextColor={theme.muted}
            />
            <Text style={[styles.label, { color: theme.text }]}>现在有多强</Text>
            <Scale theme={theme} value={before} onChange={setBefore} />
            <Button
              theme={theme}
              label="下一步"
              icon={<ArrowRight size={18} color="#fff" />}
              disabled={stage === null || before === null}
              onPress={() => go({ kind: 'feel' })}
            />
          </View>
        )}

        {step.kind === 'feel' && (
          <View style={styles.center}>
            <View style={[styles.iconCircle, { backgroundColor: theme.bg }]}>
              <EyeClosed size={28} color={theme.accent} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>闭上眼睛 · 感受自己的情绪</Text>
            <Text style={[styles.hint, { color: theme.muted }]}>它在身体哪里？先允许它在</Text>
            {summary ? <Text style={[styles.small, { color: theme.muted, marginBottom: 14 }]}>{summary}</Text> : null}
            <Button
              theme={theme}
              label="下一步"
              icon={<ArrowRight size={18} color="#fff" />}
              onPress={() => go({ kind: 'ask', i: 0 })}
            />
          </View>
        )}

        {step.kind === 'ask' && (
          <View style={styles.center}>
            <Text style={[styles.small, { color: theme.accent, fontWeight: '700' }]}>
              问自己 · 第 {step.i + 1} / {RELEASE_QUESTIONS.length} 题
            </Text>
            <Text style={[styles.title, { color: theme.text, marginTop: 10 }]}>{RELEASE_QUESTIONS[step.i].q}</Text>
            <Text style={[styles.hint, { color: theme.muted }]}>答可以或不可以都行 诚实就好</Text>
            <View style={styles.pair}>
              {RELEASE_QUESTIONS[step.i].answers.map((a, j) => (
                <View key={a} style={{ flex: 1 }}>
                  <Button
                    theme={theme}
                    kind={j === 0 ? 'primary' : 'secondary'}
                    label={a}
                    onPress={() =>
                      go(step.i + 1 < RELEASE_QUESTIONS.length ? { kind: 'ask', i: step.i + 1 } : { kind: 'check' })
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {step.kind === 'check' && (
          <View style={styles.center}>
            <View style={[styles.iconCircle, { backgroundColor: theme.bg }]}>
              <Feather size={26} color={theme.accent} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>再次感受</Text>
            <Text style={[styles.hint, { color: theme.muted }]}>之前的情绪还在吗？</Text>
            <View style={styles.pair}>
              <View style={{ flex: 1 }}>
                <Button
                  theme={theme}
                  kind="secondary"
                  label="还在 再来一轮"
                  icon={<RotateCcw size={16} color={theme.text} />}
                  onPress={() => go({ kind: 'feel' }, true, () => setRounds((r) => r + 1))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button theme={theme} label="轻了或没了" onPress={() => go({ kind: 'after' })} />
              </View>
            </View>
          </View>
        )}

        {step.kind === 'after' && (
          <View>
            <Text style={[styles.label, { color: theme.text }]}>现在还剩多强</Text>
            {before !== null && (
              <Text style={[styles.small, { color: theme.muted, marginBottom: 8 }]}>开始时是 {before}</Text>
            )}
            <Scale theme={theme} value={after} onChange={setAfter} />
            <Button
              theme={theme}
              label="完成并记录"
              icon={<Check size={18} color="#fff" />}
              disabled={after === null}
              onPress={finish}
            />
          </View>
        )}
      </Animated.View>

      {sessions.length > 0 && (
        <View style={[styles.log, { borderTopColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.text, marginTop: 0 }]}>今天 · {sessions.length} 次</Text>
          {sessions.map((s, i) => (
            <Appear key={s.at}>
              <View style={[styles.logRow, i > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                <Text style={[styles.logTime, { color: theme.muted }]}>{clock(s.at)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '600' }}>
                    {s.stage}
                    {s.feeling ? <Text style={{ fontWeight: '400' }}> · {s.feeling}</Text> : null}
                  </Text>
                  <Text style={[styles.small, { color: theme.muted }]}>
                    {s.before} → {s.after}
                    {s.rounds > 1 ? ` · ${s.rounds} 轮` : ''}
                  </Text>
                </View>
                <Text style={[styles.drop, { color: s.before - s.after > 0 ? theme.accent : theme.muted }]}>
                  {s.before - s.after > 0 ? `降 ${s.before - s.after}` : '持平'}
                </Text>
              </View>
            </Appear>
          ))}
        </View>
      )}
    </View>
  );
}

export function clock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 18 },
  restart: { paddingHorizontal: 8, paddingVertical: 2 },
  small: { fontSize: 12 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 15 },
  scale: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  scaleButton: { height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  center: { alignItems: 'stretch' },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 26 },
  hint: { fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 16, lineHeight: 20 },
  pair: { flexDirection: 'row', gap: 10 },
  log: { borderTopWidth: 1, marginTop: 18, paddingTop: 12 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  logTime: { fontVariant: ['tabular-nums'], fontWeight: '700', width: 44 },
  drop: { fontSize: 13, fontWeight: '700' },
});
