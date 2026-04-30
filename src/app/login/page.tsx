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
    <div className="min-h-dvh flex flex-col overflow-hidden relative">
      {/* 프리미엄 메쉬 배경 */}
      <div className="mesh-bg">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 relative z-10 w-full max-w-[430px] mx-auto">
        
        {/* 앱 아이콘 (Glow 효과 추가) */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-[#0084CC] blur-[32px] opacity-20 rounded-full" />
          <div className="relative glass-card rounded-[32px] p-1.5 shadow-2xl">
            <GleaumAppIcon size={96} radius={28} />
          </div>
        </div>

        {/* 타이틀 및 슬로건 */}
        <div className="text-center mb-12">
          <h1 className="text-[40px] font-bold tracking-tight mb-3" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
            gleaum
          </h1>
          <p className="text-[17px] leading-relaxed font-medium" style={{ color: 'var(--color-ink-muted-48)', fontFamily: 'var(--font-body)', letterSpacing: '-0.3px' }}>
            나, 그리고 연인/가족의<br />일상 네트워크
          </p>
        </div>

        {/* 초대 배너 (next 파라미터가 있을 때만 표시) */}
        {next && next.startsWith('/invite/') && (
          <div className="w-full flex items-center gap-4 px-5 py-4 rounded-[24px] mb-8 glass-card animate-fade-in-up">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: 'var(--color-ink)' }}>가족 초대장 도착</p>
              <p className="text-[13px]" style={{ color: 'var(--color-ink-muted-80)' }}>로그인 후 즉시 합류됩니다</p>
            </div>
          </div>
        )}

        {/* 프리미엄 기능 소개 카드 */}
        <div className="w-full space-y-3 mb-8">
          {[
            { 
              icon: <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" />, 
              text: '모든 일정 한눈에 관리', 
              color: 'var(--brand-blue)' 
            },
            { 
              icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>, 
              text: '실시간 일정 완료 확인', 
              color: 'var(--brand-teal)' 
            },
            { 
              icon: <><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></>, 
              text: '정기지출 자동 리포트', 
              color: 'var(--brand-green)' 
            },
          ].map((item, idx) => (
            <div
              key={item.text}
              className="glass-card flex items-center gap-4 px-5 py-4 rounded-[20px] animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {item.icon}
              </svg>
              <span className="text-[15px] font-semibold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.2px' }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 액션 영역 */}
      <div className="px-6 pb-12 pt-4 relative z-10 w-full max-w-[430px] mx-auto animate-slide-up">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 h-[64px] rounded-[24px] font-bold text-[16px] transition-all active:scale-[0.98] disabled:opacity-70"
          style={{
            background: 'var(--color-ink)',
            color: 'white',
            boxShadow: '0 12px 32px rgba(26,27,46,0.25)',
          }}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,255,255,0.5)', borderTopColor: 'transparent' }} />
              연결 중...
            </>
          ) : (
            <>
              {/* Google G 로고 (화이트 배경 컨테이너) */}
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-1">
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              </div>
              구글 계정으로 시작하기
            </>
          )}
        </button>

        <p className="text-center mt-6 text-[12px] font-medium" style={{ color: 'var(--color-ink-muted-48)' }}>
          계속 진행하면 글리움의 서비스 약관에 동의하게 됩니다.<br/>
          권한은 언제든지 마이페이지에서 변경할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#FAFAFD' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(0,132,204,0.3)', borderTopColor: '#0084CC' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
