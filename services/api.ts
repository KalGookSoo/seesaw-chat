/**
 * API 서비스 — api-docs.yaml 스펙을 기반으로 실제 API와 통신합니다.
 * JWT Bearer 인증은 api-client.ts에서 자동으로 처리합니다.
 */
import { apiClient } from './api-client';
import { tokenStorage } from './storage';
import type {
  JsonWebToken,
  FriendResponse,
  ChatRoomResponse,
  PagedModelMessageResponse,
  PushSubscriptionResponse,
  UserResponse,
  ChatRoomExtended,
  MessageResponse,
} from './mock-data';

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

  /** 로컬 토큰 삭제 (로그아웃) */
  logout: async (): Promise<void> => {
    await tokenStorage.clearTokens();
  },

  /** 로그인 여부 확인 */
  isLoggedIn: async (): Promise<boolean> => {
    const token = await tokenStorage.getAccessToken();
    return !!token;
  },
};

// ─────────────────────────────────────────────
// 친구 API
// GET  /api/friends
// GET  /api/friends/pending
// POST /api/friends/request
// PUT  /api/friends/{friendId}/accept
// DELETE /api/friends/{friendId}
// ─────────────────────────────────────────────
export const friendService = {
  /** GET /api/friends → FriendResponse[] */
  getFriends: (): Promise<FriendResponse[]> => apiClient.get<FriendResponse[]>('/api/friends'),

  /** GET /api/friends/pending → FriendResponse[] */
  getPendingRequests: (): Promise<FriendResponse[]> =>
    apiClient.get<FriendResponse[]>('/api/friends/pending'),

  /** POST /api/friends/request — FriendRequest { username } → void */
  sendFriendRequest: (username: string): Promise<void> =>
    apiClient.post<void>('/api/friends/request', { username }),

  /** PUT /api/friends/{friendId}/accept → void */
  acceptFriendRequest: (friendId: string): Promise<void> =>
    apiClient.put<void>(`/api/friends/${friendId}/accept`),

  /** DELETE /api/friends/{friendId} → void (거절 또는 삭제) */
  rejectFriendRequest: (friendId: string): Promise<void> =>
    apiClient.delete<void>(`/api/friends/${friendId}`),

  removeFriend: (friendId: string): Promise<void> =>
    apiClient.delete<void>(`/api/friends/${friendId}`),

  /**
   * 사용자 검색 — API 스펙에 별도 엔드포인트가 없으므로
   * 친구 요청을 위해 username으로 직접 찾는 방식을 사용합니다.
   * 백엔드에 사용자 검색 API가 추가되면 이 메서드를 수정하세요.
   */
  searchUsers: async (query: string): Promise<UserResponse[]> => {
    // 현재 API 스펙에 사용자 검색 엔드포인트가 없으므로
    // 친구 목록에서 필터링하거나 별도 구현이 필요합니다.
    // 임시로 빈 배열 반환 (백엔드 추가 후 실제 구현 필요)
    console.warn('[friendService.searchUsers] 사용자 검색 API가 스펙에 없습니다. 백엔드 확인 필요.');
    return [];
  },
};

// ─────────────────────────────────────────────
// 채팅방 API
// GET /api/chat-rooms
// GET /api/messages
// ─────────────────────────────────────────────
export const chatService = {
  /**
   * GET /api/chat-rooms → { [key: string]: ChatRoomResponse[] }
   * API는 그룹화된 객체를 반환하므로, 모든 채팅방을 flat하게 변환합니다.
   */
  getChatRooms: async (): Promise<ChatRoomExtended[]> => {
    const data = await apiClient.get<Record<string, ChatRoomResponse[]>>('/api/chat-rooms');
    // API 응답이 { groupKey: ChatRoomResponse[] } 형태이므로 flat하게 변환
    if (!data) return [];
    const rooms: ChatRoomExtended[] = Object.values(data).flat();
    return rooms;
  },

  /** GET /api/messages?chatRoomId=&pageNumber=&pageSize= → PagedModelMessageResponse */
  getMessages: (
    chatRoomId: string,
    pageNumber: number = 0,
    pageSize: number = 30,
  ): Promise<PagedModelMessageResponse> =>
    apiClient.get<PagedModelMessageResponse>(
      `/api/messages?chatRoomId=${encodeURIComponent(chatRoomId)}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
    ),

  /**
   * 메시지 전송 — WebSocket/STOMP를 통해 처리해야 하는 기능입니다.
   * REST API 스펙에는 별도 전송 엔드포인트가 없으므로 WebSocket 구현 시 대체하세요.
   * 현재는 UI 호환성을 위해 로컬에서 메시지 객체를 생성하여 반환합니다.
   */
  sendMessage: async (chatRoomId: string, content: string): Promise<MessageResponse> => {
    // WebSocket으로 메시지를 전송하는 로직은 별도 구현 필요
    // STOMP 등을 이용해 /app/chat.sendMessage 등으로 전송
    throw new Error(
      '[chatService.sendMessage] WebSocket 메시지 전송은 별도로 구현해야 합니다.',
    );
  },
};

// ─────────────────────────────────────────────
// 웹 푸시 구독 API
// POST   /api/push/subscriptions
// DELETE /api/push/subscriptions?endpoint=
// ─────────────────────────────────────────────
export const pushService = {
  /** POST /api/push/subscriptions — PushSubscriptionRequest → PushSubscriptionResponse */
  subscribe: (
    endpoint: string,
    p256dh: string,
    auth: string,
    userAgent: string,
    deviceName: string,
  ): Promise<PushSubscriptionResponse> =>
    apiClient.post<PushSubscriptionResponse>('/api/push/subscriptions', {
      endpoint,
      p256dh,
      auth,
      userAgent,
      deviceName,
    }),

  /** DELETE /api/push/subscriptions?endpoint= → void */
  unsubscribe: (endpoint: string): Promise<void> =>
    apiClient.delete<void>(
      `/api/push/subscriptions?endpoint=${encodeURIComponent(endpoint)}`,
    ),
};
