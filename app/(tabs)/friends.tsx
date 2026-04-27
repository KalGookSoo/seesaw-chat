import React, { useEffect, useState } from 'react';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '@/constants/design';
import { Alert } from '@/services/alert';
import { authService, chatService, friendService } from '@/services/api';
import type { FriendResponse, UserResponse } from '@/services/mock-data';
import { router } from 'expo-router';
import { FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { UserDetailModal, RelationshipStatus } from '@/components/friends/UserDetailModal';
import { SearchUserModal } from '@/components/friends/SearchUserModal';
import { CreateChatRoomModal } from '@/components/friends/CreateChatRoomModal';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<'ACCEPTED' | 'PENDING' | 'BLOCKED'>('ACCEPTED');
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendResponse[]>([]);
  const [blockedFriends, setBlockedFriends] = useState<FriendResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResponse[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCreateChatMode, setIsCreateChatMode] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [newChatRoomName, setNewChatRoomName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [returnToSearch, setReturnToSearch] = useState(false);

  useEffect(() => {
    const init = async () => {
      const userId = await authService.getCurrentUserId();
      setMyUserId(userId);
      await loadData();
    };
    init();
  }, []);

  const loadData = async () => {
    try {
      const friendsData = await friendService.getFriends();
      setFriends(friendsData.filter((f) => f.status === 'ACCEPTED'));
      setPendingRequests(friendsData.filter((f) => f.status === 'PENDING'));
      setBlockedFriends(friendsData.filter((f) => f.status === 'BLOCKED'));
    } catch (error: any) {
      Alert.handleApiError(error, '데이터 로드 실패');
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
    } catch (error: any) {
      Alert.handleApiError(error, '요청 수락 실패');
    }
  };

  const handleRejectRequest = async (friend: FriendResponse) => {
    try {
      await friendService.rejectFriendRequest(friend.friend.id);
      await loadData();
    } catch (error: any) {
      Alert.handleApiError(error, '요청 거절/취소 실패');
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
          } catch (error: any) {
            Alert.handleApiError(error, '친구 삭제 실패');
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
    } catch (error: any) {
      Alert.handleApiError(error, '사용자 검색 실패');
    }
  };

  const handleSendRequest = async (user: UserResponse) => {
    try {
      await friendService.sendFriendRequest(user.username);
      Alert.alert('성공', `${user.name}님에게 친구 요청을 보냈습니다.`);
      setShowSearchModal(false);
      setShowDetailModal(false);
      setSearchQuery('');
      setSearchResults(null);
      await loadData();
    } catch (error: any) {
      Alert.handleApiError(error, '친구 요청 실패');
    }
  };

  const handleShowDetail = async (userId: string, fromSearch = false) => {
    try {
      const userDetail = await friendService.getUserDetail(userId);
      setSelectedUser(userDetail);
      
      if (fromSearch) {
        setShowSearchModal(false);
        setReturnToSearch(true);
        setTimeout(() => setShowDetailModal(true), 300);
      } else {
        setShowDetailModal(true);
      }
    } catch (error: any) {
      Alert.handleApiError(error, '사용자 정보 로드 실패');
    }
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    if (returnToSearch) {
      setTimeout(() => setShowSearchModal(true), 300);
      setReturnToSearch(false);
    } else {
      setTimeout(() => setSelectedUser(null), 300);
    }
  };

  const getRelationship = (userId: string): RelationshipStatus => {
    if (myUserId === userId) return 'NONE';
    if (friends.some((f) => f.friend.id === userId)) return 'FRIEND';
    if (blockedFriends.some((f) => f.friend.id === userId)) return 'BLOCKED';
    const pending = pendingRequests.find((f) => f.friend.id === userId);
    if (pending) {
      return pending.userId === myUserId ? 'RECEIVED_REQUEST' : 'SENT_REQUEST';
    }
    return 'NONE';
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
  };

  const handleCreateChatRoom = async () => {
    if (!newChatRoomName.trim()) {
      Alert.alert('알림', '채팅방 이름을 입력해주세요.');
      return;
    }
    if (selectedFriends.length === 0) {
      Alert.alert('알림', '초대할 친구를 선택해주세요.');
      return;
    }

    try {
      const newRoom = await chatService.createChatRoom(newChatRoomName, selectedFriends);
      Alert.alert('성공', '채팅방이 생성되었습니다.');
      setShowCreateModal(false);
      setIsCreateChatMode(false);
      setSelectedFriends([]);
      setNewChatRoomName('');

      // 새 채팅방으로 이동
      router.push({
        pathname: '/chat/[id]',
        params: { id: newRoom.id },
      });
    } catch (error: any) {
      Alert.handleApiError(error, '채팅방 생성 실패');
    }
  };

  const renderFriendItem = ({ item }: { item: FriendResponse }) => (
    <TouchableOpacity
      style={[styles.friendCard, isCreateChatMode && selectedFriends.includes(item.friend.id) && styles.selectedFriendCard]}
      onPress={() => {
        if (isCreateChatMode) {
          toggleFriendSelection(item.friend.id);
        }
      }}
      onLongPress={() => !isCreateChatMode && handleRemoveFriend(item)}
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
        <View style={[styles.checkbox, selectedFriends.includes(item.friend.id) && styles.checkboxSelected]}>
          {selectedFriends.includes(item.friend.id) && <IconSymbol name="checkmark" size={14} color="#fff" />}
        </View>
      ) : (
        <View style={styles.statusBadge}>
          <View style={styles.onlineDot} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPendingItem = ({ item }: { item: FriendResponse }) => {
    const isSentByMe = item.userId !== myUserId;

    return (
      <TouchableOpacity style={[styles.pendingCard, isSentByMe && styles.sentCard]} onPress={() => handleShowDetail(item.friend.id)} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.friend.name[0]}</Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.friend.name}</Text>
          <Text style={styles.friendUsername}>@{item.friend.username}</Text>
          <Text style={styles.statusLabel}>{isSentByMe ? '보낸 요청' : '받은 요청'}</Text>
        </View>
        <View style={styles.pendingActions}>
          {!isSentByMe && (
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={(e) => {
                e.stopPropagation();
                handleAcceptRequest(item);
              }}
              activeOpacity={0.8}
            >
              <IconSymbol name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRejectRequest(item);
            }}
            activeOpacity={0.8}
          >
            <IconSymbol name={isSentByMe ? 'trash' : 'xmark'} size={16} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>친구</Text>
          <Text style={styles.headerSubtitle}>{friends.length}명의 친구</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
            <IconSymbol name="arrow.clockwise" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, isCreateChatMode && styles.activeActionButton]}
            onPress={() => {
              setIsCreateChatMode(!isCreateChatMode);
              setSelectedFriends([]);
            }}
          >
            <IconSymbol name={isCreateChatMode ? 'xmark' : 'message'} size={20} color={isCreateChatMode ? colors.gray[600] : colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowSearchModal(true)}>
            <IconSymbol name="person.badge.plus" size={22} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>
      </View>

      {isCreateChatMode && (
        <View style={styles.createModeBanner}>
          <Text style={styles.createModeText}>{selectedFriends.length}명 선택됨</Text>
          <TouchableOpacity style={[styles.createButton, selectedFriends.length === 0 && styles.createButtonDisabled]} disabled={selectedFriends.length === 0} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.createButtonText}>채팅방 생성</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'ACCEPTED' && styles.activeTab]} onPress={() => setActiveTab('ACCEPTED')}>
          <Text style={[styles.tabText, activeTab === 'ACCEPTED' && styles.activeTabText]}>친구</Text>
          {friends.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{friends.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'PENDING' && styles.activeTab]} onPress={() => setActiveTab('PENDING')}>
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.activeTabText]}>요청</Text>
          {pendingRequests.length > 0 && (
            <View style={[styles.tabBadge, styles.pendingBadge]}>
              <Text style={[styles.tabBadgeText, styles.tabBadgeTextLight]}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'BLOCKED' && styles.activeTab]} onPress={() => setActiveTab('BLOCKED')}>
          <Text style={[styles.tabText, activeTab === 'BLOCKED' && styles.activeTabText]}>차단</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {activeTab === 'ACCEPTED' && (
          <View style={styles.section}>
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👋</Text>
                <Text style={styles.emptyTitle}>아직 친구가 없습니다</Text>
                <Text style={styles.emptySubtitle}>친구를 추가하여 채팅을 시작해보세요!</Text>
              </View>
            ) : (
              friends.map((item) => <View key={item.friend.id}>{renderFriendItem({ item })}</View>)
            )}
          </View>
        )}

        {activeTab === 'PENDING' && (
          <View style={styles.section}>
            {pendingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✉️</Text>
                <Text style={styles.emptyTitle}>대기 중인 요청이 없습니다</Text>
                <Text style={styles.emptySubtitle}>새로운 친구를 찾아보세요!</Text>
              </View>
            ) : (
              <>
                {pendingRequests.some((r) => r.userId !== myUserId) && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>받은 요청</Text>
                    {pendingRequests
                      .filter((r) => r.userId !== myUserId)
                      .map((item) => (
                        <View key={item.friend.id}>{renderPendingItem({ item })}</View>
                      ))}
                  </View>
                )}

                {pendingRequests.some((r) => r.userId === myUserId) && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>보낸 요청</Text>
                    {pendingRequests
                      .filter((r) => r.userId === myUserId)
                      .map((item) => (
                        <View key={item.friend.id}>{renderPendingItem({ item })}</View>
                      ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {activeTab === 'BLOCKED' && (
          <View style={styles.section}>
            {blockedFriends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🚫</Text>
                <Text style={styles.emptyTitle}>차단된 사용자가 없습니다</Text>
              </View>
            ) : (
              blockedFriends.map((item) => <View key={item.friend.id}>{renderFriendItem({ item })}</View>)
            )}
          </View>
        )}
      </ScrollView>

      {/* Search Modal */}
      <SearchUserModal
        visible={showSearchModal}
        onClose={() => {
          setShowSearchModal(false);
          setSearchResults(null);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        searchResults={searchResults}
        onUserSelect={(id) => handleShowDetail(id, true)}
        onSendRequest={handleSendRequest}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        visible={showDetailModal}
        onClose={handleCloseDetail}
        user={selectedUser}
        relationship={selectedUser ? getRelationship(selectedUser.id) : 'NONE'}
        onSendRequest={handleSendRequest}
        onAcceptRequest={async (id) => {
          const item = pendingRequests.find((r) => r.friend.id === id);
          if (item) await handleAcceptRequest(item);
          handleCloseDetail();
        }}
        onRejectRequest={async (id) => {
          const item = pendingRequests.find((r) => r.friend.id === id);
          if (item) await handleRejectRequest(item);
          handleCloseDetail();
        }}
        onRemoveFriend={(id, name) => {
          const item = friends.find((f) => f.friend.id === id);
          if (item) {
            handleRemoveFriend(item);
            handleCloseDetail();
          }
        }}
      />

      {/* Create Chat Room Modal */}
      <CreateChatRoomModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        selectedFriendsCount={selectedFriends.length}
        newChatRoomName={newChatRoomName}
        onNameChange={setNewChatRoomName}
        onCreate={handleCreateChatRoom}
      />
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeActionButton: {
    backgroundColor: colors.gray[200],
  },
  createModeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[600],
  },
  createModeText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  createButton: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: colors.primary[600],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
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
  selectedFriendCard: {
    borderColor: colors.primary[600],
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
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
  statusLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
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
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  detailCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
  },
  detailCloseButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    width: '100%',
    alignItems: 'center',
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailAvatarText: {
    color: '#fff',
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
  },
  detailName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: 4,
  },
  detailUsername: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing.xl,
  },
  detailInfoList: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  detailAddButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailAddButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  createRoomCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
  },
  roomNameInput: {
    height: 52,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    fontWeight: fontWeight.semibold,
  },
  confirmButton: {
    flex: 2,
    height: 52,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: fontSize.base,
    color: '#fff',
    fontWeight: fontWeight.bold,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary[600],
  },
  tabText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[500],
  },
  activeTabText: {
    color: colors.primary[600],
  },
  tabBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: colors.gray[600],
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  tabBadgeTextLight: {
    color: '#fff',
  },
  pendingBadge: {
    backgroundColor: colors.primary[600],
  },
  subSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  subSectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray[400],
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sentCard: {
    backgroundColor: colors.background.primary,
    borderColor: colors.gray[200],
  },
});
