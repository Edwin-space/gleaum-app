'use client';

import { useEffect, useState } from 'react';

// BeforeInstallPromptEvent 타입 (브라우저 표준에 미포함)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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

export function PWAInstallBanner() {
  const [platform, setPlatform]         = useState<Platform>('other');
  const [showBanner, setShowBanner]     = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling]     = useState(false);

  useEffect(() => {
    // 이미 설치됐거나, 닫았으면 표시 안 함
    if (isInStandaloneMode()) return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const plat = detectPlatform();
    setPlatform(plat);

    if (plat === 'ios') {
      // iOS: 항상 수동 안내 배너 표시 (1초 딜레이)
      setTimeout(() => setShowBanner(true), 1500);
    } else if (plat === 'android') {
      // Android: beforeinstallprompt 이벤트 캡처
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setShowBanner(true), 1000);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* 배경 딤 */}
      <div
        className="fixed inset-0 z-[60] bg-black/20"
        onClick={handleDismiss}
      />

      {/* 배너 — 하단 슬라이드업 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] flex justify-center px-4 pb-6"
        style={{ animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div
          className="w-full max-w-[430px] rounded-[28px] p-5 overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 -4px 40px rgba(0,132,204,0.18), 0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.9)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* 앱 아이콘 */}
              <div
                className="w-12 h-12 rounded-[14px] overflow-hidden flex-shrink-0"
                style={{ boxShadow: '0 4px 12px rgba(0,132,204,0.25)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-192.png" alt="글리움" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[16px] font-bold" style={{ color: '#1A1B2E' }}>
                  글리움 앱 설치
                </p>
                <p className="text-[12px]" style={{ color: '#8E8E93' }}>
                  gleaum-app.vercel.app
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#F0F0F0' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* iOS 안내 */}
          {platform === 'ios' && (
            <div>
              <p className="text-[14px] font-semibold mb-3" style={{ color: '#1A1B2E' }}>
                홈 화면에 추가하면 앱처럼 사용할 수 있어요
              </p>

              {/* 단계별 안내 */}
              <div className="space-y-3 mb-5">
                {[
                  {
                    step: '1',
                    text: '하단의 공유 버튼을 탭하세요',
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2" strokeLinecap="round">
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2" strokeLinecap="round">
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
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                      style={{ background: 'rgba(0,132,204,0.10)', color: '#0084CC' }}
                    >
                      {step}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <p className="text-[13px] font-medium" style={{ color: '#3C3C43' }}>{text}</p>
                      {icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* 아래 화살표 */}
              <div className="flex justify-center">
                <div
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold"
                  style={{ background: 'rgba(0,132,204,0.08)', color: '#0084CC' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Safari 하단 공유 버튼을 눌러주세요
                </div>
              </div>
            </div>
          )}

          {/* Android 설치 버튼 */}
          {platform === 'android' && (
            <div>
              <p className="text-[14px] font-medium mb-4" style={{ color: '#3C3C43' }}>
                앱처럼 빠르게 실행하고 오프라인에서도 사용할 수 있어요.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 h-[48px] rounded-[14px] text-[14px] font-semibold"
                  style={{ border: '1.5px solid rgba(0,132,204,0.15)', color: '#8E8E93' }}
                >
                  나중에
                </button>
                <button
                  onClick={handleInstallAndroid}
                  disabled={installing}
                  className="flex-[2] h-[48px] rounded-[14px] text-[14px] font-bold text-white disabled:opacity-70 active:scale-95 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                    boxShadow: '0 6px 20px rgba(0,132,204,0.35)',
                  }}
                >
                  {installing ? '설치 중...' : '홈 화면에 추가'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
