'use client';

import { useState } from 'react';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';
import { useAuth } from '@/hooks/useAuth';

interface DesktopLandingProps {
  next?: string;
}

export function DesktopLanding({ next }: DesktopLandingProps) {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signInWithGoogle(next);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setEmailLoading(true);
    setEmailError('');
    try {
      await signInWithEmail(email, password);
      window.location.href = next || '/home';
    } catch {
      setEmailError('이메일 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="landing-fullscreen min-h-dvh flex flex-col overflow-x-hidden"
      style={{ background: 'var(--color-canvas-parchment)' }}>

      {/* ── 네비게이션 바 ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 64px',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <GleaumLogoImg size={32} />
          <GleaumBI variant="dark" width={100} />
        </div>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 28px',
            borderRadius: '999px',
            fontSize: '14px',
            fontWeight: 700,
            background: 'var(--color-ink)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '연결 중...' : '무료로 시작하기'}
        </button>
      </nav>

      {/* ── 히어로 섹션 ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: '0 64px',
        maxWidth: '1360px',
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'center',
          width: '100%',
        }}>

          {/* 왼쪽: 카피 & CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h1 style={{
                fontSize: 'clamp(44px, 4.5vw, 64px)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-1.5px',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-display)',
                margin: 0,
              }}>
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
              <p style={{
                fontSize: '18px',
                lineHeight: 1.7,
                color: 'var(--color-ink-muted-80)',
                maxWidth: '420px',
                margin: 0,
              }}>
                개인 일정부터 연인, 가족, 친구와의 공유 일정까지.
                글리움으로 모든 관계의 일상을 스마트하게 관리하세요.
              </p>
            </div>

            {/* CTA 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>

              {/* 구글 로그인 */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading || emailLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  height: '60px',
                  padding: '0 32px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '16px',
                  background: 'var(--color-ink)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 12px 32px rgba(26,27,46,0.2)',
                  transition: 'all 0.2s',
                  width: '100%',
                  opacity: (loading || emailLoading) ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <span>연결 중...</span>
                ) : (
                  <>
                    <span style={{
                      width: '32px', height: '32px', background: 'white',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                    </span>
                    구글 계정으로 시작하기
                  </>
                )}
              </button>

              {/* OR 구분선 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(26,27,46,0.08)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted-48)' }}>또는</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(26,27,46,0.08)' }} />
              </div>

              {/* 이메일 로그인 영역 */}
              {!showEmailForm ? (
                /* 이메일 버튼 (접힌 상태) */
                <button
                  onClick={() => setShowEmailForm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    height: '52px',
                    width: '100%',
                    borderRadius: '18px',
                    fontWeight: 700,
                    fontSize: '15px',
                    background: 'rgba(255,255,255,0.7)',
                    color: 'var(--color-ink)',
                    border: '1px solid rgba(26,27,46,0.1)',
                    cursor: 'pointer',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.2s',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  이메일 주소로 계속하기
                </button>
              ) : (
                /* 이메일 폼 (펼친 상태) */
                <form
                  onSubmit={handleEmailLogin}
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일 주소"
                    required
                    style={{
                      width: '100%',
                      height: '52px',
                      padding: '0 18px',
                      borderRadius: '16px',
                      fontSize: '15px',
                      fontWeight: 500,
                      border: `1.5px solid ${emailError ? '#EF4444' : 'rgba(26,27,46,0.12)'}`,
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(12px)',
                      outline: 'none',
                      color: 'var(--color-ink)',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    required
                    style={{
                      width: '100%',
                      height: '52px',
                      padding: '0 18px',
                      borderRadius: '16px',
                      fontSize: '15px',
                      fontWeight: 500,
                      border: `1.5px solid ${emailError ? '#EF4444' : 'rgba(26,27,46,0.12)'}`,
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(12px)',
                      outline: 'none',
                      color: 'var(--color-ink)',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  {emailError && (
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#EF4444', margin: 0 }}>
                      {emailError}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="submit"
                      disabled={emailLoading}
                      style={{
                        flex: 1,
                        height: '52px',
                        borderRadius: '16px',
                        fontWeight: 700,
                        fontSize: '15px',
                        background: 'var(--color-ink)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: emailLoading ? 0.7 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      {emailLoading ? '로그인 중...' : '로그인'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowEmailForm(false); setEmailError(''); setEmail(''); setPassword(''); }}
                      style={{
                        height: '52px',
                        padding: '0 20px',
                        borderRadius: '16px',
                        fontWeight: 600,
                        fontSize: '14px',
                        background: 'rgba(26,27,46,0.05)',
                        color: 'var(--color-ink-muted-80)',
                        border: '1px solid rgba(26,27,46,0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}

              <p style={{ fontSize: '12px', color: 'var(--color-ink-muted-48)', margin: 0 }}>
                무료로 시작 · 신용카드 불필요
              </p>
            </div>

            {/* 사용자 후기 */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              padding: '20px 24px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(0,132,204,0.06)',
              maxWidth: '440px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                background: 'rgba(0,132,204,0.08)',
              }}>
                👩‍👧‍👦
              </div>
              <div>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-ink-muted-80)', margin: 0 }}>
                  &ldquo;아이들 학원 일정부터 정기지출까지 한눈에 보여서 정말 편해요.&rdquo;
                </p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', margin: '8px 0 0' }}>
                  김지수, 워킹맘
                </p>
              </div>
            </div>
          </div>

          {/* 오른쪽: 앱 프리뷰 목업 */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            {/* 배경 장식 블롭 */}
            <div style={{
              position: 'absolute',
              top: '-60px',
              right: '-40px',
              width: '360px',
              height: '460px',
              borderRadius: '60px',
              transform: 'rotate(-6deg)',
              background: 'linear-gradient(180deg, rgba(12,201,181,0.12) 0%, rgba(0,132,204,0.06) 100%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-40px',
              left: '0px',
              width: '260px',
              height: '340px',
              borderRadius: '60px',
              transform: 'rotate(6deg)',
              background: 'linear-gradient(180deg, rgba(46,232,149,0.08) 0%, rgba(12,201,181,0.04) 100%)',
              pointerEvents: 'none',
            }} />

            {/* 폰 프레임 */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              width: '340px',
            }}>
              <div style={{
                borderRadius: '44px',
                overflow: 'hidden',
                background: '#000',
                padding: '12px',
                boxShadow: '0 40px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.08)',
              }}>
                {/* 상태바 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 24px 8px',
                  borderRadius: '32px 32px 0 0',
                  background: 'var(--color-canvas-parchment)',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>9:41</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                      <rect x="0" y="4" width="3" height="8" rx="1" fill="#1A1B2E"/>
                      <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="#1A1B2E"/>
                      <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill="#1A1B2E"/>
                      <rect x="13" y="4" width="3" height="8" rx="1" fill="#1A1B2E" opacity="0.3"/>
                    </svg>
                    <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                      <rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="#1A1B2E" opacity="0.3"/>
                      <rect x="2" y="2" width="16" height="8" rx="1" fill="#1A1B2E"/>
                    </svg>
                  </div>
                </div>

                {/* 앱 콘텐츠 */}
                <div style={{
                  borderRadius: '0 0 32px 32px',
                  padding: '8px 20px 24px',
                  background: 'var(--color-canvas-parchment)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}>
                  {/* 앱 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GleaumLogoImg size={28} />
                      <GleaumBI variant="dark" width={72} />
                    </div>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', background: 'rgba(0,132,204,0.08)',
                    }}>👤</div>
                  </div>

                  {/* 미니 캘린더 */}
                  <div style={{
                    borderRadius: '16px',
                    padding: '12px',
                    background: 'white',
                    border: '1px solid rgba(0,132,204,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)' }}>2026년 5월</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(0,132,204,0.08)', color: 'var(--brand-blue)' }}>오늘</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                      {['일','월','화','수','목','금','토'].map((d) => (
                        <span key={d} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--color-ink-muted-48)' }}>{d}</span>
                      ))}
                      {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => (
                        <span key={d} style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          margin: '0 auto',
                          background: d === 4 ? 'var(--brand-gradient)' : 'transparent',
                          color: d === 4 ? 'white' : 'var(--color-ink)',
                        }}>{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* 일정 카드 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { emoji: '📅', title: '팀 미팅', time: '오전 10:00', color: '#0084CC' },
                      { emoji: '💪', title: '운동 루틴', time: '오후 6:30', color: '#2EE895' },
                      { emoji: '💳', title: '넷플릭스 결제', time: '자동이체', color: '#0CC9B5' },
                    ].map((item) => (
                      <div key={item.title} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: 'white',
                        border: '1px solid rgba(0,132,204,0.06)',
                      }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', flexShrink: 0,
                          background: `${item.color}12`,
                        }}>{item.emoji}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>{item.title}</p>
                          <p style={{ fontSize: '10px', color: 'var(--color-ink-muted-80)', margin: 0 }}>{item.time}</p>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="3">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 홈 인디케이터 */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                <div style={{ width: '120px', height: '5px', borderRadius: '999px', background: 'rgba(0,0,0,0.15)' }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── 기능 소개 섹션 ── */}
      <section style={{
        padding: '80px 64px',
        maxWidth: '1360px',
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '32px',
        }}>
          {[
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round">
                  <rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
              ),
              title: '스마트 일정 관리',
              desc: '개인, 공유, 케어 일정을 한곳에서. 자동 리마인더와 상태 추적까지.',
              color: '#0084CC',
            },
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-teal)" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
              title: 'Space 공유',
              desc: '친구, 연인, 가족과 자유롭게 Space를 만들어 일정과 지출을 함께 관리.',
              color: '#0CC9B5',
            },
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2" strokeLinecap="round">
                  <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                </svg>
              ),
              title: '자금 흐름 관리',
              desc: '정기 결제, 공동 비용을 자동 추적. 놓치는 결제 없이.',
              color: '#2EE895',
            },
          ].map((feature) => (
            <div key={feature.title} style={{
              padding: '32px',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(0,132,204,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${feature.color}10`,
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>{feature.title}</h3>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-ink-muted-80)', margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer style={{
        padding: '32px 64px',
        textAlign: 'center',
        borderTop: '1px solid rgba(0,132,204,0.06)',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', margin: 0 }}>
          © 2026 Gleaum. 나, 그리고 연인/가족의 일상 네트워크.
        </p>
      </footer>
    </div>
  );
}
