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
      className={`flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800 ${
        isCreateChatMode && isSelected ? 'bg-blue-50 dark:bg-blue-900 rounded-lg px-3 -mx-3 border-b-transparent' : ''
      }`}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View className="w-14 h-14 rounded-full bg-primary-600 dark:bg-primary-500 justify-center items-center mr-4">
        <Text className="text-white text-2xl font-semibold">{item.friend.name[0]}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-1">{item.friend.name}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">@{item.friend.username}</Text>
      </View>
      {isCreateChatMode ? (
        <View
          className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
            isSelected ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          {isSelected && <MaterialIcons name="check" size={14} color="#fff" />}
        </View>
      ) : (
        <View className="p-2">
          <View className="w-2 h-2 rounded-full bg-green-500" />
        </View>
      )}
    </TouchableOpacity>
  );
};
