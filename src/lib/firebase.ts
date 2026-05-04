/**
 * 글리움 — Firebase / FCM 클라이언트
 * FCM 토큰 발급, 포그라운드 메시지 수신 담당
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// 앱 중복 초기화 방지
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let messagingInstance: Messaging | null = null;

async function getMessagingInstance(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

/**
 * 브라우저에 알림 권한 요청 후 FCM 토큰 반환
 * 권한 거부 또는 미지원 환경이면 null 반환
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[FCM] 알림 권한 거부됨');
      return null;
    }

    // 서비스워커 등록
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
 * 앱 포그라운드 상태에서 수신되는 FCM 메시지 리스너
 * 반환값: unsubscribe 함수
 */
export async function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
