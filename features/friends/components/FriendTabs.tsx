import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type TabType = 'ACCEPTED' | 'PENDING' | 'BLOCKED';

interface FriendTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  friendsCount: number;
  pendingCount: number;
}

export const FriendTabs: React.FC<FriendTabsProps> = ({ activeTab, onChangeTab, friendsCount, pendingCount }) => {
  return (
    <View className="flex-row px-4 pt-2 pb-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <TouchableOpacity
        className={`flex-1 items-center py-3 border-b-2 ${activeTab === 'ACCEPTED' ? 'border-blue-600 dark:border-blue-500' : 'border-transparent'}`}
        onPress={() => onChangeTab('ACCEPTED')}
      >
        <Text className={`text-base font-medium ${activeTab === 'ACCEPTED' ? 'text-blue-600 dark:text-blue-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
          내 친구 {friendsCount > 0 && `(${friendsCount})`}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 items-center py-3 border-b-2 ${activeTab === 'PENDING' ? 'border-blue-600 dark:border-blue-500' : 'border-transparent'}`}
        onPress={() => onChangeTab('PENDING')}
      >
        <Text className={`text-base font-medium ${activeTab === 'PENDING' ? 'text-blue-600 dark:text-blue-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
          요청 {pendingCount > 0 && `(${pendingCount})`}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 items-center py-3 border-b-2 ${activeTab === 'BLOCKED' ? 'border-blue-600 dark:border-blue-500' : 'border-transparent'}`}
        onPress={() => onChangeTab('BLOCKED')}
      >
        <Text className={`text-base font-medium ${activeTab === 'BLOCKED' ? 'text-blue-600 dark:text-blue-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>차단</Text>
      </TouchableOpacity>
    </View>
  );
};
