import { Alert as RNAlert, Platform } from 'react-native';
import { ApiError } from './api-client';

/**
 * 크로스 플랫폼 알림 유틸리티
 */
export const Alert = {
  alert: (title: string, message?: string, buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[]) => {
    if (Platform.OS === 'web') {
      const fullMessage = message ? `${title}\n\n${message}` : title;
      window.alert(fullMessage);
      if (buttons && buttons.length > 0) {
        const confirmButton = buttons.find(b => b.style !== 'cancel') || buttons[0];
        if (confirmButton.onPress) confirmButton.onPress();
      }
    } else {
      RNAlert.alert(title, message, buttons);
    }
  },

  /** API 에러 상황별 맞춤 피드백 */
  handleApiError: (error: any, defaultTitle: string = '알림') => {
    console.error(`[API 오류] ${defaultTitle}:`, error);

    let title = defaultTitle;
    let message = '일시적인 문제가 발생했습니다.';

    if (error instanceof ApiError) {
      const serverMsg = error.serverMessage;
      switch (error.status) {
        case 400:
          title = '입력 확인';
          message = serverMsg || '입력하신 정보를 다시 확인해주세요.';
          break;
        case 401:
          title = '로그인 필요';
          message = '세션이 만료되었습니다. 다시 로그인해주세요.';
          break;
        case 403:
          title = '권한 부족';
          message = '해당 작업을 수행할 권한이 없습니다.';
          break;
        case 404:
          title = '정보 없음';
          message = '요청하신 정보를 찾을 수 없습니다.';
          break;
        case 409:
          title = '중복 확인';
          message = serverMsg || '이미 등록된 정보입니다.';
          break;
        case 422:
          title = '유효성 검사 실패';
          if (error.body?.errors && Array.isArray(error.body.errors)) {
            message = error.body.errors
              .map((err: any) => `- ${err.message || err.code}`)
              .join('\n');
          } else {
            message = serverMsg || '입력값이 올바르지 않습니다.';
          }
          break;
        case 500:
          title = '시스템 오류';
          message = '서버 내부 오류가 발생했습니다. 서비스 관리자에게 문의해주세요.';
          break;
        default:
          title = '시스템 알림';
          message = serverMsg || `응답이 올바르지 않습니다. (코드: ${error.status})`;
      }
    } else if (error.message?.includes('fetch') || error.name === 'TypeError') {
      title = '시스템 오류';
      message = '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';
    } else if (error.message?.includes('시간이 초과')) {
      title = '요청 지연';
      message = '서버 응답이 너무 늦습니다. 나중에 다시 시도해주세요.';
    } else {
      message = error.message || message;
    }

    Alert.alert(title, message);
  }
};
