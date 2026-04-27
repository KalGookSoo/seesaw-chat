import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius } from '@/constants/design';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { FriendResponse } from '@/services/mock-data';

interface PendingRequestItemProps {
  item: FriendResponse;
  myUserId: string | null;
  onShowDetail: (userId: string) => void;
  onAccept: (item: FriendResponse) => void;
  onReject: (item: FriendResponse) => void;
}

export const PendingRequestItem: React.FC<PendingRequestItemProps> = ({ item, myUserId, onShowDetail, onAccept, onReject }) => {
  const isSentByMe = item.requesterId === myUserId;
  const isReceivedByMe = !isSentByMe;

  return (
    <TouchableOpacity
      style={[styles.pendingCard, isSentByMe && styles.sentCard]}
      onPress={() => onShowDetail(item.friend.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.friend.name[0]}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.friend.name}</Text>
        <Text style={styles.friendUsername}>@{item.friend.username}</Text>
        <Text style={styles.statusLabel}>{isSentByMe ? '보낸 요청' : '받은 요청'}</Text>
      </View>
      <View style={styles.pendingActions}>
        {isReceivedByMe && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={(e) => {
              e.stopPropagation();
              onAccept(item);
            }}
            activeOpacity={0.8}
          >
            <IconSymbol name="checkmark" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={(e) => {
            e.stopPropagation();
            onReject(item);
          }}
          activeOpacity={0.8}
        >
          <IconSymbol name={isSentByMe ? 'trash' : 'xmark'} size={16} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  sentCard: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[200],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 4,
  },
  friendUsername: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
});
