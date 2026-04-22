/**
 * (tabs) 그룹의 기본 인덱스 라우트.
 * 탭 바에는 표시되지 않으며(_layout.tsx에서 href: null 설정),
 * 혹시 /(tabs)로 직접 진입 시 기본 탭인 /chats로 이동합니다.
 */
import { Redirect } from 'expo-router';

export default function TabsIndex() {
  return <Redirect href="/chats" />;
}
