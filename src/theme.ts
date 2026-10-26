import { useColorScheme } from 'react-native';

const light = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  text: '#1C1E26',
  muted: '#7A7F8E',
  border: '#E6E8EF',
  accent: '#4F7CFF',
  danger: '#E5484D',
  empty: '#EBEDF2',
};

const dark: typeof light = {
  bg: '#0F1115',
  card: '#1A1D24',
  text: '#F1F2F5',
  muted: '#8C92A3',
  border: '#2A2E38',
  accent: '#6F95FF',
  danger: '#FF6369',
  empty: '#252932',
};

export type Theme = typeof light;

/** Content width cap, so the web version on a computer keeps a phone-like column. */
export const MAX_WIDTH = 640;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
