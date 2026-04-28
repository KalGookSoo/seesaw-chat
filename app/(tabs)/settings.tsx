import React, { useEffect, useState } from 'react';
import { Alert } from '@/services/alert';
import { authService, pushService, userService } from '@/services/api';
import type { UserResponse } from '@/services/mock-data';
import { pushDeviceStorage } from '@/services/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

async function getExpoPushToken(): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('웹 푸시 등록은 아직 지원하지 않습니다.');
  }

  if (!Device.isDevice) {
    throw new Error('푸시 알림은 실제 기기에서만 사용할 수 있습니다.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (existingPermission.status !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('푸시 알림 권한이 허용되지 않았습니다.');
  }

  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

  return token.data;
}

function getPlatformInfo(): string {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'web';
  }

  return [Platform.OS, Device.osName, Device.osVersion, Device.modelName].filter(Boolean).join(' ');
}

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [registeredPushDeviceId, setRegisteredPushDeviceId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userId = await authService.getCurrentUserId();
        if (userId) {
          const user = await userService.getUser(userId);
          setCurrentUser(user);
        }

        const clientDeviceId = await pushDeviceStorage.getOrCreateClientDeviceId();
        const storedRegisteredDeviceId = await pushDeviceStorage.getRegisteredDeviceId();
        const devices = await pushService.getMyDevices();
        const currentDevice = devices.find((device) => device.active && (device.id === storedRegisteredDeviceId || device.deviceName === clientDeviceId));

        setPushEnabled(!!currentDevice);
        setRegisteredPushDeviceId(currentDevice?.id ?? null);

        if (currentDevice) {
          await pushDeviceStorage.saveRegisteredDeviceId(currentDevice.id);
        } else {
          await pushDeviceStorage.clearRegisteredDeviceId();
        }
      } catch (error: any) {
        console.error('설정 정보 로드 실패:', error);
      }
    };

    loadSettings();
  }, []);

  const handlePushToggle = async (value: boolean) => {
    if (pushLoading) return;

    setPushLoading(true);

    try {
      if (value) {
        const clientDeviceId = await pushDeviceStorage.getOrCreateClientDeviceId();
        const token = await getExpoPushToken();
        const registeredDevice = await pushService.registerDevice({
          provider: 'EXPO',
          token,
          platform: getPlatformInfo(),
          deviceId: clientDeviceId,
        });

        await pushDeviceStorage.saveRegisteredDeviceId(registeredDevice.id);
        setRegisteredPushDeviceId(registeredDevice.id);
        setPushEnabled(registeredDevice.active);
        Alert.alert('알림 설정', '푸시 알림이 활성화되었습니다.');
      } else {
        const deviceId = registeredPushDeviceId ?? (await pushDeviceStorage.getRegisteredDeviceId());

        if (deviceId) {
          await pushService.unregisterDevice(deviceId);
        }

        await pushDeviceStorage.clearRegisteredDeviceId();
        setRegisteredPushDeviceId(null);
        setPushEnabled(false);
        Alert.alert('알림 설정', '푸시 알림이 비활성화되었습니다.');
      }
    } catch (error: any) {
      console.error('푸시 구독 오류:', error);
      Alert.alert('오류', error?.message || '푸시 알림 설정에 실패했습니다.');
    } finally {
      setPushLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleToggleColorScheme = () => {
    setColorScheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-16 pb-5 bg-background border-b border-border">
        <Text className="text-3xl font-bold text-foreground">설정</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-4 py-6 bg-background border-b border-border">
          <View className="w-16 h-16 rounded-full bg-primary-500 justify-center items-center mr-4 shadow-sm">
            <Text className="text-white text-2xl font-bold">{currentUser?.name ? currentUser.name[0] : '?'}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground mb-1">{currentUser?.name || '사용자'}</Text>
            <Text className="text-sm text-muted-foreground">@{currentUser?.username || '-'}</Text>
          </View>
        </View>

        <View className="pt-6 pb-2">
          <Text className="text-xs font-bold text-muted-foreground px-4 mb-2 uppercase tracking-wider">화면</Text>
          <TouchableOpacity className="flex-row justify-between items-center px-4 py-4 bg-background border-b border-border" onPress={handleToggleColorScheme} activeOpacity={0.8}>
            <View className="flex-1 flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-secondary border border-border justify-center items-center mr-3">
                <MaterialIcons name={isDarkMode ? 'dark-mode' : 'light-mode'} size={18} color={isDarkMode ? '#D1D5DB' : '#6B7280'} />
              </View>
              <View>
                <Text className="text-base font-semibold text-foreground">화면 모드</Text>
                <Text className="text-xs text-muted-foreground">{isDarkMode ? '다크 모드 사용 중' : '라이트 모드 사용 중'}</Text>
              </View>
            </View>
            <View className="bg-secondary border border-border px-3 py-1.5 rounded-full">
              <Text className="text-xs font-bold text-secondary-foreground">{isDarkMode ? 'Light' : 'Dark'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="pt-6 pb-2">
          <Text className="text-xs font-bold text-muted-foreground px-4 mb-2 uppercase tracking-wider">알림</Text>
          <View className="flex-row justify-between items-center px-4 py-4 bg-background border-b border-border">
            <View className="flex-1 flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 justify-center items-center mr-3">
                <MaterialIcons name="notifications" size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-base font-semibold text-foreground">푸시 알림</Text>
                <Text className="text-xs text-muted-foreground">새 메시지 알림을 받습니다</Text>
              </View>
            </View>
            <Switch disabled={pushLoading} value={pushEnabled} onValueChange={handlePushToggle} trackColor={{ false: '#d1d5db', true: '#2563eb' }} thumbColor="#fff" />
          </View>
        </View>

        <View className="pt-6 pb-2">
          <Text className="text-xs font-bold text-muted-foreground px-4 mb-2 uppercase tracking-wider">계정</Text>
          <TouchableOpacity
            className="flex-row justify-between items-center px-4 py-4 bg-background border-b border-border"
            onPress={() => router.push('/settings/profile')}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 justify-center items-center mr-3">
                <MaterialIcons name="account-circle" size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-base font-semibold text-foreground">프로필 편집</Text>
                <Text className="text-xs text-muted-foreground">이름과 프로필 사진을 변경합니다</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row justify-between items-center px-4 py-4 bg-background border-b border-border"
            onPress={() => router.push('/settings/password')}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 justify-center items-center mr-3">
                <MaterialIcons name="lock" size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-base font-semibold text-foreground">패스워드 변경</Text>
                <Text className="text-xs text-muted-foreground">계정 패스워드를 변경합니다</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View className="pt-6 pb-2">
          <Text className="text-xs font-bold text-muted-foreground px-4 mb-2 uppercase tracking-wider">정보</Text>
          <TouchableOpacity className="flex-row justify-between items-center px-4 py-4 bg-background border-b border-border">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 justify-center items-center mr-3">
                <MaterialIcons name="info" size={18} color="#2563eb" />
              </View>
              <Text className="text-base font-semibold text-foreground">앱 정보</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-muted-foreground">v1.0.0</Text>
              <MaterialIcons name="chevron-right" size={16} color="#9ca3af" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center px-4 py-4 bg-background border-b border-border">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 justify-center items-center mr-3">
                <MaterialIcons name="description" size={18} color="#2563eb" />
              </View>
              <Text className="text-base font-semibold text-foreground">이용약관</Text>
            </View>
            <MaterialIcons name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center px-4 py-4 bg-background border-b border-border">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 justify-center items-center mr-3">
                <MaterialIcons name="front-hand" size={18} color="#2563eb" />
              </View>
              <Text className="text-base font-semibold text-foreground">개인정보처리방침</Text>
            </View>
            <MaterialIcons name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mx-4 mt-8 h-14 rounded-xl bg-red-500 dark:bg-red-600 justify-center items-center shadow-sm" onPress={handleLogout}>
          <Text className="text-white text-lg font-bold">로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
