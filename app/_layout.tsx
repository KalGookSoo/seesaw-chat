import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import 'react-native-reanimated';
import '../global.css';

import { setCurrentPathname } from '@/services/api-client';
import { useColorScheme, vars } from 'nativewind';

import { GlobalSpinner } from '@/components/ui/global-spinner';

export const unstable_settings = {
  // 네이티브 앱 딥링크 미적용 시 초기 화면 (웹에서는 URL로 결정되므로 무관)
  initialRouteName: 'index',
};

const themeVars = {
  light: vars({
    '--color-primary-50': '#F2F8FF',
    '--color-primary-100': '#E1F0FF',
    '--color-primary-200': '#BADAFF',
    '--color-primary-300': '#8EBEFF',
    '--color-primary-400': '#5AA1FF',
    '--color-primary-500': '#007AFF',
    '--color-primary-600': '#0062CC',
    '--color-primary-700': '#004B99',
    '--color-primary-800': '#003366',
    '--color-primary-900': '#001C33',
    '--color-primary-950': '#000E1A',
    '--background': '#FFFFFF',
    '--foreground': '#000000',
    '--secondary-background': '#F2F2F7',
    '--secondary-foreground': '#3C3C43',
    '--border': '#C6C6C8',
    '--muted': '#8E8E93',
    '--success': '#34C759',
    '--error': '#FF3B30',
    '--warning': '#FF9500',
    '--info': '#007AFF',
  }),
  dark: vars({
    '--color-primary-50': '#F2F8FF',
    '--color-primary-100': '#E1F0FF',
    '--color-primary-200': '#BADAFF',
    '--color-primary-300': '#8EBEFF',
    '--color-primary-400': '#5AA1FF',
    '--color-primary-500': '#0A84FF',
    '--color-primary-600': '#0062CC',
    '--color-primary-700': '#004B99',
    '--color-primary-800': '#003366',
    '--color-primary-900': '#001C33',
    '--color-primary-950': '#000E1A',
    '--background': '#000000',
    '--foreground': '#FFFFFF',
    '--secondary-background': '#1C1C1E',
    '--secondary-foreground': '#EBEBF5',
    '--border': '#38383A',
    '--muted': '#8E8E93',
    '--success': '#30D158',
    '--error': '#FF453A',
    '--warning': '#FF9F0A',
    '--info': '#0A84FF',
  }),
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme ?? 'light';
  const pathname = usePathname();

  useEffect(() => {
    // API 클라이언트에 현재 경로 동기화 (401 리디렉션용)
    setCurrentPathname(pathname);
  }, [pathname]);

  return (
    <View className="flex-1" style={themeVars[theme]}>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* 공개 영역 — 인증 불필요 */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth/signup" options={{ headerShown: true, title: '회원가입' }} />

          {/* 인증 영역 — 로그인 후 접근 */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: true }} />
          <Stack.Screen name="settings/profile" options={{ headerShown: false, title: '프로필 편집' }} />
          <Stack.Screen name="settings/password" options={{ headerShown: false, title: '패스워드 변경' }} />

          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <GlobalSpinner />
      </ThemeProvider>
    </View>
  );
}
