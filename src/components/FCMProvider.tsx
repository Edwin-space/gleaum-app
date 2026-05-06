'use client';

/**
 * 글리움 — FCM Provider
 * 앱 전체에서 FCM 토큰 등록 및 포그라운드 알림 수신을 활성화합니다.
 * RootLayout에 삽입됩니다.
 */

import { useFCM } from '@/hooks/useFCM';

export function FCMProvider({ children }: { children: React.ReactNode }) {
  useFCM();
  return <>{children}</>;
}
