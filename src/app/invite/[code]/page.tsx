'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { joinSpaceByCode } from '@/lib/db';

type PageState = 'loading' | 'joining' | 'success' | 'already_member' | 'invalid_code' | 'error';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = typeof params.code === 'string' ? params.code.toUpperCase() : '';
  const { user, spaceId, loading: userLoading } = useCurrentUser();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [spaceName, setSpaceName] = useState<string>('');

  useEffect(() => {
    // 유저 로딩 중이면 대기
    if (userLoading) return;

    // 비로그인 → 로그인 페이지로 (next 파라미터로 현재 경로 전달)
    if (!user) {
      router.replace(`/login?next=/invite/${code}`);
      return;
    }

    // 로그인 상태 → 자동으로 합류 시도
    const doJoin = async () => {
      setPageState('joining');

      const result = await joinSpaceByCode(code);

      if (result.alreadyMember) {
        setSpaceName(result.spaceName ?? '');
        setPageState('already_member');
      } else if (result.success) {
        setSpaceName(result.spaceName ?? '');
        setPageState('success');
        // 2초 후 /space(공간관리)로 이동
        setTimeout(() => router.replace('/space'), 2000);
      } else {
        setPageState('invalid_code');
      }
    };

    doJoin();
  }, [user, userLoading, code, router]);

  // ── 로딩 / 합류 중 ──
  if (pageState === 'loading' || pageState === 'joining') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6"
        style={{ background: '#FAFAFD' }}
      >
        <div style={{
          position: 'fixed', top: '-80px', left: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'fixed', bottom: '-40px', right: '-40px',
          width: '420px', height: '420px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,153,255,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div
          className="w-20 h-20 rounded-[24px] flex items-center justify-center mb-6"
          style={{ background: '#0084CC', boxShadow: '0 12px 40px rgba(0,132,204,0.35)' }}
        >
          <span className="text-4xl">🏠</span>
        </div>

        <div
          className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin mb-4"
          style={{ borderColor: 'rgba(0,132,204,0.2)', borderTopColor: '#0084CC' }}
        />

        <p className="text-[16px] font-bold" style={{ color: '#1A1B2E' }}>
          {pageState === 'joining' ? '공간에 합류하는 중...' : '확인 중...'}
        </p>
        <p className="text-[13px] mt-2" style={{ color: '#8E8E93' }}>잠시만 기다려주세요</p>
      </div>
    );
  }

  // ── 성공 ──
  if (pageState === 'success') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#FAFAFD' }}
      >
        <div style={{
          position: 'fixed', top: '-80px', left: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'fixed', bottom: '-40px', right: '-40px',
          width: '420px', height: '420px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,153,255,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(16,185,129,0.12)' }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="rgba(16,185,129,0.15)"/>
            <path d="M14 24L21 31L34 17" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="text-[28px] font-bold mb-2" style={{ color: '#1A1B2E' }}>
          합류 완료!
        </h1>
        {spaceName && (
          <p className="text-[17px] font-semibold mb-1" style={{ color: '#0084CC' }}>
            {spaceName}
          </p>
        )}
        <p className="text-[15px]" style={{ color: '#8E8E93' }}>
          이제 새로운 공간의 멤버입니다 🎉
        </p>

        <p className="text-[13px] mt-8" style={{ color: '#C7C7CC' }}>
          잠시 후 관리 페이지로 이동합니다...
        </p>
      </div>
    );
  }

  // ── 이미 멤버 ──
  if (pageState === 'already_member') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#FAFAFD' }}
      >
        <div style={{
          position: 'fixed', top: '-80px', left: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(0,132,204,0.10)' }}
        >
          <span className="text-5xl">🏠</span>
        </div>

        <h1 className="text-[28px] font-bold mb-2" style={{ color: '#1A1B2E' }}>
          이미 멤버예요
        </h1>
        {spaceName && (
          <p className="text-[16px] font-semibold mb-1" style={{ color: '#0084CC' }}>
            {spaceName}
          </p>
        )}
        <p className="text-[14px] mt-2" style={{ color: '#8E8E93' }}>
          이미 이 공간에 속해 있습니다
        </p>

        <button
          onClick={() => router.replace('/space')}
          className="mt-10 w-full h-[56px] rounded-[20px] font-bold text-[16px] text-white transition-transform active:scale-[0.97]"
          style={{ background: '#0084CC', boxShadow: '0 8px 24px rgba(0,132,204,0.35)' }}
        >
          공간 관리로 이동
        </button>
      </div>
    );
  }

  // ── 유효하지 않은 코드 ──
  if (pageState === 'invalid_code') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#FAFAFD' }}
      >
        <div style={{
          position: 'fixed', top: '-80px', left: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(239,68,68,0.10)' }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="rgba(239,68,68,0.12)"/>
            <path d="M17 17L31 31M31 17L17 31" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="text-[28px] font-bold mb-2" style={{ color: '#1A1B2E' }}>
          유효하지 않은 초대 코드
        </h1>
        <p className="text-[14px] mt-2" style={{ color: '#8E8E93' }}>
          초대 링크가 만료되었거나 올바르지 않습니다.<br />
          새로운 링크를 요청해 주세요.
        </p>

        <div
          className="mt-6 px-6 py-3 rounded-[16px]"
          style={{ background: 'rgba(239,68,68,0.06)' }}
        >
          <p className="text-[12px]" style={{ color: '#C7C7CC' }}>입력된 코드</p>
          <p className="text-[15px] font-mono font-bold mt-1" style={{ color: '#EF4444' }}>
            {code}
          </p>
        </div>

        <button
          onClick={() => router.replace('/home')}
          className="mt-10 w-full h-[56px] rounded-[20px] font-bold text-[16px] text-white transition-transform active:scale-[0.97]"
          style={{ background: '#0084CC', boxShadow: '0 8px 24px rgba(0,132,204,0.35)' }}
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  // ── 에러 (fallback) ──
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#FAFAFD' }}
    >
      <p className="text-[16px] font-bold" style={{ color: '#1A1B2E' }}>오류가 발생했습니다</p>
      <button
        onClick={() => router.replace('/home')}
        className="mt-6 px-8 py-3 rounded-[16px] font-bold text-white"
        style={{ background: '#0084CC' }}
      >
        홈으로
      </button>
    </div>
  );
}
