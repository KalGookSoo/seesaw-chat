import { useState, useEffect, useCallback, useMemo } from 'react';
import { authService, friendService } from '@/services/api';
import type { FriendResponse } from '@/services/mock-data';
import { Alert } from '@/services/alert';

export function useFriends() {
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [allFriends, setAllFriends] = useState<FriendResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const init = useCallback(async () => {
    const userId = await authService.getCurrentUserId();
    setMyUserId(userId);
    await loadData();
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const loadData = async () => {
    try {
      const friendsData = await friendService.getFriends();
      setAllFriends(friendsData);
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

  const handleBlockUser = async (userId: string, userName: string, onSuccess: () => void) => {
    Alert.alert('사용자 차단', `${userName}님을 차단하시겠습니까?\n차단 후에는 상대방의 친구 요청 및 메시지를 받지 않습니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '차단',
        style: 'destructive',
        onPress: async () => {
          try {
            await friendService.blockFriend(userId);
            Alert.alert('성공', '사용자를 차단했습니다.');
            onSuccess();
            await loadData();
          } catch (error: any) {
            Alert.handleApiError(error, '차단 실패');
          }
        },
      },
    ]);
  };

  const friends = useMemo(() => allFriends.filter((f) => f.status === 'ACCEPTED'), [allFriends]);
  const pendingRequests = useMemo(() => allFriends.filter((f) => f.status === 'PENDING'), [allFriends]);
  const blockedFriends = useMemo(() => allFriends.filter((f) => f.status === 'BLOCKED'), [allFriends]);

  return {
    myUserId,
    allFriends,
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
  };
}
