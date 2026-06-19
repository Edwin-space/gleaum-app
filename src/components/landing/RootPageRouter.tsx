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
    // useIsDesktop()은 hydration 안전을 위해 초기값이 false다.
    // 따라서 루트 리다이렉트 판단은 effect 안에서 실제 브라우저 뷰포트를 다시 확인한다.
    const desktopNow = window.matchMedia('(min-width: 1024px)').matches;
    if (desktopNow) return;

    // 네이티브 앱은 NativeAppProvider가 네이티브 세션 적용 후 /home 또는 /onboarding으로 이동시킨다.
    // 여기서 먼저 /home으로 이동하면 서버 proxy가 쿠키 없는 요청을 /login으로 돌려보내는 레이스가 생긴다.
    if (isNativeApp()) {
      const timer = window.setTimeout(() => {
        if (window.location.pathname === '/') router.replace('/login');
      }, 4200);
      return () => window.clearTimeout(timer);
    }

    router.replace('/login');
  }, [router]);

  // 데스크탑이면 랜딩 페이지, 모바일이면 빈 화면(리다이렉트 중)
  if (!isDesktop) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: '#08080E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.62)',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}
      >
        GLEAUM
      </div>
    );
  }

  return <PcLandingPage />;
}
