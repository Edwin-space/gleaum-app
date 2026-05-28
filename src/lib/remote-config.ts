/**
 * 글리움 — Firebase Remote Config 유틸리티
 *
 * Firebase 콘솔에서 코드 배포 없이 앱 동작을 제어합니다.
 * 네이티브: @capacitor-firebase/remote-config
 * 웹: firebase/remote-config (JS SDK)
 *
 * ── 현재 정의된 Feature Flags ────────────────────────────────
 * weekly_digest_enabled     : 주간 소비 다이제스트 알림 ON/OFF
 * overdue_badge_enabled     : 홈 미결제 뱃지 ON/OFF
 * budget_dday_enabled       : 가계부 D-day UI ON/OFF
 * onboarding_new_flow       : 새 온보딩 플로우 A/B 테스트
 * max_expense_categories    : 표시할 최대 지출 카테고리 수
 * maintenance_mode          : 점검 모드 (true면 점검 공지 표시)
 * maintenance_message       : 점검 공지 메시지
 * ─────────────────────────────────────────────────────────────
 *
 * Firebase 콘솔에서 위 키들을 등록하고 값을 설정하세요.
 * 설정 전까지는 아래 DEFAULT_CONFIG 값이 사용됩니다.
 */

import { isNativeApp } from '@/lib/native';

// ── 기본값 (Firebase 콘솔 미설정 시 사용) ───────────────────
export const DEFAULT_CONFIG = {
  weekly_digest_enabled:  true,
  overdue_badge_enabled:  true,
  budget_dday_enabled:    true,
  onboarding_new_flow:    false,
  max_expense_categories: 7,
  maintenance_mode:       false,
  maintenance_message:    '서비스 점검 중입니다. 잠시 후 다시 시도해 주세요.',
} as const;

export type RemoteConfigKey = keyof typeof DEFAULT_CONFIG;

// 인메모리 캐시
let _cache: Record<string, string> = {};
let _initialized = false;

/** Remote Config 초기화 + 값 fetch (앱 시작 시 1회 호출) */
export async function initRemoteConfig(): Promise<void> {
  try {
    if (isNativeApp()) {
      const { FirebaseRemoteConfig } = await import('@capacitor-firebase/remote-config');

      // 최소 갱신 간격: 1시간 (프로덕션), 개발 시 0
      // setDefaultConfig는 지원하지 않으므로 인메모리 DEFAULT_CONFIG로 폴백 처리
      await FirebaseRemoteConfig.setSettings({
        minimumFetchIntervalInSeconds: process.env.NODE_ENV === 'development' ? 0 : 3600,
      });

      // Fetch → Activate
      await FirebaseRemoteConfig.fetchAndActivate();

      // 캐시 업데이트
      for (const key of Object.keys(DEFAULT_CONFIG)) {
        try {
          const result = await FirebaseRemoteConfig.getString({ key });
          _cache[key] = result.value;
        } catch {
          _cache[key] = String(DEFAULT_CONFIG[key as RemoteConfigKey]);
        }
      }
    } else if (typeof window !== 'undefined') {
      // 웹 (Firebase JS SDK)
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getRemoteConfig, fetchAndActivate, getString, setLogLevel } = await import('firebase/remote-config');

      const firebaseConfig = {
        apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      };

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const remoteConfig = getRemoteConfig(app);

      remoteConfig.defaultConfig = Object.fromEntries(
        Object.entries(DEFAULT_CONFIG).map(([k, v]) => [k, String(v)])
      );
      remoteConfig.settings.minimumFetchIntervalMillis =
        process.env.NODE_ENV === 'development' ? 0 : 3_600_000;

      if (process.env.NODE_ENV === 'development') setLogLevel(remoteConfig, 'debug');

      await fetchAndActivate(remoteConfig);

      for (const key of Object.keys(DEFAULT_CONFIG)) {
        _cache[key] = getString(remoteConfig, key);
      }
    }

    _initialized = true;
    console.info('[RemoteConfig] 초기화 완료', _cache);
  } catch (e) {
    console.warn('[RemoteConfig] 초기화 실패, 기본값 사용:', e);
    _initialized = true; // 실패해도 기본값으로 동작
  }
}

/** boolean 값 반환 */
export function getBoolean(key: Extract<RemoteConfigKey, 'weekly_digest_enabled' | 'overdue_badge_enabled' | 'budget_dday_enabled' | 'onboarding_new_flow' | 'maintenance_mode'>): boolean {
  if (!_initialized || !_cache[key]) return DEFAULT_CONFIG[key] as boolean;
  return _cache[key] === 'true' || _cache[key] === '1';
}

/** number 값 반환 */
export function getNumber(key: Extract<RemoteConfigKey, 'max_expense_categories'>): number {
  if (!_initialized || !_cache[key]) return DEFAULT_CONFIG[key] as number;
  const n = Number(_cache[key]);
  return isNaN(n) ? (DEFAULT_CONFIG[key] as number) : n;
}

/** string 값 반환 */
export function getString(key: Extract<RemoteConfigKey, 'maintenance_message'>): string {
  if (!_initialized || !_cache[key]) return DEFAULT_CONFIG[key] as string;
  return _cache[key] || (DEFAULT_CONFIG[key] as string);
}

/** 현재 캐시된 전체 config 반환 (디버그용) */
export function getAllConfig(): Record<string, string> {
  return { ...Object.fromEntries(Object.entries(DEFAULT_CONFIG).map(([k, v]) => [k, String(v)])), ..._cache };
}
