# 2장. 프로젝트 구조와 아키텍처

## 2-2. 폴더 구조 설계 전략

### 개요

효과적인 폴더 구조는 프로젝트의 확장성과 유지보수성을 결정하는 핵심 요소입니다. 이 섹션에서는 React Native 프로젝트의 다양한 폴더 구조 패턴을 살펴보고, 프로젝트 규모와 팀 구성에 따른 최적의 구조 설계 전략을 다룹니다. Feature-based, Layer-based, Domain-driven 등 여러 접근 방식을 비교하고 실무에 적용할 수 있는 가이드를 제공합니다.

### 폴더 구조 설계의 원칙

#### 1. 확장 가능성 (Scalability)

프로젝트가 성장해도 구조가 복잡해지지 않아야 합니다.

```mermaid
graph TB
    A[소규모 프로젝트] -->|기능 추가| B[중규모 프로젝트]
    B -->|팀 확장| C[대규모 프로젝트]

    A -.구조 변경 최소화.-> C

    style A fill:#3cb371
    style B fill:#daa520
    style C fill:#c35b5b
```

#### 2. 응집도 (Cohesion)

관련된 코드는 가까이, 관련 없는 코드는 분리합니다.

```typescript
// ❌ 낮은 응집도
components/Button.tsx
utils/buttonHelpers.ts
styles/buttonStyles.ts
types/buttonTypes.ts

// ✅ 높은 응집도
components/Button/
  ├── index.tsx
  ├── Button.styles.ts
  ├── Button.types.ts
  └── Button.utils.ts
```

#### 3. 명확성 (Clarity)

폴더와 파일 이름만으로 역할을 파악할 수 있어야 합니다.

#### 4. 일관성 (Consistency)

프로젝트 전체에서 동일한 규칙을 따라야 합니다.

### 주요 폴더 구조 패턴

#### 1. Feature-Based 구조 (현재 프로젝트 적용 기준)

기능 중심으로 구성하는 방식으로, 각 기능이 독립적인 모듈처럼 동작합니다.

```
app/
├── (tabs)/
│   └── friends.tsx
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── store/
│   │   │   └── authSlice.ts
│   │   ├── services/
│   │   │   └── authApi.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts
│   ├── friends/
│   │   ├── components/
│   │   │   ├── FriendListItem.tsx
│   │   │   └── UserDetailModal.tsx
│   │   ├── hooks/
│   │   │   └── useFriends.ts
│   │   └── services/
│   │       └── friendApi.ts
│   └── chat/
│       ├── components/
│       └── hooks/
├── shared/
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── hooks/
│   │   └── useDebounce.ts
│   └── utils/
│       └── formatters.ts
├── store/
│   └── index.ts
└── _layout.tsx
```

**Feature-Based 구조 다이어그램**:

```mermaid
graph TB
    subgraph "Feature: Auth"
        A1[Components]
        A2[Screens]
        A3[Hooks]
        A4[Store]
        A5[Services]
    end

    subgraph "Feature: Product"
        B1[Components]
        B2[Screens]
        B3[Hooks]
        B4[Store]
        B5[Services]
    end

    subgraph "Shared"
        C1[Common Components]
        C2[Common Hooks]
        C3[Utils]
    end

    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5

    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5

    A1 -.사용.-> C1
    B1 -.사용.-> C1
    A3 -.사용.-> C2
    B3 -.사용.-> C2

    style A4 fill:#3cb371
    style B4 fill:#3cb371
    style C1 fill:#daa520
```

**장점**:
- ✅ 기능별로 완전히 독립적인 모듈
- ✅ 코드 재사용성 향상
- ✅ 팀 단위 개발에 유리
- ✅ 기능 추가/제거가 용이

**단점**:
- ❌ 초기 구조 설계가 복잡
- ❌ 기능 간 의존성 관리 필요
- ❌ 소규모 프로젝트에는 과도할 수 있음

**적합한 경우**:
- 중대규모 프로젝트
- 여러 팀이 협업하는 경우
- 기능이 명확히 구분되는 앱
- 마이크로프론트엔드 아키텍처

#### 2. Layer-Based 구조

계층 중심으로 구성하는 전통적인 방식입니다.

```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Card/
│   └── features/
│       ├── LoginForm/
│       ├── ProductCard/
│       └── CartItem/
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── SignupScreen.tsx
│   ├── product/
│   │   ├── ProductListScreen.tsx
│   │   └── ProductDetailScreen.tsx
│   └── cart/
│       └── CartScreen.tsx
├── navigation/
│   ├── AuthNavigator.tsx
│   ├── MainNavigator.tsx
│   └── AppNavigator.tsx
├── store/
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── productSlice.ts
│   │   └── cartSlice.ts
│   ├── middleware/
│   └── index.ts
├── services/
│   ├── api/
│   │   ├── authApi.ts
│   │   ├── productApi.ts
│   │   └── baseApi.ts
│   └── storage/
│       └── AsyncStorageService.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useProducts.ts
│   └── useDebounce.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
├── types/
│   ├── auth.types.ts
│   ├── product.types.ts
│   └── common.types.ts
├── constants/
│   ├── config.ts
│   └── theme.ts
└── assets/
    ├── images/
    └── fonts/
```

**Layer-Based 구조 다이어그램**:

```mermaid
graph TB
    A[Screens] --> B[Components]
    B --> C[Hooks]
    C --> D[Store]
    D --> E[Services]
    E --> F[Utils]

    A -.사용.-> C
    A -.사용.-> D
    B -.사용.-> G[Types]
    C -.사용.-> G
    D -.사용.-> G

    H[Constants] -.참조.-> A
    H -.참조.-> B

    style A fill:#3cb371
    style D fill:#daa520
    style E fill:#c35b5b
```

#### 3. Domain-Driven 구조

비즈니스 도메인 중심으로 구성하는 방식입니다.

```
src/
├── domains/
│   ├── user/
│   │   ├── entities/
│   │   │   └── User.ts
│   │   ├── repositories/
│   │   │   └── UserRepository.ts
│   │   ├── usecases/
│   │   │   ├── LoginUseCase.ts
│   │   │   └── GetUserProfileUseCase.ts
│   │   └── presentation/
│   │       ├── components/
│   │       ├── screens/
│   │       └── viewmodels/
│   ├── product/
│   │   ├── entities/
│   │   │   └── Product.ts
│   │   ├── repositories/
│   │   │   └── ProductRepository.ts
│   │   ├── usecases/
│   │   │   ├── GetProductsUseCase.ts
│   │   │   └── SearchProductsUseCase.ts
│   │   └── presentation/
│   │       ├── components/
│   │       └── screens/
│   └── order/
│       ├── entities/
│       ├── repositories/
│       ├── usecases/
│       └── presentation/
├── infrastructure/
│   ├── api/
│   │   └── RestApiClient.ts
│   ├── storage/
│   │   └── LocalStorage.ts
│   └── navigation/
│       └── Navigator.ts
└── shared/
    ├── components/
    ├── hooks/
    └── utils/
```

### 하이브리드 접근법

실무에서는 여러 패턴을 혼합한 하이브리드 구조를 많이 사용합니다.

```
app/
├── (tabs)/
├── features/                    # Feature-based
│   ├── auth/
│   ├── friends/
│   └── chat/
├── core/                        # Layer-based
│   ├── components/
│   ├── hooks/
│   └── store/
├── shared/
│   ├── utils/
│   ├── types/
│   └── constants/
├── infrastructure/              # Domain-driven
│   ├── api/
│   └── storage/
└── _layout.tsx
```

### 컴포넌트 구조 전략

#### 1. 컴포넌트 분류

```mermaid
graph TB
    A[Components] --> B[Atoms]
    A --> C[Molecules]
    A --> D[Organisms]
    A --> E[Templates]
    A --> F[Pages/Screens]

    B --> G[Button, Input, Icon]
    C --> H[SearchBar, Card]
    D --> I[Header, ProductList]
    E --> J[PageLayout]
    F --> K[HomeScreen]

    style B fill:#3cb371
    style C fill:#3cb371
    style D fill:#daa520
    style E fill:#808080
    style F fill:#c35b5b
```

#### 2. 컴포넌트 파일 구조

**파일 분리 방식 (권장)**
```
Button/
├── index.tsx              # Export만 담당
├── Button.tsx             # 메인 컴포넌트
├── Button.styles.ts       # 스타일
├── Button.types.ts        # 타입 정의
├── Button.utils.ts        # 헬퍼 함수
├── Button.test.tsx        # 테스트
└── Button.stories.tsx     # Storybook (선택)
```

```typescript
// Button/index.tsx
export { Button } from './Button';
export type { ButtonProps } from './Button.types';

// Button/Button.types.ts
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

// Button/Button.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#8E8E93',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Button/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { ButtonProps } from './Button.types';
import { styles } from './Button.styles';

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
```

### 네이밍 컨벤션

#### 1. 폴더 및 파일 명명 규칙

```typescript
// ✅ 올바른 네이밍
components/Button/index.tsx
screens/ProductListScreen.tsx
hooks/useAuth.ts
utils/formatDate.ts
types/product.types.ts
constants/API_ENDPOINTS.ts

// ❌ 잘못된 네이밍
components/button/index.tsx        // 컴포넌트는 PascalCase
screens/productList.tsx            // Screen 접미사 누락
hooks/AuthHook.ts                  // use 접두사 필요
utils/format-date.ts               // camelCase 사용
types/ProductTypes.ts              // .types.ts 컨벤션
constants/apiEndpoints.ts          // 상수는 UPPER_CASE
```

#### 2. 컴포넌트 네이밍

```typescript
// 컴포넌트: PascalCase
export const UserProfile: React.FC = () => {};
export const ProductCard: React.FC = () => {};

// 커스텀 훅: use + PascalCase
export const useAuth = () => {};
export const useProducts = () => {};

// 유틸 함수: camelCase
export const formatDate = () => {};
export const validateEmail = () => {};

// 타입/인터페이스: PascalCase
export interface User {}
export type Product = {};

// 상수: UPPER_SNAKE_CASE
export const API_BASE_URL = '';
export const MAX_RETRY_COUNT = 3;
```

#### 3. 파일 확장자 규칙

```typescript
// TypeScript 컴포넌트
*.tsx

// TypeScript 유틸/훅/서비스
*.ts

// 타입 정의
*.types.ts
*.d.ts

// 스타일
*.styles.ts

// 테스트
*.test.tsx / *.spec.tsx

// 플랫폼별
*.ios.tsx
*.android.tsx
```

### 경로 별칭 설정

#### 1. TypeScript 설정

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@features/*": ["app/features/*"],
      "@components/*": ["components/*"],
      "@hooks/*": ["hooks/*"],
      "@services/*": ["services/*"],
      "@utils/*": ["app/shared/utils/*"],
      "@types/*": ["app/shared/types/*"],
      "@constants/*": ["constants/*"],
      "@assets/*": ["assets/*"]
    }
  }
}
```

### 의존성 규칙

#### 단방향 의존성 흐름

**규칙**:
1. **상위 계층은 하위 계층에 의존 가능**
2. **하위 계층은 상위 계층에 의존 불가**
3. **Shared는 어디서나 사용 가능**
4. **Feature 간 직접 참조 금지** (Shared를 통해서만)

```typescript
// ✅ 올바른 의존성
// Screen → Component
import Button from '@components/Button';

// Hook → Service
import { authApi } from '@services/authApi';

// Component → Shared Util
import { formatDate } from '@utils/formatters';

// ❌ 잘못된 의존성
// Component → Screen (상위 계층 참조)
import HomeScreen from '@screens/HomeScreen';

// Utils → Hook (상위 계층 참조)
import { useAuth } from '@hooks/useAuth';

// Feature → Feature 직접 참조
import { ProductCard } from '@features/product/components/ProductCard';
// 대신 Shared로 이동하거나 Props로 전달
```

### 요약

효과적인 폴더 구조 설계는 프로젝트의 성공을 좌우합니다.

**핵심 포인트**:
- **프로젝트 규모에 맞는 구조 선택**: 소규모는 Layer-Based, 대규모는 Feature-Based
- **일관된 네이밍 컨벤션**: PascalCase(컴포넌트), camelCase(함수), UPPER_CASE(상수)
- **경로 별칭 활용**: 상대 경로 대신 `@components`, `@utils` 등 사용
- **단방향 의존성**: 상위 → 하위 계층 의존, 하위 → 상위 금지
- **컴포넌트 분류**: Atomic Design 패턴으로 체계적 관리
- **Feature 독립성**: 각 Feature는 독립적으로 동작 가능하도록 구성
