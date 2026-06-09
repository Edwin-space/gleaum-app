'use client';

import { useEffect } from 'react';

interface KakaoAdBannerProps {
  adUnit: string;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 카카오 AdFit 배너 컴포넌트
 *
 * next/script 대신 useEffect로 스크립트를 직접 주입한다.
 * 이유: ba.min.js 는 로드 시점에 DOM을 스캔하므로, <ins> 요소가
 * 이미 렌더링된 뒤에 스크립트가 실행되어야 광고가 표시된다.
 * SPA 내비게이션 시에도 컴포넌트 재마운트 → useEffect 재실행 →
 * 스크립트 재삽입으로 항상 올바르게 동작한다.
 */
export function KakaoAdBanner({ adUnit, width, height, className, style }: KakaoAdBannerProps) {
  useEffect(() => {
    // 동일 스크립트가 이미 있으면 제거 (SPA 이동 후 재실행 보장)
    const existing = document.querySelector('script[src*="ba.min.js"]');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type  = 'text/javascript';
    script.src   = '//t1.kakaocdn.net/kas/static/ba.min.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      try { script.remove(); } catch { /* 이미 제거됨 */ }
    };
  }, []); // 마운트 1회 — <ins>가 DOM에 있을 때 실행됨

  return (
    <div
      className={className}
      style={{
        width: `${width}px`,
        maxWidth: '100%',
        minHeight: `${height}px`,
        ...style,
      }}
    >
      <ins
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit={adUnit}
        data-ad-width={String(width)}
        data-ad-height={String(height)}
      />
    </div>
  );
}
