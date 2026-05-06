/**
 * 글리움 — Firebase / FCM 클라이언트 (브라우저 전용)
 * 동적 임포트를 사용하여 서버 빌드 환경에서 firebase/messaging 오류 방지
 */

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
 * 브라우저 알림 권한 요청 후 FCM 토큰 반환
 * 서버 환경 / 권한 거부 / 미지원 시 null 반환
 */
export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  try {
    // 동적 임포트 — 서버 번들에 firebase/messaging 포함되지 않도록 처리
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
    console.error('[FCM] 토큰 발급 실패:', err);
    return null;
  }
}

/**
 * 앱 포그라운드 상태에서 FCM 메시지 수신 리스너
 * 반환: unsubscribe 함수
 */
export async function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
): Promise<() => void> {
  if (typeof window === 'undefined') return () => {};

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
