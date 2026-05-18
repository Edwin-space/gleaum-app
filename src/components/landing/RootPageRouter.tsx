'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useMediaQuery';
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
    // window가 로드된 후 모바일이면 /login으로 이동
    if (!isDesktop) {
      router.replace('/login');
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
