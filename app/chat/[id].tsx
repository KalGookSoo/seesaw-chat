import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Alert } from '@/services/alert';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { authService, chatService, friendService } from '@/services/api';
import { tokenStorage } from '@/services/storage';
import type { ChatRoomResponse, FriendResponse, MessageResponse, UserResponse } from '@/services/mock-data';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '@/constants/design';
import { BASE_URL } from '@/services/api-client';

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

  // Drawer & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Mocks for feature toggles
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    loadInitialData();
    connectWebSocket();

    return () => {
      isMounted.current = false;
      cleanupWebSocket();
    };
  }, [id, loadInitialData, connectWebSocket, cleanupWebSocket]);

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

      // 지수 백오프 또는 단순 지연 (여기서는 2초)
      retryTimerRef.current = setTimeout(() => {
        if (isMounted.current) {
          connectWebSocket();
        }
      }, 2000);
    } else {
      setIsConnectionFailed(true);
      Alert.alert('연결 오류', '서버와 연결할 수 없습니다. 나중에 다시 시도해주세요.');
    }
  }, [connectWebSocket]);

  const connectWebSocket = useCallback(async () => {
    if (typeof id !== 'string') return;

    try {
      setWsStatus(WebSocket.CONNECTING);
      setIsConnectionFailed(false);
      const token = await tokenStorage.getAccessToken();
      const baseUrl = BASE_URL.replace(/\/$/, '');
      const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
      const wsUrl = `${wsBaseUrl}/chat?chatRoomId=${id}&token=${token}`;

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
          const data = JSON.parse(event.data);
          const message: MessageResponse = data.message;
          if (message) {
            setMessages((prev) => [...prev, message]);
          }
        } catch (e) {
          console.error('[WebSocket] 메시지 파싱 오류:', e);
        }
      });

      socket.addEventListener('error', (error) => {
        console.error('[WebSocket] 오류 발생:', error);
      });

      socket.addEventListener('close', (event) => {
        console.log('[WebSocket] 연결 종료:', event.code, event.reason);
        setWsStatus(WebSocket.CLOSED);

        // 정상적인 종료(1000)가 아니면 재연결 시도
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
              await loadChatRoom(); // 멤버 목록 갱신
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
      // 이미 멤버인 친구 제외
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
      await loadChatRoom(); // 멤버 목록 갱신
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
    if (item.type === 'NOTIFICATION') {
      return (
        <View style={styles.notificationContainer}>
          <ThemedText style={styles.notificationText}>{item.content}</ThemedText>
        </View>
      );
    }

    const isMyMessage = item.sender.id === currentUserId.current;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showSender = !prevMessage || prevMessage.sender.id !== item.sender.id || !isMyMessage;

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {!isMyMessage && showSender && <ThemedText style={styles.senderName}>{item.sender.name}</ThemedText>}
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
          <ThemedText style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>{item.content}</ThemedText>
        </View>
        <ThemedText style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>{formatMessageTime(item.createdDate)}</ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: chatRoom?.name || '채팅',
          headerShown: true,
          headerRight: () => (
            <View style={styles.headerRight}>
              {wsStatus === WebSocket.CONNECTING && (
                <View style={styles.statusIndicator}>
                  <ThemedText style={styles.statusText}>연결 중...</ThemedText>
                </View>
              )}
              <TouchableOpacity onPress={() => setIsDrawerOpen(true)} style={styles.headerButton}>
                <IconSymbol name="line.3.horizontal" size={24} color={colors.gray[900]} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {isConnectionFailed ? (
        <View style={styles.errorState}>
          <IconSymbol name="wifi.slash" size={48} color={colors.gray[300]} />
          <ThemedText style={styles.errorTitle}>연결에 실패했습니다</ThemedText>
          <ThemedText style={styles.errorDescription}>서버와의 연결이 원활하지 않습니다.{'\n'}인터넷 연결을 확인하고 다시 시도해주세요.</ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              retryCount.current = 0;
              connectWebSocket();
            }}
          >
            <ThemedText style={styles.retryButtonText}>다시 연결하기</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ref={flatListRef}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>메시지가 없습니다.</ThemedText>
                <ThemedText style={styles.emptySubtext}>첫 메시지를 보내보세요!</ThemedText>
              </View>
            }
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={wsStatus === WebSocket.CONNECTING ? '연결 중...' : '메시지를 입력하세요...'}
              placeholderTextColor={colors.gray[400]}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={wsStatus === WebSocket.OPEN}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || wsStatus !== WebSocket.OPEN) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || wsStatus !== WebSocket.OPEN}
            >
              <IconSymbol name="paperplane.fill" size={20} color={inputText.trim() && wsStatus === WebSocket.OPEN ? '#fff' : colors.gray[300]} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Drawer Menu */}
      <Modal visible={isDrawerOpen} transparent animationType="none">
        <Pressable style={styles.drawerOverlay} onPress={() => setIsDrawerOpen(false)}>
          <Pressable style={styles.drawerContent} onPress={(e) => e.stopPropagation()}>
            <SafeAreaView style={styles.flex1}>
              <View style={styles.drawerHeader}>
                <ThemedText style={styles.drawerTitle}>채팅방 정보</ThemedText>
                <TouchableOpacity onPress={() => setIsDrawerOpen(false)}>
                  <IconSymbol name="xmark" size={24} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.flex1}>
                {/* Feature Toggles */}
                <View style={styles.drawerSection}>
                  <TouchableOpacity style={styles.drawerItem} onPress={() => setIsNotificationsEnabled(!isNotificationsEnabled)}>
                    <View style={styles.drawerItemLeft}>
                      <IconSymbol name={isNotificationsEnabled ? 'bell.fill' : 'bell.slash.fill'} size={20} color={colors.gray[600]} />
                      <ThemedText style={styles.drawerItemText}>알림 {isNotificationsEnabled ? '켜짐' : '꺼짐'}</ThemedText>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerItem} onPress={() => setIsFavorite(!isFavorite)}>
                    <View style={styles.drawerItemLeft}>
                      <IconSymbol name={isFavorite ? 'star.fill' : 'star'} size={20} color={isFavorite ? colors.warning : colors.gray[600]} />
                      <ThemedText style={styles.drawerItemText}>즐겨찾기</ThemedText>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerItem}>
                    <View style={styles.drawerItemLeft}>
                      <IconSymbol name="gearshape.fill" size={20} color={colors.gray[600]} />
                      <ThemedText style={styles.drawerItemText}>환경설정</ThemedText>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Member List */}
                <View style={styles.drawerSection}>
                  <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>대화상대 ({chatRoom?.members?.length || 0})</ThemedText>
                    <TouchableOpacity style={styles.inviteButton} onPress={handleOpenInvite}>
                      <IconSymbol name="person.badge.plus.fill" size={20} color={colors.primary[600]} />
                    </TouchableOpacity>
                  </View>

                  {chatRoom?.members?.map((member) => (
                    <View key={member.id} style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberAvatar}>
                          <ThemedText style={styles.avatarInitial}>{member.name[0]}</ThemedText>
                        </View>
                        <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                        {member.id === chatRoom.createdBy && (
                          <View style={styles.creatorBadge}>
                            <ThemedText style={styles.creatorBadgeText}>방장</ThemedText>
                          </View>
                        )}
                        {member.id === currentUserId.current && <ThemedText style={styles.meLabel}>(나)</ThemedText>}
                      </View>

                      {isCreator && member.id !== currentUserId.current && (
                        <TouchableOpacity style={styles.kickButton} onPress={() => handleKickMember(member)}>
                          <IconSymbol name="person.fill.xmark" size={18} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.drawerFooter}>
                <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRoom}>
                  <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.gray[600]} />
                  <ThemedText style={styles.leaveButtonText}>채팅방 나가기</ThemedText>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>친구 초대</ThemedText>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <IconSymbol name="xmark" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={friends}
              keyExtractor={(item) => item.friend.id}
              style={styles.friendsList}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.friendItem, selectedFriends.includes(item.friend.id) && styles.selectedFriendItem]} onPress={() => toggleFriendSelection(item.friend.id)}>
                  <View style={styles.memberAvatar}>
                    <ThemedText style={styles.avatarInitial}>{item.friend.name[0]}</ThemedText>
                  </View>
                  <ThemedText style={styles.memberName}>{item.friend.name}</ThemedText>
                  <View style={[styles.checkbox, selectedFriends.includes(item.friend.id) && styles.checkboxSelected]}>
                    {selectedFriends.includes(item.friend.id) && <IconSymbol name="checkmark" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <ThemedText style={styles.emptySubtext}>초대할 수 있는 친구가 없습니다.</ThemedText>
                </View>
              }
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowInviteModal(false)}>
                <ThemedText style={styles.cancelButtonText}>취소</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, selectedFriends.length === 0 && styles.confirmButtonDisabled]} onPress={handleInvite} disabled={selectedFriends.length === 0}>
                <ThemedText style={styles.confirmButtonText}>초대하기 ({selectedFriends.length})</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex1: {
    flex: 1,
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusIndicator: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 10,
    color: colors.gray[500],
    fontWeight: fontWeight.bold,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  messageContainer: {
    marginBottom: spacing.md,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  myMessageBubble: {
    backgroundColor: colors.primary[600],
    borderTopRightRadius: 2,
  },
  otherMessageBubble: {
    backgroundColor: colors.gray[100],
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: colors.gray[900],
  },
  messageTime: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 4,
  },
  notificationContainer: {
    alignSelf: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginVertical: spacing.md,
  },
  notificationText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  myMessageTime: {
    textAlign: 'right',
  },
  otherMessageTime: {
    textAlign: 'left',
    marginLeft: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    backgroundColor: colors.background.primary,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[100],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    opacity: 0.6,
  },

  // Drawer Styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: colors.background.primary,
    height: '100%',
    ...shadows.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  drawerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  drawerSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  drawerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  drawerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  drawerItemText: {
    fontSize: fontSize.base,
    color: colors.gray[700],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  inviteButton: {
    padding: spacing.xs,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  memberName: {
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  creatorBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  creatorBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  meLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
  kickButton: {
    padding: spacing.xs,
  },
  drawerFooter: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  leaveButtonText: {
    fontSize: fontSize.base,
    color: colors.gray[600],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    maxHeight: '80%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  friendsList: {
    marginBottom: spacing.lg,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: borderRadius.xl,
  },
  selectedFriendItem: {
    backgroundColor: colors.primary[50],
  },
  checkbox: {
    marginLeft: 'auto',
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
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
  },
  cancelButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.gray[600],
  },
  confirmButton: {
    flex: 2,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.xl,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.primary,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.lg,
    color: colors.gray[900],
  },
  errorDescription: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
