import React, { useEffect, useState } from 'react';
import { Alert } from '@/services/alert';
import { authService, userService } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileEditScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUserId = await authService.getCurrentUserId();
      if (currentUserId) {
        const user = await userService.getUser(currentUserId);
        setUserId(user.id);
        setName(user.name);
      }
    } catch (error: any) {
      console.error('프로필 로드 실패:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    if (!userId) {
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      return;
    }

    setLoading(true);
    try {
      await userService.updateProfile(userId, name);
      Alert.alert('성공', '프로필이 수정되었습니다.');
      router.back();
    } catch (error: any) {
      Alert.handleApiError(error, '프로필 수정 실패');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-950">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-row items-center justify-between px-4 pt-16 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 justify-center items-center">
          <MaterialIcons name="chevron-left" size={24} className="text-slate-900 dark:text-white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900 dark:text-white">프로필 편집</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 px-6">
        <View className="items-center my-10">
          <View className="w-[100px] h-[100px] rounded-full bg-primary-600 dark:bg-primary-500 justify-center items-center mb-4 shadow-md">
            <Text className="text-white text-4xl font-bold">{name[0] || '?'}</Text>
          </View>
          <Text className="text-sm text-slate-500 dark:text-slate-400">프로필 사진 변경 기능은 준비 중입니다</Text>
        </View>

        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">이름</Text>
            <TextInput
              className="h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-base text-slate-900 dark:text-white"
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity
            className={`h-14 bg-primary-600 dark:bg-primary-500 rounded-xl justify-center items-center mt-4 shadow-sm ${loading ? 'opacity-70' : ''}`}
            onPress={handleSave}
            disabled={loading}
          >
            <Text className="text-white text-base font-bold">{loading ? '저장 중...' : '저장하기'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
