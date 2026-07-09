'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

type Platform = 'ios' | 'android' | 'other';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

const DISMISSED_KEY = 'gleaum_pwa_banner_dismissed';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gleaum.app';

export function PWAInstallBanner() {
  const [platform, setPlatform]     = useState<Platform>('other');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 네이티브 앱(Capacitor)에서는 PWA 설치 배너 완전 비활성
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.isNativePlatform?.()) return;

    if (isInStandaloneMode()) return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const plat = detectPlatform();
    setPlatform(plat);

    if (plat === 'ios' || plat === 'android') {
      setTimeout(() => {
        setShowBanner(true);
        void trackEvent('pwa_banner_show', { platform: plat });
      }, 1500);
    }
  }, []);

  const handleDismiss = () => {
    if (platform === 'ios' || platform === 'android') {
      void trackEvent('pwa_install_dismiss', { platform });
    }
    setShowBanner(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  const handleOpenPlayStore = () => {
    void trackEvent('navigation_click', { destination: 'google_play_install_banner' });
    window.location.href = PLAY_STORE_URL;
  };

  if (!showBanner) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Backdrop dim */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          background: 'rgba(0,0,0,0.40)',
        }}
        onClick={handleDismiss}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 70,
          display: 'flex',
          justifyContent: 'center',
          animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '430px',
            background: 'var(--theme-surface)',
            borderRadius: '32px 32px 0 0',
            overflow: 'hidden',
            boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dark gradient preview header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
              padding: '28px 24px 24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative glow blobs */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,132,204,0.40) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '10%',
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(12,201,181,0.30) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Large app icon */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.30)',
                    border: '2px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/icon-192.png" alt="글리움" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <p style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: 'rgba(12,201,181,0.85)',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}>
                    PREMIUM APP
                  </p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.3px' }}>
                    글리움
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.50)', margin: '2px 0 0' }}>
                    가족 일정 관리 앱
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.70)" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Content area */}
          <div style={{ padding: '24px 24px 32px' }}>

            {/* iOS instructions */}
            {platform === 'ios' && (
              <div>
                <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 6px', letterSpacing: '-0.2px' }}>
                  홈 화면에 추가하세요
                </p>
                <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
                  앱처럼 빠르게 실행하고 오프라인에서도 사용할 수 있어요
                </p>

                {/* Numbered steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {[
                    {
                      step: '1',
                      text: '하단의 공유 버튼을 탭하세요',
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                          <polyline points="16 6 12 2 8 6"/>
                          <line x1="12" y1="2" x2="12" y2="15"/>
                        </svg>
                      ),
                    },
                    {
                      step: '2',
                      text: '아래로 스크롤하여 "홈 화면에 추가" 탭',
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      ),
                    },
                    {
                      step: '3',
                      text: '"추가"를 눌러 설치 완료',
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2EE895" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ),
                    },
                  ].map(({ step, text, icon }) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#0084CC',
                          background: 'rgba(0,132,204,0.10)',
                          border: '1.5px solid rgba(0,132,204,0.18)',
                        }}
                      >
                        {step}
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--theme-text)', margin: 0 }}>{text}</p>
                        <div style={{ flexShrink: 0, marginLeft: '8px' }}>{icon}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Safari share hint */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 18px',
                      borderRadius: '999px',
                      background: 'rgba(0,132,204,0.08)',
                      border: '1px solid rgba(0,132,204,0.15)',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0084CC',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                      <polyline points="16 6 12 2 8 6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                    Safari 하단 공유 버튼을 눌러주세요 ↓
                  </div>
                </div>
              </div>
            )}

            {/* Android install button */}
            {platform === 'android' && (
              <div>
                <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 6px', letterSpacing: '-0.2px' }}>
                  Google Play 앱으로 더 안정적으로 사용하세요
                </p>
                <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
                  Android 단말에서는 공식 앱을 설치하면 네이티브 로그인, 알림, 캘린더 연동을 더 안정적으로 사용할 수 있어요.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleDismiss}
                    style={{
                      flex: 1,
                      height: '52px',
                      borderRadius: '16px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--theme-text-subtle)',
                      background: 'var(--theme-surface-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    웹으로 계속
                  </button>
                  <button
                    onClick={handleOpenPlayStore}
                    style={{
                      flex: 2,
                      height: '52px',
                      borderRadius: '16px',
                      fontSize: '15px',
                      fontWeight: 800,
                      color: 'white',
                      background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(0,132,204,0.35)',
                      transition: 'opacity 0.15s, transform 0.15s',
                      letterSpacing: '-0.2px',
                    }}
                    onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                    onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    Google Play에서 설치
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
