import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fontSize, fontWeight, spacing } from '@/constants/design';
import { Alert } from '@/services/alert';
import { chatService, friendService } from '@/services/api';
import type { UserResponse } from '@/services/mock-data';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { CreateChatRoomModal } from '@/app/features/friends/components/CreateChatRoomModal';
import { SearchUserModal } from '@/app/features/friends/components/SearchUserModal';
import { RelationshipStatus, UserDetailModal } from '@/app/features/friends/components/UserDetailModal';
import { FriendListItem } from '@/app/features/friends/components/FriendListItem';
import { PendingRequestItem } from '@/app/features/friends/components/PendingRequestItem';
import { FriendTabs } from '@/app/features/friends/components/FriendTabs';
import { useFriends } from '@/app/features/friends/hooks/useFriends';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<'ACCEPTED' | 'PENDING' | 'BLOCKED'>('ACCEPTED');

  // Custom Hook for State & Logic
  const {
    myUserId,
    friends,
    pendingRequests,
    blockedFriends,
    refreshing,
    handleRefresh,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend,
    handleBlockUser,
    loadData,
  } = useFriends();

  // Screen-specific UI State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResponse[] | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [returnToSearch, setReturnToSearch] = useState(false);

  // Create Chat Room Mode State
  const [isCreateChatMode, setIsCreateChatMode] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [newChatRoomName, setNewChatRoomName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
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

      router.push({
        pathname: '/chat/[id]',
        params: { id: newRoom.id },
      });
    } catch (error: any) {
      Alert.handleApiError(error, '채팅방 생성 실패');
    }
  };

  const handleCreateChatRoomWithFriend = async (userId: string) => {
    const friend = friends.find((f) => f.friend.id === userId);
    if (!friend) return;

    setShowDetailModal(false);

    Alert.alert('채팅방 생성', `${friend.friend.name}님과의 채팅방을 생성하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '생성',
        onPress: async () => {
          try {
            const newRoom = await chatService.createChatRoom(`${friend.friend.name}님과의 채팅`, [userId]);
            Alert.alert('성공', '채팅방이 생성되었습니다.');

            router.push({
              pathname: '/chat/[id]',
              params: { id: newRoom.id },
            });
          } catch (error: any) {
            Alert.handleApiError(error, '채팅방 생성 실패');
          }
        },
      },
    ]);
  };

  const getRelationship = (targetUserId: string): RelationshipStatus => {
    if (myUserId === targetUserId) return 'NONE';
    if (friends.some((f) => f.friend.id === targetUserId || f.userId === targetUserId)) return 'FRIEND';
    if (blockedFriends.some((f) => f.friend.id === targetUserId || f.userId === targetUserId)) return 'BLOCKED';
    const pending = pendingRequests.find((f) => f.friend.id === targetUserId);
    if (pending) {
      if (pending.requesterId === myUserId) return 'SENT_REQUEST';
      return 'RECEIVED_REQUEST';
    }
    return 'NONE';
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
      <FriendTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        friendsCount={friends.length}
        pendingCount={pendingRequests.length}
      />

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
              friends.map((item) => (
                <FriendListItem
                  key={item.friend.id}
                  item={item}
                  isCreateChatMode={isCreateChatMode}
                  isSelected={selectedFriends.includes(item.friend.id)}
                  onPress={() => (isCreateChatMode ? toggleFriendSelection(item.friend.id) : handleShowDetail(item.friend.id))}
                  onLongPress={() => !isCreateChatMode && handleRemoveFriend(item)}
                />
              ))
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
                {pendingRequests.filter((r) => r.requesterId !== myUserId).length > 0 && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>받은 요청</Text>
                    {pendingRequests
                      .filter((r) => r.requesterId !== myUserId)
                      .map((item) => (
                        <PendingRequestItem
                          key={item.friend.id}
                          item={item}
                          myUserId={myUserId}
                          onShowDetail={handleShowDetail}
                          onAccept={handleAcceptRequest}
                          onReject={handleRejectRequest}
                        />
                      ))}
                  </View>
                )}

                {pendingRequests.filter((r) => r.requesterId === myUserId).length > 0 && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>보낸 요청</Text>
                    {pendingRequests
                      .filter((r) => r.requesterId === myUserId)
                      .map((item) => (
                        <PendingRequestItem
                          key={item.friend.id}
                          item={item}
                          myUserId={myUserId}
                          onShowDetail={handleShowDetail}
                          onAccept={handleAcceptRequest}
                          onReject={handleRejectRequest}
                        />
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
              blockedFriends.map((item) => (
                <FriendListItem
                  key={item.friend.id}
                  item={item}
                  isCreateChatMode={false}
                  isSelected={false}
                  onPress={() => handleShowDetail(item.friend.id)}
                  onLongPress={() => handleRemoveFriend(item)}
                />
              ))
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
        onBlockUser={(userId) => {
          if (selectedUser) {
            handleBlockUser(userId, selectedUser.name, () => setShowDetailModal(false));
          }
        }}
        onCreateChatRoom={handleCreateChatRoomWithFriend}
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    borderRadius: 8,
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
});
