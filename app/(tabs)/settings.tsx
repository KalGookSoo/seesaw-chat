import React, { useEffect, useState } from 'react';
import { Alert } from '@/services/alert';
import { authService, pushService, userService } from '@/services/api';
import type { UserResponse } from '@/services/mock-data';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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
        // Mock push subscription - in real app, would use actual web push API
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
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">설정</ThemedText>
      </View>

      <ScrollView style={styles.flex1} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{currentUser?.name ? currentUser.name[0] : '?'}</ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{currentUser?.name || '사용자'}</ThemedText>
            <ThemedText style={styles.profileUsername}>@{currentUser?.username || '-'}</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>알림</ThemedText>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="bell.fill" size={20} color="#007AFF" style={styles.settingIcon} />
              <View>
                <ThemedText style={styles.settingLabel}>푸시 알림</ThemedText>
                <ThemedText style={styles.settingDescription}>새 메시지 알림을 받습니다</ThemedText>
              </View>
            </View>
            <Switch value={pushEnabled} onValueChange={handlePushToggle} trackColor={{ false: '#E8E8E8', true: '#007AFF' }} thumbColor="#fff" />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>계정</ThemedText>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/profile')}>
            <View style={styles.settingInfo}>
              <IconSymbol name="person.circle.fill" size={20} color="#007AFF" style={styles.settingIcon} />
              <View>
                <ThemedText style={styles.settingLabel}>프로필 편집</ThemedText>
                <ThemedText style={styles.settingDescription}>이름과 프로필 사진을 변경합니다</ThemedText>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/password')}>
            <View style={styles.settingInfo}>
              <IconSymbol name="lock.fill" size={20} color="#007AFF" style={styles.settingIcon} />
              <View>
                <ThemedText style={styles.settingLabel}>패스워드 변경</ThemedText>
                <ThemedText style={styles.settingDescription}>계정 패스워드를 변경합니다</ThemedText>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>정보</ThemedText>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="info.circle.fill" size={20} color="#007AFF" style={styles.settingIcon} />
              <ThemedText style={styles.settingLabel}>앱 정보</ThemedText>
            </View>
            <View style={styles.versionContainer}>
              <ThemedText style={styles.versionText}>v1.0.0</ThemedText>
              <IconSymbol name="chevron.right" size={16} color="#999" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="doc.text.fill" size={20} color="#007AFF" style={styles.settingIcon} />
              <ThemedText style={styles.settingLabel}>이용약관</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="hand.raised.fill" size={20} color="#007AFF" style={styles.settingIcon} />
              <ThemedText style={styles.settingLabel}>개인정보처리방침</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>로그아웃</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    opacity: 0.6,
  },
  section: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    opacity: 0.6,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versionText: {
    fontSize: 14,
    opacity: 0.6,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
