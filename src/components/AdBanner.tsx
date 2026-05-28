'use client';

/**
 * AdBanner — 홈 탭 인라인 AdMob 배너 컴포넌트
 *
 * 동작 방식:
 * 1. 웹(브라우저): 아무것도 렌더링하지 않음 (AdMob은 네이티브 전용)
 * 2. 네이티브 앱:
 *    - placeholder div를 렌더링해 레이아웃 공간 확보 (배너 높이만큼)
 *    - div의 화면 Y 좌표를 측정해 AdMob 네이티브 배너를 동일 위치에 표시
 *    - 언마운트 시 배너 제거
 */

import { useEffect, useRef } from 'react';
import { isNativeApp } from '@/lib/native';
import { showHomeBanner, removeBanner } from '@/lib/admob';

// ADAPTIVE_BANNER 의 기본 높이 (Android 기준 대략 60dp)
const BANNER_HEIGHT = 60;

interface AdBannerProps {
  /** 좌우 여백 (px). MobileHome padding-x 20px 과 맞춤 */
  horizontalPadding?: number;
}

export function AdBanner({ horizontalPadding = 20 }: AdBannerProps) {
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNativeApp()) return;

    // placeholder 의 화면 상단으로부터의 Y 좌표를 측정
    const showAd = () => {
      const el = placeholderRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // getBoundingClientRect().top = 뷰포트 기준 Y 좌표
      void showHomeBanner(rect.top);
    };

    // 렌더 완료 후 측정 (레이아웃 확정을 위해 requestAnimationFrame 사용)
    const raf = requestAnimationFrame(() => {
      // 짧은 딜레이: sticky 헤더 등 레이아웃이 완전히 정착된 후 측정
      setTimeout(showAd, 150);
    });

    return () => {
      cancelAnimationFrame(raf);
      void removeBanner();
    };
  }, []);

  // 웹에서는 아무것도 렌더링하지 않음
  if (!isNativeApp()) return null;

  return (
    <div
      ref={placeholderRef}
      style={{
        width: '100%',
        height: `${BANNER_HEIGHT}px`,
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.03)',
        // 네이티브 배너가 이 위치에 올라오므로 시각적으로 보이지 않아도 됨
        // 하지만 레이아웃 공간은 정확히 확보해야 함
      }}
      aria-hidden="true"
    />
  );
}
