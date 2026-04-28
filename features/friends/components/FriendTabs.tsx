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
    <View className="px-4 py-3 bg-background border-b border-border">
      <View className="flex-row bg-secondary border border-border p-1 rounded-xl">
        <TouchableOpacity
          className={`flex-1 items-center py-2 rounded-lg border ${activeTab === 'ACCEPTED' ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500' : 'border-transparent'}`}
          onPress={() => onChangeTab('ACCEPTED')}
        >
          <Text className={`text-sm font-semibold ${activeTab === 'ACCEPTED' ? 'text-primary-500' : 'text-muted-foreground'}`}>
            내 친구 {friendsCount > 0 && `(${friendsCount})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center py-2 rounded-lg border ${activeTab === 'PENDING' ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500' : 'border-transparent'}`}
          onPress={() => onChangeTab('PENDING')}
        >
          <Text className={`text-sm font-semibold ${activeTab === 'PENDING' ? 'text-primary-500' : 'text-muted-foreground'}`}>
            요청 {pendingCount > 0 && `(${pendingCount})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center py-2 rounded-lg border ${activeTab === 'BLOCKED' ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500' : 'border-transparent'}`}
          onPress={() => onChangeTab('BLOCKED')}
        >
          <Text className={`text-sm font-semibold ${activeTab === 'BLOCKED' ? 'text-primary-500' : 'text-muted-foreground'}`}>차단</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
