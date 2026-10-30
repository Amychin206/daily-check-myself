import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { CHECKS, DAY_REMINDERS } from './growth';
import { SECTION_BY_KEY, SectionKey, SECTIONS } from './sections';

// Reminders are local notifications, so they are configured per device.

export type Reminder = { enabled: boolean; hour: number; minute: number };
export type ReminderSettings = Record<SectionKey, Reminder>;

const KEY = 'reminders.v1';
const GROWTH_KEY = 'growthReminders.v1';

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

/** Whether the 成长 tab sends its reminders (morning, four check-ins, bedtime). */
export async function loadGrowthReminders(): Promise<boolean> {
  return (await AsyncStorage.getItem(GROWTH_KEY)) === 'on';
}

/** Turns the 成长 check-in reminders on or off. Returns false if permission was denied. */
export async function setGrowthReminders(enabled: boolean): Promise<boolean> {
  await AsyncStorage.setItem(GROWTH_KEY, enabled ? 'on' : 'off');
  return applyReminders(await loadReminders());
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
  const growthOn = await loadGrowthReminders();
  if (active.length === 0 && !growthOn) return true;
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
  if (growthOn) {
    const growthReminders = [
      ...DAY_REMINDERS,
      ...CHECKS.map((c) => ({ hour: c.hour, minute: c.minute, title: '🌱 停一下', body: c.short })),
    ];
    for (const { hour, minute, title, body } of growthReminders) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { growth: true } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'reminders' },
      });
    }
  }
  return true;
}
