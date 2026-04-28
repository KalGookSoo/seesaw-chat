import React, { useState } from 'react';
import { CreateChatRoomModal } from '@/features/friends/components/CreateChatRoomModal';
import { FriendListItem } from '@/features/friends/components/FriendListItem';
import { FriendTabs } from '@/features/friends/components/FriendTabs';
import { PendingRequestItem } from '@/features/friends/components/PendingRequestItem';
import { SearchUserModal } from '@/features/friends/components/SearchUserModal';
import { RelationshipStatus, UserDetailModal } from '@/features/friends/components/UserDetailModal';
import { useFriends } from '@/features/friends/hooks/useFriends';
import { Alert } from '@/services/alert';
import { chatService, friendService } from '@/services/api';
import type { UserResponse } from '@/services/mock-data';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FriendsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconButtonBgColor = isDark ? '#2C2C2E' : '#F2F2F7';
  const iconButtonBorderColor = isDark ? '#48484A' : '#C6C6C8';
  const iconButtonColor = isDark ? '#F3F4F6' : '#374151';
  const [activeTab, setActiveTab] = useState<'ACCEPTED' | 'PENDING' | 'BLOCKED'>('ACCEPTED');

  // Custom Hook for State & Logic
  const { myUserId, friends, pendingRequests, blockedFriends, refreshing, handleRefresh, handleAcceptRequest, handleRejectRequest, handleRemoveFriend, handleBlockUser, loadData } = useFriends();

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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 pt-5 pb-5 bg-background border-b border-border">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-bold text-foreground">친구</Text>
            <Text className="text-sm text-muted-foreground mt-1">{friends.length}명의 친구</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="w-11 h-11 rounded-xl justify-center items-center active:opacity-80"
              style={{ backgroundColor: iconButtonBgColor, borderColor: iconButtonBorderColor, borderWidth: 1 }}
              onPress={handleRefresh}
            >
              <MaterialIcons name="refresh" size={20} color={iconButtonColor} />
            </TouchableOpacity>
            <TouchableOpacity
              className={`w-11 h-11 rounded-xl justify-center items-center active:opacity-80 ${isCreateChatMode ? 'bg-primary-500 border-primary-500' : ''}`}
              style={isCreateChatMode ? undefined : { backgroundColor: iconButtonBgColor, borderColor: iconButtonBorderColor, borderWidth: 1 }}
              onPress={() => {
                setIsCreateChatMode(!isCreateChatMode);
                setSelectedFriends([]);
              }}
            >
              <MaterialIcons name={isCreateChatMode ? 'close' : 'chat'} size={20} color={isCreateChatMode ? '#FFFFFF' : iconButtonColor} />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-11 h-11 rounded-xl justify-center items-center active:opacity-80"
              style={{ backgroundColor: iconButtonBgColor, borderColor: iconButtonBorderColor, borderWidth: 1 }}
              onPress={() => setShowSearchModal(true)}
            >
              <MaterialIcons name="person-add" size={22} color={iconButtonColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isCreateChatMode && (
        <View className="flex-row justify-between items-center px-4 py-3 bg-primary-500">
          <Text className="text-white text-base font-semibold">{selectedFriends.length}명 선택됨</Text>
          <TouchableOpacity
            className={`bg-white px-4 py-2 rounded-xl ${selectedFriends.length === 0 ? 'opacity-50' : ''}`}
            disabled={selectedFriends.length === 0}
            onPress={() => setShowCreateModal(true)}
          >
            <Text className="text-primary-500 text-sm font-bold">채팅방 생성</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <FriendTabs activeTab={activeTab} onChangeTab={setActiveTab} friendsCount={friends.length} pendingCount={pendingRequests.length} />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colorScheme === 'dark' ? '#3b82f6' : '#2563eb'} />}
      >
        {activeTab === 'ACCEPTED' && (
          <View className="mt-4">
            {friends.length === 0 ? (
              <View className="items-center py-12 px-6">
                <Text className="text-xl font-medium text-foreground mb-2">아직 친구가 없습니다</Text>
                <Text className="text-base text-muted-foreground text-center">친구를 추가하여 채팅을 시작해보세요!</Text>
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
          <View className="mt-4">
            {pendingRequests.length === 0 ? (
              <View className="items-center py-12 px-6">
                <Text className="text-xl font-medium text-foreground mb-2">대기 중인 요청이 없습니다</Text>
                <Text className="text-base text-muted-foreground text-center">새로운 친구를 찾아보세요!</Text>
              </View>
            ) : (
              <>
                {pendingRequests.filter((r) => r.requesterId !== myUserId).length > 0 && (
                  <View className="mt-2 mb-4">
                    <Text className="text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-wider">받은 요청</Text>
                    {pendingRequests
                      .filter((r) => r.requesterId !== myUserId)
                      .map((item) => (
                        <PendingRequestItem key={item.friend.id} item={item} myUserId={myUserId} onShowDetail={handleShowDetail} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />
                      ))}
                  </View>
                )}

                {pendingRequests.filter((r) => r.requesterId === myUserId).length > 0 && (
                  <View className="mt-2 mb-4">
                    <Text className="text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-wider">보낸 요청</Text>
                    {pendingRequests
                      .filter((r) => r.requesterId === myUserId)
                      .map((item) => (
                        <PendingRequestItem key={item.friend.id} item={item} myUserId={myUserId} onShowDetail={handleShowDetail} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />
                      ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {activeTab === 'BLOCKED' && (
          <View className="mt-4">
            {blockedFriends.length === 0 ? (
              <View className="items-center py-12 px-6">
                <Text className="text-xl font-medium text-foreground mb-2">차단된 사용자가 없습니다</Text>
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
    </SafeAreaView>
  );
}
