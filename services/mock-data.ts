// Mock data for the chat application - matching API spec from api-docs.yaml

// API Response Types (matching OpenAPI schemas)
export interface UserResponse {
  id: string;
  username: string;
  name: string;
}

export interface FriendResponse {
  userId: string;
  friend: UserResponse;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
}

export interface ChatRoomResponse {
  id: string;
  name: string;
}

export interface SenderResponse {
  id: string;
  name: string;
}

export interface MessageResponse {
  id: string;
  chatRoomId: string;
  content: string;
  type: 'CHAT' | 'NOTIFICATION';
  mimeType?: string;
  createdDate: string;
  sender: SenderResponse;
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

// Extended types for UI (with additional client-side properties)
export interface ChatRoomExtended extends ChatRoomResponse {
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

// Mock current user
export const mockCurrentUser: UserResponse = {
  id: 'user-1',
  username: 'myusername',
  name: '나',
};

// Mock friends
export const mockFriends: FriendResponse[] = [
  {
    userId: 'user-1',
    status: 'ACCEPTED',
    friend: {
      id: 'user-2',
      username: 'alice',
      name: '앨리스',
    },
  },
  {
    userId: 'user-1',
    status: 'ACCEPTED',
    friend: {
      id: 'user-3',
      username: 'bob',
      name: '밥',
    },
  },
  {
    userId: 'user-1',
    status: 'ACCEPTED',
    friend: {
      id: 'user-4',
      username: 'charlie',
      name: '찰리',
    },
  },
];

// Mock pending friend requests
export const mockPendingRequests: FriendResponse[] = [
  {
    userId: 'user-1',
    status: 'PENDING',
    friend: {
      id: 'user-5',
      username: 'david',
      name: '데이비드',
    },
  },
  {
    userId: 'user-1',
    status: 'PENDING',
    friend: {
      id: 'user-6',
      username: 'emma',
      name: '엠마',
    },
  },
];

// Mock chat rooms (base response from API)
export const mockChatRoomsBase: ChatRoomResponse[] = [
  {
    id: 'room-1',
    name: '앨리스',
  },
  {
    id: 'room-2',
    name: '밥',
  },
  {
    id: 'room-3',
    name: '프로젝트 팀',
  },
];

// Mock chat rooms with extended UI properties
export const mockChatRooms: ChatRoomExtended[] = [
  {
    id: 'room-1',
    name: '앨리스',
    lastMessage: '안녕하세요! 오늘 회의 몇 시에요?',
    lastMessageAt: '2026-04-21T10:30:00Z',
    unreadCount: 2,
  },
  {
    id: 'room-2',
    name: '밥',
    lastMessage: '네, 알겠습니다.',
    lastMessageAt: '2026-04-21T09:15:00Z',
    unreadCount: 0,
  },
  {
    id: 'room-3',
    name: '프로젝트 팀',
    lastMessage: '다음 주 일정 공유드립니다.',
    lastMessageAt: '2026-04-20T18:00:00Z',
    unreadCount: 5,
  },
];

// Mock messages for a room (matching MessageResponse schema)
export const mockMessages: Record<string, MessageResponse[]> = {
  'room-1': [
    {
      id: 'msg-1',
      chatRoomId: 'room-1',
      content: '안녕하세요!',
      type: 'CHAT',
      mimeType: 'text/plain',
      createdDate: '2026-04-21T10:25:00Z',
      sender: {
        id: 'user-2',
        name: '앨리스',
      },
    },
    {
      id: 'msg-2',
      chatRoomId: 'room-1',
      content: '안녕하세요, 앨리스님!',
      type: 'CHAT',
      mimeType: 'text/plain',
      createdDate: '2026-04-21T10:26:00Z',
      sender: {
        id: 'user-1',
        name: '나',
      },
    },
    {
      id: 'msg-3',
      chatRoomId: 'room-1',
      content: '안녕하세요! 오늘 회의 몇 시에요?',
      type: 'CHAT',
      mimeType: 'text/plain',
      createdDate: '2026-04-21T10:30:00Z',
      sender: {
        id: 'user-2',
        name: '앨리스',
      },
    },
  ],
  'room-2': [
    {
      id: 'msg-4',
      chatRoomId: 'room-2',
      content: '밥님, 문서 확인 부탁드립니다.',
      type: 'CHAT',
      mimeType: 'text/plain',
      createdDate: '2026-04-21T09:10:00Z',
      sender: {
        id: 'user-1',
        name: '나',
      },
    },
    {
      id: 'msg-5',
      chatRoomId: 'room-2',
      content: '네, 알겠습니다.',
      type: 'CHAT',
      mimeType: 'text/plain',
      createdDate: '2026-04-21T09:15:00Z',
      sender: {
        id: 'user-3',
        name: '밥',
      },
    },
  ],
  'room-3': [
    {
      id: 'msg-6',
      chatRoomId: 'room-3',
      content: '다음 주 월요일에 회의 있습니다.',
      type: 'CHAT',
      mimeType: 'text/plain',
      createdDate: '2026-04-20T17:50:00Z',
      sender: {
        id: 'user-2',
        name: '앨리스',
      },
    },
    {
      id: 'msg-7',
      chatRoomId: 'room-3',
      content: '확인했습니다!',
      type: 'CHAT',
      mimeType: 'text/plain',
      createdDate: '2026-04-20T17:55:00Z',
      sender: {
        id: 'user-4',
        name: '찰리',
      },
    },
    {
      id: 'msg-8',
      chatRoomId: 'room-3',
      content: '다음 주 일정 공유드립니다.',
      type: 'CHAT',
      mimeType: 'text/plain',
      createdDate: '2026-04-20T18:00:00Z',
      sender: {
        id: 'user-3',
        name: '밥',
      },
    },
  ],
};
