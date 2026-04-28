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
        isSentByMe ? 'bg-secondary border-border' : 'bg-background border-primary-500'
      }`}
      onPress={() => onShowDetail(item.friend.id)}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-full bg-primary-500 justify-center items-center mr-4">
        <Text className="text-white text-lg font-bold">{item.friend.name[0]}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground mb-1">{item.friend.name}</Text>
        <Text className="text-sm text-muted-foreground mb-1">@{item.friend.username}</Text>
        <Text className="text-xs font-medium text-primary-500">{isSentByMe ? '보낸 요청' : '받은 요청'}</Text>
      </View>
      <View className="flex-row gap-2">
        {isReceivedByMe && (
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-primary-500 justify-center items-center"
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
          className="w-9 h-9 rounded-full bg-error/10 justify-center items-center"
          onPress={(e) => {
            e.stopPropagation();
            onReject(item);
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name={isSentByMe ? 'delete' : 'close'} size={16} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
