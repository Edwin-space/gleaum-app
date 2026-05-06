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
    <div className="min-h-dvh flex flex-col overflow-hidden relative" style={{ background: '#F8FAFC' }}>
      {/* ── 프리미엄 심층 메쉬 배경 ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-20%] w-[120%] h-[60%] opacity-40 mix-blend-multiply filter blur-[100px] animate-floating" 
             style={{ background: 'radial-gradient(circle, rgba(46,232,149,0.3) 0%, rgba(12,201,181,0.1) 70%)', animationDuration: '10s' }} />
        <div className="absolute bottom-[10%] right-[-10%] w-[100%] h-[50%] opacity-30 mix-blend-multiply filter blur-[80px] animate-floating" 
             style={{ background: 'radial-gradient(circle, rgba(0,132,204,0.2) 0%, transparent 70%)', animationDuration: '12s', animationDelay: '-2s' }} />
      </div>

      <div className="flex-1 flex flex-col relative z-10 w-full max-w-[430px] mx-auto px-7 pt-14 pb-10">
        
        {/* ── 헤더: 브랜드 아이덴티티 ── */}
        <header className="flex flex-col items-start gap-5 mb-12 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-blue/20 blur-xl rounded-full" />
            <GleaumAppIcon size={44} radius={12} />
          </div>
          <div>
            <h1 className="text-[44px] font-black leading-[1.05] tracking-tight text-[#1A1B2E]" style={{ fontFamily: 'var(--font-display)' }}>
              일상을 함께<br />
              <span className="text-brand-gradient">빛나게.</span>
            </h1>
            <div className="h-1 w-12 bg-brand-blue mt-4 rounded-full" />
          </div>
        </header>

        {/* ── 메인 콘텐츠: 정교한 피처 클러스터 ── */}
        <div className="relative flex-1 flex flex-col justify-center py-6">
          
          {/* 피처 설명 (텍스트) */}
          <p className="text-[16px] leading-relaxed text-[#8E8E93] font-medium mb-10 max-w-[240px] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            나와 소중한 사람들의<br />
            가장 빛나는 순간을 기록하세요.
          </p>

          {/* 비주얼 레이아웃: 엇갈린 입체 카드 (조형성 강화) */}
          <div className="relative h-[320px] w-full">
            
            {/* 카드 1: 스마트 일정 (Main) */}
            <div className="absolute top-0 left-0 w-[85%] glass-card p-5 rounded-[28px] shadow-[0_20px_50px_rgba(0,132,204,0.12)] z-30 animate-fade-in-up" 
                 style={{ animationDelay: '0.3s', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-[14px] bg-[#0084CC]/10 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.5" strokeLinecap="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#1A1B2E]">스마트 일정 관리</p>
                  <p className="text-[11px] text-[#8E8E93]">팀 미팅, 기념일, 운동 루틴</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-[70%] bg-brand-blue rounded-full" />
              </div>
            </div>

            {/* 카드 2: Space (Sub - Right) */}
            <div className="absolute top-[85px] right-0 w-[70%] glass-card p-5 rounded-[28px] shadow-[0_20px_40px_rgba(12,201,181,0.1)] z-20 animate-fade-in-up" 
                 style={{ animationDelay: '0.4s', background: 'rgba(255,255,255,0.7)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[12px] bg-[#0CC9B5]/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0CC9B5" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <p className="text-[13px] font-bold text-[#1A1B2E]">가족 Space 공유</p>
              </div>
            </div>

            {/* 카드 3: 지출 (Sub - Bottom) */}
            <div className="absolute bottom-0 left-[10%] w-[80%] glass-card p-5 rounded-[28px] shadow-[0_20px_40px_rgba(46,232,149,0.08)] z-10 animate-fade-in-up" 
                 style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[12px] bg-[#2EE895]/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2EE895" strokeWidth="2.5" strokeLinecap="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                </div>
                <p className="text-[13px] font-bold text-[#1A1B2E]">정기 지출 리포트</p>
              </div>
              <p className="text-[11px] text-[#8E8E93]">이번 달 지출 12% 절약됨</p>
            </div>
          </div>
        </div>

        {/* ── 하단: 사회적 증명 및 액션 ── */}
        <footer className="mt-8 space-y-8">
          {/* 사용자 후기 (신뢰성) */}
          <div className="flex items-center gap-4 px-1 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
              ))}
            </div>
            <p className="text-[12px] font-semibold text-[#1A1B2E]/60">
              이미 12,000명의 가족이 사용 중
            </p>
          </div>

          <div className="animate-slide-up">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 h-[72px] rounded-[24px] font-bold text-[18px] transition-all active:scale-[0.98] group relative overflow-hidden"
              style={{
                background: '#1A1B2E',
                color: 'white',
                boxShadow: '0 20px 40px rgba(26,27,46,0.25)',
              }}
            >
              {loading ? (
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'white' }} />
              ) : (
                <>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <svg width="22" height="22" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  </div>
                  구글로 3초만에 시작하기
                </>
              )}
            </button>
            <p className="text-center mt-6 text-[11px] text-[#8E8E93] leading-relaxed">
              가입 시 글리움의 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.<br/>
              모든 데이터는 안전하게 보호됩니다.
            </p>
          </div>
        </footer>
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
