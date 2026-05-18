'use client';

/**
 * 글리움 — useFCM 훅
 * 로그인 사용자의 FCM 토큰을 자동 등록하고, 포그라운드 알림을 처리합니다.
 */

import { useEffect } from 'react';
import { requestFCMToken, onForegroundMessage } from '@/lib/firebase';
import { saveFCMToken } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isNativeApp, getNativePlatform } from '@/lib/native';

export function useFCM() {
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading || !user) return;
    if (typeof window === 'undefined') return;

    // 네이티브 앱은 Notification API 여부와 무관하게 항상 실행
    // (웹은 Notification API 필수)
    const isNative = isNativeApp();
    if (!isNative && !('Notification' in window)) return;

    let unsubscribe: (() => void) | null = null;

    (async () => {
      // 1) FCM 토큰 발급 후 DB 저장
      try {
        console.info('[FCM] 토큰 발급 시작 — 환경:', isNative ? getNativePlatform() : 'web');
        const token = await requestFCMToken();
        if (token) {
          console.info('[FCM] 토큰 발급 성공 — prefix:', token.slice(0, 20), '| native:', isNative);
          await saveFCMToken(token);
        } else {
          console.warn('[FCM] 토큰 발급 실패 또는 권한 거부');
        }
      } catch (err) {
        console.error('[FCM] 토큰 발급 중 오류:', err);
      }

      // 2) 포그라운드 메시지 수신 → 알림 표시
      unsubscribe = await onForegroundMessage((payload) => {
        const title = payload.notification?.title ?? '글리움';
        const body  = payload.notification?.body  ?? '';
        const url   = payload.data?.url ?? '/home';

        // 네이티브 앱은 @capacitor-firebase/messaging 이 알림 표시를 처리하므로
        // 웹에서만 Notification API 사용
        if (!isNative && Notification.permission === 'granted') {
          const notification = new Notification(title, {
            body,
            icon: '/icon-192.png',
          });
          notification.onclick = () => {
            window.focus();
            window.location.href = url;
          };
        } else if (isNative) {
          // 네이티브 포그라운드 알림: URL 이동만 처리 (시각적 알림은 플러그인이 담당)
          console.info('[FCM] 포그라운드 메시지 수신:', title, '→', url);
        }
      });
    })();

    return () => {
      unsubscribe?.();
    };
  }, [user, loading]);
}
