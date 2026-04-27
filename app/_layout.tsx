import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import 'react-native-reanimated';
import '../global.css';

import { setCurrentPathname } from '@/services/api-client';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GlobalSpinner } from '@/components/ui/global-spinner';

export const unstable_settings = {
  // 네이티브 앱 딥링크 미적용 시 초기 화면 (웹에서는 URL로 결정되므로 무관)
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  useEffect(() => {
    // API 클라이언트에 현재 경로 동기화 (401 리디렉션용)
    setCurrentPathname(pathname);
  }, [pathname]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
      <StatusBar style="auto" />
      <GlobalSpinner />
    </ThemeProvider>
  );
}
