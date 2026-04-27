import React from 'react';
import type { UserResponse } from '@/services/mock-data';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

export type RelationshipStatus = 'FRIEND' | 'SENT_REQUEST' | 'RECEIVED_REQUEST' | 'BLOCKED' | 'NONE';

interface FriendRequestInfo {
  canBlock: boolean;
  canDelete: boolean;
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
        return (
          <View className="w-full flex-col gap-4">
            {onCreateChatRoom && (
              <TouchableOpacity className="w-full h-[52px] rounded-xl flex-row gap-2 bg-blue-600 dark:bg-blue-500 justify-center items-center" onPress={() => onCreateChatRoom(user.id)}>
                <MaterialIcons name="chat-bubble-outline" size={18} color="#fff" />
                <Text className="text-white text-base font-bold">채팅방 생성</Text>
              </TouchableOpacity>
            )}
            <View className="flex-row w-full gap-4">
              {onBlockUser && (
                <TouchableOpacity className="flex-1 h-[52px] rounded-xl bg-gray-200 dark:bg-gray-800 justify-center items-center" onPress={() => onBlockUser(user.id)}>
                  <Text className="text-gray-700 dark:text-gray-300 text-base font-bold">차단하기</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity className="flex-1 h-[52px] rounded-xl bg-red-500/10 dark:bg-red-500/20 justify-center items-center" onPress={() => onRemoveFriend(user.id, user.name)}>
                <Text className="text-red-500 dark:text-red-400 text-base font-bold">친구 삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'SENT_REQUEST':
        return (
          <TouchableOpacity className="w-full h-[52px] rounded-xl bg-gray-200 dark:bg-gray-800 justify-center items-center" onPress={() => onRejectRequest(user.id)}>
            <Text className="text-gray-700 dark:text-gray-300 text-base font-bold">요청 삭제</Text>
          </TouchableOpacity>
        );
      case 'RECEIVED_REQUEST':
        return (
          <View className="w-full flex-col gap-4">
            <View className="flex-row w-full gap-4">
              <TouchableOpacity className="flex-1 h-[52px] rounded-xl bg-gray-200 dark:bg-gray-800 justify-center items-center" onPress={() => onRejectRequest(user.id)}>
                <Text className="text-gray-700 dark:text-gray-300 text-base font-bold">거절</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 h-[52px] rounded-xl bg-blue-600 dark:bg-blue-500 justify-center items-center" onPress={() => onAcceptRequest(user.id)}>
                <Text className="text-white text-base font-bold">승인</Text>
              </TouchableOpacity>
            </View>
            {onBlockUser && (
              <TouchableOpacity className="w-full h-[52px] rounded-xl bg-gray-200 dark:bg-gray-800 justify-center items-center" onPress={() => onBlockUser(user.id)}>
                <Text className="text-gray-700 dark:text-gray-300 text-base font-bold">차단하기</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 'NONE':
        return (
          <TouchableOpacity className="w-full h-[52px] rounded-xl bg-blue-600 dark:bg-blue-500 justify-center items-center" onPress={() => onSendRequest(user)}>
            <Text className="text-white text-base font-bold">친구 추가 요청</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <View className="w-full bg-white dark:bg-gray-900 rounded-2xl p-6 items-center relative">
          <TouchableOpacity className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 justify-center items-center z-10" onPress={onClose}>
            <MaterialIcons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View className="w-full items-center">
            <View className="w-20 h-20 rounded-full bg-blue-600 dark:bg-blue-500 justify-center items-center mb-4">
              <Text className="text-white text-3xl font-bold">{user.name[0]}</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mb-6">@{user.username}</Text>

            <View className="w-full flex-col gap-2 mb-8">
              {user.contactNumber && (
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="phone" size={16} color="#9ca3af" />
                  <Text className="text-sm text-gray-600 dark:text-gray-400">{user.contactNumber}</Text>
                </View>
              )}
              {user.registeredAt && (
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="calendar-today" size={16} color="#9ca3af" />
                  <Text className="text-sm text-gray-600 dark:text-gray-400">가입일: {new Date(user.registeredAt).toISOString().split('T')[0]}</Text>
                </View>
              )}
              {user.roles && user.roles.length > 0 && (
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="shield" size={16} color="#9ca3af" />
                  <Text className="text-sm text-gray-600 dark:text-gray-400">권한: {user.roles.map((role) => ROLE_MAPPING[role as keyof typeof ROLE_MAPPING] || role).join(', ')}</Text>
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
