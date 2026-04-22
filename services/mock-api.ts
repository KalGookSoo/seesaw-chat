// Mock API services - matching API spec from api-docs.yaml
import {
  mockCurrentUser,
  mockFriends,
  mockPendingRequests,
  mockChatRooms,
  mockMessages,
  type UserResponse,
  type FriendResponse,
  type ChatRoomExtended,
  type MessageResponse,
  type JsonWebToken,
  type PagedModelMessageResponse,
} from './mock-data';

// Simulate network delay
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Auth Service (POST /api/sign-in, POST /api/sign-up, POST /api/token/refresh)
export const authService = {
  // POST /api/sign-in - SignInRequest -> JsonWebToken
  login: async (username: string, password: string): Promise<JsonWebToken> => {
    await delay();
    if (username && password) {
      return {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresIn: 3600, // 1 hour
      };
    }
    throw new Error('Invalid credentials');
  },

  // POST /api/sign-up - SignUpRequest -> void (201)
  signup: async (username: string, password: string, name: string): Promise<void> => {
    await delay();
    if (username && password && name) {
      // Successfully created (201)
      return;
    }
    throw new Error('Invalid signup data');
  },

  // POST /api/token/refresh - TokenRefreshRequest -> JsonWebToken
  refreshToken: async (refreshToken: string): Promise<JsonWebToken> => {
    await delay();
    if (refreshToken) {
      return {
        accessToken: 'mock-new-access-token-' + Date.now(),
        expiresIn: 3600,
      };
    }
    throw new Error('Invalid refresh token');
  },
};

// Friend Service (GET /api/friends, GET /api/friends/pending, POST /api/friends/request, PUT /api/friends/{friendId}/accept, DELETE /api/friends/{friendId})
export const friendService = {
  // GET /api/friends -> FriendResponse[]
  getFriends: async (): Promise<FriendResponse[]> => {
    await delay();
    return mockFriends;
  },

  // GET /api/friends/pending -> FriendResponse[]
  getPendingRequests: async (): Promise<FriendResponse[]> => {
    await delay();
    return mockPendingRequests;
  },

  // POST /api/friends/request - FriendRequest (username) -> void
  sendFriendRequest: async (username: string): Promise<void> => {
    await delay();
    console.log('Friend request sent to username:', username);
  },

  // PUT /api/friends/{friendId}/accept -> void
  acceptFriendRequest: async (friendId: string): Promise<void> => {
    await delay();
    console.log('Friend request accepted:', friendId);
  },

  // DELETE /api/friends/{friendId} -> void
  rejectFriendRequest: async (friendId: string): Promise<void> => {
    await delay();
    console.log('Friend request rejected:', friendId);
  },

  // DELETE /api/friends/{friendId} -> void
  removeFriend: async (friendId: string): Promise<void> => {
    await delay();
    console.log('Friend removed:', friendId);
  },

  // Search users (not in API spec, but useful for UI)
  searchUsers: async (query: string): Promise<UserResponse[]> => {
    await delay();
    // Mock search results
    return [
      { id: 'user-7', username: 'john', name: '존' },
      { id: 'user-8', username: 'jane', name: '제인' },
    ].filter(
      (user) => user.username.includes(query.toLowerCase()) || user.name.includes(query)
    );
  },
};

// Chat Service (GET /api/chat-rooms, GET /api/messages)
export const chatService = {
  // GET /api/chat-rooms -> { [key: string]: ChatRoomResponse[] }
  // Note: API returns object with arbitrary keys, we'll return extended version for UI
  getChatRooms: async (): Promise<ChatRoomExtended[]> => {
    await delay();
    return mockChatRooms;
  },

  // GET /api/messages?chatRoomId=xxx&pageNumber=0&pageSize=30 -> PagedModelMessageResponse
  getMessages: async (
    chatRoomId: string,
    pageNumber: number = 0,
    pageSize: number = 30
  ): Promise<PagedModelMessageResponse> => {
    await delay();
    const messages = mockMessages[chatRoomId] || [];

    return {
      content: messages,
      page: {
        size: pageSize,
        number: pageNumber,
        totalElements: messages.length,
        totalPages: Math.ceil(messages.length / pageSize),
      },
    };
  },

  // Send message (WebSocket in real app, but mocked here)
  sendMessage: async (chatRoomId: string, content: string): Promise<MessageResponse> => {
    await delay();
    const newMessage: MessageResponse = {
      id: `msg-${Date.now()}`,
      chatRoomId,
      content,
      type: 'CHAT',
      mimeType: 'text/plain',
      createdDate: new Date().toISOString(),
      sender: {
        id: mockCurrentUser.id,
        name: mockCurrentUser.name,
      },
    };
    return newMessage;
  },
};

// Push Notification Service (POST /api/push/subscriptions, DELETE /api/push/subscriptions)
export const pushService = {
  // POST /api/push/subscriptions - PushSubscriptionRequest -> PushSubscriptionResponse
  subscribe: async (
    endpoint: string,
    p256dh: string,
    auth: string,
    userAgent: string,
    deviceName: string
  ): Promise<void> => {
    await delay();
    console.log('Push notification subscribed:', { endpoint, deviceName, userAgent });
  },

  // DELETE /api/push/subscriptions?endpoint=xxx -> void
  unsubscribe: async (endpoint: string): Promise<void> => {
    await delay();
    console.log('Push notification unsubscribed:', endpoint);
  },
};
