'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Gleaum Error]', error);
  }, [error]);

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 gap-6"
      style={{ background: 'transparent' }}
    >
      {/* 에러 아이콘 */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.08)' }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <div className="text-center">
        <h1 className="text-[22px] font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
          오류가 발생했어요
        </h1>
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-ink-muted-80)' }}>
          일시적인 문제가 발생했습니다.<br/>잠시 후 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="mt-2 text-[11px] font-mono" style={{ color: '#C7C7CC' }}>
            오류 코드: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        <button
          onClick={reset}
          className="w-full h-[52px] rounded-[16px] text-[15px] font-bold text-white active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
            boxShadow: '0 8px 24px rgba(0,132,204,0.30)',
          }}
        >
          다시 시도
        </button>
        <Link
          href="/home"
          className="w-full h-[52px] rounded-[16px] text-[15px] font-semibold flex items-center justify-center active:scale-95 transition-all"
          style={{ border: '2px solid rgba(0,132,204,0.15)', color: 'var(--color-ink-muted-80)' }}
        >
          홈으로 이동
        </Link>
      </div>
    </div>
  );
}
