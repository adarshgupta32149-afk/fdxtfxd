import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { colors, font } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Outline icons when idle, filled when selected: quiet, and still obvious which tab is open.
const icon = (idle: IconName, active: IconName) =>
  function TabBarIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? active : idle} size={22} color={typeof color === 'string' ? color : colors.muted} />;
  };

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(7,11,22,0.96)',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontFamily: font, fontSize: 11, fontWeight: '500' },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.faint,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('flash-outline', 'flash') }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: icon('time-outline', 'time') }} />
      <Tabs.Screen name="skills" options={{ title: 'Skills', tabBarIcon: icon('ribbon-outline', 'ribbon') }} />
      <Tabs.Screen name="records" options={{ title: 'Records', tabBarIcon: icon('podium-outline', 'podium') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
