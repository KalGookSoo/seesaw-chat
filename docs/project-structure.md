# Seesaw Chat — 프로젝트 구조 & 개발 가이드

> 최종 수정일: 2026-04-27

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [디렉토리 구조](#2-디렉토리-구조)
3. [아키텍처 설계 의도](#3-아키텍처-설계-의도)
4. [레이어별 상세 설명](#4-레이어별-상세-설명)
5. [코딩 컨벤션](#5-코딩-컨벤션)
6. [새 기능 추가 가이드](#6-새-기능-추가-가이드)
7. [환경 설정](#7-환경-설정)

---

## 1. 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | [Expo](https://expo.dev/) (SDK 54) + [React Native](https://reactnative.dev/) 0.81 |
| 라우팅 | [Expo Router](https://expo.github.io/router/) v6 (파일 기반 라우팅) |
| 언어 | TypeScript 5.9 |
| API 통신 | Fetch API + JWT Bearer 인증 (커스텀 클라이언트) |
| 상태 관리 | React 내장 (`useState`, `useEffect`) — 전역 상태 라이브러리 미사용 |
| 스타일링 | React Native `StyleSheet` + 자체 디자인 시스템 (`constants/design.ts`) |
| 토큰 저장 | `@react-native-async-storage/async-storage` (네이티브) / `localStorage` (웹) |
| API 문서 | OpenAPI 3.0 (`docs/api-docs.yaml`) |

---

## 2. 디렉토리 구조

```
seesaw-chat/
├── app/                        # 화면 (Expo Router 파일 기반 라우팅)
│   ├── _layout.tsx             # 루트 레이아웃 (Stack 네비게이터 설정)
│   ├── auth/
│   │   ├── login.tsx           # 로그인 화면
│   │   └── signup.tsx          # 회원가입 화면
│   ├── (tabs)/                 # 탭 네비게이터 그룹
│   │   ├── _layout.tsx         # 탭 바 구성
│   │   ├── index.tsx           # 루트(/) 진입점 → /auth/login 리디렉션
│   │   ├── friends.tsx         # 친구 목록 화면
│   │   ├── chats.tsx           # 채팅방 목록 화면
│   │   └── settings.tsx        # 설정 화면
│   ├── chat/
│   │   └── [id].tsx            # 채팅방 상세 화면 (동적 라우트)
│   └── modal.tsx               # 공통 모달
│
├── features/                   # 기능별 도메인 로직 (컴포넌트, 훅 등)
│   └── friends/
│       ├── components/         # 친구 기능 전용 컴포넌트
│       └── hooks/              # 친구 기능 전용 훅
│
├── services/                   # 비즈니스 로직 & API 통신 레이어
│   ├── storage.ts              # JWT 토큰 저장소 (플랫폼 추상화)
│   ├── api-client.ts           # HTTP 클라이언트 (인증, 갱신, 에러 처리)
│   ├── api.ts                  # 도메인별 API 서비스 함수
│   └── mock-data.ts            # API 응답 타입 정의 (TypeScript 인터페이스)
│
├── components/                 # 재사용 가능한 UI 컴포넌트
│   ├── themed-text.tsx         # 테마 적용 텍스트
│   ├── themed-view.tsx         # 테마 적용 뷰
│   ├── haptic-tab.tsx          # 햅틱 피드백 탭 버튼
│   └── ui/
│       ├── icon-symbol.tsx     # SF Symbol / Material Icon 래퍼 (크로스 플랫폼)
│       └── icon-symbol.ios.tsx # iOS 전용 SF Symbol 구현
│
├── constants/
│   ├── design.ts               # 디자인 시스템 토큰 (색상, 여백, 폰트 등)
│   └── theme.ts                # React Navigation 테마 설정
│
├── hooks/
│   ├── use-color-scheme.ts     # 다크/라이트 모드 감지
│   └── use-theme-color.ts      # 테마 색상 추출 훅
│
└── docs/
    ├── api-docs.yaml           # OpenAPI 3.0 스펙
    └── project-structure.md    # 이 문서
```

---

## 3. 아키텍처 설계 의도

### 3.1 관심사의 분리 (Separation of Concerns)

이 프로젝트는 **3개의 명확한 레이어**로 구성됩니다.

```
┌─────────────────────────────────┐
│  View Layer  (app/)             │  화면 렌더링, 사용자 이벤트 처리
├─────────────────────────────────┤
│  Service Layer  (services/)     │  API 호출, 토큰 관리, 비즈니스 로직
├─────────────────────────────────┤
│  Infrastructure  (api-client)   │  HTTP, JWT 자동 갱신, 에러 정규화
└─────────────────────────────────┘
```

- **화면(app/)** 은 서비스 함수를 호출하는 것 외에 API에 대해 아무것도 알지 못합니다.
- **서비스(services/api.ts)** 는 어떤 HTTP 메서드를 써야 하는지, 엔드포인트 경로가 무엇인지 알지만, 토큰을 직접 다루지 않습니다.
- **클라이언트(api-client.ts)** 는 네트워크와 인증만 담당하며, 비즈니스 도메인을 모릅니다.

> **핵심 원칙**: 화면 컴포넌트에서 `fetch()`를 직접 호출하거나 토큰을 직접 읽지 않습니다.

---

### 3.2 API 클라이언트 설계 (api-client.ts)

```
화면 호출
  ↓
apiClient.get/post/put/delete
  ↓
request() 함수
  ├─ skipAuth=false → 토큰 만료 확인
  │     ├─ 만료됨 + 갱신 중 아님 → performTokenRefresh() → 새 토큰
  │     └─ 만료됨 + 이미 갱신 중 → 큐에 등록 → 갱신 완료 후 재개
  ├─ Authorization: Bearer {token} 헤더 첨부
  └─ fetch() 실행 → 응답 파싱 → 에러 시 ApiError throw
```

**동시 요청 안전성**: 여러 화면이 동시에 만료된 토큰으로 요청을 보낼 때, `isRefreshing` 플래그와 `refreshSubscribers` 큐를 통해 토큰 갱신을 한 번만 수행하고 나머지는 대기시킵니다. 이로써 불필요한 중복 갱신 요청을 방지합니다.

---

### 3.3 토큰 저장소 추상화 (storage.ts)

Expo는 iOS, Android, Web을 동시에 지원합니다. 플랫폼마다 저장 방식이 다르기 때문에 `storage.ts`는 이를 단일 인터페이스로 추상화합니다.

| 플랫폼 | 백엔드 | 비고 |
|--------|--------|------|
| Web | `localStorage` | 동기 API를 비동기로 래핑 |
| iOS/Android | `AsyncStorage` | `npx expo install @react-native-async-storage/async-storage` 설치 필요 |
| 미설치 fallback | 인메모리 객체 | 앱 재시작 시 초기화 (개발/테스트용) |

화면과 서비스 레이어는 `tokenStorage.getAccessToken()` 등을 호출할 뿐, 실제 저장 방식을 신경 쓰지 않습니다.

---

### 3.4 타입 단일 출처 (Single Source of Truth)

`services/mock-data.ts`는 **타입 정의만** 포함합니다. 이 파일은 `docs/api-docs.yaml`의 `components/schemas`와 1:1로 대응하며, 화면·서비스 양쪽에서 동일한 타입을 import하여 타입 불일치를 방지합니다.

```
api-docs.yaml (스펙)
    ↕ 동기화
mock-data.ts (TypeScript 인터페이스)
    ↕ import
api.ts + 각 화면
```

> 백엔드 API 스펙이 변경되면 `mock-data.ts`의 타입만 수정하면 TypeScript 컴파일러가 불일치 지점을 모두 찾아줍니다.

---

### 3.5 파일 기반 라우팅 (Expo Router)

Expo Router는 `app/` 디렉토리 구조를 URL 경로로 자동 변환합니다.

| 파일 경로 | URL | 역할 |
|-----------|-----|------|
| `app/(tabs)/index.tsx` | `/` | 루트 진입점 → `/auth/login` 리디렉션 |
| `app/auth/login.tsx` | `/auth/login` | 로그인 화면 |
| `app/auth/signup.tsx` | `/auth/signup` | 회원가입 화면 |
| `app/(tabs)/chats.tsx` | `/chats` | 채팅방 목록 (탭 내부) |
| `app/(tabs)/friends.tsx` | `/friends` | 친구 목록 (탭 내부) |
| `app/(tabs)/settings.tsx` | `/settings` | 설정 (탭 내부) |
| `app/chat/[id].tsx` | `/chat/123` | 채팅방 상세 (동적 파라미터) |

`(tabs)` 폴더의 괄호는 URL에 포함되지 않는 **레이아웃 그룹**입니다. 탭 네비게이터를 구성하면서도 URL을 깔끔하게 유지할 수 있습니다.

#### ⚠️ 웹 초기 경로 처리 주의사항

`_layout.tsx`의 `unstable_settings.initialRouteName`은 **네이티브 앱**에서 딥링크 없이 앱을 열 때의 초기 화면을 지정합니다. **웹 환경에서는 적용되지 않습니다.**

웹에서는 URL 경로를 기준으로 화면을 결정합니다. `localhost:8081`에 접속하면 `/` 경로가 요청되고, 이는 `app/(tabs)/index.tsx`로 매핑됩니다.

따라서 루트 경로(/)에서 바로 Expo 기본 웰컴 페이지가 렌더링되는 것을 막기 위해, `app/(tabs)/index.tsx`를 `<Redirect href="/auth/login" />`으로 구성합니다.

```typescript
// app/(tabs)/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/auth/login" />;
}
```

> **결론**: `initialRouteName`은 네이티브 전용 설정입니다. 웹과 네이티브 모두 일관된 진입점을 보장하려면 루트 인덱스 파일에서 `<Redirect>`를 사용해야 합니다.

---

## 4. 레이어별 상세 설명

### 4.1 services/mock-data.ts — 타입 정의

API 응답 타입을 정의합니다. 실제 데이터는 포함하지 않습니다.

```typescript
// api-docs.yaml의 components/schemas/FriendResponse와 대응
export interface FriendResponse {
  userId: string;
  friend: UserResponse;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
}
```

### 4.2 services/api.ts — 도메인 서비스

각 API 엔드포인트를 도메인 단위로 묶은 서비스 객체입니다.

```typescript
// 사용 예시 (화면에서)
import { friendService } from '@/services/api';

const friends = await friendService.getFriends();
```

현재 정의된 서비스:

| 서비스 | 담당 API |
|--------|---------|
| `authService` | 로그인, 회원가입, 토큰 갱신, 로그아웃 |
| `friendService` | 친구 CRUD, 친구 요청 |
| `chatService` | 채팅방 목록, 메시지 이력 조회 |
| `pushService` | 웹 푸시 구독/해제 |

### 4.3 constants/design.ts — 디자인 시스템

모든 스타일 값은 이 파일에서 import합니다. 화면에서 하드코딩된 숫자나 색상 코드를 직접 쓰지 않습니다.

```typescript
import { colors, spacing, fontSize, borderRadius, shadows } from '@/constants/design';

// 사용 예시
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    padding: spacing.md,           // 16
    borderRadius: borderRadius.xl, // 16
    ...shadows.sm,
  },
});
```

---

## 5. 코딩 컨벤션

### 5.1 파일 & 디렉토리 명명

| 대상 | 규칙 | 예시 |
|------|------|------|
| 화면 파일 (app/) | `kebab-case.tsx` | `login.tsx`, `[id].tsx` |
| 컴포넌트 파일 | `kebab-case.tsx` | `themed-text.tsx` |
| 서비스 파일 | `kebab-case.ts` | `api-client.ts`, `api.ts` |
| 훅 파일 | `use-kebab-case.ts` | `use-color-scheme.ts` |
| 상수 파일 | `kebab-case.ts` | `design.ts`, `theme.ts` |

### 5.2 컴포넌트

- 모든 컴포넌트는 **함수형** (`function` 키워드 또는 화살표 함수)
- `default export` 사용 (화면 컴포넌트는 필수, 일반 컴포넌트는 named export 허용)
- `StyleSheet.create()`는 파일 하단에 `const styles = ...` 로 선언
- 인라인 스타일 객체(`style={{ margin: 8 }}`) 사용 금지 — 반드시 `styles.*` 참조

```typescript
// ✅ 올바른 예
export default function FriendsScreen() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
});

// ❌ 잘못된 예
export default function FriendsScreen() {
  return <View style={{ flex: 1, backgroundColor: '#F9FAFB' }} />;
}
```

### 5.3 API 호출

- 화면에서 `fetch()` 직접 호출 금지
- `services/api.ts`의 서비스 함수만 사용
- 모든 API 호출은 `try/catch`로 감싸고, 에러는 `Alert.alert()`로 사용자에게 안내

```typescript
// ✅ 올바른 예
const handleAccept = async () => {
  try {
    await friendService.acceptFriendRequest(friendId);
    await loadData();
  } catch (error) {
    Alert.alert('오류', '요청 처리에 실패했습니다.');
  }
};

// ❌ 잘못된 예
const handleAccept = async () => {
  const token = await tokenStorage.getAccessToken();
  const res = await fetch(`/api/friends/${friendId}/accept`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
```

### 5.4 타입

- `any` 사용 금지 — 불가피한 경우 `unknown` 사용 후 타입 가드 적용
- API 응답 타입은 반드시 `services/mock-data.ts`에서 import
- 컴포넌트 props는 인터페이스로 명시적으로 정의

```typescript
// ✅ 올바른 예
interface FriendCardProps {
  friend: FriendResponse;
  onRemove: (id: string) => void;
}

function FriendCard({ friend, onRemove }: FriendCardProps) { ... }
```

### 5.5 비동기 처리

- `async/await` 사용 (`.then()` 체이닝 금지)
- `useEffect` 내부에서 비동기 함수를 직접 사용하지 않고 내부 함수를 선언 후 호출

```typescript
// ✅ 올바른 예
useEffect(() => {
  const loadData = async () => {
    const result = await friendService.getFriends();
    setFriends(result);
  };
  loadData();
}, []);

// ❌ 잘못된 예
useEffect(async () => {
  const result = await friendService.getFriends();
  setFriends(result);
}, []);
```

### 5.6 Import 순서

1. React, React Native 기본 모듈
2. Expo / 서드파티 라이브러리
3. `@/` 경로 alias (내부 모듈) — 서비스 → 컴포넌트 → 상수 → 타입 순
4. 상대 경로 (`./`, `../`)

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { friendService } from '@/services/api';
import type { FriendResponse } from '@/services/mock-data';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors, spacing } from '@/constants/design';
```

### 5.7 주석

- 비즈니스 로직, 복잡한 알고리즘, 임시 구현에만 주석 작성
- 자명한 코드에는 주석 생략
- TODO 주석 형식: `// TODO: [이유] [해결 방법 또는 관련 이슈]`

```typescript
// TODO: /api/me 엔드포인트 추가 후 실제 사용자 정보로 교체 필요
const currentUser = { name: '', username: '' };
```

---

## 6. 새 기능 추가 가이드

### 예시: "알림 목록" 기능 추가

새 기능을 추가할 때는 다음 순서를 따릅니다.

#### Step 1. 타입 정의 (`services/mock-data.ts`)

API 스펙(`api-docs.yaml`)의 스키마를 인터페이스로 추가합니다.

```typescript
// services/mock-data.ts 에 추가
export interface NotificationResponse {
  id: string;
  message: string;
  isRead: boolean;
  createdDate: string;
}
```

#### Step 2. 서비스 함수 추가 (`services/api.ts`)

```typescript
// services/api.ts 에 추가
export const notificationService = {
  /** GET /api/notifications → NotificationResponse[] */
  getNotifications: (): Promise<NotificationResponse[]> =>
    apiClient.get<NotificationResponse[]>('/api/notifications'),

  /** PUT /api/notifications/{id}/read → void */
  markAsRead: (id: string): Promise<void> =>
    apiClient.put<void>(`/api/notifications/${id}/read`),
};
```

#### Step 3. 화면 파일 생성 (`app/`)

라우팅 구조에 맞게 파일을 생성합니다.

```
# 탭으로 추가하는 경우
app/(tabs)/notifications.tsx

# 별도 화면으로 추가하는 경우
app/notifications/index.tsx
```

```typescript
// app/(tabs)/notifications.tsx 예시
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, StyleSheet } from 'react-native';
import { notificationService } from '@/services/api';
import type { NotificationResponse } from '@/services/mock-data';
import { colors, spacing, fontSize } from '@/constants/design';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data);
      } catch {
        Alert.alert('오류', '알림을 불러오지 못했습니다.');
      }
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.message}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  item: { padding: spacing.md, fontSize: fontSize.base },
});
```

#### Step 4. 레이아웃에 등록

**탭으로 추가하는 경우** `app/(tabs)/_layout.tsx`:

```typescript
<Tabs.Screen
  name="notifications"
  options={{
    title: '알림',
    tabBarIcon: ({ color }) => (
      <IconSymbol size={28} name="bell.fill" color={color} />
    ),
  }}
/>
```

**독립 화면으로 추가하는 경우** `app/_layout.tsx`:

```typescript
<Stack.Screen
  name="notifications/index"
  options={{ title: '알림', headerShown: true }}
/>
```

---

### 파일 추가 체크리스트

- [ ] `services/mock-data.ts` — 응답 타입 추가
- [ ] `services/api.ts` — 서비스 함수 추가
- [ ] `app/` 적절한 위치에 화면 파일 생성
- [ ] 화면에서 `services/api.ts` 서비스만 import (직접 fetch 금지)
- [ ] 모든 스타일 값은 `constants/design.ts` 토큰 사용
- [ ] 탭/Stack 레이아웃에 새 화면 등록
- [ ] `api-docs.yaml`에 새 엔드포인트가 있다면 스펙 파일도 함께 업데이트

---

## 7. 환경 설정

### 7.1 서버 URL 설정

프로젝트 루트에 `.env` 파일을 생성합니다 (`.env.example` 참고).

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

`EXPO_PUBLIC_` 접두사가 붙은 변수만 클라이언트 코드에서 접근 가능합니다.

### 7.2 AsyncStorage 설치 (네이티브 로그인 상태 유지)

```bash
npx expo install @react-native-async-storage/async-storage
```

미설치 시 인메모리 fallback으로 동작하며, 앱 재시작 시 로그인 상태가 초기화됩니다.

### 7.3 개발 서버 실행

```bash
npm start          # Expo Go / 시뮬레이터
npm run ios        # iOS 시뮬레이터
npm run android    # Android 에뮬레이터
npm run web        # 웹 브라우저
```

---

## 향후 구현 예정

| 기능 | 설명 | 비고 |
|------|------|------|
| WebSocket 메시지 전송 | STOMP 기반 실시간 메시지 송수신 | `chat/[id].tsx` TODO 참조 |
| `/api/me` 현재 사용자 조회 | 설정 화면 프로필, 채팅 내 내 메시지 식별 | 백엔드 엔드포인트 추가 필요 |
| 사용자 검색 API | 친구 추가 시 검색 기능 | 백엔드 엔드포인트 추가 필요 |
| 전역 인증 상태 관리 | 401 에러 시 자동 로그인 화면 리디렉션 | Context API 또는 Zustand 도입 검토 |
