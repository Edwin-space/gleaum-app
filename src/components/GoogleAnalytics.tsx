'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { GA_ID, trackPageView } from '@/lib/analytics';

/**
 * SPA 라우트 전환 시 page_view 자동 전송
 * useSearchParams 는 Suspense 내에서만 안전하게 사용 가능
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}

/**
 * GA4 스크립트 삽입 + 페이지뷰 트래커
 * layout.tsx에 한 번만 추가
 */
export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      {/* gtag.js 비동기 로드 — afterInteractive: 렌더 블로킹 없음 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            send_page_view: false,
            cookie_flags: 'SameSite=None;Secure',
          });
        `}
      </Script>

      {/* SPA 라우팅 시 page_view 추적 */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
