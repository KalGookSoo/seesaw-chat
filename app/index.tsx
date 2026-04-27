import React, { useEffect, useState } from 'react';
import { Alert } from '@/services/alert';
import { authService } from '@/services/api';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const { redirect } = useLocalSearchParams<{ redirect: string }>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authService.isLoggedIn().then((loggedIn) => {
      if (loggedIn) {
        router.replace('/(tabs)/chats');
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('알림', '아이디와 패스워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await authService.login(username, password);
      if (redirect) {
        router.replace(redirect as any);
      } else {
        router.replace('/(tabs)/chats');
      }
    } catch (error: any) {
      Alert.handleApiError(error, '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="items-center mb-12">
          <View className="mb-4">
            <View className="w-20 h-20 rounded-2xl justify-center items-center bg-blue-600 dark:bg-blue-500 shadow-lg">
              <Text className="text-4xl">💬</Text>
            </View>
          </View>
          <Text className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Seesaw Chat</Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 font-medium">간편하게 연결되는 실시간 채팅</Text>
        </View>

        {/* Form */}
        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">아이디</Text>
            <TextInput
              className={`h-14 border-2 rounded-xl px-4 text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${username ? 'border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-800'}`}
              placeholder="아이디를 입력하세요"
              placeholderTextColor="#9ca3af"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">패스워드</Text>
            <TextInput
              className={`h-14 border-2 rounded-xl px-4 text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${password ? 'border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-800'}`}
              placeholder="패스워드를 입력하세요"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            className={`h-14 rounded-xl mt-4 bg-blue-600 dark:bg-blue-500 justify-center items-center shadow-md ${loading ? 'opacity-50' : ''}`}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-semibold">{loading ? '로그인 중...' : '로그인'}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="py-4 items-center" onPress={handleSignup} activeOpacity={0.7}>
            <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">아직 계정이 없으신가요? 회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
