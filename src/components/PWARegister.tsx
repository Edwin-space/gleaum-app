'use client';

import { useEffect } from 'react';

/** PWA Service Worker 등록 + 스플래시 스크린 */
export function PWARegister() {
  useEffect(() => {
    // 1. Service Worker 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[SW] 등록 완료:', reg.scope);
        })
        .catch((err) => {
          console.warn('[SW] 등록 실패:', err);
        });
    }

    // 2. PWA 독립실행 모드에서 스플래시 인젝션
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

    if (!isStandalone) return;

    // 이미 존재하면 스킵
    if (document.getElementById('gleaum-splash')) return;

    const splash = document.createElement('div');
    splash.id = 'gleaum-splash';
    Object.assign(splash.style, {
      position:        'fixed',
      inset:           '0',
      zIndex:          '99999',
      background:      'linear-gradient(160deg, #0F1A2E 0%, #0a2240 50%, #091c36 100%)',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             '20px',
      transition:      'opacity 0.4s ease',
      opacity:         '1',
    });

    splash.innerHTML = `
      <div style="
        width: 88px; height: 88px;
        border-radius: 22px;
        background: linear-gradient(135deg, #2EE895 0%, #0CC9B5 50%, #0084CC 100%);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 16px 48px rgba(12,201,181,0.45);
        animation: splashPulse 1.6s ease-in-out infinite;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
          <line x1="8" x2="13" y1="14" y2="14"/>
          <line x1="8" x2="11" y1="18" y2="18"/>
        </svg>
      </div>
      <div style="text-align: center;">
        <p style="font-size: 26px; font-weight: 800; color: white; letter-spacing: -0.5px; font-family: 'Outfit', sans-serif;">글리움</p>
        <p style="font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 4px; letter-spacing: 0.5px;">나의 일상 네트워크</p>
      </div>
      <style>
        @keyframes splashPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 16px 48px rgba(12,201,181,0.45); }
          50% { transform: scale(1.04); box-shadow: 0 20px 60px rgba(12,201,181,0.60); }
        }
      </style>
    `;

    document.body.prepend(splash);

    // 0.9초 후 페이드아웃
    const timer = setTimeout(() => {
      splash.style.opacity = '0';
      // 트랜지션 후 제거
      setTimeout(() => splash.remove(), 450);
    }, 900);

    return () => {
      clearTimeout(timer);
      document.getElementById('gleaum-splash')?.remove();
    };
  }, []);

  return null;
}
