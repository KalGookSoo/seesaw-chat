import React, { useCallback, useState } from 'react';
import { chatService } from '@/services/api';
import type { ChatRoomExtended } from '@/services/mock-data';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

export default function ChatsScreen() {
  const [chatRooms, setChatRooms] = useState<ChatRoomExtended[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadChatRooms();
    }, []),
  );

  const loadChatRooms = async () => {
    try {
      const rooms = await chatService.getChatRooms();
      setChatRooms(rooms);
    } catch (error) {
      console.error('채팅방 목록 로드 실패:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChatRooms();
    setRefreshing(false);
  };

  const handleRoomPress = (room: ChatRoomExtended) => {
    router.push({
      pathname: '/chat/[id]',
      params: { id: room.id },
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours < 1) {
      return `${minutes}분 전`;
    } else if (hours < 24) {
      return `${hours}시간 전`;
    } else {
      const days = Math.floor(hours / 24);
      if (days === 1) return '어제';
      if (days < 7) return `${days}일 전`;
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const renderChatRoomItem = ({ item }: { item: ChatRoomExtended }) => (
    <TouchableOpacity className="flex-row bg-white dark:bg-gray-900 rounded-xl p-4 mb-4 shadow-sm" onPress={() => handleRoomPress(item)} activeOpacity={0.7}>
      <View className="w-14 h-14 rounded-full bg-blue-600 dark:bg-blue-500 justify-center items-center mr-4">
        <Text className="text-white text-2xl font-semibold">{item.name ? item.name[0] : '?'}</Text>
      </View>
      <View className="flex-1 justify-center">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="flex-1 text-lg font-semibold text-gray-900 dark:text-white mr-2" numberOfLines={1}>
            {item.name || '알 수 없는 채팅방'}
          </Text>
          <Text className="text-xs text-gray-400 dark:text-gray-500 font-medium">{formatTime(item.lastMessageAt)}</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="flex-1 text-sm text-gray-600 dark:text-gray-400 mr-2" numberOfLines={1}>
            {item.lastMessage || '메시지가 없습니다.'}
          </Text>
          {item.unreadCount !== undefined && item.unreadCount > 0 && (
            <View className="bg-blue-600 dark:bg-blue-500 rounded-full min-w-[24px] h-6 px-2 justify-center items-center">
              <Text className="text-white text-xs font-semibold">{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <View className="px-5 pt-16 pb-5 bg-white dark:bg-gray-900">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">채팅</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{chatRooms.length}개의 대화</Text>
      </View>

      <FlatList
        data={chatRooms}
        renderItem={renderChatRoomItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563eb" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12 px-8">
            <Text className="text-6xl mb-4">💬</Text>
            <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">채팅방이 없습니다</Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 text-center">친구와 대화를 시작해보세요!</Text>
          </View>
        }
      />
    </View>
  );
}
