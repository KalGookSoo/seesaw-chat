import React from 'react';
import type { FriendResponse } from '@/services/mock-data';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text, TouchableOpacity, View } from 'react-native';

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
      className={`flex-row items-center p-4 mb-3 rounded-xl border ${
        isCreateChatMode && isSelected ? 'bg-secondary border-primary-500' : 'bg-background border-border'
      }`}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View className="w-14 h-14 rounded-full bg-primary-500 justify-center items-center mr-4">
        <Text className="text-white text-2xl font-semibold">{item.friend.name[0]}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground mb-1">{item.friend.name}</Text>
        <Text className="text-sm text-muted-foreground">@{item.friend.username}</Text>
      </View>
      {isCreateChatMode ? (
        <View
          className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
            isSelected ? 'bg-primary-500 border-primary-500' : 'border-border'
          }`}
        >
          {isSelected && <MaterialIcons name="check" size={14} color="#fff" />}
        </View>
      ) : (
        <View className="bg-success/10 px-3 py-1 rounded-full">
          <Text className="text-success text-xs font-bold">친구</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
