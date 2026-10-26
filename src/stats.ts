import { addDays } from './dates';
import { SectionKey, SECTIONS } from './sections';
import type { Entry } from './store';

/** Map of date -> set of sections checked in that day. */
export function indexByDate(entries: Entry[]): Map<string, Set<SectionKey>> {
  const map = new Map<string, Set<SectionKey>>();
  for (const e of entries) {
    let set = map.get(e.date);
    if (!set) map.set(e.date, (set = new Set()));
    set.add(e.section);
  }
  return map;
}

/**
 * Consecutive days with a check-in, counting back from today. If today has no
 * check-in yet the streak counts from yesterday, so it doesn't reset at midnight.
 */
export function currentStreak(has: (date: string) => boolean, today: string): number {
  let day = has(today) ? today : addDays(today, -1);
  let n = 0;
  while (has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function longestStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export type SectionStats = {
  section: SectionKey;
  streak: number;
  rate30: number; // 0..1, share of the last 30 days with a check-in
  total: number;
};

export function sectionStats(byDate: Map<string, Set<SectionKey>>, today: string): SectionStats[] {
  return SECTIONS.map(({ key }) => {
    const has = (d: string) => byDate.get(d)?.has(key) ?? false;
    let last30 = 0;
    for (let i = 0; i < 30; i++) if (has(addDays(today, -i))) last30++;
    let total = 0;
    for (const set of byDate.values()) if (set.has(key)) total++;
    return { section: key, streak: currentStreak(has, today), rate30: last30 / 30, total };
  });
}

/** Number of sections completed on each of the last `days` days, oldest first. */
export function dailyCounts(byDate: Map<string, Set<SectionKey>>, today: string, days: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - days + 1);
    return { date, count: byDate.get(date)?.size ?? 0 };
  });
}
