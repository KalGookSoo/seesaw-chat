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
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-row items-center justify-between px-4 pt-16 pb-4 bg-secondary border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 justify-center items-center">
            <MaterialIcons name="chevron-left" size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-xl font-medium text-foreground">패스워드 변경</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="items-center my-10 gap-4">
            <View className="w-20 h-20 rounded-full bg-secondary justify-center items-center">
              <MaterialIcons name="lock-outline" size={48} color="#6366f1" />
            </View>
            <Text className="text-sm text-muted-foreground text-center px-8">주기적인 패스워드 변경으로 계정을 안전하게 보호하세요.</Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-sm font-medium text-secondary-foreground ml-1">새 패스워드</Text>
              <TextInput
                className="bg-secondary border border-border rounded-xl p-4 text-foreground text-base"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="새 패스워드를 입력하세요"
                placeholderTextColor="#8E8E93"
                secureTextEntry
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-secondary-foreground ml-1">새 패스워드 확인</Text>
              <TextInput
                className="bg-secondary border border-border rounded-xl p-4 text-foreground text-base"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="새 패스워드를 다시 입력하세요"
                placeholderTextColor="#8E8E93"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className={`bg-primary-500 rounded-xl p-4 items-center mt-4 ${loading ? 'opacity-70' : ''}`}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text className="text-white font-semibold text-base">{loading ? '변경 중...' : '패스워드 변경'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
