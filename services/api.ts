/**
 * API 서비스 — api-docs.yaml 스펙을 기반으로 실제 API와 통신합니다.
 * JWT Bearer 인증은 api-client.ts에서 자동으로 처리합니다.
 */
import { apiClient, decodeJwt } from './api-client';
import { tokenStorage } from './storage';
import { router } from 'expo-router';
import type { ChatRoomExtended, ChatRoomResponse, FriendResponse, JsonWebToken, MessageResponse, PagedModelMessageResponse, PushSubscriptionResponse, UserResponse } from './mock-data';

// ─────────────────────────────────────────────
// 인증 API  POST /api/sign-in  /api/sign-up  /api/token/refresh
// ─────────────────────────────────────────────
export const authService = {
  /** POST /api/sign-in — SignInRequest → JsonWebToken */
  login: async (username: string, password: string): Promise<JsonWebToken> => {
    const token = await apiClient.postPublic<JsonWebToken>('/api/sign-in', { username, password });
    await tokenStorage.saveTokens(token.accessToken, token.refreshToken, token.expiresIn);
    return token;
  },

  /** POST /api/sign-up — SignUpRequest → void (201) */
  signup: async (username: string, password: string, name: string): Promise<void> => {
    await apiClient.postPublic<void>('/api/sign-up', { username, password, name });
  },

  /** POST /api/token/refresh — TokenRefreshRequest → JsonWebToken */
  refreshToken: async (refreshToken: string): Promise<JsonWebToken> => {
    const token = await apiClient.postPublic<JsonWebToken>('/api/token/refresh', { refreshToken });
    await tokenStorage.saveTokens(token.accessToken, token.refreshToken, token.expiresIn);
    return token;
  },

  /** 로컬 토큰 삭제 및 서버 로그아웃 */
  logout: async (): Promise<void> => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      if (accessToken && refreshToken) {
        await apiClient.post('/api/sign-out', { accessToken, refreshToken });
      }
    } catch (error) {
      console.error('서버 로그아웃 실패:', error);
    } finally {
      await tokenStorage.clearTokens();
    }
  },

  /** 로그인 여부 확인 */
  isLoggedIn: async (): Promise<boolean> => {
    const token = await tokenStorage.getAccessToken();
    return !!token;
  },

  /** JWT 토큰에서 현재 사용자 정보(ID, 계정명, 권한) 추출 */
  getAuthInfo: async () => {
    const token = await tokenStorage.getAccessToken();
    if (!token) return null;
    const decoded = decodeJwt(token);
    return {
      userId: decoded?.sub as string | undefined,
      username: decoded?.username as string | undefined,
      roles: decoded?.authorities as string[] | undefined,
    };
  },

  /** JWT 토큰에서 현재 사용자 ID(userId) 추출 */
  getCurrentUserId: async (): Promise<string | null> => {
    const token = await tokenStorage.getAccessToken();
    if (!token) return null;
    const decoded = decodeJwt(token);
    return (decoded?.sub as string) || null;
  },

  /** JWT 토큰에서 현재 사용자 계정명(username) 추출 */
  getCurrentUsername: async (): Promise<string | null> => {
    const token = await tokenStorage.getAccessToken();
    if (!token) return null;
    const decoded = decodeJwt(token);
    return (decoded?.username as string) || null;
  },
};

// ─────────────────────────────────────────────
// 친구 API
// GET  /api/friends
// POST /api/friends/request
// PUT  /api/friends/{friendId}/accept
// DELETE /api/friends/{friendId}
// ─────────────────────────────────────────────
export const friendService = {
  /** GET /api/friends → FriendResponse[] */
  getFriends: (): Promise<FriendResponse[]> => apiClient.get<FriendResponse[]>('/api/friends'),

  /** POST /api/friends/request — FriendRequest { username } → void */
  sendFriendRequest: (username: string): Promise<void> => apiClient.post<void>('/api/friends/request', { username }),

  /** PUT /api/friends/{friendId}/accept → void */
  acceptFriendRequest: (friendId: string): Promise<void> => apiClient.put<void>(`/api/friends/${friendId}/accept`),

  /** DELETE /api/friends/{friendId} → void (거절 또는 삭제) */
  rejectFriendRequest: (friendId: string): Promise<void> => apiClient.delete<void>(`/api/friends/${friendId}`),

  removeFriend: (friendId: string): Promise<void> => apiClient.delete<void>(`/api/friends/${friendId}`),

  /**
   * GET /api/users?username=...&name=... — UserSearch → UserResponse[]
   * 친구 추가를 위해 사용자를 검색합니다. (아이디 또는 이름으로 검색)
   */
  searchUsers: (query: string): Promise<UserResponse[]> => {
    const encodedQuery = encodeURIComponent(query);
    return apiClient.get<UserResponse[]>(`/api/users?username=${encodedQuery}&name=${encodedQuery}`);
  },

  /** GET /api/users/{userId} → UserResponse */
  getUserDetail: (userId: string): Promise<UserResponse> => apiClient.get<UserResponse>(`/api/users/${userId}`),
};

// ─────────────────────────────────────────────
// 사용자 API
// ─────────────────────────────────────────────
export const userService = {
  /** GET /api/users/{userId} → UserResponse (사용자 상세 조회) */
  getUser: (userId: string): Promise<UserResponse> => apiClient.get<UserResponse>(`/api/users/${userId}`),

  /** PATCH /api/users/{userId}/password → void (패스워드 변경) */
  updatePassword: (userId: string, newPassword: string): Promise<void> => apiClient.patch<void>(`/api/users/${userId}/password`, { newPassword }),

  /** PUT /api/users/{userId} → void (사용자 정보 수정) */
  updateProfile: async (userId: string, name: string): Promise<void> => {
    await apiClient.put<void>(`/api/users/${userId}`, { name });

    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authService.refreshToken(refreshToken);
      } catch (error) {
        console.warn('프로필이 수정되었으나 토큰 갱신에 실패했습니다:', error);
      }
    }
  },
};

// ─────────────────────────────────────────────
// 채팅방 API
// GET /api/chat-rooms
// GET /api/messages
// ─────────────────────────────────────────────
export const chatService = {
  /**
   * GET /api/chat-rooms → ChatRoomResponse[]
   */
  getChatRooms: async (): Promise<ChatRoomExtended[]> => {
    const rooms = await apiClient.get<ChatRoomResponse[]>('/api/chat-rooms');
    return (rooms || []) as ChatRoomExtended[];
  },

  /** POST /api/chat-rooms — ChatRoomCreateRequest → ChatRoomResponse */
  createChatRoom: (name: string, friendIds: string[]): Promise<ChatRoomResponse> => apiClient.post<ChatRoomResponse>('/api/chat-rooms', { name, friendIds }),

  /** GET /api/messages?chatRoomId=&pageNumber=&pageSize= → PagedModelMessageResponse */
  getMessages: (chatRoomId: string, pageNumber: number = 0, pageSize: number = 30): Promise<PagedModelMessageResponse> =>
    apiClient.get<PagedModelMessageResponse>(`/api/messages?chatRoomId=${encodeURIComponent(chatRoomId)}&pageNumber=${pageNumber}&pageSize=${pageSize}`),

  /**
   * 메시지 전송 — WebSocket/STOMP를 통해 처리해야 하는 기능입니다.
   * REST API 스펙에는 별도 전송 엔드포인트가 없으므로 WebSocket 구현 시 대체하세요.
   * 현재는 UI 호환성을 위해 로컬에서 메시지 객체를 생성하여 반환합니다.
   */
  sendMessage: async (chatRoomId: string, content: string): Promise<MessageResponse> => {
    // WebSocket으로 메시지를 전송하는 로직은 별도 구현 필요
    // STOMP 등을 이용해 /app/chat.sendMessage 등으로 전송
    throw new Error('[chatService.sendMessage] WebSocket 메시지 전송은 별도로 구현해야 합니다.');
  },
};

// ─────────────────────────────────────────────
// 웹 푸시 구독 API
// POST   /api/push/subscriptions
// DELETE /api/push/subscriptions?endpoint=
// ─────────────────────────────────────────────
export const pushService = {
  /** POST /api/push/subscriptions — PushSubscriptionRequest → PushSubscriptionResponse */
  subscribe: (endpoint: string, p256dh: string, auth: string, userAgent: string, deviceName: string): Promise<PushSubscriptionResponse> =>
    apiClient.post<PushSubscriptionResponse>('/api/push/subscriptions', {
      endpoint,
      p256dh,
      auth,
      userAgent,
      deviceName,
    }),

  /** DELETE /api/push/subscriptions?endpoint= → void */
  unsubscribe: (endpoint: string): Promise<void> => apiClient.delete<void>(`/api/push/subscriptions?endpoint=${encodeURIComponent(endpoint)}`),
};
