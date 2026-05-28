/**
 * 글리움 — Firebase App Check 유틸리티
 *
 * 실제 글리움 앱에서만 API 호출이 가능하도록 검증합니다.
 *
 * 플랫폼별 Provider:
 *   iOS     : DeviceCheck (프로덕션) / Debug (개발)
 *   Android : Play Integrity (프로덕션) / Debug (개발)
 *   Web     : reCAPTCHA v3 (프로덕션) / Debug (개발)
 *
 * ── Firebase 콘솔 설정 필요 ────────────────────────────────
 *  1. Firebase 콘솔 → App Check → 각 앱 등록
 *  2. iOS: DeviceCheck 활성화
 *  3. Android: Play Integrity 활성화
 *  4. Web: reCAPTCHA v3 사이트 키 등록
 *     → NEXT_PUBLIC_RECAPTCHA_SITE_KEY 환경변수에 저장
 * ──────────────────────────────────────────────────────────
 */

import { isNativeApp } from '@/lib/native';

let _initialized = false;

/** App Check 초기화 (앱 시작 시 1회 호출) */
export async function initAppCheck(): Promise<void> {
  if (_initialized) return;

  try {
    if (isNativeApp()) {
      const { FirebaseAppCheck } = await import('@capacitor-firebase/app-check');

      // iOS: DeviceCheck / Android: Play Integrity 자동 선택
      // 개발 디버그 토큰 사용 시 Firebase 콘솔에서 debug token 등록 필요
      await FirebaseAppCheck.initialize({
        debug: process.env.NODE_ENV === 'development',
        isTokenAutoRefreshEnabled: true,
      });

      _initialized = true;
      console.info('[AppCheck] 네이티브 초기화 완료');
    } else if (typeof window !== 'undefined') {
      const reCAPTCHASiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (!reCAPTCHASiteKey && process.env.NODE_ENV !== 'development') {
        console.warn('[AppCheck] NEXT_PUBLIC_RECAPTCHA_SITE_KEY 미설정, 웹 App Check 비활성');
        return;
      }

      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } = await import('firebase/app-check');

      const firebaseConfig = {
        apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      };

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

      if (process.env.NODE_ENV === 'development') {
        // 개발 모드: 자동 디버그 토큰 사용
        // Firebase 콘솔 → App Check → Apps → 웹 앱 → Debug tokens 등록 필요
        (self as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        initializeAppCheck(app, {
          provider: new CustomProvider({
            getToken: async () => ({
              token: 'debug-token',
              expireTimeMillis: Date.now() + 3_600_000,
            }),
          }),
          isTokenAutoRefreshEnabled: true,
        });
      } else if (reCAPTCHASiteKey) {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(reCAPTCHASiteKey),
          isTokenAutoRefreshEnabled: true,
        });
      }

      _initialized = true;
      console.info('[AppCheck] 웹 초기화 완료');
    }
  } catch (e) {
    console.warn('[AppCheck] 초기화 실패 (앱 동작에는 영향 없음):', e);
  }
}

/** App Check 토큰 직접 조회 (디버그/테스트용) */
export async function getAppCheckToken(): Promise<string | null> {
  try {
    if (isNativeApp()) {
      const { FirebaseAppCheck } = await import('@capacitor-firebase/app-check');
      const { token } = await FirebaseAppCheck.getToken({ forceRefresh: false });
      return token;
    }
    return null;
  } catch {
    return null;
  }
}
