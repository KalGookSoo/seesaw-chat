import { router } from 'expo-router';
import { tokenStorage } from './storage';
import * as base64js from 'base64-js';
import { spinnerService } from './spinner';

let currentPathname = '/';

/** 현재 경로 추적 (RootLayout 등에서 호출) */
export function setCurrentPathname(path: string) {
  currentPathname = path;
}

// 서버 기본 URL — 환경에 따라 변경하세요.
// 예: 'http://localhost:8080' 또는 process.env.EXPO_PUBLIC_API_URL
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshDone(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function performTokenRefresh(signal?: AbortSignal): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${BASE_URL}/api/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal,
    });

    if (!response.ok) {
      await tokenStorage.clearTokens();
      return null;
    }

    const data = await response.json();
    await tokenStorage.saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
    return data.accessToken;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 서버에서 내려준 에러 메시지 추출 */
  get serverMessage(): string | undefined {
    if (this.body && typeof this.body === 'object') {
      return this.body.message || this.body.detail || this.body.error;
    }
    return undefined;
  }
}

const REQUEST_TIMEOUT = 10000; // 10초 타임아웃

export async function request<T = void>(path: string, options: RequestInit & { skipAuth?: boolean; skipSpinner?: boolean } = {}): Promise<T> {
  const { skipAuth = false, skipSpinner = false, ...fetchOptions } = options;

  if (!skipSpinner) {
    spinnerService.show();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  try {
    // JWT Bearer 토큰 첨부 logic...
    if (!skipAuth) {
      let accessToken = await tokenStorage.getAccessToken();
      if (await tokenStorage.isTokenExpired()) {
        if (isRefreshing) {
          accessToken = await new Promise<string>((resolve) => {
            subscribeTokenRefresh(resolve);
          });
        } else {
          isRefreshing = true;
          try {
            const newToken = await performTokenRefresh(controller.signal);
            if (newToken) {
              accessToken = newToken;
              onRefreshDone(newToken);
            } else {
              throw new ApiError(401, '세션이 만료되었습니다. 다시 로그인해주세요.');
            }
          } finally {
            isRefreshing = false;
          }
        }
      }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 빈 응답 처리 (204 No Content 등)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    let body: any;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    if (!response.ok) {
      // 401 Unauthorized인 경우 토큰 갱신 후 1회 재시도
      if (response.status === 401 && !skipAuth) {
        if (isRefreshing) {
          const newToken = await new Promise<string>((resolve) => {
            subscribeTokenRefresh(resolve);
          });
          if (newToken) {
            return request<T>(path, options);
          }
        } else {
          isRefreshing = true;
          try {
            const newToken = await performTokenRefresh(controller.signal);
            if (newToken) {
              onRefreshDone(newToken);
              return request<T>(path, options);
            }
          } finally {
            isRefreshing = false;
          }
        }
        // 갱신 실패 시 토큰 삭제 및 리디렉션
        await tokenStorage.clearTokens();

        // 로그인/회원가입 페이지가 아닐 때만 리디렉션 (무한 루프 방지)
        if (currentPathname !== '/' && !currentPathname.startsWith('/auth')) {
          router.replace(`/?redirect=${encodeURIComponent(currentPathname)}`);
        }

        throw new ApiError(401, '세션이 만료되었습니다. 다시 로그인해주세요.', body);
      }

      throw new ApiError(response.status, `API 오류: ${response.status}`, body);
    }

    return body as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.');
    }
    throw error;
  } finally {
    if (!skipSpinner) {
      spinnerService.hide();
    }
  }
}

export function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let base64Url = parts[1];
    // 1. Base64Url -> Base64 문자로 변환
    base64Url = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // 2. 패딩(Padding) 맞추기 (base64-js는 패딩에 엄격함)
    while (base64Url.length % 4) {
      base64Url += '=';
    }

    // 3. 디코딩하여 Uint8Array(바이트 배열) 획득
    const byteArray = base64js.toByteArray(base64Url);

    // 4. 바이트 배열을 UTF-8 문자열로 변환 (한글 처리 포함)
    // TextDecoder가 없는 환경을 대비한 수동 변환 방식
    let jsonPayload = '';
    for (let i = 0; i < byteArray.length; i++) {
      jsonPayload += String.fromCharCode(byteArray[i]);
    }

    // 만약 한글이 포함되어 있다면 위 루프 대신 아래 방식을 권장합니다.
    const utf8Payload = decodeURIComponent(
      Array.from(byteArray)
        .map((b) => '%' + b.toString(16).padStart(2, '0'))
        .join(''),
    );

    return JSON.parse(utf8Payload);
  } catch (e) {
    console.error('[decodeJwt] 실패:', e);
    return null;
  }
}
export const apiClient = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'DELETE' }),

  /** 인증 불필요한 요청 (로그인, 회원가입, 토큰 갱신) */
  postPublic: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      skipAuth: true,
    }),
};
