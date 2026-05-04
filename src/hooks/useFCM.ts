'use client';

/**
 * 글리움 — useFCM 훅
 * 로그인 사용자의 FCM 토큰을 자동 등록하고, 포그라운드 알림을 처리합니다.
 */

import { useEffect } from 'react';
import { requestFCMToken, onForegroundMessage } from '@/lib/firebase';
import { saveFCMToken } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function useFCM() {
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading || !user) return;
    if (typeof window === 'undefined') return;
    // HTTPS 또는 localhost 환경에서만 실행
    if (!('Notification' in window)) return;

    let unsubscribe: (() => void) | null = null;

    (async () => {
      // 1) FCM 토큰 발급 후 DB 저장
      const token = await requestFCMToken();
      if (token) {
        await saveFCMToken(token);
      }

      // 2) 포그라운드 메시지 수신 → 브라우저 Notification API로 표시
      unsubscribe = await onForegroundMessage((payload) => {
        const title = payload.notification?.title ?? '글리움';
        const body  = payload.notification?.body  ?? '';
        const url   = payload.data?.url ?? '/home';

        if (Notification.permission === 'granted') {
          const notification = new Notification(title, {
            body,
            icon: '/icon-192.png',
          });
          notification.onclick = () => {
            window.focus();
            window.location.href = url;
          };
        }
      });
    })();

    return () => {
      unsubscribe?.();
    };
  }, [user, loading]);
}
