'use client';

import dynamic from 'next/dynamic';

// SSR 제외 — 초기 렌더 부하 없이 JS 로드 후 마운트
const PWAInstallBannerLazy = dynamic(
  () => import('@/components/PWAInstallBanner').then((m) => ({ default: m.PWAInstallBanner })),
  { ssr: false }
);

export function LazyPWABanner() {
  return <PWAInstallBannerLazy />;
}
