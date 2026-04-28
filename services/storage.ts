/**
 * 토큰 저장소
 * - 웹: localStorage 사용
 * - 네이티브: @react-native-async-storage/async-storage 사용 (설치 필요)
 *   미설치 시 인메모리 fallback 사용 (앱 재시작 시 초기화됨)
 *
 * 설치 명령어: npx expo install @react-native-async-storage/async-storage
 */
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'seesaw_access_token';
const REFRESH_TOKEN_KEY = 'seesaw_refresh_token';
const EXPIRES_AT_KEY = 'seesaw_expires_at';
const PUSH_CLIENT_DEVICE_ID_KEY = 'seesaw_push_client_device_id';
const PUSH_REGISTERED_DEVICE_ID_KEY = 'seesaw_push_registered_device_id';

// 인메모리 fallback (AsyncStorage 미설치 시)
const memoryStore: Record<string, string> = {};

type StorageBackend = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
};

let _asyncStorage: StorageBackend | null | 'loading' = 'loading';

async function getBackend(): Promise<StorageBackend> {
  if (Platform.OS === 'web') {
    // 웹 환경: localStorage 래핑
    return {
      getItem: async (key) => {
        try { return localStorage.getItem(key); } catch { return null; }
      },
      setItem: async (key, value) => {
        try { localStorage.setItem(key, value); } catch {}
      },
      removeItem: async (key) => {
        try { localStorage.removeItem(key); } catch {}
      },
      multiRemove: async (keys) => {
        keys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
      },
    };
  }

  // 네이티브 환경: AsyncStorage 시도
  if (_asyncStorage === 'loading') {
    try {
      const mod = await import('@react-native-async-storage/async-storage');
      _asyncStorage = mod.default as unknown as StorageBackend;
    } catch {
      console.warn(
        '[tokenStorage] @react-native-async-storage/async-storage 가 설치되지 않았습니다.\n' +
        '인메모리 fallback을 사용합니다. 앱 재시작 시 로그인 상태가 유지되지 않습니다.\n' +
        '설치: npx expo install @react-native-async-storage/async-storage',
      );
      _asyncStorage = null;
    }
  }

  if (_asyncStorage) return _asyncStorage;

  // 인메모리 fallback
  return {
    getItem: async (key) => memoryStore[key] ?? null,
    setItem: async (key, value) => { memoryStore[key] = value; },
    removeItem: async (key) => { delete memoryStore[key]; },
    multiRemove: async (keys) => { keys.forEach((k) => delete memoryStore[k]); },
  };
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return (await getBackend()).getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return (await getBackend()).getItem(REFRESH_TOKEN_KEY);
  },

  async getExpiresAt(): Promise<number | null> {
    const raw = await (await getBackend()).getItem(EXPIRES_AT_KEY);
    return raw ? Number(raw) : null;
  },

  async saveTokens(accessToken: string, refreshToken?: string, expiresIn?: number): Promise<void> {
    const backend = await getBackend();
    await backend.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) await backend.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (expiresIn) {
      const expiresAt = Date.now() + expiresIn * 1000;
      await backend.setItem(EXPIRES_AT_KEY, String(expiresAt));
    }
  },

  async clearTokens(): Promise<void> {
    const backend = await getBackend();
    await backend.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRES_AT_KEY]);
  },

  async isTokenExpired(): Promise<boolean> {
    const expiresAt = await this.getExpiresAt();
    if (!expiresAt) return true;
    // 30초 여유를 두고 만료 여부 확인
    return Date.now() >= expiresAt - 30_000;
  },
};

function createDeviceId(): string {
  if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const pushDeviceStorage = {
  async getOrCreateClientDeviceId(): Promise<string> {
    const backend = await getBackend();
    const storedDeviceId = await backend.getItem(PUSH_CLIENT_DEVICE_ID_KEY);

    if (storedDeviceId) {
      return storedDeviceId;
    }

    const deviceId = createDeviceId();
    await backend.setItem(PUSH_CLIENT_DEVICE_ID_KEY, deviceId);
    return deviceId;
  },

  async getRegisteredDeviceId(): Promise<string | null> {
    return (await getBackend()).getItem(PUSH_REGISTERED_DEVICE_ID_KEY);
  },

  async saveRegisteredDeviceId(deviceId: string): Promise<void> {
    await (await getBackend()).setItem(PUSH_REGISTERED_DEVICE_ID_KEY, deviceId);
  },

  async clearRegisteredDeviceId(): Promise<void> {
    await (await getBackend()).removeItem(PUSH_REGISTERED_DEVICE_ID_KEY);
  },
};
