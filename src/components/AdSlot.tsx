'use client';

/**
 * AdSlot — 광고 슬롯 컴포넌트
 *
 * 플랫폼별 자동 분리:
 *   웹 브라우저  → 하우스광고(Supabase) → AdSense 폴백
 *   네이티브 앱  → 하우스광고(Supabase) → 광고 없음 (AdMob은 슬롯별 네이티브 코드에서 처리)
 *
 * 사용:
 *   <AdSlot slotId="home-feed-inline" width={320} height={60}
 *           adsenseSlotId="XXXX" />  ← 웹 전용 AdSense ID
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { isNativeApp } from '@/lib/native';
import type { ActiveAd } from '@/types/ads';

interface AdSlotProps {
  slotId:         string;
  width?:         number;
  height?:        number;
  /** AdSense 슬롯 ID — 웹 브라우저 전용 폴백. 네이티브 앱에서는 무시됨 */
  adsenseSlotId?: string;
  className?:     string;
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

export function AdSlot({ slotId, width = 320, height = 60, adsenseSlotId, className }: AdSlotProps) {
  const [ad, setAd]    = useState<ActiveAd | null | 'loading'>('loading');
  const trackedRef     = useRef(false);
  const native         = isNativeApp();

  // ── 1. 하우스 광고 조회 (웹/앱 공통) ─────────────────────────
  useEffect(() => {
    const platform = native ? 'android' : 'web'; // 앱이면 android로 필터링
    fetch(`/api/ads?slot=${encodeURIComponent(slotId)}&platform=${platform}`)
      .then(async (res) => {
        if (!res.ok) { setAd(null); return; }
        const json = await res.json();
        if (json && typeof json.id === 'string' && typeof json.link_url === 'string') {
          setAd(json as ActiveAd);
        } else {
          setAd(null);
        }
      })
      .catch(() => setAd(null));
  }, [slotId, native]);

  // ── 2. AdSense 폴백 초기화 — 웹 전용 ─────────────────────────
  useEffect(() => {
    if (native) return;                          // 앱에서는 AdSense 사용 안 함
    if (ad !== null || !adsenseSlotId || !ADSENSE_CLIENT) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      if (Array.isArray(w.adsbygoogle)) w.adsbygoogle.push({});
    } catch { /* silent */ }
  }, [ad, adsenseSlotId, native]);

  // ── 3. 하우스 광고 노출 이벤트 ───────────────────────────────
  useEffect(() => {
    if (!ad || ad === 'loading' || trackedRef.current) return;
    trackedRef.current = true;
    navigator.sendBeacon('/api/ads/events', JSON.stringify({
      adId: ad.id, event: 'impression',
      platform: native ? 'android' : 'web',
    }));
  }, [ad, native]);

  // ── 로딩 중 ──────────────────────────────────────────────────
  if (ad === 'loading') {
    return <div style={{ width, height, borderRadius: 12, background: 'rgba(0,0,0,0.03)' }} />;
  }

  // ── 하우스 광고 렌더 (웹/앱 공통) ────────────────────────────
  if (ad) {
    return (
      <a
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          navigator.sendBeacon('/api/ads/events', JSON.stringify({
            adId: ad.id, event: 'click',
            platform: native ? 'android' : 'web',
          }));
        }}
        className={className}
        style={{
          display: 'block', width, height,
          borderRadius: 12, overflow: 'hidden',
          textDecoration: 'none', position: 'relative',
          background: '#F2F2F7',
        }}
        aria-label={`광고: ${ad.title}`}
      >
        {ad.image_url ? (
          <Image src={ad.image_url} alt={ad.title} fill
            style={{ objectFit: 'cover' }} sizes={`${width}px`} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 16px', gap: 8,
            background: 'linear-gradient(135deg, #F8F9FF 0%, #EEF2FF 100%)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1B2E', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ad.title}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'white',
              background: '#0084CC', borderRadius: 8,
              padding: '4px 10px', flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              {ad.cta_text}
            </span>
          </div>
        )}
        <span style={{
          position: 'absolute', top: 3, right: 5,
          fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.3)', letterSpacing: '0.05em',
        }}>AD</span>
      </a>
    );
  }

  // ── 폴백 ─────────────────────────────────────────────────────
  // 웹: AdSense | 네이티브 앱: null (AdMob은 슬롯별 네이티브 코드에서 처리)
  if (!native && adsenseSlotId && ADSENSE_CLIENT) {
    return (
      <ins
        className={`adsbygoogle${className ? ` ${className}` : ''}`}
        style={{ display: 'block', width, height }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adsenseSlotId}
        data-ad-format="auto"
        data-full-width-responsive="false"
      />
    );
  }

  return null;
}
