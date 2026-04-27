import React, { useEffect, useState } from 'react';
import { Alert } from '@/services/alert';
import { authService, pushService, userService } from '@/services/api';
import type { UserResponse } from '@/services/mock-data';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userId = await authService.getCurrentUserId();
        if (userId) {
          const user = await userService.getUser(userId);
          setCurrentUser(user);
        }
      } catch (error: any) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };
    loadUserInfo();
  }, []);

  const handlePushToggle = async (value: boolean) => {
    try {
      if (value) {
        await pushService.subscribe('https://fcm.googleapis.com/fcm/send/mock-endpoint', 'mock-p256dh-key', 'mock-auth-key', navigator.userAgent, 'iOS Device');
        Alert.alert('알림 설정', '푸시 알림이 활성화되었습니다.');
      } else {
        await pushService.unsubscribe('https://fcm.googleapis.com/fcm/send/mock-endpoint');
        Alert.alert('알림 설정', '푸시 알림이 비활성화되었습니다.');
      }
      setPushEnabled(value);
    } catch (error) {
      console.error('푸시 구독 오류:', error);
      Alert.alert('오류', '푸시 알림 설정에 실패했습니다.');
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

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="px-5 pt-16 pb-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">설정</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-5 py-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <View className="w-16 h-16 rounded-full bg-blue-600 dark:bg-blue-500 justify-center items-center mr-4 shadow-sm">
            <Text className="text-white text-2xl font-bold">{currentUser?.name ? currentUser.name[0] : '?'}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">{currentUser?.name || '사용자'}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">@{currentUser?.username || '-'}</Text>
          </View>
        </View>

        <View className="pt-6 pb-2">
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 px-5 mb-2 uppercase tracking-wider">알림</Text>
          <View className="flex-row justify-between items-center px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800/50">
            <View className="flex-1 flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 justify-center items-center mr-3">
                <MaterialIcons name="notifications" size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-base font-semibold text-gray-900 dark:text-white">푸시 알림</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">새 메시지 알림을 받습니다</Text>
              </View>
            </View>
            <Switch value={pushEnabled} onValueChange={handlePushToggle} trackColor={{ false: '#d1d5db', true: '#2563eb' }} thumbColor="#fff" />
          </View>
        </View>

        <View className="pt-6 pb-2">
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 px-5 mb-2 uppercase tracking-wider">계정</Text>
          <TouchableOpacity
            className="flex-row justify-between items-center px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800/50"
            onPress={() => router.push('/settings/profile')}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 justify-center items-center mr-3">
                <MaterialIcons name="account-circle" size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-base font-semibold text-gray-900 dark:text-white">프로필 편집</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">이름과 프로필 사진을 변경합니다</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row justify-between items-center px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800/50"
            onPress={() => router.push('/settings/password')}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 justify-center items-center mr-3">
                <MaterialIcons name="lock" size={18} color="#2563eb" />
              </View>
              <View>
                <Text className="text-base font-semibold text-gray-900 dark:text-white">패스워드 변경</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">계정 패스워드를 변경합니다</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View className="pt-6 pb-2">
          <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 px-5 mb-2 uppercase tracking-wider">정보</Text>
          <TouchableOpacity className="flex-row justify-between items-center px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800/50">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 justify-center items-center mr-3">
                <MaterialIcons name="info" size={18} color="#2563eb" />
              </View>
              <Text className="text-base font-semibold text-gray-900 dark:text-white">앱 정보</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-gray-400 dark:text-gray-500">v1.0.0</Text>
              <MaterialIcons name="chevron-right" size={16} color="#9ca3af" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800/50">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 justify-center items-center mr-3">
                <MaterialIcons name="description" size={18} color="#2563eb" />
              </View>
              <Text className="text-base font-semibold text-gray-900 dark:text-white">이용약관</Text>
            </View>
            <MaterialIcons name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row justify-between items-center px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800/50">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 justify-center items-center mr-3">
                <MaterialIcons name="front-hand" size={18} color="#2563eb" />
              </View>
              <Text className="text-base font-semibold text-gray-900 dark:text-white">개인정보처리방침</Text>
            </View>
            <MaterialIcons name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mx-5 mt-8 h-14 rounded-xl bg-red-500 dark:bg-red-600 justify-center items-center shadow-sm" onPress={handleLogout}>
          <Text className="text-white text-lg font-bold">로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
