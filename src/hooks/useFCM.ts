'use client';

/**
 * 글리움 — useFCM 훅
 * 로그인 사용자의 FCM 토큰을 자동 등록하고, 포그라운드 알림을 처리합니다.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { requestFCMToken, onForegroundMessage, onNotificationTap } from '@/lib/firebase';
import { saveFCMToken } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isNativeApp, getNativePlatform } from '@/lib/native';

export function useFCM() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (typeof window === 'undefined') return;

    const isNative = isNativeApp();
    if (!isNative && !('Notification' in window)) return;

    let unsubForeground: (() => void) | null = null;
    let unsubTap:        (() => void) | null = null;

    (async () => {
      // 1) FCM 토큰 발급 후 DB 저장
      try {
        console.info('[FCM] 토큰 발급 시작 — 환경:', isNative ? getNativePlatform() : 'web');
        const token = await requestFCMToken();
        if (token) {
          console.info('[FCM] 토큰 발급 성공 — prefix:', token.slice(0, 20));
          await saveFCMToken(token);
        } else {
          console.warn('[FCM] 토큰 발급 실패 또는 권한 거부');
        }
      } catch (err) {
        console.error('[FCM] 토큰 발급 중 오류:', err);
      }

      // 2) 알림 탭 → URL 네비게이션 (백그라운드/종료 상태에서 탭했을 때)
      unsubTap = await onNotificationTap((url) => {
        try {
          // 트래킹 URL 처리: /api/campaign/click?id=...&to=ENCODED_URL
          // 실제 목적지로 이동하고, 트래킹 요청은 백그라운드에서 실행
          const resolveDestination = (rawUrl: string): string => {
            try {
              const parsed = rawUrl.startsWith('http')
                ? new URL(rawUrl)
                : new URL(rawUrl, 'https://placeholder.local');

              // 트래킹 리다이렉트 URL인지 확인
              if (parsed.pathname === '/api/campaign/click') {
                const toParam = parsed.searchParams.get('to');
                if (toParam) {
                  // 백그라운드에서 트래킹 요청 전송 (결과 무시)
                  fetch(rawUrl.startsWith('http') ? rawUrl : `https://www.gleaum.com${rawUrl}`, {
                    method: 'GET',
                    keepalive: true,
                  }).catch(() => {});

                  // 실제 목적지 URL 반환
                  const dest = decodeURIComponent(toParam);
                  return dest.startsWith('http')
                    ? new URL(dest).pathname + new URL(dest).search
                    : dest;
                }
              }

              // 일반 URL: pathname 추출
              return rawUrl.startsWith('http')
                ? parsed.pathname + parsed.search
                : rawUrl;
            } catch {
              return '/home';
            }
          };

          router.push(resolveDestination(url));
        } catch {
          router.push('/home');
        }
      });

      // 3) 포그라운드 메시지 수신 → 알림 표시
      unsubForeground = await onForegroundMessage((payload) => {
        const title = payload.notification?.title ?? '글리움';
        const body  = payload.notification?.body  ?? '';
        const url   = payload.data?.url ?? '/home';

        if (!isNative && Notification.permission === 'granted') {
          // 웹: 브라우저 Notification API
          const notification = new Notification(title, {
            body,
            icon: '/icon-192.png',
          });
          notification.onclick = () => {
            window.focus();
            try {
              const pathname = url.startsWith('http')
                ? new URL(url).pathname + new URL(url).search
                : url;
              router.push(pathname);
            } catch {
              window.location.href = url;
            }
          };
        } else if (isNative) {
          console.info('[FCM] 포그라운드 메시지 수신:', title, '→', url);
        }
      });
    })();

    return () => {
      unsubForeground?.();
      unsubTap?.();
    };
  }, [user, loading, router]);
}
