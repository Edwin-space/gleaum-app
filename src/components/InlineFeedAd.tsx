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

const AD_HEIGHT = 60;
import { isNativeApp } from '@/lib/native';
import { AdSlot } from '@/components/AdSlot';
import type { NativeAdData } from '@/lib/native-ad';
import { useAccountCapability } from '@/components/AccountSessionProvider';

// ── 네이티브 광고 카드 (피드 카드 형태) ────────────────────────────────────
function NativeAdCard({ ad }: { ad: NativeAdData }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    import('@/lib/native-ad')
      .then(({ NativeAd }) => NativeAd.reportImpression())
      .catch(() => {});
  }, []);

  return (
    <div style={{
      width: '100%', borderRadius: 16, overflow: 'hidden',
      background: 'var(--theme-surface)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    }}>
      {/* 이미지 */}
      {ad.imageUrl && (
        <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative' }}>
          <Image src={ad.imageUrl} alt={ad.headline} fill
            style={{ objectFit: 'cover' }} sizes="100vw" />
        </div>
      )}

      {/* 텍스트 영역 */}
      <div style={{ padding: '12px 16px 16px' }}>
        {/* AD 라벨 */}
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--theme-text-subtle)',
          letterSpacing: '0.05em', display: 'block', marginBottom: 6,
        }}>AD{ad.advertiser ? ` · ${ad.advertiser}` : ''}</span>

        {/* 헤드라인 */}
        <p style={{
          fontSize: 15, fontWeight: 800, color: 'var(--theme-text)',
          margin: '0 0 4px', lineHeight: 1.3,
        }}>{ad.headline}</p>

        {/* 본문 */}
        {ad.body ? (
          <p style={{
            fontSize: 12, color: 'var(--theme-text-muted)',
            margin: '0 0 12px', lineHeight: 1.5,
          }}>{ad.body}</p>
        ) : <div style={{ height: 12 }} />}

        {/* CTA 버튼 */}
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #0084CC, #0CC9B5)',
          color: 'white', fontSize: 13, fontWeight: 700,
          padding: '8px 20px', borderRadius: 10,
        }}>
          {ad.callToAction || '자세히 알아보기'}
        </div>
      </div>
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
  const canShowAds = useAccountCapability('canShowAds');
  if (!canShowAds) return null;
  if (isNativeApp()) return <NativeInlineAd />;
  return <WebInlineAd />;
}
