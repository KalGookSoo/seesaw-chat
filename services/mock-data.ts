/**
 * API 응답 타입 정의 — api-docs.yaml의 components/schemas와 대응됩니다.
 * 실제 데이터는 api.ts의 서비스를 통해 서버에서 받아옵니다.
 */

// ─── 기본 타입 ────────────────────────────────

export interface UserResponse {
  id: string;
  username: string;
  name: string;
  registeredAt?: string;
  contactNumber?: string;
  expiredDate?: string;
  lockedDate?: string;
  credentialsExpiredDate?: string;
  roles?: string[];
}

export interface ChatRoomCreateRequest {
  name: string;
  friendIds?: string[];
}

export interface UserSearch {
  username?: string;
  name?: string;
}


export interface FriendResponse {
  userId: string;
  friend: UserResponse;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
}

export interface ChatRoomResponse {
  id: string;
  name: string;
  createdBy?: string;
  createdDate?: string;
  members?: UserResponse[];
}

export interface ChatRoomMemberAddRequest {
  memberIds: string[];
}

export interface MessageResponse {
  id: string;
  chatRoomId: string;
  content: string;
  type: 'CHAT' | 'NOTIFICATION';
  mimeType?: string;
  createdDate: string;
  sender: UserResponse;
}

export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PagedModelMessageResponse {
  content: MessageResponse[];
  page: PageMetadata;
}

export interface JsonWebToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface PushSubscriptionResponse {
  id: string;
  userId: string;
  endpoint: string;
  p256dh?: string;
  auth?: string;
  userAgent?: string;
  deviceName?: string;
  createdDate?: string;
}

// ─── UI 확장 타입 ──────────────────────────────

/** 채팅방 목록 화면에서 사용하는 확장 타입 (클라이언트 전용 필드 포함) */
export interface ChatRoomExtended extends ChatRoomResponse {
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}
