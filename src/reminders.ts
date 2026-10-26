import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SECTION_BY_KEY, SectionKey, SECTIONS } from './sections';

// Reminders are local notifications, so they are configured per device.

export type Reminder = { enabled: boolean; hour: number; minute: number };
export type ReminderSettings = Record<SectionKey, Reminder>;

const KEY = 'reminders.v1';

const DEFAULT_TIMES: Record<SectionKey, [number, number]> = {
  study: [9, 0],
  reading: [21, 0],
  exercise: [18, 30],
  diet: [12, 0],
  rest: [22, 30],
  meditation: [7, 30],
};

export function defaultReminders(): ReminderSettings {
  return Object.fromEntries(
    SECTIONS.map(({ key }) => [key, { enabled: false, hour: DEFAULT_TIMES[key][0], minute: DEFAULT_TIMES[key][1] }]),
  ) as ReminderSettings;
}

export async function loadReminders(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  return { ...defaultReminders(), ...(raw ? JSON.parse(raw) : {}) };
}

export function configureNotifications() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: '打卡提醒',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Saves settings and reschedules every reminder. Returns false if permission was denied. */
export async function applyReminders(settings: ReminderSettings): Promise<boolean> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  await Notifications.cancelAllScheduledNotificationsAsync();
  const active = SECTIONS.filter(({ key }) => settings[key].enabled);
  if (active.length === 0) return true;
  if (!(await ensurePermission())) return false;
  for (const { key } of active) {
    const { hour, minute } = settings[key];
    const section = SECTION_BY_KEY[key];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${section.emoji} 该打卡「${section.title}」啦`,
        body: section.prompt,
        data: { section: key },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'reminders',
      },
    });
  }
  return true;
}
