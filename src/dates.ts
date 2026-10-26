// Dates are stored as local-calendar "YYYY-MM-DD" strings so a check-in
// belongs to the day the user experienced it, regardless of timezone.

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, delta: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + delta);
  return toDateKey(d);
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function formatDateLabel(key: string): string {
  const d = fromDateKey(key);
  const today = todayKey();
  const prefix = key === today ? '今天 · ' : key === addDays(today, -1) ? '昨天 · ' : '';
  return `${prefix}${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAYS[d.getDay()]}`;
}

export function weekdayLabel(key: string): string {
  return WEEKDAYS[fromDateKey(key).getDay()];
}
