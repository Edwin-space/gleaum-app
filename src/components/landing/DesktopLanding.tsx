'use client';

import { useState } from 'react';
import { GleaumAppIcon, GleaumLogo } from '@/components/ui/GleaumLogo';
import { useAuth } from '@/hooks/useAuth';

interface DesktopLandingProps {
  next?: string;
}

export function DesktopLanding({ next }: DesktopLandingProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signInWithGoogle(next);
  };

  return (
    <div className="landing-fullscreen min-h-dvh flex flex-col" style={{ background: 'var(--color-canvas-parchment)' }}>

      {/* ── 네비게이션 바 ── */}
      <nav className="flex items-center justify-between px-12 py-6 relative z-10">
        <GleaumLogo variant="light" size="sm" />
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold transition-all hover:shadow-lg active:scale-[0.97]"
          style={{
            background: 'var(--color-ink)',
            color: 'white',
          }}
        >
          {loading ? '연결 중...' : '시작하기'}
        </button>
      </nav>

      {/* ── 히어로 섹션 ── */}
      <main className="flex-1 flex items-center px-12 lg:px-20 xl:px-32 max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-12 gap-12 items-center w-full">

          {/* 왼쪽: 카피 & CTA */}
          <div className="col-span-6 space-y-8">
            <div className="space-y-5">
              <h1
                className="text-[52px] xl:text-[64px] font-bold leading-[1.1] tracking-tight"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
              >
                일상을 함께<br />
                <span style={{
                  background: 'var(--brand-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  빛나게.
                </span>
              </h1>
              <p
                className="text-[18px] xl:text-[20px] leading-relaxed max-w-[440px]"
                style={{ color: 'var(--color-ink-muted-80)' }}
              >
                개인 일정부터 연인, 가족, 친구와의 공유 일정까지.
                글리움으로 모든 관계의 일상을 스마트하게 관리하세요.
              </p>
            </div>

            {/* CTA 버튼 */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center gap-3 h-[60px] px-8 rounded-[20px] font-bold text-[16px] transition-all hover:shadow-xl active:scale-[0.97] disabled:opacity-70"
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
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
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
            <p className="text-[13px]" style={{ color: 'var(--color-ink-muted-48)' }}>
              무료로 시작 · 신용카드 불필요
            </p>

            {/* 사용자 후기 */}
            <div className="flex items-start gap-4 mt-4 p-5 rounded-[20px]"
              style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,132,204,0.06)' }}>
              <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-2xl"
                style={{ background: 'rgba(0,132,204,0.08)' }}>
                👩‍👧‍👦
              </div>
              <div>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-ink-muted-80)' }}>
                  &ldquo;아이들 학원 일정부터 정기지출까지 한눈에 보여서 정말 편해요.&rdquo;
                </p>
                <p className="text-[13px] font-bold mt-2" style={{ color: 'var(--color-ink)' }}>
                  김지수, 워킹맘
                </p>
              </div>
            </div>
          </div>

          {/* 오른쪽: 앱 프리뷰 목업 */}
          <div className="col-span-6 flex justify-center items-center relative">
            {/* 배경 장식 */}
            <div className="absolute -top-20 -right-10 w-[400px] h-[500px] rounded-[60px] -rotate-6 opacity-40"
              style={{ background: 'linear-gradient(180deg, rgba(12,201,181,0.15) 0%, rgba(0,132,204,0.1) 100%)' }} />
            <div className="absolute -bottom-10 -left-10 w-[300px] h-[400px] rounded-[60px] rotate-6 opacity-30"
              style={{ background: 'linear-gradient(180deg, rgba(46,232,149,0.12) 0%, rgba(12,201,181,0.08) 100%)' }} />

            {/* 폰 목업 */}
            <div className="relative z-10 w-[320px] xl:w-[360px]">
              {/* 폰 프레임 */}
              <div className="rounded-[44px] overflow-hidden shadow-2xl"
                style={{
                  background: '#000',
                  padding: '12px',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
                }}>
                {/* 상태바 */}
                <div className="flex items-center justify-between px-6 pt-3 pb-2 rounded-t-[32px]"
                  style={{ background: 'var(--color-canvas-parchment)' }}>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--color-ink)' }}>9:41</span>
                  <div className="flex items-center gap-1">
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                      <rect x="0" y="4" width="3" height="8" rx="1" fill="#1A1B2E"/>
                      <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="#1A1B2E"/>
                      <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill="#1A1B2E"/>
                      <rect x="13" y="4" width="3" height="8" rx="1" fill="#1A1B2E" opacity="0.3"/>
                    </svg>
                    <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                      <rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="#1A1B2E" opacity="0.3"/>
                      <rect x="2" y="2" width="16" height="8" rx="1" fill="#1A1B2E"/>
                      <rect x="22.5" y="3.5" width="1.5" height="5" rx="0.5" fill="#1A1B2E" opacity="0.3"/>
                    </svg>
                  </div>
                </div>

                {/* 앱 콘텐츠 미리보기 */}
                <div className="rounded-b-[32px] px-5 pb-6 pt-2 space-y-4"
                  style={{ background: 'var(--color-canvas-parchment)' }}>

                  {/* 로고 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GleaumAppIcon size={28} radius={8} />
                      <span className="text-[16px] font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>gleaum</span>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                      style={{ background: 'rgba(0,132,204,0.08)' }}>
                      👤
                    </div>
                  </div>

                  {/* 미니 캘린더 */}
                  <div className="rounded-[16px] p-3" style={{ background: 'white', border: '1px solid rgba(0,132,204,0.06)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[12px] font-bold" style={{ color: 'var(--color-ink)' }}>2026년 5월</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,132,204,0.08)', color: 'var(--brand-blue)' }}>오늘</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {['일','월','화','수','목','금','토'].map((d) => (
                        <span key={d} className="text-[9px] font-bold" style={{ color: 'var(--color-ink-muted-48)' }}>{d}</span>
                      ))}
                      {Array.from({ length: 31 }, (_, i) => i + 1).slice(0, 14).map((d) => (
                        <span
                          key={d}
                          className="text-[10px] font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                          style={{
                            background: d === 4 ? 'var(--brand-gradient)' : 'transparent',
                            color: d === 4 ? 'white' : 'var(--color-ink)',
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 일정 카드 미리보기 */}
                  <div className="space-y-2">
                    {[
                      { emoji: '📅', title: '팀 미팅', time: '오전 10:00', color: 'var(--brand-blue)' },
                      { emoji: '💪', title: '운동 루틴', time: '오후 6:30', color: 'var(--brand-green)' },
                      { emoji: '💳', title: '넷플릭스 결제', time: '자동이체', color: 'var(--brand-teal)' },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center gap-2.5 p-2.5 rounded-[12px]"
                        style={{ background: 'white', border: '1px solid rgba(0,132,204,0.06)' }}>
                        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-sm flex-shrink-0"
                          style={{ background: `${item.color}12` }}>
                          {item.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate" style={{ color: 'var(--color-ink)' }}>{item.title}</p>
                          <p className="text-[9px]" style={{ color: 'var(--color-ink-muted-80)' }}>{item.time}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: `${item.color}15`, color: item.color }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 홈 인디케이터 */}
              <div className="flex justify-center mt-2">
                <div className="w-[120px] h-[5px] rounded-full bg-black/20" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── 기능 소개 섹션 ── */}
      <section className="px-12 lg:px-20 xl:px-32 py-20 max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-3 gap-8">
          {[
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round">
                  <rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
              ),
              title: '스마트 일정 관리',
              desc: '개인, 공유, 케어 일정을 한곳에서. 자동 리마인더와 상태 추적까지.',
              color: 'var(--brand-blue)',
            },
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-teal)" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
              title: 'Space 공유',
              desc: '친구, 연인, 가족과 자유롭게 Space를 만들어 일정과 지출을 함께 관리.',
              color: 'var(--brand-teal)',
            },
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2" strokeLinecap="round">
                  <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                </svg>
              ),
              title: '자금 흐름 관리',
              desc: '정기 결제, 공동 비용을 자동 추적. 놓치는 결제 없이.',
              color: 'var(--brand-green)',
            },
          ].map((feature) => (
            <div key={feature.title} className="p-6 rounded-[24px] space-y-4"
              style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,132,204,0.06)' }}>
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center"
                style={{ background: `${feature.color}10` }}>
                {feature.icon}
              </div>
              <h3 className="text-[18px] font-bold" style={{ color: 'var(--color-ink)' }}>{feature.title}</h3>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-ink-muted-80)' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="px-12 py-8 text-center" style={{ borderTop: '1px solid rgba(0,132,204,0.06)' }}>
        <p className="text-[13px]" style={{ color: 'var(--color-ink-muted-48)' }}>
          © 2026 Gleaum. 나, 그리고 연인/가족의 일상 네트워크.
        </p>
      </footer>
    </div>
  );
}
