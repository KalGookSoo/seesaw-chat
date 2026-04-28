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
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-16 pb-4 bg-secondary border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 justify-center items-center">
          <MaterialIcons name="chevron-left" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-medium text-foreground">프로필 편집</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 px-4">
        <View className="items-center my-10">
          <View className="w-[100px] h-[100px] rounded-full bg-primary-500 justify-center items-center mb-4 shadow-md">
            <Text className="text-white text-4xl font-bold">{name[0] || '?'}</Text>
          </View>
          <Text className="text-sm text-muted-foreground">프로필 사진 변경 기능은 준비 중입니다</Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-secondary-foreground ml-1">이름</Text>
            <TextInput
              className="bg-secondary border border-border rounded-xl p-4 text-foreground text-base"
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <TouchableOpacity
            className={`bg-primary-500 rounded-xl p-4 items-center mt-4 ${loading ? 'opacity-70' : ''}`}
            onPress={handleSave}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">{loading ? '저장 중...' : '저장하기'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
