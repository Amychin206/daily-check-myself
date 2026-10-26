import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { addDays, fromDateKey, todayKey, weekdayLabel } from '../../src/dates';
import { SECTION_BY_KEY, SECTIONS } from '../../src/sections';
import { currentStreak, dailyCounts, indexByDate, longestStreak, sectionStats } from '../../src/stats';
import { activeEntries, useStore } from '../../src/store';
import { Theme, useTheme } from '../../src/theme';

const WEEKS = 12;
const PAD = 16;

export default function StatsScreen() {
  const theme = useTheme();
  const { entries } = useStore();
  const { width } = useWindowDimensions();
  const chartWidth = width - PAD * 2 - 32;
  const today = todayKey();

  const data = useMemo(() => {
    const list = activeEntries(entries);
    const byDate = indexByDate(list);
    const days = [...byDate.keys()];
    return {
      total: list.length,
      streak: currentStreak((d) => byDate.has(d), today),
      best: longestStreak(days),
      week: dailyCounts(byDate, today, 7),
      heat: dailyCounts(byDate, today, WEEKS * 7),
      sections: sectionStats(byDate, today),
    };
  }, [entries, today]);

  return (
    <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 32 }}>
      <View style={styles.tiles}>
        <Tile theme={theme} label="连续打卡" value={data.streak} unit="天" />
        <Tile theme={theme} label="最长连续" value={data.best} unit="天" />
        <Tile theme={theme} label="累计打卡" value={data.total} unit="次" />
      </View>

      <Card theme={theme} title="最近 7 天">
        <WeekChart theme={theme} width={chartWidth} days={data.week} />
      </Card>

      <Card theme={theme} title={`最近 ${WEEKS} 周`}>
        <Heatmap theme={theme} width={chartWidth} days={data.heat} />
      </Card>

      <Card theme={theme} title="各版面 · 近 30 天完成率">
        {data.sections.map((s) => {
          const section = SECTION_BY_KEY[s.section];
          return (
            <View key={s.section} style={styles.sectionRow}>
              <Text style={[styles.sectionName, { color: theme.text }]}>
                {section.emoji} {section.title}
              </Text>
              <View style={[styles.rateTrack, { backgroundColor: theme.empty }]}>
                <View style={[styles.rateFill, { width: `${s.rate30 * 100}%`, backgroundColor: section.color }]} />
              </View>
              <Text style={[styles.rateText, { color: theme.text }]}>{Math.round(s.rate30 * 100)}%</Text>
              <Text style={[styles.streakText, { color: theme.muted }]}>🔥{s.streak}</Text>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

function Tile({ theme, label, value, unit }: { theme: Theme; label: string; value: number; unit: string }) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.card }]}>
      <Text style={[styles.tileValue, { color: theme.text }]}>
        {value}
        <Text style={[styles.tileUnit, { color: theme.muted }]}> {unit}</Text>
      </Text>
      <Text style={{ color: theme.muted, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function Card({ theme, title, children }: { theme: Theme; title: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function WeekChart({ theme, width, days }: { theme: Theme; width: number; days: { date: string; count: number }[] }) {
  const height = 150;
  const labelH = 20;
  const valueH = 16;
  const plotH = height - labelH - valueH;
  const slot = width / days.length;
  const barW = Math.min(28, slot * 0.6);
  const max = SECTIONS.length;
  return (
    <Svg width={width} height={height}>
      {days.map((d, i) => {
        const h = Math.max(2, (d.count / max) * plotH);
        const x = i * slot + (slot - barW) / 2;
        const y = valueH + plotH - h;
        const isToday = i === days.length - 1;
        return (
          <React.Fragment key={d.date}>
            <Rect x={x} y={valueH} width={barW} height={plotH} rx={4} fill={theme.empty} />
            <Rect x={x} y={y} width={barW} height={h} rx={4} fill={d.count ? theme.accent : 'transparent'} />
            <SvgText x={x + barW / 2} y={y - 4} fontSize={11} fill={theme.muted} textAnchor="middle">
              {d.count ? String(d.count) : ''}
            </SvgText>
            <SvgText
              x={x + barW / 2}
              y={height - 4}
              fontSize={12}
              fill={isToday ? theme.text : theme.muted}
              fontWeight={isToday ? '700' : '400'}
              textAnchor="middle"
            >
              {isToday ? '今' : weekdayLabel(d.date)}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function Heatmap({ theme, width, days }: { theme: Theme; width: number; days: { date: string; count: number }[] }) {
  const labelW = 18;
  const gap = 3;
  const cell = Math.floor((width - labelW - gap * WEEKS) / WEEKS);
  const counts = new Map(days.map((d) => [d.date, d.count]));
  // Columns are weeks starting on Monday; the last column holds the current week.
  const today = todayKey();
  const todayDow = (fromDateKey(today).getDay() + 6) % 7; // 0 = Monday
  const firstMonday = addDays(today, -todayDow - (WEEKS - 1) * 7);
  const height = 7 * (cell + gap);
  const max = SECTIONS.length;

  const cells = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const date = addDays(firstMonday, w * 7 + d);
      if (date > today) continue;
      const count = counts.get(date) ?? 0;
      const opacity = count ? 0.25 + 0.75 * (count / max) : 1;
      cells.push(
        <Rect
          key={date}
          x={labelW + w * (cell + gap)}
          y={d * (cell + gap)}
          width={cell}
          height={cell}
          rx={3}
          fill={count ? theme.accent : theme.empty}
          fillOpacity={opacity}
        />,
      );
    }
  }

  return (
    <View>
      <Svg width={width} height={height}>
        {['一', '三', '五', '日'].map((label) => {
          const row = { 一: 0, 三: 2, 五: 4, 日: 6 }[label]!;
          return (
            <SvgText key={label} x={0} y={row * (cell + gap) + cell * 0.75} fontSize={10} fill={theme.muted}>
              {label}
            </SvgText>
          );
        })}
        {cells}
      </Svg>
      <View style={styles.legend}>
        <Text style={{ color: theme.muted, fontSize: 11 }}>少</Text>
        {[0, 2, 4, 6].map((n) => (
          <View
            key={n}
            style={[
              styles.legendCell,
              { backgroundColor: n ? theme.accent : theme.empty, opacity: n ? 0.25 + 0.75 * (n / max) : 1 },
            ]}
          />
        ))}
        <Text style={{ color: theme.muted, fontSize: 11 }}>多</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  tile: { flex: 1, borderRadius: 14, padding: 14 },
  tileValue: { fontSize: 26, fontWeight: '800' },
  tileUnit: { fontSize: 13, fontWeight: '400' },
  card: { borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionName: { width: 92, fontSize: 14 },
  rateTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  rateFill: { height: 10, borderRadius: 5 },
  rateText: { width: 44, textAlign: 'right', fontSize: 13, fontVariant: ['tabular-nums'] },
  streakText: { width: 40, textAlign: 'right', fontSize: 12 },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 8 },
  legendCell: { width: 12, height: 12, borderRadius: 3 },
});
