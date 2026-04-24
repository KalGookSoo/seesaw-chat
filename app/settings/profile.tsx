import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { authService, userService } from '@/services/api';
import { Alert } from '@/services/alert';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '@/constants/design';

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
      console.error('Failed to load profile:', error);
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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>프로필 편집</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{name[0] || '?'}</ThemedText>
          </View>
          <ThemedText style={styles.avatarHint}>프로필 사진 변경 기능은 준비 중입니다</ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>이름</ThemedText>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="이름을 입력하세요" placeholderTextColor={colors.gray[400]} />
          </View>

          <TouchableOpacity style={[styles.saveButton, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
            <ThemedText style={styles.saveButtonText}>{loading ? '저장 중...' : '저장하기'}</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: fontWeight.bold,
  },
  avatarHint: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
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
