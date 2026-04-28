# 스타일가이드 준수 컴포넌트 예시 (Atomic Components)

이 문서는 `docs/styleguide.md`에 정의된 디자인 시스템을 기반으로 작성된 리액트 네이티브(NativeWind) 컴포넌트 예시입니다.

---

## 1. Typography (타이포그래피)

```tsx
import { Text, View } from 'react-native';

export const TypographyExample = () => (
  <View className="gap-4 p-4 bg-background">
    <Text className="text-3xl font-bold text-foreground">Heading 1 (30px)</Text>
    <Text className="text-2xl font-semibold text-foreground">Heading 2 (24px)</Text>
    <Text className="text-xl font-medium text-foreground">Heading 3 (20px)</Text>
    <Text className="text-lg text-foreground">Body Large (18px)</Text>
    <Text className="text-base text-foreground">Body Base (16px)</Text>
    <Text className="text-sm text-secondary-foreground">Body Small / Secondary (14px)</Text>
    <Text className="text-xs text-muted-foreground">Caption / Muted (12px)</Text>
  </View>
);
```

---

## 2. Buttons (버튼)

```tsx
import { TouchableOpacity, Text, View } from 'react-native';

export const ButtonExample = () => (
  <View className="gap-3 p-4 bg-background">
    {/* Primary Button */}
    <TouchableOpacity className="bg-primary-500 rounded-xl p-4 items-center active:opacity-80">
      <Text className="text-white font-semibold text-base">Primary Action</Text>
    </TouchableOpacity>

    {/* Secondary Button */}
    <TouchableOpacity className="bg-secondary rounded-xl p-4 items-center active:opacity-80">
      <Text className="text-secondary-foreground font-semibold text-base">Secondary Action</Text>
    </TouchableOpacity>

    {/* Ghost Button */}
    <TouchableOpacity className="bg-transparent border border-primary-500 rounded-xl p-4 items-center active:bg-primary-50">
      <Text className="text-primary-500 font-semibold text-base">Ghost Action</Text>
    </TouchableOpacity>
  </View>
);
```

---

## 3. Inputs (입력창)

```tsx
import { TextInput, View, Text } from 'react-native';

export const InputExample = () => (
  <View className="gap-2 p-4 bg-background">
    <Text className="text-sm font-medium text-foreground ml-1">Label</Text>
    <TextInput 
      className="bg-secondary border border-border rounded-xl p-4 text-foreground text-base focus:border-primary-500"
      placeholder="Type something..."
      placeholderTextColor="#8E8E93"
    />
    <Text className="text-xs text-muted-foreground ml-1">Helper text goes here.</Text>
  </View>
);
```

---

## 4. Semantic Badges (상태 배지)

```tsx
import { View, Text } from 'react-native';

const Badge = ({ label, variant }: { label: string, variant: 'success' | 'error' | 'warning' | 'info' }) => {
  const bgStyles = {
    success: 'bg-success/10',
    error: 'bg-error/10',
    warning: 'bg-warning/10',
    info: 'bg-info/10',
  };
  const textStyles = {
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
  };

  return (
    <View className={`${bgStyles[variant]} px-3 py-1 rounded-full`}>
      <Text className={`${textStyles[variant]} text-xs font-bold`}>{label}</Text>
    </View>
  );
};

export const BadgeExample = () => (
  <View className="flex-row gap-2 p-4 bg-background">
    <Badge label="Success" variant="success" />
    <Badge label="Error" variant="error" />
    <Badge label="Warning" variant="warning" />
    <Badge label="Info" variant="info" />
  </View>
);
```

---

## 5. Layout & Grid (레이아웃 및 그리드)

```tsx
import { View, Text } from 'react-native';

export const GridExample = () => (
  <View className="p-4 bg-background gap-4">
    {/* 2 Column Grid */}
    <View className="flex-row gap-4">
      <View className="flex-1 bg-secondary p-4 rounded-xl items-center">
        <Text className="text-foreground font-medium">Col 1</Text>
      </View>
      <View className="flex-1 bg-secondary p-4 rounded-xl items-center">
        <Text className="text-foreground font-medium">Col 2</Text>
      </View>
    </View>
    
    {/* 3 Column Grid */}
    <View className="flex-row gap-2">
      <View className="flex-1 bg-secondary p-4 rounded-xl items-center">
        <Text className="text-foreground text-xs">Col 1</Text>
      </View>
      <View className="flex-1 bg-secondary p-4 rounded-xl items-center">
        <Text className="text-foreground text-xs">Col 2</Text>
      </View>
      <View className="flex-1 bg-secondary p-4 rounded-xl items-center">
        <Text className="text-foreground text-xs">Col 3</Text>
      </View>
    </View>
  </View>
);
```

---

## 6. List Group (리스트 그룹)

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native'; // 예시 아이콘

export const ListGroupExample = () => (
  <View className="bg-background">
    <View className="border-t border-b border-border">
      {[1, 2, 3].map((item, index) => (
        <TouchableOpacity 
          key={item} 
          className={`flex-row justify-between items-center p-4 bg-background ${index !== 0 ? 'border-t border-border ml-4' : ''}`}
        >
          <Text className="text-base text-foreground">List Item {item}</Text>
          <ChevronRight size={20} color="#8E8E93" />
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
```

---

## 7. Accordion & Collapse (아코디언 및 콜랩스)

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

export const AccordionExample = () => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View className="p-4 bg-background">
      <TouchableOpacity 
        onPress={toggle}
        className="flex-row justify-between items-center p-4 bg-secondary rounded-xl"
      >
        <Text className="font-semibold text-foreground">Accordion Header</Text>
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <ChevronDown size={20} color="#000" />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View className="p-4 bg-background border-l border-r border-b border-border rounded-b-xl mt-[-8]">
          <Text className="text-secondary-foreground">
            아코디언 내용입니다. NativeWind와 LayoutAnimation을 사용하여 구현할 수 있습니다.
          </Text>
        </View>
      )}
    </View>
  );
};
```

---

## 8. Modal & Alerts (모달 및 알림)

```tsx
import { View, Text, TouchableOpacity, Modal } from 'react-native';

export const AlertExample = () => (
  <View className="p-4 gap-3 bg-background">
    {/* Inline Alert */}
    <View className="bg-primary-500/10 p-4 rounded-xl border border-primary-500/20">
      <Text className="text-primary-500 font-medium">이것은 정보 알림입니다.</Text>
    </View>
    
    <View className="bg-error/10 p-4 rounded-xl border border-error/20">
      <Text className="text-error font-medium">문제가 발생했습니다.</Text>
    </View>
  </View>
);

// Modal은 컴포넌트 내부 상태로 제어합니다.
export const SimpleModal = ({ visible, onClose }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View className="flex-1 justify-center items-center bg-black/50 p-6">
      <View className="bg-background w-full rounded-2xl p-6 shadow-xl">
        <Text className="text-xl font-bold text-foreground mb-2">Modal Title</Text>
        <Text className="text-base text-secondary-foreground mb-6">
          이것은 모달 메시지입니다. iOS 스타일의 둥근 모서리와 그림자가 적용되었습니다.
        </Text>
        <TouchableOpacity 
          onPress={onClose}
          className="bg-primary-500 p-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold">확인</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);
```

---

## 9. Progress & Spinners (진행 바 및 스피너)

```tsx
import { View, Text, ActivityIndicator } from 'react-native';

export const ProgressExample = () => (
  <View className="p-4 gap-6 bg-background">
    {/* Progress Bar */}
    <View className="gap-2">
      <Text className="text-xs text-muted-foreground uppercase font-semibold">Uploading... 60%</Text>
      <View className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <View className="h-full bg-primary-500 w-[60%]" />
      </View>
    </View>

    {/* Spinners */}
    <View className="flex-row items-center gap-4">
      <ActivityIndicator color={process.env.NODE_ENV === 'web' ? '#007AFF' : undefined} className="text-primary-500" />
      <ActivityIndicator size="large" color={process.env.NODE_ENV === 'web' ? '#007AFF' : undefined} className="text-primary-500" />
      <Text className="text-sm text-secondary-foreground">Loading data...</Text>
    </View>
  </View>
);
```

---

## 10. Navs & Tabs (네비게이션 및 탭)

```tsx
import { View, Text, TouchableOpacity } from 'react-native';

export const TabExample = () => (
  <View className="p-4 bg-background">
    <View className="flex-row bg-secondary p-1 rounded-xl">
      <TouchableOpacity className="flex-1 bg-background py-2 rounded-lg shadow-sm items-center">
        <Text className="font-semibold text-foreground">Tab 1</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex-1 py-2 items-center">
        <Text className="text-secondary-foreground font-medium">Tab 2</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex-1 py-2 items-center">
        <Text className="text-secondary-foreground font-medium">Tab 3</Text>
      </TouchableOpacity>
    </View>
  </View>
);
```

---

## 11. Tables (테이블)

```tsx
import { View, Text } from 'react-native';

export const TableExample = () => (
  <View className="p-4 bg-background">
    <View className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <View className="flex-row bg-secondary border-b border-border">
        <View className="flex-1 p-3"><Text className="font-bold text-xs text-secondary-foreground uppercase">Name</Text></View>
        <View className="flex-1 p-3"><Text className="font-bold text-xs text-secondary-foreground uppercase">Status</Text></View>
        <View className="w-20 p-3"><Text className="font-bold text-xs text-secondary-foreground uppercase">Role</Text></View>
      </View>
      {/* Rows */}
      <View className="flex-row border-b border-border">
        <View className="flex-1 p-3"><Text className="text-sm text-foreground">John Doe</Text></View>
        <View className="flex-1 p-3"><Text className="text-sm text-success">Active</Text></View>
        <View className="w-20 p-3"><Text className="text-sm text-muted-foreground">Admin</Text></View>
      </View>
      <View className="flex-row">
        <View className="flex-1 p-3"><Text className="text-sm text-foreground">Jane Smith</Text></View>
        <View className="flex-1 p-3"><Text className="text-sm text-warning">Pending</Text></View>
        <View className="w-20 p-3"><Text className="text-sm text-muted-foreground">User</Text></View>
      </View>
    </View>
  </View>
);
```

---

## 12. Miscellaneous (기타)

### Button Group
```tsx
<View className="flex-row border border-primary-500 rounded-xl overflow-hidden self-start">
  <TouchableOpacity className="bg-primary-500 px-4 py-2 border-r border-white/20">
    <Text className="text-white font-medium">Left</Text>
  </TouchableOpacity>
  <TouchableOpacity className="px-4 py-2 border-r border-primary-500">
    <Text className="text-primary-500 font-medium">Middle</Text>
  </TouchableOpacity>
  <TouchableOpacity className="px-4 py-2">
    <Text className="text-primary-500 font-medium">Right</Text>
  </TouchableOpacity>
</View>
```

### Toast (Inline Concept)
```tsx
<View className="absolute bottom-10 left-4 right-4 bg-foreground/90 p-4 rounded-2xl flex-row items-center shadow-2xl">
  <View className="w-2 h-2 rounded-full bg-success mr-3" />
  <Text className="text-background font-medium flex-1">성공적으로 저장되었습니다.</Text>
</View>
```
