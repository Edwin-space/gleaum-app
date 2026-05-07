'use client';

import { useState, useEffect } from 'react';

/**
 * 뷰포트 미디어 쿼리 훅
 * SSR 안전: typeof window 체크로 초기값을 실제 뷰포트 기준으로 설정
 * → 모바일에서 hydration 후 불필요한 재렌더 방지
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    // 초기값 동기화 (혹시 useState 초기화 시점과 effect 시점 사이에 변경된 경우)
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
