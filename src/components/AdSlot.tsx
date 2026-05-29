'use client';

/**
 * AdSlot — 웹 광고 슬롯 컴포넌트
 *
 * 우선순위:
 *   1. 백오피스에 등록된 자체 광고  (Supabase ads 테이블)
 *   2. Google AdSense 폴백          (자체 광고 없을 때)
 *
 * 사용:
 *   <AdSlot slotId="home-feed-inline" width={320} height={60} />
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { ActiveAd } from '@/types/ads';

interface AdSlotProps {
  slotId:   string;
  width?:   number;
  height?:  number;
  /** AdSense 광고 슬롯 ID (없으면 AdSense 폴백 생략) */
  adsenseSlotId?: string;
  className?: string;
}

// AdSense 퍼블리셔 ID — 환경변수 또는 직접 설정
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

export function AdSlot({ slotId, width = 320, height = 60, adsenseSlotId, className }: AdSlotProps) {
  const [ad, setAd]       = useState<ActiveAd | null | 'loading'>('loading');
  const trackedRef        = useRef(false);

  // ── 1. 자체 광고 조회 ────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/ads?slot=${encodeURIComponent(slotId)}&platform=web`)
      .then(async (res) => {
        if (res.status === 204) { setAd(null); return; }  // 광고 없음 → AdSense
        const json = await res.json();
        setAd(json as ActiveAd);
      })
      .catch(() => setAd(null));
  }, [slotId]);

  // ── 2. AdSense 폴백 초기화 ───────────────────────────────────
  useEffect(() => {
    if (ad !== null || !adsenseSlotId || !ADSENSE_CLIENT) return;
    try {
      // adsbygoogle 스크립트가 로드된 경우에만 push
      const w = window as unknown as { adsbygoogle?: unknown[] };
      if (Array.isArray(w.adsbygoogle)) {
        w.adsbygoogle.push({});
      }
    } catch { /* silent */ }
  }, [ad, adsenseSlotId]);

  // ── 3. 자체 광고 노출 이벤트 ────────────────────────────────
  useEffect(() => {
    if (!ad || ad === 'loading' || trackedRef.current) return;
    trackedRef.current = true;
    navigator.sendBeacon('/api/ads/events', JSON.stringify({
      adId: ad.id, event: 'impression', platform: 'web',
    }));
  }, [ad]);

  // ── 로딩 중: 빈 공간 유지 ────────────────────────────────────
  if (ad === 'loading') {
    return <div style={{ width, height, borderRadius: 12, background: 'rgba(0,0,0,0.03)' }} />;
  }

  // ── 자체 광고 렌더 ───────────────────────────────────────────
  if (ad) {
    return (
      <a
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          navigator.sendBeacon('/api/ads/events', JSON.stringify({
            adId: ad.id, event: 'click', platform: 'web',
          }));
        }}
        className={className}
        style={{
          display:        'block',
          width,
          height,
          borderRadius:   12,
          overflow:       'hidden',
          textDecoration: 'none',
          position:       'relative',
          background:     '#F2F2F7',
        }}
        aria-label={`광고: ${ad.title}`}
      >
        {ad.image_url ? (
          <Image
            src={ad.image_url}
            alt={ad.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes={`${width}px`}
          />
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
        {/* 광고 레이블 */}
        <span style={{
          position: 'absolute', top: 3, right: 5,
          fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.3)',
          letterSpacing: '0.05em',
        }}>
          AD
        </span>
      </a>
    );
  }

  // ── AdSense 폴백 ─────────────────────────────────────────────
  if (adsenseSlotId && ADSENSE_CLIENT) {
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

  // ── 광고도 AdSense 설정도 없음 → 공간 없음 ───────────────────
  return null;
}
