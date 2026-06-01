'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { isNativeApp } from '@/lib/native';
import { PcLandingPage } from './PcLandingPage';

/**
 * 루트(/) 라우터
 * - PC(1024px 이상): PC 랜딩 페이지 표시
 * - 모바일/태블릿: /login 으로 리다이렉트
 *   → Android/iOS 앱(WebView) 접근 시 마케팅 랜딩 노출 방지
 */
export function RootPageRouter() {
  const isDesktop = useIsDesktop();
  const router = useRouter();

  useEffect(() => {
    if (!isDesktop) {
      // 네이티브 앱: 이미 RouterActivity 에서 세션 체크 후 MainActivity 로 왔으므로 /home 으로
      // 웹 브라우저: 마케팅 랜딩 노출 방지를 위해 /login 으로
      router.replace(isNativeApp() ? '/home' : '/login');
    }
  }, [isDesktop, router]);

  // 데스크탑이면 랜딩 페이지, 모바일이면 빈 화면(리다이렉트 중)
  if (!isDesktop) {
    return (
      <div style={{ minHeight: '100dvh', background: '#08080E' }} />
    );
  }

  return <PcLandingPage />;
}
