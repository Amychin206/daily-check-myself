import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';
import { useTheme } from '../../src/theme';

const icon = (emoji: string) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;

export default function TabLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '今日打卡', tabBarLabel: '打卡', tabBarIcon: icon('✅') }} />
      <Tabs.Screen name="growth" options={{ title: '成长', tabBarIcon: icon('🌱') }} />
      <Tabs.Screen name="coach" options={{ title: 'AI 教练', tabBarLabel: 'AI', tabBarIcon: icon('🤖') }} />
      <Tabs.Screen name="stats" options={{ title: '统计', tabBarIcon: icon('📊') }} />
      <Tabs.Screen name="settings" options={{ title: '我的', tabBarIcon: icon('⚙️') }} />
    </Tabs>
  );
}
