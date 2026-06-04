'use client';

/**
 * SaveAdSheet — 저장 완료 후 하단 바텀시트 광고
 *
 * 플랫폼 자동 분리:
 *   웹 브라우저  → 하우스광고 → AdSense 폴백 (바텀시트)
 *   네이티브 앱  → 하우스광고 → AdMob 인터스티셜 폴백
 *
 * 사용:
 *   const { showAd, AdSheet } = useSaveAdSheet();
 *   showAd();   // 저장 성공 후 호출
 *   <AdSheet /> // JSX에 마운트
 *
 * 쿨다운: 5분
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { isNativeApp } from '@/lib/native';

interface HouseAd {
  id:          string;
  title:       string;
  description: string | null;
  image_url:   string | null;
  link_url:    string;
  cta_text:    string;
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';
const ADSENSE_SLOT   = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SAVE_PROMPT ?? '';
const COOLDOWN_KEY   = 'save_ad_sheet_last';
const COOLDOWN_MS    = 5 * 60 * 1000;

function canShow(): boolean {
  try {
    const last = parseInt(localStorage.getItem(COOLDOWN_KEY) ?? '0', 10);
    return Date.now() - last >= COOLDOWN_MS;
  } catch { return true; }
}
function recordShown(): void {
  try { localStorage.setItem(COOLDOWN_KEY, Date.now().toString()); } catch {}
}

export function useSaveAdSheet() {
  const [visible, setVisible] = useState(false);
  const [ad, setAd]           = useState<HouseAd | null | 'loading'>('loading');
  const trackedRef             = useRef(false);
  const autoCloseRef           = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const native                 = isNativeApp();

  // ── 하우스 광고 조회 (웹/앱 공통, 플랫폼 필터 적용) ─────────
  useEffect(() => {
    const platform = native ? 'android' : 'web';
    fetch(`/api/ads?slot=save-prompt&platform=${platform}`)
      .then(async (res) => {
        if (!res.ok) { setAd(null); return; }
        const json = await res.json();
        if (json?.id && json?.link_url) setAd(json as HouseAd);
        else setAd(null);
      })
      .catch(() => setAd(null));
  }, [native]);

  const close = useCallback(() => {
    setVisible(false);
    clearTimeout(autoCloseRef.current);
  }, []);

  const showAd = useCallback(() => {
    if (!canShow()) return;
    if (ad === 'loading') return;

    recordShown();
    trackedRef.current = false;

    if (ad) {
      // 하우스 광고 있음 → 바텀시트 표시 (웹/앱 공통)
      setVisible(true);
      autoCloseRef.current = setTimeout(close, 8000);
    } else if (native) {
      // 네이티브 앱 + 하우스 광고 없음 → AdMob 인터스티셜
      import('@/lib/admob').then(({ showInterstitial }) => {
        void showInterstitial();
      }).catch(() => {});
    } else if (ADSENSE_CLIENT && ADSENSE_SLOT) {
      // 웹 + 하우스 광고 없음 → AdSense 바텀시트
      setVisible(true);
      autoCloseRef.current = setTimeout(close, 8000);
    }
    // 어떤 광고도 없으면 아무것도 표시 안 함
  }, [ad, native, close]);

  // ── 하우스 광고 노출 이벤트 ───────────────────────────────────
  useEffect(() => {
    if (!visible || !ad || ad === 'loading' || trackedRef.current) return;
    trackedRef.current = true;
    navigator.sendBeacon('/api/ads/events', JSON.stringify({
      adId: ad.id, event: 'impression',
      platform: native ? 'android' : 'web',
    }));
  }, [visible, ad, native]);

  // ── AdSense 초기화 (웹 전용) ──────────────────────────────────
  useEffect(() => {
    if (native || !visible || ad !== null || !ADSENSE_CLIENT || !ADSENSE_SLOT) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      if (Array.isArray(w.adsbygoogle)) w.adsbygoogle.push({});
    } catch {}
  }, [visible, ad, native]);

  const handleAdClick = useCallback(() => {
    if (!ad || ad === 'loading') return;
    navigator.sendBeacon('/api/ads/events', JSON.stringify({
      adId: ad.id, event: 'click',
      platform: native ? 'android' : 'web',
    }));
  }, [ad, native]);

  // ── AdSheet JSX ───────────────────────────────────────────────
  const AdSheet = useCallback(() => {
    if (!visible) return null;

    return (
      <>
        {/* 딤 배경 */}
        <div onClick={close} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)', zIndex: 9000,
          animation: 'fadeIn 0.2s ease',
        }} />

        {/* 바텀시트 */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9001,
          background: 'var(--theme-surface)', borderRadius: '24px 24px 0 0',
          padding: '20px 20px 36px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* 핸들 */}
          <div style={{
            width: 40, height: 4, borderRadius: 2,
            background: '#E0E0E0', margin: '0 auto 16px',
          }} />

          {/* 닫기 */}
          <button onClick={close} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none',
            fontSize: 16, color: 'var(--theme-text-subtle)', cursor: 'pointer', padding: '4px 8px',
          }}>× 닫기</button>

          {/* 하우스 광고 */}
          {ad && ad !== 'loading' ? (
            <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
              onClick={handleAdClick}
              style={{ textDecoration: 'none', display: 'block' }}>
              {ad.image_url && (
                <div style={{
                  width: '100%', borderRadius: 16, overflow: 'hidden',
                  marginBottom: 16, aspectRatio: '16/9', position: 'relative',
                  background: 'var(--theme-surface-muted)',
                }}>
                  <Image src={ad.image_url} alt={ad.title} fill
                    style={{ objectFit: 'cover' }} sizes="100vw" />
                </div>
              )}
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--theme-text-subtle)', margin: '0 0 6px', letterSpacing: '0.05em' }}>AD</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 6px', lineHeight: 1.3 }}>{ad.title}</p>
              {ad.description && (
                <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>{ad.description}</p>
              )}
              <div style={{
                width: '100%', height: 52, borderRadius: 14,
                background: 'linear-gradient(135deg, #0084CC, #0CC9B5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: 'white',
              }}>
                {ad.cta_text || '자세히 알아보기'}
              </div>
            </a>
          ) : (
            /* AdSense 폴백 — 웹 전용 (네이티브에서는 이 분기 진입 안 함) */
            !native && ADSENSE_CLIENT && ADSENSE_SLOT ? (
              <ins className="adsbygoogle"
                style={{ display: 'block', minHeight: 120 }}
                data-ad-client={ADSENSE_CLIENT}
                data-ad-slot={ADSENSE_SLOT}
                data-ad-format="auto"
                data-full-width-responsive="true" />
            ) : null
          )}
        </div>

        <style>{`
          @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
          @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
        `}</style>
      </>
    );
  }, [visible, ad, close, handleAdClick, native]);

  return { showAd, AdSheet };
}
