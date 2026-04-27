import React from 'react';
import { Colors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { HapticTab } from '@/components/haptic-tab';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="friends"
        options={{
          title: '친구',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="people" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: '채팅',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="chat" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="settings" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
