'use client';

import { useEffect, useRef } from 'react';

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
 * 공식 가이드(https://github.com/adfit/adfit-web-sdk) 기준:
 *  - <ins> 바로 뒤에 <script async> 가 위치해야 함
 *  - <ins> style 에 width:100% 포함 필요
 *  - 스크립트는 body 하단에 위치 권장
 *
 * React SPA 대응:
 *  - useEffect: <ins> 가 DOM에 마운트된 뒤 스크립트 삽입 보장
 *  - 기존 스크립트 제거 후 재삽입 → SPA 이동 후에도 재실행
 *  - document.body 에 append (가이드 권장 위치)
 */
export function KakaoAdBanner({ adUnit, width, height, className, style }: KakaoAdBannerProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // 이전에 삽입된 동일 스크립트 제거 (SPA 재진입 시 재실행 보장)
    const existing = document.querySelector('script[src*="ba.min.js"]');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type      = 'text/javascript';
    script.charset   = 'utf-8';
    script.src       = 'https://t1.kakaocdn.net/kas/static/ba.min.js';
    script.async     = true;

    // 공식 가이드: </body> 바로 위 배치 권장
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      try { script.remove(); } catch { /* 이미 제거됨 */ }
    };
  }, []); // 마운트 1회 — <ins>가 DOM에 존재한 뒤 실행

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
      {/*
        공식 가이드 스펙:
          style="display:none;width:100%;"  ← width:100% 필수
          data-ad-unit / data-ad-width / data-ad-height
      */}
      <ins
        className="kakao_ad_area"
        style={{ display: 'none', width: '100%' }}
        data-ad-unit={adUnit}
        data-ad-width={String(width)}
        data-ad-height={String(height)}
      />
    </div>
  );
}
