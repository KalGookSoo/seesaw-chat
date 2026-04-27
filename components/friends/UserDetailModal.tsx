import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '@/constants/design';
import type { UserResponse } from '@/services/mock-data';

export type RelationshipStatus = 'FRIEND' | 'SENT_REQUEST' | 'RECEIVED_REQUEST' | 'BLOCKED' | 'NONE';

interface FriendRequestInfo {
  canBlock: boolean; // 차단 가능 여부
  canDelete: boolean; // 삭제 가능 여부
}

const ROLE_MAPPING = {
  ROLE_USER: '일반사용자',
  ROLE_MANAGER: '관리자',
  ROLE_ADMIN: '최고관리자',
};

interface UserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserResponse | null;
  relationship: RelationshipStatus;
  friendRequestInfo?: FriendRequestInfo;
  onSendRequest: (user: UserResponse) => void;
  onAcceptRequest: (userId: string) => void;
  onRejectRequest: (userId: string) => void;
  onRemoveFriend: (userId: string, userName: string) => void;
  onBlockUser?: (userId: string) => void;
  onCreateChatRoom?: (userId: string) => void;
}

export function UserDetailModal({
  visible,
  onClose,
  user,
  relationship,
  friendRequestInfo,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onBlockUser,
  onCreateChatRoom,
}: UserDetailModalProps) {
  if (!user) return null;

  const renderActionButton = () => {
    switch (relationship) {
      case 'FRIEND':
        // 친구 상태: 채팅방 생성, 차단하기, 친구 삭제
        return (
          <View style={styles.friendActionsContainer}>
            {onCreateChatRoom && (
              <TouchableOpacity style={[styles.actionButton, styles.chatButton]} onPress={() => onCreateChatRoom(user.id)}>
                <IconSymbol name="message" size={18} color="#fff" />
                <Text style={styles.chatButtonText}>채팅방 생성</Text>
              </TouchableOpacity>
            )}
            <View style={styles.buttonRow}>
              {onBlockUser && (
                <TouchableOpacity style={[styles.actionButton, styles.blockButton]} onPress={() => onBlockUser(user.id)}>
                  <Text style={styles.blockButtonText}>차단하기</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionButton, styles.removeButton]} onPress={() => onRemoveFriend(user.id, user.name)}>
                <Text style={styles.removeButtonText}>친구 삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'SENT_REQUEST':
        // 내가 보낸 요청: 삭제만 가능 (차단 불가)
        return (
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => onRejectRequest(user.id)}>
            <Text style={styles.cancelButtonText}>요청 삭제</Text>
          </TouchableOpacity>
        );
      case 'RECEIVED_REQUEST':
        // 받은 요청: 승인, 거절, 차단 가능
        return (
          <View style={styles.receivedRequestContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => onRejectRequest(user.id)}>
                <Text style={styles.rejectButtonText}>거절</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => onAcceptRequest(user.id)}>
                <Text style={styles.acceptButtonText}>승인</Text>
              </TouchableOpacity>
            </View>
            {onBlockUser && (
              <TouchableOpacity style={[styles.actionButton, styles.blockButtonFull]} onPress={() => onBlockUser(user.id)}>
                <Text style={styles.blockButtonText}>차단하기</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 'NONE':
        return (
          <TouchableOpacity style={[styles.actionButton, styles.addButton]} onPress={() => onSendRequest(user)}>
            <Text style={styles.addButtonText}>친구 추가 요청</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.detailCard}>
          <TouchableOpacity style={styles.detailCloseButton} onPress={onClose}>
            <IconSymbol name="xmark" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <View style={styles.detailContent}>
            <View style={styles.detailAvatar}>
              <Text style={styles.detailAvatarText}>{user.name[0]}</Text>
            </View>
            <Text style={styles.detailName}>{user.name}</Text>
            <Text style={styles.detailUsername}>@{user.username}</Text>

            <View style={styles.detailInfoList}>
              {user.contactNumber && (
                <View style={styles.infoItem}>
                  <IconSymbol name="phone" size={16} color={colors.gray[400]} />
                  <Text style={styles.infoText}>{user.contactNumber}</Text>
                </View>
              )}
              {user.registeredAt && (
                <View style={styles.infoItem}>
                  <IconSymbol name="calendar" size={16} color={colors.gray[400]} />
                  <Text style={styles.infoText}>가입일: {new Date(user.registeredAt).toISOString().split('T')[0]}</Text>
                </View>
              )}
              {user.roles && user.roles.length > 0 && (
                <View style={styles.infoItem}>
                  <IconSymbol name="shield" size={16} color={colors.gray[400]} />
                  <Text style={styles.infoText}>
                    권한: {user.roles.map((role) => ROLE_MAPPING[role as keyof typeof ROLE_MAPPING] || role).join(', ')}
                  </Text>
                </View>
              )}
            </View>

            {renderActionButton()}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  detailCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
  },
  detailCloseButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  detailContent: {
    width: '100%',
    alignItems: 'center',
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailAvatarText: {
    color: '#fff',
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
  },
  detailName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: 4,
  },
  detailUsername: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing.xl,
  },
  detailInfoList: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  actionButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.primary[600],
  },
  addButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  removeButton: {
    backgroundColor: colors.error + '1A', // Light red
  },
  removeButtonText: {
    color: colors.error,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  cancelButtonText: {
    color: colors.gray[700],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.gray[200],
  },
  rejectButtonText: {
    color: colors.gray[700],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  friendActionsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  chatButton: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primary[600],
  },
  chatButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  blockButton: {
    flex: 1,
    backgroundColor: colors.gray[200],
  },
  blockButtonText: {
    color: colors.gray[700],
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  blockButtonFull: {
    width: '100%',
    backgroundColor: colors.gray[200],
  },
  receivedRequestContainer: {
    width: '100%',
    gap: spacing.md,
  },
});
