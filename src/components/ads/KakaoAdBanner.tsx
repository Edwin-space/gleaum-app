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
 *  - 각 광고 컨테이너에 독립 스크립트 삽입 → 다른 슬롯을 제거하지 않음
 *  - <ins> 바로 뒤에 SDK 스크립트를 배치
 */
export function KakaoAdBanner({ adUnit, width, height, className, style }: KakaoAdBannerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const safeStyle = style ? { ...style } : undefined;

  if (safeStyle) {
    // AdFit 심사 정책: 광고 스크립트/노출 영역은 라운딩, 클리핑, 강조 효과로
    // 임의 변형하면 안 된다. margin 같은 배치 속성만 허용하고 광고 외형은 원본 유지.
    delete safeStyle.borderRadius;
    delete safeStyle.borderTopLeftRadius;
    delete safeStyle.borderTopRightRadius;
    delete safeStyle.borderBottomLeftRadius;
    delete safeStyle.borderBottomRightRadius;
    delete safeStyle.overflow;
    delete safeStyle.clipPath;
    delete safeStyle.boxShadow;
    delete safeStyle.filter;
    delete safeStyle.transform;
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement('script');
    script.type      = 'text/javascript';
    script.charset   = 'utf-8';
    script.src       = 'https://t1.kakaocdn.net/kas/static/ba.min.js';
    script.async     = true;

    // 공식 가이드와 SPA 재진입을 모두 만족시키기 위해 각 <ins> 바로 뒤에
    // SDK 스크립트를 붙인다. 다른 슬롯의 스크립트는 건드리지 않는다.
    container.appendChild(script);
    scriptRef.current = script;

    return () => {
      try { script.remove(); } catch { /* 이미 제거됨 */ }
    };
  }, [adUnit, width, height]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: `${width}px`,
        maxWidth: '100%',
        minHeight: `${height}px`,
        ...safeStyle,
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
