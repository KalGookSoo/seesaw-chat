import React from 'react';
import type { FriendResponse } from '@/services/mock-data';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text, TouchableOpacity, View } from 'react-native';

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
      className={`flex-row items-center p-4 rounded-xl mb-3 border ${
        isSentByMe ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' : 'bg-white border-blue-200 dark:bg-gray-900 dark:border-blue-900/50'
      }`}
      onPress={() => onShowDetail(item.friend.id)}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800/50 justify-center items-center mr-4">
        <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.friend.name[0]}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-1">{item.friend.name}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">@{item.friend.username}</Text>
        <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">{isSentByMe ? '보낸 요청' : '받은 요청'}</Text>
      </View>
      <View className="flex-row gap-2">
        {isReceivedByMe && (
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-blue-600 dark:bg-blue-500 justify-center items-center"
            onPress={(e) => {
              e.stopPropagation();
              onAccept(item);
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="check" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 justify-center items-center"
          onPress={(e) => {
            e.stopPropagation();
            onReject(item);
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name={isSentByMe ? 'delete' : 'close'} size={16} color={isSentByMe ? '#ef4444' : '#6b7280'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
