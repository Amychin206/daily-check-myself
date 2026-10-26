import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { configureNotifications } from '../src/reminders';
import { isSectionKey } from '../src/sections';
import { StoreProvider } from '../src/store';
import { SyncProvider } from '../src/sync';
import { MAX_WIDTH, useTheme } from '../src/theme';
import { todayKey } from '../src/dates';

configureNotifications();

export default function RootLayout() {
  const theme = useTheme();

  // Tapping a reminder opens today's check-in for that section.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const section = response.notification.request.content.data?.section;
      if (isSectionKey(section)) router.push({ pathname: '/entry/[section]', params: { section, date: todayKey() } });
    });
    return () => sub.remove();
  }, []);

  return (
    <StoreProvider>
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
    </StoreProvider>
  );
}
