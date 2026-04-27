import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius } from '@/constants/design';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { FriendResponse } from '@/services/mock-data';

interface FriendListItemProps {
  item: FriendResponse;
  isCreateChatMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export const FriendListItem: React.FC<FriendListItemProps> = ({ item, isCreateChatMode, isSelected, onPress, onLongPress }) => {
  return (
    <TouchableOpacity
      style={[styles.friendCard, isCreateChatMode && isSelected && styles.selectedFriendCard]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.friend.name[0]}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.friend.name}</Text>
        <Text style={styles.friendUsername}>@{item.friend.username}</Text>
      </View>
      {isCreateChatMode ? (
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <IconSymbol name="checkmark" size={14} color="#fff" />}
        </View>
      ) : (
        <View style={styles.statusBadge}>
          <View style={styles.onlineDot} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  selectedFriendCard: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderBottomColor: 'transparent',
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
  },
  statusBadge: {
    padding: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
});
