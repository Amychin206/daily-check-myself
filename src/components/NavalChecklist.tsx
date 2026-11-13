import { Check } from 'lucide-react-native';
import { LayoutAnimation, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { GrowthDay, NAVAL_GROUPS, NAVAL_ITEMS, NAVAL_NOTE, navalCount } from '../growth';
import { useGrowth } from '../growthStore';
import { Theme } from '../theme';
import { Appear, PressScale } from './Motion';

// Naval's life system as a daily checklist: health first, then the income
// system, then wealth & relationships, plus a line on what moved today.

export function NavalChecklist({ theme, date }: { theme: Theme; date: string }) {
  const { getDay, updateDay } = useGrowth();
  const day: GrowthDay = getDay(date);
  const checked = day.naval ?? {};
  const total = navalCount(day);

  const toggle = (key: string) => {
    if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    updateDay(date, { naval: { ...checked, [key]: !checked[key] } });
  };

  return (
    <View>
      <Text style={[styles.motto, { color: theme.danger }]}>从底层做起 先守住健康 再建立收入系统</Text>
      <View style={[styles.totalTrack, { backgroundColor: theme.empty }]}>
        <View
          style={[styles.totalFill, { width: `${(total / NAVAL_ITEMS.length) * 100}%`, backgroundColor: theme.accent }]}
        />
      </View>
      {NAVAL_GROUPS.map((g, gi) => {
        const done = g.items.filter((i) => checked[i.key]).length;
        const complete = done === g.items.length;
        return (
          <View key={g.title} style={[styles.group, gi > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
            <View style={styles.groupHead}>
              <Text style={[styles.groupTitle, { color: complete ? theme.accent : theme.text }]}>{g.title}</Text>
              <View style={[styles.count, { backgroundColor: complete ? theme.accent : theme.empty }]}>
                <Text style={[styles.countText, { color: complete ? '#fff' : theme.muted }]}>
                  {done} / {g.items.length}
                </Text>
              </View>
            </View>
            {g.items.map((item) => {
              const on = !!checked[item.key];
              return (
                <PressScale key={item.key} onPress={() => toggle(item.key)} style={styles.item}>
                  <View
                    style={[
                      styles.box,
                      { borderColor: theme.accent, backgroundColor: on ? theme.accent : 'transparent' },
                    ]}
                  >
                    {on ? (
                      <Appear>
                        <Check size={15} color="#fff" strokeWidth={3} />
                      </Appear>
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: on ? theme.muted : theme.text }]}>{item.label}</Text>
                    {item.sub ? <Text style={[styles.sub, { color: theme.muted }]}>{item.sub}</Text> : null}
                  </View>
                </PressScale>
              );
            })}
          </View>
        );
      })}
      <Text style={[styles.noteLabel, { color: theme.text }]}>今天收入系统推进了什么</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
        value={day.notes[NAVAL_NOTE] ?? ''}
        onChangeText={(v) => updateDay(date, { notes: { ...day.notes, [NAVAL_NOTE]: v } })}
        placeholder="写一句就好"
        placeholderTextColor={theme.muted}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  motto: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  totalTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  totalFill: { height: 6, borderRadius: 3 },
  group: { paddingVertical: 10 },
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  groupTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  count: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  label: { fontSize: 15, lineHeight: 22 },
  sub: { fontSize: 12, lineHeight: 18, marginTop: 1 },
  noteLabel: { fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15, lineHeight: 22, minHeight: 64 },
});
