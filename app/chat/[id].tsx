import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from '@/services/alert';
import { authService, chatService, friendService } from '@/services/api';
import { BASE_URL } from '@/services/api-client';
import type { ChatRoomResponse, FriendResponse, MessageResponse, UserResponse } from '@/services/mock-data';
import { tokenStorage } from '@/services/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Dimensions, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const [chatRoom, setChatRoom] = useState<ChatRoomResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [wsStatus, setWsStatus] = useState<number>(WebSocket.CONNECTING);
  const [isConnectionFailed, setIsConnectionFailed] = useState(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 5;
  const ws = useRef<WebSocket | null>(null);
  const currentUserId = useRef<string | null>(null);
  const retryTimerRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const cleanupWebSocket = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const loadChatRoom = useCallback(async () => {
    if (typeof id === 'string') {
      try {
        const room = await chatService.getChatRoom(id);
        setChatRoom(room);
      } catch (error) {
        console.error('채팅방 정보 로드 실패:', error);
      }
    }
  }, [id]);

  const loadMessages = useCallback(async () => {
    if (typeof id === 'string') {
      try {
        const response = await chatService.getMessages(id);
        setMessages(response.content);
      } catch (error: any) {
        console.error('메시지 로드 실패:', error);
      }
    }
  }, [id]);

  const loadInitialData = useCallback(async () => {
    if (typeof id !== 'string') return;

    try {
      currentUserId.current = await authService.getCurrentUserId();
      await Promise.all([loadChatRoom(), loadMessages()]);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  }, [id, loadChatRoom, loadMessages]);

  const handleReconnect = useCallback(() => {
    if (!isMounted.current) return;

    if (retryCount.current < MAX_RETRIES) {
      retryCount.current += 1;
      console.log(`[WebSocket] 재연결 시도 (${retryCount.current}/${MAX_RETRIES})...`);

      retryTimerRef.current = setTimeout(() => {
        if (isMounted.current) {
          connectWebSocket();
        }
      }, 2000);
    } else {
      setIsConnectionFailed(true);
      Alert.alert('연결 오류', '서버와 연결할 수 없습니다. 나중에 다시 시도해주세요.');
    }
  }, []);

  const connectWebSocket = useCallback(async () => {
    if (typeof id !== 'string') return;

    try {
      setWsStatus(WebSocket.CONNECTING);
      setIsConnectionFailed(false);
      const token = await tokenStorage.getAccessToken();
      const baseUrl = BASE_URL.replace(/\/$/, '');
      const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
      const wsUrl = `${wsBaseUrl}/chat?chatRoomId=${id}&accessToken=${token}`;

      const socket = new WebSocket(wsUrl);

      socket.addEventListener('open', () => {
        if (!isMounted.current) {
          socket.close();
          return;
        }
        console.log('[WebSocket] 연결됨');
        setWsStatus(WebSocket.OPEN);
        retryCount.current = 0;
      });

      socket.addEventListener('message', (event) => {
        try {
          const message: MessageResponse = JSON.parse(event.data);

          if (message && message.chatRoomId === id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }
        } catch (e) {
          console.error('[WebSocket] 메시지 수신 및 파싱 오류:', e);
        }
      });

      socket.addEventListener('error', (error) => {
        console.error('[WebSocket] 오류 발생:', error);
      });

      socket.addEventListener('close', (event) => {
        console.log('[WebSocket] 연결 종료:', event.code, event.reason);
        setWsStatus(WebSocket.CLOSED);

        if (event.code !== 1000) {
          handleReconnect();
        }
      });

      ws.current = socket;
    } catch (error) {
      console.error('[WebSocket] 연결 시도 중 오류:', error);
      setWsStatus(WebSocket.CLOSED);
      handleReconnect();
    }
  }, [id, handleReconnect]);

  const handleSend = async () => {
    if (!inputText.trim() || typeof id !== 'string') return;

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      Alert.alert('알림', '서버와 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const messageText = inputText.trim();

    try {
      const payload = {
        chatRoomId: id,
        content: messageText,
        type: 'CHAT',
      };

      ws.current.send(JSON.stringify(payload));
      setInputText('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      Alert.alert('오류', '메시지 전송에 실패했습니다.');
    }
  };

  const handleLeaveRoom = () => {
    Alert.alert('채팅방 나가기', '정말 이 채팅방을 나가시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: async () => {
          if (typeof id === 'string' && currentUserId.current) {
            try {
              await chatService.removeMember(id, currentUserId.current);
              router.replace('/(tabs)/chats');
            } catch (error) {
              Alert.handleApiError(error, '채팅방 나가기 실패');
            }
          }
        },
      },
    ]);
  };

  const handleKickMember = (member: UserResponse) => {
    Alert.alert('멤버 내보내기', `${member.name}님을 채팅방에서 내보내시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '내보내기',
        style: 'destructive',
        onPress: async () => {
          if (typeof id === 'string') {
            try {
              await chatService.removeMember(id, member.id);
              await loadChatRoom();
            } catch (error) {
              Alert.handleApiError(error, '멤버 내보내기 실패');
            }
          }
        },
      },
    ]);
  };

  const handleOpenInvite = async () => {
    try {
      const friendsData = await friendService.getFriends();
      const memberIds = chatRoom?.members?.map((m) => m.id) || [];
      const notMembers = friendsData.filter((f) => f.status === 'ACCEPTED' && !memberIds.includes(f.friend.id));
      setFriends(notMembers);
      setSelectedFriends([]);
      setShowInviteModal(true);
    } catch (error) {
      Alert.handleApiError(error, '친구 목록 로드 실패');
    }
  };

  const handleInvite = async () => {
    if (selectedFriends.length === 0 || typeof id !== 'string') return;
    try {
      await chatService.addMembers(id, selectedFriends);
      setShowInviteModal(false);
      await loadChatRoom();
      Alert.alert('초대 완료', '새로운 멤버가 추가되었습니다.');
    } catch (error) {
      Alert.handleApiError(error, '멤버 초대 실패');
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
  };

  const isCreator = chatRoom?.createdBy === currentUserId.current;

  const renderMessage = ({ item, index }: { item: MessageResponse; index: number }) => {
    if (item.type === 'NOTIFICATION' || !item.sender) {
      return (
        <View className="self-center bg-gray-100 dark:bg-gray-800 px-4 py-1 rounded-full my-3">
          <Text className="text-xs text-gray-600 dark:text-gray-400 font-medium">{item.content}</Text>
        </View>
      );
    }

    const isMyMessage = item.sender?.id === currentUserId.current;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showSender = !prevMessage || prevMessage.sender?.id !== item.sender?.id || !isMyMessage;

    return (
      <View className={`mb-4 max-w-[75%] ${isMyMessage ? 'self-end items-end' : 'self-start items-start'}`}>
        {!isMyMessage && showSender && <Text className="text-xs opacity-70 mb-1 ml-1 text-gray-700 dark:text-gray-300">{item.sender.name}</Text>}
        <View className={`rounded-2xl px-4 py-2 shadow-sm ${isMyMessage ? 'bg-blue-600 dark:bg-blue-500 rounded-tr-[2px]' : 'bg-gray-100 dark:bg-gray-800 rounded-tl-[2px]'}`}>
          <Text className={`text-base leading-5 ${isMyMessage ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{item.content}</Text>
        </View>
        <Text className={`text-[10px] opacity-50 mt-1 ${isMyMessage ? 'text-right' : 'text-left ml-1'} text-gray-500 dark:text-gray-400`}>{formatMessageTime(item.createdDate)}</Text>
      </View>
    );
  };

  useEffect(() => {
    isMounted.current = true;
    loadInitialData();
    connectWebSocket();

    return () => {
      isMounted.current = false;
      cleanupWebSocket();
    };
  }, [id, loadInitialData, connectWebSocket, cleanupWebSocket]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <Stack.Screen
        options={{
          title: chatRoom?.name || '채팅',
          headerShown: true,
          headerRight: () => (
            <View className="flex-row items-center gap-2">
              {wsStatus === WebSocket.CONNECTING && (
                <View className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                  <Text className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">연결 중...</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => setIsDrawerOpen(true)} className="p-2">
                <MaterialIcons name="menu" size={24} className="text-gray-900 dark:text-white" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {isConnectionFailed ? (
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="wifi-off" size={48} color="#d1d5db" />
          <Text className="text-xl font-bold text-gray-900 dark:text-white mt-4">연결에 실패했습니다</Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center mt-2">서버와의 연결이 원활하지 않습니다.{'\n'}인터넷 연결을 확인하고 다시 시도해주세요.</Text>
          <TouchableOpacity
            className="mt-6 px-6 py-3 bg-blue-600 dark:bg-blue-500 rounded-xl"
            onPress={() => {
              retryCount.current = 0;
              connectWebSocket();
            }}
          >
            <Text className="text-white font-semibold">다시 연결하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ref={flatListRef}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center mt-24">
                <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">메시지가 없습니다.</Text>
                <Text className="text-sm opacity-60 text-gray-500 dark:text-gray-400">첫 메시지를 보내보세요!</Text>
              </View>
            }
          />

          <View className="flex-row px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 items-end">
            <TextInput
              className="flex-1 min-h-[40px] max-h-[120px] bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-2 text-base text-gray-900 dark:text-white"
              placeholder={wsStatus === WebSocket.CONNECTING ? '연결 중...' : '메시지를 입력하세요...'}
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={wsStatus === WebSocket.OPEN}
            />
            <TouchableOpacity
              className={`w-10 h-10 rounded-full justify-center items-center ml-2 ${inputText.trim() && wsStatus === WebSocket.OPEN ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-100 dark:bg-gray-800'}`}
              onPress={handleSend}
              disabled={!inputText.trim() || wsStatus !== WebSocket.OPEN}
            >
              <MaterialIcons name="send" size={20} className={inputText.trim() && wsStatus === WebSocket.OPEN ? 'text-white' : 'text-gray-400 dark:text-gray-600'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Drawer Menu */}
      <Modal visible={isDrawerOpen} transparent animationType="none">
        <Pressable className="flex-1 bg-black/50 flex-row justify-end" onPress={() => setIsDrawerOpen(false)}>
          <Pressable className="w-[80%] bg-white dark:bg-gray-950 h-full shadow-2xl" onPress={(e) => e.stopPropagation()}>
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">채팅방 정보</Text>
                <TouchableOpacity onPress={() => setIsDrawerOpen(false)}>
                  <MaterialIcons name="close" size={24} color="#4b5563" />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1">
                {/* Feature Toggles */}
                <View className="p-5 border-b border-gray-100 dark:border-gray-800">
                  <TouchableOpacity className="flex-row justify-between items-center py-3" onPress={() => setIsNotificationsEnabled(!isNotificationsEnabled)}>
                    <View className="flex-row items-center gap-3">
                      <MaterialIcons name={isNotificationsEnabled ? 'notifications' : 'notifications-off'} size={20} className="text-gray-500" />
                      <Text className="text-base text-gray-700 dark:text-gray-300">알림 {isNotificationsEnabled ? '켜짐' : '꺼짐'}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row justify-between items-center py-3" onPress={() => setIsFavorite(!isFavorite)}>
                    <View className="flex-row items-center gap-3">
                      <MaterialIcons name={isFavorite ? 'star' : 'star-outline'} size={20} className={isFavorite ? 'text-yellow-500' : 'text-gray-500'} />
                      <Text className="text-base text-gray-700 dark:text-gray-300">즐겨찾기</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row justify-between items-center py-3">
                    <View className="flex-row items-center gap-3">
                      <MaterialIcons name="settings" size={20} className="text-gray-500" />
                      <Text className="text-base text-gray-700 dark:text-gray-300">환경설정</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Member List */}
                <View className="p-5 border-b border-gray-100 dark:border-gray-800">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-base font-bold text-gray-900 dark:text-white">대화상대 ({chatRoom?.members?.length || 0})</Text>
                    <TouchableOpacity className="p-1" onPress={handleOpenInvite}>
                      <MaterialIcons name="person-add" size={20} className="text-blue-600 dark:text-blue-500" />
                    </TouchableOpacity>
                  </View>

                  {chatRoom?.members?.map((member) => (
                    <View key={member.id} className="flex-row justify-between items-center py-2">
                      <View className="flex-row items-center gap-3">
                        <View className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 justify-center items-center">
                          <Text className="text-base font-bold text-blue-600 dark:text-blue-400">{member.name[0]}</Text>
                        </View>
                        <Text className="text-base text-gray-900 dark:text-white">{member.name}</Text>
                        {member.id === chatRoom.createdBy && (
                          <View className="bg-yellow-500 px-1.5 py-0.5 rounded">
                            <Text className="text-[10px] font-bold text-white">방장</Text>
                          </View>
                        )}
                        {member.id === currentUserId.current && <Text className="text-xs text-gray-400 dark:text-gray-500">(나)</Text>}
                      </View>

                      {isCreator && member.id !== currentUserId.current && (
                        <TouchableOpacity className="p-1" onPress={() => handleKickMember(member)}>
                          <MaterialIcons name="person-remove" size={18} className="text-red-500" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View className="p-5 pb-8">
                <TouchableOpacity className="flex-row items-center gap-3 p-2" onPress={handleLeaveRoom}>
                  <MaterialIcons name="exit-to-app" size={20} className="text-gray-500" />
                  <Text className="text-base text-gray-600 dark:text-gray-400">채팅방 나가기</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl max-h-[80%] p-5">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">친구 초대</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <MaterialIcons name="close" size={24} className="text-gray-500" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={friends}
              keyExtractor={(item) => item.friend.id}
              className="mb-5"
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`flex-row items-center p-3 rounded-xl mb-2 ${selectedFriends.includes(item.friend.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onPress={() => toggleFriendSelection(item.friend.id)}
                >
                  <View className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 justify-center items-center mr-3">
                    <Text className="text-base font-bold text-blue-600 dark:text-blue-400">{item.friend.name[0]}</Text>
                  </View>
                  <Text className="flex-1 text-base text-gray-900 dark:text-white">{item.friend.name}</Text>
                  <View
                    className={`w-6 h-6 rounded-full border-2 justify-center items-center ${selectedFriends.includes(item.friend.id) ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' : 'border-gray-300 dark:border-gray-700'}`}
                  >
                    {selectedFriends.includes(item.friend.id) && <MaterialIcons name="check" size={14} className="text-white" />}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center py-12">
                  <Text className="text-sm opacity-60 text-gray-500 dark:text-gray-400">초대할 수 있는 친구가 없습니다.</Text>
                </View>
              }
            />

            <View className="flex-row gap-4">
              <TouchableOpacity className="flex-1 h-12 rounded-xl justify-center items-center bg-gray-100 dark:bg-gray-800" onPress={() => setShowInviteModal(false)}>
                <Text className="text-base text-gray-600 dark:text-gray-300 font-semibold">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-[2] h-12 rounded-xl justify-center items-center bg-blue-600 dark:bg-blue-500 ${selectedFriends.length === 0 ? 'opacity-50' : ''}`}
                onPress={handleInvite}
                disabled={selectedFriends.length === 0}
              >
                <Text className="text-white text-base font-bold">초대하기 ({selectedFriends.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
