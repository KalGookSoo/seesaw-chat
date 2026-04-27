import React, { useEffect, useState } from 'react';
import { Alert } from '@/services/alert';
import { authService, userService } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PasswordChangeScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    try {
      const currentUserId = await authService.getCurrentUserId();
      if (currentUserId) {
        const user = await userService.getUser(currentUserId);
        setUserId(user.id);
      }
    } catch (error: any) {
      console.error('사용자 ID 로드 실패:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('알림', '모든 필드를 입력해주세요.');
      return;
    }

    if (!userId) {
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('알림', '새 패스워드가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert('알림', '패스워드는 4자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await userService.updatePassword(userId, newPassword);
      Alert.alert('성공', '패스워드가 변경되었습니다. 다시 로그인해주세요.', [
        {
          text: '확인',
          onPress: async () => {
            await authService.logout();
            router.replace('/');
          },
        },
      ]);
    } catch (error: any) {
      Alert.handleApiError(error, '패스워드 변경 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-950">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-row items-center justify-between px-4 pt-16 pb-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 justify-center items-center">
            <MaterialIcons name="chevron-left" size={24} className="text-gray-900 dark:text-white" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">패스워드 변경</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="items-center my-10 gap-4">
            <View className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 justify-center items-center">
              <MaterialIcons name="lock-outline" size={48} color="#2563eb" />
            </View>
            <Text className="text-sm text-gray-600 dark:text-gray-400 text-center px-8">주기적인 패스워드 변경으로 계정을 안전하게 보호하세요.</Text>
          </View>

          <View className="gap-6">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">새 패스워드</Text>
              <TextInput
                className="h-14 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 text-base text-gray-900 dark:text-white"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="새 패스워드를 입력하세요"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">새 패스워드 확인</Text>
              <TextInput
                className="h-14 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 text-base text-gray-900 dark:text-white"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="새 패스워드를 다시 입력하세요"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className={`h-14 bg-blue-600 dark:bg-blue-500 rounded-xl justify-center items-center mt-4 shadow-sm ${loading ? 'opacity-70' : ''}`}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text className="text-white text-base font-bold">{loading ? '변경 중...' : '패스워드 변경'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
