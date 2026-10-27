import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EntryPhoto } from '../../src/components/EntryPhoto';
import { SectionArt } from '../../src/components/SectionArt';
import { addDays, formatDateLabel, todayKey } from '../../src/dates';
import { SECTIONS } from '../../src/sections';
import { useStore } from '../../src/store';
import { useTheme } from '../../src/theme';

export default function TodayScreen() {
  const theme = useTheme();
  const { getEntry } = useStore();
  const [date, setDate] = useState(todayKey());
  const isToday = date === todayKey();
  const done = SECTIONS.filter((s) => getEntry(date, s.key)).length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.dateRow}>
        <Pressable hitSlop={12} onPress={() => setDate(addDays(date, -1))}>
          <Text style={[styles.arrow, { color: theme.accent }]}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setDate(todayKey())}>
          <Text style={[styles.dateText, { color: theme.text }]}>{formatDateLabel(date)}</Text>
        </Pressable>
        <Pressable hitSlop={12} disabled={isToday} onPress={() => setDate(addDays(date, 1))}>
          <Text style={[styles.arrow, { color: isToday ? theme.border : theme.accent }]}>›</Text>
        </Pressable>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: theme.empty }]}>
        <View
          style={[styles.progressFill, { width: `${(done / SECTIONS.length) * 100}%`, backgroundColor: theme.accent }]}
        />
      </View>
      <Text style={[styles.progressText, { color: theme.muted }]}>
        已完成 {done} / {SECTIONS.length}
        {done === SECTIONS.length ? ' · 太棒了！🎉' : ''}
      </Text>

      <View style={styles.grid}>
        {SECTIONS.map((s) => {
          const entry = getEntry(date, s.key);
          return (
            <Pressable
              key={s.key}
              style={[styles.card, { backgroundColor: theme.card, borderColor: entry ? s.color : theme.border }]}
              onPress={() => router.push({ pathname: '/entry/[section]', params: { section: s.key, date } })}
            >
              {entry?.photoFile ? (
                <EntryPhoto photoFile={entry.photoFile} style={styles.thumb} />
              ) : (
                <SectionArt section={s.key} style={styles.thumb} />
              )}
              <View style={styles.cardFooter}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{s.title}</Text>
                <Text style={{ color: entry ? s.color : theme.muted, fontWeight: '600' }}>
                  {entry ? '✓ 已打卡' : '去打卡'}
                </Text>
              </View>
              {entry?.note ? (
                <Text numberOfLines={2} style={[styles.note, { color: theme.muted }]}>
                  {entry.note}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  arrow: { fontSize: 32, paddingHorizontal: 12 },
  dateText: { fontSize: 18, fontWeight: '600' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { marginTop: 6, marginBottom: 16, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: { width: '48%', borderRadius: 14, borderWidth: 2, overflow: 'hidden' },
  thumb: { width: '100%', aspectRatio: 4 / 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  note: { paddingHorizontal: 10, paddingBottom: 10, fontSize: 13 },
});
