/**
 * API 클라이언트 - JWT Bearer 인증, 자동 토큰 갱신, 에러 처리를 담당합니다.
 * api-docs.yaml의 securitySchemes.BearerAuthentication 스펙을 준수합니다.
 */
import { tokenStorage } from './storage';

// 서버 기본 URL — 환경에 따라 변경하세요.
// 예: 'http://localhost:8080' 또는 process.env.EXPO_PUBLIC_API_URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshDone(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${BASE_URL}/api/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await tokenStorage.clearTokens();
    return null;
  }

  const data = await response.json();
  await tokenStorage.saveTokens(data.accessToken, data.refreshToken, data.expiresIn);
  return data.accessToken;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T = void>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // JWT Bearer 토큰 첨부 (인증 불필요한 엔드포인트 제외)
  if (!skipAuth) {
    let accessToken = await tokenStorage.getAccessToken();

    // 토큰 만료 시 갱신 처리 (동시 요청 대비 큐잉)
    if (await tokenStorage.isTokenExpired()) {
      if (isRefreshing) {
        // 이미 갱신 중이면 완료될 때까지 대기
        accessToken = await new Promise<string>((resolve) => {
          subscribeTokenRefresh(resolve);
        });
      } else {
        isRefreshing = true;
        try {
          const newToken = await performTokenRefresh();
          if (newToken) {
            accessToken = newToken;
            onRefreshDone(newToken);
          } else {
            // 갱신 실패 → 로그인 필요
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
  });

  // 빈 응답 처리 (201 Created, 204 No Content 등)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  // 401 재시도 (서버가 토큰 만료를 늦게 알린 경우)
  if (response.status === 401 && !skipAuth) {
    await tokenStorage.clearTokens();
    throw new ApiError(401, '인증이 필요합니다. 다시 로그인해주세요.');
  }

  let body: unknown;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json') || contentType.includes('*/*')) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(response.status, `API 오류: ${response.status}`, body);
  }

  return body as T;
}

// 편의 메서드
export const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

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

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),

  /** 인증 불필요한 요청 (로그인, 회원가입, 토큰 갱신) */
  postPublic: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      skipAuth: true,
    }),
};
