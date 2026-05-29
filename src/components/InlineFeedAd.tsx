'use client';

/**
 * InlineFeedAd — 홈피드 인라인 광고
 *
 * - 웹:    AdSlot (자체 광고 → AdSense 폴백)
 * - 네이티브: AdMob TOP_CENTER 배너 (헤더 bottom 기준 고정)
 */

import { useEffect, useRef } from 'react';
import { isNativeApp } from '@/lib/native';
import { showInlineBanner, removeInlineBanner } from '@/lib/admob';
import { AdSlot } from '@/components/AdSlot';

const BANNER_HEIGHT = 60;

/** 네이티브 전용 — AdMob 배너 오버레이 */
function NativeInlineBanner() {
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const show = () => {
      const header = document.querySelector('header');
      if (!header) return;
      void showInlineBanner(header.getBoundingClientRect().bottom);
    };

    const raf = requestAnimationFrame(() => { setTimeout(show, 150); });
    return () => { cancelAnimationFrame(raf); void removeInlineBanner(); };
  }, []);

  // 네이티브 배너가 올라올 자리 확보 (DOM 공간)
  return (
    <div
      ref={placeholderRef}
      style={{ width: '100%', height: BANNER_HEIGHT, borderRadius: 12 }}
      aria-hidden="true"
    />
  );
}

/** 웹 전용 — 자체 광고 or AdSense */
function WebInlineBanner() {
  return (
    <AdSlot
      slotId="home-feed-inline"
      height={BANNER_HEIGHT}
      adsenseSlotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_FEED}
    />
  );
}

export function InlineFeedAd() {
  if (isNativeApp()) return <NativeInlineBanner />;
  return <WebInlineBanner />;
}
