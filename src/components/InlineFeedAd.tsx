'use client';

/**
 * InlineFeedAd — 홈피드 인라인 광고
 *
 * 웹 브라우저:
 *   AdSlot → 하우스광고 → AdSense 폴백
 *
 * 네이티브 앱:
 *   AdMob 네이티브 광고 (NativeAdPlugin) 직접 표시
 *   (하우스광고 연동은 네이티브 광고 정상 동작 확인 후 추가 예정)
 */

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { isNativeApp } from '@/lib/native';
import { AdSlot } from '@/components/AdSlot';
import type { NativeAdData } from '@/lib/native-ad';

const AD_HEIGHT = 60;

// ── 네이티브 광고 카드 ───────────────────────────────────────────────────────
function NativeAdCard({ ad }: { ad: NativeAdData }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    import('@/lib/native-ad')
      .then(({ NativeAd }) => NativeAd.reportImpression())
      .catch(() => {});
  }, []);

  if (ad.imageUrl) {
    return (
      <div style={{
        width: '100%', height: AD_HEIGHT, borderRadius: 12,
        overflow: 'hidden', position: 'relative', background: '#F2F2F7',
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
        <p style={{
          fontSize: 12, fontWeight: 700, color: '#1A1B2E',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0,
        }}>{ad.headline}</p>
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

// ── 네이티브 앱: AdMob 네이티브 광고 직접 로드 ──────────────────────────────
function NativeInlineAd() {
  const [ad, setAd]         = useState<NativeAdData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/native-ad')
      .then(({ NativeAd }) => NativeAd.loadAd())
      .then((result) => {
        if (!result.error && result.headline) {
          setAd(result);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 로딩 중 — 자리 확보
  if (loading) {
    return (
      <div style={{ width: '100%', height: AD_HEIGHT, borderRadius: 12, background: 'rgba(0,0,0,0.03)' }} />
    );
  }

  // 광고 있음
  if (ad) return <NativeAdCard ad={ad} />;

  // 광고 없음 — 공간 제거
  return null;
}

// ── 웹 브라우저: 하우스광고 → AdSense ──────────────────────────────────────
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
