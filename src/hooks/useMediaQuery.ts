'use client';

import { useSyncExternalStore } from 'react';

/**
 * 뷰포트 미디어 쿼리 훅
 *
 * ★ hydration 안전:
 *   useSyncExternalStore의 getServerSnapshot이 SSR과 클라이언트 첫 렌더에서
 *   동일하게 false를 반환하므로, 서버가 그린 HTML과 클라이언트 첫 렌더가 일치한다.
 *   (이전 useState(window.matchMedia()) 방식은 서버=false, 데스크탑 클라이언트=true로
 *    갈려 Mobile/Desktop 레이아웃이 통째로 어긋나 React #418 hydration 오류 →
 *    전체 트리 재렌더로 화면이 밀리는 현상이 있었음)
 *   하이드레이션 직후 getSnapshot(실제 뷰포트)으로 한 번 동기화된다.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches, // 클라이언트 스냅샷
    () => false,                            // 서버 스냅샷 (SSR + 첫 하이드레이션)
  );
}

/** PC 뷰포트 (1024px 이상) 감지 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
