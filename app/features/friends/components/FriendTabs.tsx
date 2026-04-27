import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, shadows } from '@/constants/design';

type TabType = 'ACCEPTED' | 'PENDING' | 'BLOCKED';

interface FriendTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  friendsCount: number;
  pendingCount: number;
}

export const FriendTabs: React.FC<FriendTabsProps> = ({ activeTab, onChangeTab, friendsCount, pendingCount }) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity style={[styles.tab, activeTab === 'ACCEPTED' && styles.activeTab]} onPress={() => onChangeTab('ACCEPTED')}>
        <Text style={[styles.tabText, activeTab === 'ACCEPTED' && styles.activeTabText]}>내 친구 {friendsCount > 0 && `(${friendsCount})`}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, activeTab === 'PENDING' && styles.activeTab]} onPress={() => onChangeTab('PENDING')}>
        <Text style={[styles.tabText, activeTab === 'PENDING' && styles.activeTabText]}>요청 {pendingCount > 0 && `(${pendingCount})`}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tab, activeTab === 'BLOCKED' && styles.activeTab]} onPress={() => onChangeTab('BLOCKED')}>
        <Text style={[styles.tabText, activeTab === 'BLOCKED' && styles.activeTabText]}>차단</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary[600],
  },
  tabText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[500],
  },
  activeTabText: {
    color: colors.primary[600],
    fontWeight: fontWeight.bold,
  },
});
