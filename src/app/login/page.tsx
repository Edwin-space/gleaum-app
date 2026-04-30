'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { useAuth } from '@/hooks/useAuth';

function LoginContent() {
  const { signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? undefined;
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signInWithGoogle(next);
  };

  return (
    <div
      className="min-h-dvh flex flex-col overflow-hidden relative"
      style={{ background: '#FAFAFD' }}
    >
      {/* 배경 블롭 */}
      <div style={{
        position: 'absolute', top: '-80px', left: '-80px',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '120px', right: '-140px',
        width: '480px', height: '480px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(153,240,255,0.40) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-40px', left: '-40px',
        width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,153,255,0.35) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* 상단 로고 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 relative z-10">

        {/* 앱 아이콘 */}
        <div
          className="w-24 h-24 rounded-[28px] flex items-center justify-center mb-8"
          style={{
            background: '#5A32FA',
            boxShadow: '0 16px 48px rgba(90,50,250,0.35)',
          }}
        >
          <GleaumAppIcon size={52} />
        </div>

        {/* 초대 배너 (next 파라미터가 있을 때만 표시) */}
        {next && next.startsWith('/invite/') && (
          <div
            className="w-full flex items-center gap-3 px-5 py-4 rounded-[20px] mb-6"
            style={{
              background: 'rgba(90,50,250,0.08)',
              border: '1.5px solid rgba(90,50,250,0.15)',
            }}
          >
            <span className="text-2xl">👨‍👩‍👧‍👦</span>
            <div>
              <p className="text-[13px] font-bold" style={{ color: '#5A32FA' }}>가족 초대 링크</p>
              <p className="text-[12px]" style={{ color: '#8E8E93' }}>로그인 후 자동으로 가족에 합류됩니다</p>
            </div>
          </div>
        )}

        {/* 서비스명 */}
        <h1
          className="text-[36px] font-bold tracking-tight mb-2"
          style={{ color: '#1A1B2E' }}
        >
          글리움
        </h1>
        <p
          className="text-[16px] text-center leading-relaxed mb-12"
          style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          가족의 모든 일정을<br />한 곳에서 관리하세요
        </p>

        {/* 기능 소개 카드 */}
        <div className="w-full space-y-3">
          {[
            { icon: '📅', text: '공유·개인·자녀 일정 한눈에 관리', color: 'rgba(90,50,250,0.08)' },
            { icon: '✅', text: '아이들 일정 완료 여부 실시간 확인', color: 'rgba(16,185,129,0.08)' },
            { icon: '💰', text: '정기지출 가계부 자동 정리',          color: 'rgba(245,158,11,0.08)' },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-4 px-5 py-4 rounded-[20px]"
              style={{
                background: item.color,
                boxShadow: '0 2px 12px rgba(90,50,250,0.04)',
              }}
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <span
                className="text-[14px] font-semibold"
                style={{ color: '#1A1B2E', fontFamily: "'Noto Sans KR', sans-serif" }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 로그인 버튼 */}
      <div className="px-6 pb-14 pt-6 relative z-10">
        {/* 안내 문구 */}
        <p
          className="text-center text-[12px] mb-5"
          style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}
        >
          구글 계정으로 로그인 시 캘린더·드라이브 접근 권한이 요청됩니다
        </p>

        {/* 구글 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 h-[60px] rounded-[20px] font-bold text-[16px] transition-transform active:scale-[0.97] disabled:opacity-70"
          style={{
            background: loading ? '#5A32FA' : 'white',
            color: loading ? 'white' : '#1A1B2E',
            boxShadow: '0 8px 30px rgba(90,50,250,0.12)',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          {loading ? (
            <>
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.5)', borderTopColor: 'transparent' }}
              />
              연결 중...
            </>
          ) : (
            <>
              {/* Google G 로고 */}
              <svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              구글 계정으로 시작하기
            </>
          )}
        </button>

        {/* 하단 보라 버튼 (강조) */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 h-[52px] rounded-[20px] font-bold text-[15px] text-white mt-3 transition-transform active:scale-[0.97] disabled:opacity-70"
          style={{
            background: '#5A32FA',
            boxShadow: '0 8px 24px rgba(90,50,250,0.35)',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          시작하기
        </button>

        <p
          className="text-center mt-4 text-[11px]"
          style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          권한은 언제든지 마이페이지에서 변경할 수 있습니다
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#FAFAFD' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(90,50,250,0.3)', borderTopColor: '#5A32FA' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
