'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { useAuth } from '@/hooks/useAuth';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { DesktopLanding } from '@/components/landing/DesktopLanding';

function MobileLogin() {
  const { signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? undefined;
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signInWithGoogle(next);
  };

  return (
    <div className="min-h-dvh flex flex-col overflow-hidden relative" style={{ background: 'var(--color-canvas-parchment)' }}>
      {/* 프리미엄 메쉬 배경 (v4 최적화) */}
      <div className="mesh-bg">
        <div className="mesh-blob mesh-blob-1" style={{ opacity: 0.4 }} />
        <div className="mesh-blob mesh-blob-2" style={{ opacity: 0.3 }} />
        <div className="mesh-blob mesh-blob-3" style={{ opacity: 0.3 }} />
      </div>

      <div className="flex-1 flex flex-col px-7 pt-12 pb-8 relative z-10 w-full max-w-[430px] mx-auto">
        
        {/* 상단 로고 & 타이틀 */}
        <div className="flex items-center gap-2 mb-10 animate-fade-in">
          <GleaumAppIcon size={32} radius={10} />
          <span className="text-[20px] font-bold tracking-tight text-[#1A1B2E]" style={{ fontFamily: 'var(--font-display)' }}>gleaum</span>
        </div>

        {/* 히어로 슬로건 */}
        <div className="mb-14 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-[42px] font-extrabold leading-[1.15] tracking-tight mb-4 text-[#1A1B2E]" style={{ fontFamily: 'var(--font-display)' }}>
            일상을 함께<br />
            <span className="text-brand-gradient">빛나게.</span>
          </h1>
          <p className="text-[16px] leading-relaxed text-[#8E8E93] font-medium max-w-[260px]">
            개인부터 가족까지, 모든 관계의<br />일상을 스마트하게 연결하세요.
          </p>
        </div>

        {/* ── 프리미엄 피처 쇼케이스 (Floating Cards Layout) ── */}
        <div className="relative h-[280px] mb-12">
          
          {/* 카드 1: 스마트 일정 (상단 왼쪽) */}
          <div className="absolute top-0 left-0 w-[180px] glass-card p-4 rounded-[24px] shadow-2xl animate-floating z-20" style={{ animationDelay: '0s' }}>
            <div className="w-9 h-9 rounded-[12px] bg-[#0084CC]/10 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.5" strokeLinecap="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <p className="text-[13px] font-bold text-[#1A1B2E] mb-1">스마트 일정 관리</p>
            <p className="text-[11px] text-[#8E8E93] leading-tight">자동 리마인더와 상태 추적</p>
          </div>

          {/* 카드 2: Space 공유 (중앙 오른쪽) */}
          <div className="absolute top-[60px] right-0 w-[190px] glass-card p-4 rounded-[24px] shadow-2xl animate-floating z-30" style={{ animationDelay: '-1.5s', animationDuration: '4.5s' }}>
            <div className="w-9 h-9 rounded-[12px] bg-[#0CC9B5]/10 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0CC9B5" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <p className="text-[13px] font-bold text-[#1A1B2E] mb-1">프라이빗 Space</p>
            <p className="text-[11px] text-[#8E8E93] leading-tight">연인, 가족과 함께 기록하기</p>
          </div>

          {/* 카드 3: 자금 관리 (하단 왼쪽) */}
          <div className="absolute bottom-0 left-[20px] w-[170px] glass-card p-4 rounded-[24px] shadow-2xl animate-floating z-10" style={{ animationDelay: '-3s', animationDuration: '5s' }}>
            <div className="w-9 h-9 rounded-[12px] bg-[#2EE895]/10 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2EE895" strokeWidth="2.5" strokeLinecap="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </div>
            <p className="text-[13px] font-bold text-[#1A1B2E] mb-1">자금 흐름 추적</p>
            <p className="text-[11px] text-[#8E8E93] leading-tight">놓치는 결제 없는 자동화</p>
          </div>
        </div>

        {/* ── 사용자 후기 미니 섹션 ── */}
        <div className="mt-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-start gap-3 p-4 rounded-[22px] bg-white/40 border border-white/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-[#0084CC]/10 flex items-center justify-center text-xl flex-shrink-0">
              👩‍👧‍👦
            </div>
            <div>
              <p className="text-[13px] leading-[1.6] text-[#8E8E93] font-medium italic">
                "아이들 학원 일정부터 정기지출까지 한눈에 보여서 정말 편해요."
              </p>
              <p className="text-[11px] font-bold text-[#1A1B2E] mt-1.5">— 김지수, 워킹맘</p>
            </div>
          </div>
        </div>

      </div>

      {/* ── 하단 액션 버튼 ── */}
      <div className="px-7 pb-12 pt-6 relative z-10 w-full max-w-[430px] mx-auto">
        <div className="animate-slide-up">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-[68px] rounded-[26px] font-bold text-[17px] transition-all active:scale-[0.98] disabled:opacity-70 group overflow-hidden relative"
            style={{
              background: 'var(--color-ink)',
              color: 'white',
              boxShadow: '0 16px 32px rgba(26,27,46,0.3)',
            }}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'white' }} />
                <span>글리움 연결 중...</span>
              </div>
            ) : (
              <>
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </div>
                구글 계정으로 시작하기
              </>
            )}
            {/* 호버/액티브 시 빛나는 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-active:animate-[shimmer_1s_infinite]" />
          </button>

          <div className="flex flex-col items-center mt-7 gap-1">
            <p className="text-[12px] font-semibold text-[#1A1B2E]/60 tracking-tight">
              무료로 시작 · 구글 계정으로 간편 가입
            </p>
            <p className="text-[10px] text-[#8E8E93]/60">
              계속 진행하면 글리움의 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginContent() {
  const isDesktop = useIsDesktop();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? undefined;

  if (isDesktop) {
    return <DesktopLanding next={next} />;
  }

  return <MobileLogin />;
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
