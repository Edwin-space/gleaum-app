'use client';

import { useState, useEffect } from 'react';

/**
 * 시간대(아침/오후/저녁) 인사말 — hydration 안전.
 *
 * 서버는 UTC, 클라이언트는 사용자 로컬(예: KST)이라 getHours() 결과가 갈려
 * SSR HTML과 클라이언트 첫 렌더의 인사말 텍스트가 어긋나면 React #418
 * (hydration 불일치)이 발생한다. 빈 문자열로 초기화해 SSR/첫 렌더를 일치시키고,
 * 마운트 직후 실제 로컬 시각으로 인사말을 채운다.
 */
export function useTimeGreeting(): string {
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? '좋은 아침이에요' : h < 18 ? '좋은 오후예요' : '좋은 저녁이에요');
  }, []);
  return greeting;
}
