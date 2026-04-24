import React, { useEffect, useState } from 'react';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '@/constants/design';
import { Alert } from '@/services/alert';
import { chatService, friendService } from '@/services/api';
import type { FriendResponse, UserResponse } from '@/services/mock-data';
import { router } from 'expo-router';
import { FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

export default function FriendsScreen() {
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendResponse[]>([]);
  const [blockedFriends, setBlockedFriends] = useState<FriendResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCreateChatMode, setIsCreateChatMode] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [newChatRoomName, setNewChatRoomName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
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
      Alert.handleApiError(error, '요청 거절 실패');
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
      setSearchResults([]);
    } catch (error: any) {
      Alert.handleApiError(error, '친구 요청 실패');
    }
  };

  const handleShowDetail = async (userId: string) => {
    try {
      const userDetail = await friendService.getUserDetail(userId);
      setSelectedUser(userDetail);
      setShowDetailModal(true);
    } catch (error: any) {
      Alert.handleApiError(error, '사용자 정보 로드 실패');
    }
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

  const renderPendingItem = ({ item }: { item: FriendResponse }) => (
    <TouchableOpacity style={styles.pendingCard} onPress={() => handleShowDetail(item.friend.id)} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.friend.name[0]}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.friend.name}</Text>
        <Text style={styles.friendUsername}>@{item.friend.username}</Text>
        <Text style={styles.statusLabel}>수락 대기 중</Text>
      </View>
      <View style={styles.pendingActions}>
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
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRejectRequest(item);
          }}
          activeOpacity={0.8}
        >
          <IconSymbol name="xmark" size={16} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: UserResponse }) => (
    <TouchableOpacity style={styles.searchResultCard} onPress={() => handleShowDetail(item.id)} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={(e) => {
          e.stopPropagation();
          handleSendRequest(item);
        }}
      >
        <IconSymbol name="plus" size={20} color={colors.primary[600]} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>친구</Text>
          <Text style={styles.headerSubtitle}>{friends.length}명의 친구</Text>
        </View>
        <View style={styles.headerActions}>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
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
            friends.map((item) => <View key={item.friend.id}>{renderFriendItem({ item })}</View>)
          )}
        </View>

        {/* Blocked List */}
        {blockedFriends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>차단된 사용자</Text>
            {blockedFriends.map((item) => (
              <View key={item.friend.id}>{renderFriendItem({ item })}</View>
            ))}
          </View>
        )}
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

      {/* User Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.detailCard}>
            <TouchableOpacity style={styles.detailCloseButton} onPress={() => setShowDetailModal(false)}>
              <IconSymbol name="xmark" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            {selectedUser && (
              <View style={styles.detailContent}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarText}>{selectedUser.name[0]}</Text>
                </View>
                <Text style={styles.detailName}>{selectedUser.name}</Text>
                <Text style={styles.detailUsername}>@{selectedUser.username}</Text>

                <View style={styles.detailInfoList}>
                  {selectedUser.contactNumber && (
                    <View style={styles.infoItem}>
                      <IconSymbol name="phone" size={16} color={colors.gray[400]} />
                      <Text style={styles.infoText}>{selectedUser.contactNumber}</Text>
                    </View>
                  )}
                  {selectedUser.registeredAt && (
                    <View style={styles.infoItem}>
                      <IconSymbol name="calendar" size={16} color={colors.gray[400]} />
                      <Text style={styles.infoText}>가입일: {new Date(selectedUser.registeredAt).toLocaleDateString()}</Text>
                    </View>
                  )}
                  {selectedUser.roles && selectedUser.roles.length > 0 && (
                    <View style={styles.infoItem}>
                      <IconSymbol name="shield" size={16} color={colors.gray[400]} />
                      <Text style={styles.infoText}>권한: {selectedUser.roles.join(', ')}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.detailAddButton} onPress={() => handleSendRequest(selectedUser)}>
                  <Text style={styles.detailAddButtonText}>친구 추가 요청</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Chat Room Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.createRoomCard}>
            <Text style={styles.modalTitle}>새 채팅방 생성</Text>
            <Text style={styles.modalSubtitle}>{selectedFriends.length}명의 친구 초대됨</Text>

            <TextInput style={styles.roomNameInput} placeholder="채팅방 이름을 입력하세요" value={newChatRoomName} onChangeText={setNewChatRoomName} autoFocus />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleCreateChatRoom}>
                <Text style={styles.confirmButtonText}>생성하기</Text>
              </TouchableOpacity>
            </View>
          </View>
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
});
