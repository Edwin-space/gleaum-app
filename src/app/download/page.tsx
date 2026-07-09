'use client';

/**
 * /download — 앱 다운로드 랜딩 페이지
 *
 * 동작 방식:
 *  1. 마운트 즉시 User-Agent로 OS 감지
 *  2. Android → Google Play, iOS → App Store 자동 딥링크
 *  3. 자동 이동 전 "이동 중" 스피너 500ms 노출 (사용자 인지)
 *  4. 데스크톱 / 미감지 → 수동 선택 UI 표시
 *
 * 스토어 URL:
 *  Android  https://play.google.com/store/apps/details?id=com.gleaum.app
 *  iOS      App Store 등록 후 추가 예정
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GleaumAppIcon, GleaumBI } from '@/components/ui/GleaumLogo';

const PLAY_STORE_URL  = 'https://play.google.com/store/apps/details?id=com.gleaum.app';
const APP_STORE_URL   = null; // App Store 등록 후 URL 교체
const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: '글리움',
  alternateName: 'Gleaum',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Android',
  url: 'https://gleaum.com/download',
  downloadUrl: PLAY_STORE_URL,
  installUrl: PLAY_STORE_URL,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
    url: PLAY_STORE_URL,
  },
  description: 'Google Play에서 글리움 Android 앱을 설치하고 일정, 공간, 가계부를 한 곳에서 관리하세요.',
  inLanguage: 'ko-KR',
};

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/android/i.test(ua))              return 'android';
  if (/iPad|iPhone|iPod/i.test(ua))     return 'ios';
  if (/Macintosh|Windows|Linux/i.test(ua)) return 'desktop';
  return 'unknown';
}

export default function DownloadPage() {
  const [platform,     setPlatform]     = useState<Platform>('unknown');
  const [redirecting,  setRedirecting]  = useState(false);
  const [countdown,    setCountdown]    = useState(3);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    // 모바일이고 스토어 URL이 있으면 자동 이동 (3초 카운트다운)
    const storeUrl = p === 'android' ? PLAY_STORE_URL : p === 'ios' ? APP_STORE_URL : null;
    if (!storeUrl) return;

    setRedirecting(true);
    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        window.location.href = storeUrl;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const storeUrl = platform === 'android'
    ? PLAY_STORE_URL
    : platform === 'ios'
    ? APP_STORE_URL
    : null;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0F1A2E 0%, #1A1B2E 50%, #0F2A3E 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center',
      padding: 'calc(env(safe-area-inset-top) + 32px) 24px calc(env(safe-area-inset-bottom) + 32px)',
      position: 'relative', overflow: 'hidden',
    }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      {/* 배경 글로우 */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,132,204,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(12,201,181,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>

        {/* 앱 아이콘 */}
        <div style={{
          width: '100px', height: '100px', borderRadius: '28px',
          background: 'linear-gradient(135deg, #0084CC 0%, #0CC9B5 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 20px 60px rgba(0,132,204,0.45)',
          marginBottom: '24px',
        }}>
          <GleaumAppIcon size={64} />
        </div>

        {/* 브랜드 */}
        <GleaumBI variant="white" width={120} />
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', margin: '8px 0 32px', letterSpacing: '0.3px' }}>
          일상을 연결하는 네트워크
        </p>

        {/* ── 자동 이동 중 상태 ── */}
        {redirecting && storeUrl && (
          <div style={{
            width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.10)', padding: '28px 24px',
            textAlign: 'center', marginBottom: '20px', backdropFilter: 'blur(12px)',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              border: '3px solid rgba(0,132,204,0.3)', borderTopColor: '#0084CC',
              animation: 'spin 0.9s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ fontSize: '16px', fontWeight: 800, color: 'white', margin: '0 0 6px' }}>
              {platform === 'android' ? 'Google Play로 이동 중' : 'App Store로 이동 중'}
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px' }}>
              {countdown}초 후 자동 이동합니다
            </p>
            <a
              href={storeUrl}
              style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #0CC9B5, #0084CC)',
                color: 'white', fontSize: '13px', fontWeight: 800, textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(0,132,204,0.35)',
              }}
            >
              지금 바로 이동 →
            </a>
          </div>
        )}

        {/* ── 수동 선택 UI (데스크톱 or 자동이동 없음) ── */}
        {!redirecting && (
          <>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.70)', margin: '0 0 20px', textAlign: 'center', lineHeight: 1.6 }}>
              글리움 앱을 설치하고<br/>
              <span style={{ color: '#0CC9B5', fontWeight: 800 }}>소중한 사람들과 연결</span>하세요
            </p>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>

              {/* Android */}
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '18px 22px', borderRadius: '20px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  textDecoration: 'none', backdropFilter: 'blur(12px)',
                  transition: 'background 0.2s',
                }}
              >
                {/* Google Play 아이콘 */}
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M6 3.5L20.5 18L6 32.5V3.5Z" fill="#00C853"/>
                  <path d="M6 3.5L25.5 13L20.5 18L6 3.5Z" fill="#FFD600"/>
                  <path d="M6 32.5L20.5 18L25.5 23L6 32.5Z" fill="#F44336"/>
                  <path d="M25.5 13L30 15.5C31.4 16.3 31.4 19.7 30 20.5L25.5 23L20.5 18L25.5 13Z" fill="#448AFF"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', margin: '0 0 2px', letterSpacing: '0.3px' }}>Google Play에서 다운로드</p>
                  <p style={{ fontSize: '17px', fontWeight: 800, color: 'white', margin: 0 }}>Android</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </a>

              {/* iOS */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '18px 22px', borderRadius: '20px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.5px solid rgba(255,255,255,0.07)',
                  opacity: 0.6, cursor: 'not-allowed',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Apple 아이콘 */}
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path d="M24 8C22.4 9.6 20 10.4 18 10.2 17.6 7.8 19.6 5.4 21.2 4 22.8 2.4 25.2 1.8 27 2 27.4 4.6 25.6 6.4 24 8Z" fill="white"/>
                  <path d="M27 13C24.8 11.6 22 11.8 20 13 18 14.2 16.4 16.4 16.4 19.2 16.4 24.4 19.8 30 23 32 24.6 33 26.4 33 28 32 29 31.4 30.2 31 31.4 31.2 30 29.6 28.2 28.6 28.2 26.2 28.2 23.6 29.8 22.4 31.2 21 31.8 19.4 31 17.6 29.4 14 27.6 11.4 27 13Z" fill="white"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', margin: '0 0 2px', letterSpacing: '0.3px' }}>App Store에서 다운로드</p>
                  <p style={{ fontSize: '17px', fontWeight: 800, color: 'rgba(255,255,255,0.50)', margin: 0 }}>iPhone · iPad</p>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: '999px',
                  fontSize: '10px', fontWeight: 800,
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)',
                  whiteSpace: 'nowrap',
                }}>준비 중</span>
              </div>
            </div>
          </>
        )}

        {/* iOS 자동이동 중 + 아직 없을 때 대체 안내 */}
        {redirecting && platform === 'ios' && !APP_STORE_URL && (
          <div style={{
            width: '100%', padding: '18px 20px', borderRadius: '18px',
            background: 'rgba(255,149,0,0.10)', border: '1px solid rgba(255,149,0,0.20)',
            textAlign: 'center', marginBottom: '20px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,200,100,0.90)', margin: 0, lineHeight: 1.6 }}>
              iOS 앱은 현재 준비 중이에요.<br/>곧 App Store에서 만나요!
            </p>
          </div>
        )}

        {/* 앱 특징 */}
        <div style={{
          width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px', marginBottom: '28px',
        }}>
          {[
            { emoji: '📅', label: '일정 관리' },
            { emoji: '💰', label: '자금 관리' },
            { emoji: '🔋', label: '루틴 관리' },
          ].map(f => (
            <div key={f.label} style={{
              padding: '14px 8px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '22px', display: 'block', marginBottom: '6px' }}>{f.emoji}</span>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{f.label}</p>
            </div>
          ))}
        </div>

        {/* 이미 앱 있으면 홈으로 */}
        <Link
          href="/home"
          style={{
            fontSize: '13px', fontWeight: 700,
            color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none',
          }}
        >
          이미 앱이 있으신가요? → 바로 시작하기
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
