import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { friendService } from '@/services/mock-api';
import type { FriendResponse, UserResponse } from '@/services/mock-data';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/constants/design';

export default function FriendsScreen() {
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsData, pendingData] = await Promise.all([
        friendService.getFriends(),
        friendService.getPendingRequests(),
      ]);
      setFriends(friendsData);
      setPendingRequests(pendingData);
    } catch (error) {
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (friend: FriendResponse) => {
    try {
      await friendService.acceptFriendRequest(friend.friend.id);
      Alert.alert('성공', '친구 요청을 수락했습니다.');
      await loadData();
    } catch (error) {
      Alert.alert('오류', '친구 요청 수락에 실패했습니다.');
    }
  };

  const handleRejectRequest = async (friend: FriendResponse) => {
    try {
      await friendService.rejectFriendRequest(friend.friend.id);
      await loadData();
    } catch (error) {
      Alert.alert('오류', '친구 요청 거절에 실패했습니다.');
    }
  };

  const handleRemoveFriend = (friend: FriendResponse) => {
    Alert.alert('친구 삭제', `${friend.friend.name}님을 친구 목록에서 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await friendService.removeFriend(friend.friend.id);
            await loadData();
          } catch (error) {
            Alert.alert('오류', '친구 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const results = await friendService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('오류', '검색에 실패했습니다.');
    }
  };

  const handleSendRequest = async (user: UserResponse) => {
    try {
      await friendService.sendFriendRequest(user.username);
      Alert.alert('성공', `${user.name}님에게 친구 요청을 보냈습니다.`);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      Alert.alert('오류', '친구 요청에 실패했습니다.');
    }
  };

  const renderFriendItem = ({ item }: { item: FriendResponse }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onLongPress={() => handleRemoveFriend(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.friend.name[0]}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.friend.name}</Text>
        <Text style={styles.friendUsername}>@{item.friend.username}</Text>
      </View>
      <View style={styles.statusBadge}>
        <View style={styles.onlineDot} />
      </View>
    </TouchableOpacity>
  );

  const renderPendingItem = ({ item }: { item: FriendResponse }) => (
    <View style={styles.pendingCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.friend.name[0]}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.friend.name}</Text>
        <Text style={styles.friendUsername}>@{item.friend.username}</Text>
      </View>
      <View style={styles.pendingActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item)}
          activeOpacity={0.8}
        >
          <IconSymbol name="checkmark" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(item)}
          activeOpacity={0.8}
        >
          <IconSymbol name="xmark" size={16} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }: { item: UserResponse }) => (
    <View style={styles.searchResultCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => handleSendRequest(item)}>
        <IconSymbol name="plus" size={20} color={colors.primary[600]} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>친구</Text>
          <Text style={styles.headerSubtitle}>{friends.length}명의 친구</Text>
        </View>
        <TouchableOpacity style={styles.addFriendButton} onPress={() => setShowSearchModal(true)}>
          <IconSymbol name="person.badge.plus" size={22} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>받은 요청</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            </View>
            {pendingRequests.map((item) => (
              <View key={item.friend.id}>{renderPendingItem({ item })}</View>
            ))}
          </View>
        )}

        {/* Friends List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 친구</Text>
          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👋</Text>
              <Text style={styles.emptyTitle}>아직 친구가 없습니다</Text>
              <Text style={styles.emptySubtitle}>친구를 추가하여 채팅을 시작해보세요!</Text>
            </View>
          ) : (
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.friend.id}
              scrollEnabled={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            />
          )}
        </View>
      </ScrollView>

      {/* Search Modal */}
      <Modal visible={showSearchModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>친구 찾기</Text>
            <TouchableOpacity onPress={() => setShowSearchModal(false)} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <IconSymbol name="magnifyingglass" size={20} color={colors.gray[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder="아이디 또는 이름으로 검색"
                placeholderTextColor={colors.gray[400]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>검색</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            style={styles.searchResults}
            contentContainerStyle={styles.searchResultsContent}
            ListEmptyComponent={
              searchQuery ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
                  <Text style={styles.emptySubtitle}>다른 키워드로 검색해보세요</Text>
                </View>
              ) : null
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  headerTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  addFriendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  badge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  modalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray[200],
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  searchButton: {
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  searchResults: {
    flex: 1,
    marginTop: spacing.lg,
  },
  searchResultsContent: {
    paddingHorizontal: spacing.lg,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
});
