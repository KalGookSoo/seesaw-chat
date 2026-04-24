import React, { useEffect, useState } from 'react';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '@/constants/design';
import { Alert } from '@/services/alert';
import { authService, userService } from '@/services/api';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>패스워드 변경</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.infoSection}>
            <IconSymbol name="lock.shield.fill" size={48} color={colors.primary[600]} />
            <ThemedText style={styles.infoText}>주기적인 패스워드 변경으로 계정을 안전하게 보호하세요.</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>새 패스워드</ThemedText>
              <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="새 패스워드를 입력하세요" placeholderTextColor={colors.gray[400]} secureTextEntry />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>새 패스워드 확인</ThemedText>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="새 패스워드를 다시 입력하세요"
                placeholderTextColor={colors.gray[400]}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={[styles.saveButton, loading && styles.buttonDisabled]} onPress={handleChangePassword} disabled={loading}>
              <ThemedText style={styles.saveButtonText}>{loading ? '변경 중...' : '패스워드 변경'}</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  infoSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginLeft: 4,
  },
  input: {
    height: 52,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  saveButton: {
    height: 56,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.md,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
