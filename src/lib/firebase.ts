/**
 * 글리움 — Firebase / FCM 클라이언트
 *
 * 환경 분기:
 *  - 네이티브 앱 (iOS / Android): @capacitor-firebase/messaging 플러그인 사용
 *  - 웹 브라우저: Firebase JS SDK + Service Worker 사용
 *  - 서버 (SSR): 항상 null 반환 (window 없음)
 */

import { isNativeApp } from '@/lib/native';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

const isFirebaseValid = !!firebaseConfig.projectId && !!firebaseConfig.apiKey;

/**
 * FCM 토큰 발급
 *
 * 네이티브: @capacitor-firebase/messaging → APNs/FCM 네이티브 토큰
 * 웹: Firebase JS SDK → VAPID 기반 웹 푸시 토큰
 */
export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // ── 네이티브 앱 (iOS / Android) ──────────────────────────────────────────
  if (isNativeApp()) {
    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

      // 알림 권한 요청
      const { receive } = await FirebaseMessaging.requestPermissions();
      if (receive !== 'granted') return null;

      // FCM 토큰 발급
      const { token } = await FirebaseMessaging.getToken();
      return token ?? null;
    } catch (err) {
      console.error('[FCM] 네이티브 토큰 발급 실패:', err);
      return null;
    }
  }

  // ── 웹 브라우저 ───────────────────────────────────────────────────────────
  if (!('Notification' in window)) return null;

  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging');

    const supported = await isSupported();
    if (!supported || !isFirebaseValid) return null;

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
      serviceWorkerRegistration: registration,
    });

    return token ?? null;
  } catch (err) {
    console.error('[FCM] 웹 토큰 발급 실패:', err);
    return null;
  }
}

/**
 * 앱 포그라운드 상태에서 FCM 메시지 수신 리스너
 *
 * 네이티브: @capacitor-firebase/messaging notificationReceived 이벤트
 * 웹: Firebase JS SDK onMessage
 *
 * 반환: unsubscribe 함수
 */
export async function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
): Promise<() => void> {
  if (typeof window === 'undefined') return () => {};

  // ── 네이티브 앱 ───────────────────────────────────────────────────────────
  if (isNativeApp()) {
    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
      await FirebaseMessaging.addListener('notificationReceived', (event) => {
        callback({
          notification: {
            title: event.notification.title,
            body:  event.notification.body,
          },
          data: event.notification.data as Record<string, string> | undefined,
        });
      });
      return () => { FirebaseMessaging.removeAllListeners(); };
    } catch {
      return () => {};
    }
  }

  // ── 웹 브라우저 ───────────────────────────────────────────────────────────
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getMessaging, onMessage, isSupported } = await import('firebase/messaging');

    const supported = await isSupported();
    if (!supported || !isFirebaseValid) return () => {};

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const messaging = getMessaging(app);

    return onMessage(messaging, callback);
  } catch {
    return () => {};
  }
}
