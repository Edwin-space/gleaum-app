'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { isNativeApp } from '@/lib/native';
import { PcLandingPage } from './PcLandingPage';

const subscribeRuntime = (onStoreChange: () => void) => {
  const timer = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timer);
};

/**
 * 루트(/) 라우터
 * - 일반 웹: PC·태블릿·모바일에 동일한 반응형 소개 페이지 표시
 * - Android/iOS 앱 WebView: 마케팅 페이지를 건너뛰고 네이티브 세션 라우팅 대기
 */
export function RootPageRouter() {
  const router = useRouter();
  const nativeRuntime = useSyncExternalStore(
    subscribeRuntime,
    isNativeApp,
    () => true,
  );

  useEffect(() => {
    // 네이티브 앱은 NativeAppProvider가 네이티브 세션 적용 후 /home 또는 /onboarding으로 이동시킨다.
    // 여기서 먼저 /home으로 이동하면 서버 proxy가 쿠키 없는 요청을 /login으로 돌려보내는 레이스가 생긴다.
    if (nativeRuntime) {
      const timer = window.setTimeout(() => {
        if (window.location.pathname === '/') router.replace('/login');
      }, 4200);
      return () => window.clearTimeout(timer);
    }
  }, [nativeRuntime, router]);

  if (nativeRuntime) {
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
