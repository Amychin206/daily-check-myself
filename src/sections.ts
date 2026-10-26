export type SectionKey = 'study' | 'reading' | 'exercise' | 'diet' | 'rest' | 'meditation';

export type Section = {
  key: SectionKey;
  title: string;
  emoji: string;
  color: string;
  prompt: string;
};

export const SECTIONS: Section[] = [
  { key: 'study', title: '学习', emoji: '📚', color: '#4F7CFF', prompt: '今天学了什么？' },
  { key: 'reading', title: '读书', emoji: '📖', color: '#8E5BE8', prompt: '读了哪本书、哪一章？有什么收获？' },
  { key: 'exercise', title: '运动', emoji: '🏃', color: '#F2994A', prompt: '做了什么运动？多长时间？' },
  { key: 'diet', title: '健康饮食', emoji: '🥗', color: '#27AE60', prompt: '今天吃得怎么样？' },
  { key: 'rest', title: '休息', emoji: '😴', color: '#2D9CDB', prompt: '几点睡、几点起？睡得好吗？' },
  { key: 'meditation', title: '冥想', emoji: '🧘', color: '#E0679A', prompt: '冥想了多久？感受如何？' },
];

export const SECTION_BY_KEY: Record<SectionKey, Section> = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s]),
) as Record<SectionKey, Section>;

export function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === 'string' && value in SECTION_BY_KEY;
}
