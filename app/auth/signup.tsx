import React, { useState } from 'react';
import { Alert } from '@/services/alert';
import { authService } from '@/services/api';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim() || !password.trim() || !name.trim()) {
      Alert.alert('알림', '모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('알림', '패스워드가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('알림', '패스워드는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await authService.signup(username, password, name);
      Alert.alert('회원가입 성공', '로그인 화면으로 이동합니다.', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.handleApiError(error, '회원가입 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-4 py-6">
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-foreground mb-2">회원가입</Text>
            <Text className="text-base text-muted-foreground">새로운 계정을 만들어보세요</Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground ml-1">아이디</Text>
              <TextInput
                className="bg-secondary border border-border rounded-xl p-4 text-foreground text-base"
                placeholder="아이디를 입력하세요"
                placeholderTextColor="#8E8E93"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground ml-1">이름</Text>
              <TextInput
                className="bg-secondary border border-border rounded-xl p-4 text-foreground text-base"
                placeholder="이름을 입력하세요"
                placeholderTextColor="#8E8E93"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground ml-1">패스워드</Text>
              <TextInput
                className="bg-secondary border border-border rounded-xl p-4 text-foreground text-base"
                placeholder="패스워드를 입력하세요 (최소 6자)"
                placeholderTextColor="#8E8E93"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground ml-1">패스워드 확인</Text>
              <TextInput
                className="bg-secondary border border-border rounded-xl p-4 text-foreground text-base"
                placeholder="패스워드를 다시 입력하세요"
                placeholderTextColor="#8E8E93"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity className={`bg-primary-500 rounded-xl p-4 items-center mt-2 ${loading ? 'opacity-50' : ''}`} onPress={handleSignup} disabled={loading} activeOpacity={0.8}>
              <Text className="text-white text-base font-semibold">{loading ? '가입 중...' : '가입하기'}</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-transparent border border-primary-500 rounded-xl p-4 items-center" onPress={() => router.back()} activeOpacity={0.8}>
              <Text className="text-primary-500 text-base font-semibold">취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
