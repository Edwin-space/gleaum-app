'use client';

import { useState } from 'react';
import { GleaumLogo, GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signInWithGoogle();
    // Supabase가 Google OAuth 페이지로 리다이렉트하므로
    // 이후 /auth/callback → /home 으로 자동 이동
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--brand-black)' }}>

      {/* 배경 그라디언트 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(46,232,149,0.15) 0%, transparent 70%)',
        }}
      />

      {/* 상단 로고 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-20 pb-10 relative z-10">
        <GleaumAppIcon size={96} className="mb-8 shadow-2xl" />
        <GleaumLogo variant="dark" size="xl" className="mb-3" />
        <p
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '15px',
            color: 'var(--color-body-muted)',
            fontWeight: 300,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          가족의 모든 일정을<br />한 곳에서 관리하세요
        </p>

        {/* 기능 소개 */}
        <div className="mt-12 w-full space-y-3">
          {[
            { icon: '📅', text: '공유·개인·자녀 일정 한눈에 관리' },
            { icon: '✅', text: '아이들 일정 완료 여부 실시간 확인' },
            { icon: '💰', text: '정기지출 가계부 자동 정리' },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <span className="text-xl">{item.icon}</span>
              <span
                style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.75)',
                  fontWeight: 400,
                }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 로그인 버튼 */}
      <div
        className="px-6 pb-12 pt-6 relative z-10"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* 권한 안내 */}
        <p
          className="text-center mb-5"
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '12px',
            color: 'var(--color-ink-muted-48)',
            lineHeight: 1.6,
          }}
        >
          구글 계정으로 로그인 시 캘린더·드라이브 접근 권한이 요청됩니다
        </p>

        {/* 구글 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl font-semibold text-[16px] active:scale-[0.97] transition-transform"
          style={{
            background: 'white',
            color: 'var(--brand-navy)',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          {/* Google G 로고 */}
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loading ? '연결 중...' : '구글 계정으로 시작하기'}
        </button>

        <p
          className="text-center mt-4"
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '11px',
            color: 'rgba(110,110,102,0.6)',
          }}
        >
          권한은 언제든지 마이페이지에서 변경할 수 있습니다
        </p>
      </div>
    </div>
  );
}
