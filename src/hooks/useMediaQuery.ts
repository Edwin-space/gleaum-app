'use client';

import { useState, useEffect } from 'react';

/**
 * 뷰포트 미디어 쿼리 훅
 * SSR 안전: 초기값 false → 클라이언트 마운트 후 실제 값 반영
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** PC 뷰포트 (1024px 이상) 감지 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
