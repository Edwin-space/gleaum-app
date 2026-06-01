'use client';

/**
 * InlineFeedAd — 홈피드 인라인 광고
 *
 * 웹 브라우저:
 *   AdSlot → 하우스광고 → AdSense 폴백
 *
 * 네이티브 앱:
 *   AdSlot → 하우스광고 → AdMob 네이티브 광고 폴백 (인라인 렌더링)
 *   하우스광고 있으면 항상 하우스광고 우선.
 *   없을 때만 NativeAdPlugin.loadAd() 호출.
 */

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { isNativeApp } from '@/lib/native';
import { AdSlot } from '@/components/AdSlot';
import type { NativeAdData } from '@/lib/native-ad';

const AD_HEIGHT = 60;

// ── 네이티브 광고 카드 (AdMob Native Ad) ────────────────────────────────────
function NativeAdCard({ ad }: { ad: NativeAdData }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    import('@/lib/native-ad').then(({ NativeAd }) => NativeAd.reportImpression()).catch(() => {});
  }, []);

  // 이미지 있으면 이미지 배너, 없으면 텍스트 배너
  if (ad.imageUrl) {
    return (
      <div style={{
        width: '100%', height: AD_HEIGHT, borderRadius: 12, overflow: 'hidden',
        position: 'relative', background: '#F2F2F7',
      }}>
        <Image src={ad.imageUrl} alt={ad.headline} fill
          style={{ objectFit: 'cover' }} sizes="100vw" />
        <span style={{
          position: 'absolute', top: 3, right: 5,
          fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.3)',
        }}>AD</span>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: AD_HEIGHT, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', gap: 8, background: '#F8F9FF',
      border: '1px solid #EEF2FF',
    }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#1A1B2E',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
          {ad.headline}
        </p>
        {ad.advertiser && (
          <p style={{ fontSize: 10, color: '#8E8E93', margin: '2px 0 0' }}>{ad.advertiser}</p>
        )}
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, color: 'white',
        background: '#0084CC', borderRadius: 8, padding: '4px 10px',
        flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        {ad.callToAction || '더 알아보기'}
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>AD</span>
    </div>
  );
}

// ── 네이티브 앱 전용: 하우스광고 → AdMob 네이티브 폴백 ──────────────────────
function NativeInlineAd() {
  const [houseAdLoaded, setHouseAdLoaded] = useState<boolean | null>(null); // null=loading
  const [nativeAd, setNativeAd] = useState<NativeAdData | null>(null);

  // 1. 먼저 하우스광고 확인 (AdSlot이 로드 결과를 알 수 없어 직접 fetch)
  useEffect(() => {
    fetch('/api/ads?slot=home-feed-inline&platform=android')
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          setHouseAdLoaded(!!(json?.id && json?.link_url));
        } else {
          setHouseAdLoaded(false);
        }
      })
      .catch(() => setHouseAdLoaded(false));
  }, []);

  // 2. 하우스광고 없으면 AdMob 네이티브 광고 로드
  useEffect(() => {
    if (houseAdLoaded !== false) return; // 하우스광고 있거나 아직 로딩 중
    import('@/lib/native-ad').then(({ NativeAd }) =>
      NativeAd.loadAd().then((ad) => {
        if (!ad.error && ad.headline) setNativeAd(ad);
      })
    ).catch(() => {});
  }, [houseAdLoaded]);

  // 로딩 중
  if (houseAdLoaded === null) {
    return <div style={{ width: '100%', height: AD_HEIGHT, borderRadius: 12, background: 'rgba(0,0,0,0.03)' }} />;
  }

  // 하우스광고 있음 → AdSlot 렌더
  if (houseAdLoaded) {
    return (
      <AdSlot slotId="home-feed-inline" height={AD_HEIGHT} />
    );
  }

  // 하우스광고 없음 + AdMob 네이티브 광고 있음
  if (nativeAd) {
    return <NativeAdCard ad={nativeAd} />;
  }

  // 둘 다 없음 → 공간 없음
  return null;
}

// ── 웹 전용 ─────────────────────────────────────────────────────────────────
function WebInlineAd() {
  return (
    <AdSlot
      slotId="home-feed-inline"
      height={AD_HEIGHT}
      adsenseSlotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_FEED}
    />
  );
}

export function InlineFeedAd() {
  if (isNativeApp()) return <NativeInlineAd />;
  return <WebInlineAd />;
}
