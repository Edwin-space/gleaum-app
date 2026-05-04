'use client';

import { useEffect } from 'react';

/** PWA Service Worker 등록 컴포넌트 */
export function PWARegister() {
  useEffect(() => {
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
  }, []);

  return null;
}
