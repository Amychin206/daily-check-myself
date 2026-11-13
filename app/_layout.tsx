import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GrowthProvider } from '../src/growthStore';
import { configureNotifications } from '../src/reminders';
import { isSectionKey } from '../src/sections';
import { StoreProvider } from '../src/store';
import { SyncProvider } from '../src/sync';
import { MAX_WIDTH, useTheme } from '../src/theme';
import { todayKey } from '../src/dates';

configureNotifications();

export default function RootLayout() {
  const theme = useTheme();

  // Tapping a reminder opens today's check-in for that section, or the 成长 tab.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handled = new Set<string>();
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const id = response.notification.request.identifier + response.notification.date;
      if (handled.has(id)) return;
      handled.add(id);
      const data = response.notification.request.content.data;
      if (data?.growth) {
        // `at` changes each time so tapping the same reminder again still scrolls to its card.
        if (typeof data.card === 'string')
          router.navigate({ pathname: '/growth', params: { card: data.card, at: Date.now() } });
        else router.navigate('/growth');
      }
      const section = data?.section;
      if (isSectionKey(section)) router.push({ pathname: '/entry/[section]', params: { section, date: todayKey() } });
    };
    // A tap that launched the app from closed arrives before this listener exists.
    const launch = Notifications.getLastNotificationResponse();
    if (launch) {
      Notifications.clearLastNotificationResponse();
      setTimeout(() => open(launch), 500); // let the navigator mount first
    }
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);

  return (
    <StoreProvider>
      <GrowthProvider>
        <SyncProvider>
          <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={{ flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' }}>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: theme.card },
                  headerTintColor: theme.text,
                  contentStyle: { backgroundColor: theme.bg },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="entry/[section]" options={{ title: '打卡' }} />
              </Stack>
            </View>
          </View>
        </SyncProvider>
      </GrowthProvider>
    </StoreProvider>
  );
}
