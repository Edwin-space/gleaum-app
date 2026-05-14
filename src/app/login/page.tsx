'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';
import { useAuth } from '@/hooks/useAuth';
import { trackEvent } from '@/lib/analytics';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { DesktopLanding } from '@/components/landing/DesktopLanding';

function MobileLogin() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? undefined;

  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    trackEvent('login', { method: 'google' });
    await signInWithGoogle(next);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email, password);
      trackEvent('login', { method: 'email' });
      window.location.href = next || '/home';
    } catch {
      setError('이메일 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0F1A2E' }}>

      {/* ── 상단 히어로 (다크 그라디언트) ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: 'linear-gradient(160deg, #0F1A2E 0%, #16263A 45%, #0D2240 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 'calc(env(safe-area-inset-top) + 60px) 28px 44px',
        overflow: 'hidden',
        minHeight: '48vh',
      }}>
        {/* 브랜드 글로우 블롭들 */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-80px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(12,201,181,0.22) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0px', left: '-100px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,132,204,0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '35%', left: '55%',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,232,149,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* 미세 별 무늬 (선택적 텍스처) */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        {/* 로고 — 공식 BI */}
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 20px)', left: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GleaumLogoImg size={34} />
          <GleaumBI variant="white" width={96} />
        </div>

        {/* 앱 아이콘 카드 — 프리미엄 플로팅 카드 */}
        <div style={{
          position: 'relative', zIndex: 2,
          width: '72px', height: '72px', borderRadius: '22px',
          background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 16px 48px rgba(0,132,204,0.4), 0 4px 12px rgba(0,0,0,0.2)',
          marginBottom: '20px',
          border: '2px solid rgba(255,255,255,0.15)',
        }}>
          <GleaumBI variant="white" width={44} />
        </div>

        {/* 헤드라인 */}
        <div style={{ position: 'relative', zIndex: 2, marginBottom: '28px' }}>
          <h1 style={{
            fontSize: '40px',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            color: 'white',
            margin: '0 0 12px',
          }}>
            일상을 함께<br />
            <span style={{
              background: 'linear-gradient(90deg, #0CC9B5 0%, #2EE895 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              빛나게.
            </span>
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, margin: 0, lineHeight: 1.65 }}>
            나와 소중한 사람들의 일상을<br />하나의 앱으로 연결하세요.
          </p>
        </div>

        {/* 피처 칩 3개 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          {[
            { icon: '📅', label: '스마트 일정', color: 'rgba(0,132,204,0.28)' },
            { icon: '🤝', label: 'Space 공유', color: 'rgba(12,201,181,0.28)' },
            { icon: '💳', label: '자금 관리', color: 'rgba(46,232,149,0.22)' },
          ].map((f) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 13px', borderRadius: '999px',
              background: f.color,
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}>
              <span style={{ fontSize: '12px' }}>{f.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.1px' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 하단 액션 시트 (화이트 카드) ── */}
      <div style={{
        background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '28px 24px calc(env(safe-area-inset-bottom) + 36px)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.15)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* 드래그 핸들 */}
        <div style={{
          width: '36px', height: '4px', borderRadius: '999px',
          background: '#E5E5EA', margin: '0 auto 24px',
        }} />

        {!showEmailForm ? (
          <>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 18px', letterSpacing: '-0.4px' }}>
              시작하기
            </p>

            {/* 구글 로그인 */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%', height: '60px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
                borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
                color: 'white',
                fontSize: '15px', fontWeight: 700,
                boxShadow: '0 8px 28px rgba(26,27,46,0.22)',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
                marginBottom: '12px',
              }}
            >
              {loading ? (
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>
                  <div style={{ width: '34px', height: '34px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 48 48">
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

            {/* OR 구분선 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#F0F0F5' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#C7C7CC' }}>또는</span>
              <div style={{ flex: 1, height: '1px', background: '#F0F0F5' }} />
            </div>

            {/* 이메일 버튼 */}
            <button
              onClick={() => setShowEmailForm(true)}
              style={{
                width: '100%', height: '54px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                borderRadius: '18px', cursor: 'pointer',
                background: '#F7F7FA',
                border: '1.5px solid #EBEBF0',
                color: '#1A1B2E', fontSize: '15px', fontWeight: 700,
                transition: 'all 0.2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2" strokeLinecap="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              이메일 주소로 계속하기
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#C7C7CC', marginTop: '18px', lineHeight: 1.7 }}>
              가입 시 글리움의{' '}
              <a href="/legal/terms" style={{ color: '#8E8E93', textDecoration: 'underline' }}>서비스 약관</a>
              {' '}및{' '}
              <a href="/legal/privacy" style={{ color: '#8E8E93', textDecoration: 'underline' }}>개인정보 처리방침</a>
              에<br />동의하게 됩니다.
            </p>
          </>
        ) : (
          /* 이메일 폼 */
          <form onSubmit={handleEmailLogin}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => { setShowEmailForm(false); setError(''); setEmail(''); setPassword(''); }}
                style={{
                  width: '38px', height: '38px', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#F7F7FA', border: '1.5px solid #EBEBF0', cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18L9 12L15 6"/></svg>
              </button>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B2E', margin: 0, letterSpacing: '-0.3px' }}>이메일 로그인</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round"
                  style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  required
                  style={{
                    width: '100%', height: '56px', padding: '0 18px 0 44px',
                    borderRadius: '16px', fontSize: '15px', fontWeight: 500,
                    border: `1.5px solid ${error ? '#EF4444' : '#EBEBF0'}`,
                    background: error ? 'rgba(239,68,68,0.03)' : '#F7F7FA',
                    outline: 'none', color: '#1A1B2E',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round"
                  style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  required
                  style={{
                    width: '100%', height: '56px', padding: '0 18px 0 44px',
                    borderRadius: '16px', fontSize: '15px', fontWeight: 500,
                    border: `1.5px solid ${error ? '#EF4444' : '#EBEBF0'}`,
                    background: error ? 'rgba(239,68,68,0.03)' : '#F7F7FA',
                    outline: 'none', color: '#1A1B2E',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)', marginBottom: '12px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#EF4444', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '58px',
                borderRadius: '18px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #0084CC 0%, #0CC9B5 100%)',
                color: 'white',
                fontSize: '16px', fontWeight: 700,
                boxShadow: '0 8px 28px rgba(0,132,204,0.3)',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
                marginTop: '4px',
              }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#C7C7CC', marginTop: '16px', lineHeight: 1.65 }}>
              가입 시{' '}
              <a href="/legal/terms" style={{ color: '#8E8E93', textDecoration: 'underline' }}>서비스 약관</a>
              {' '}및{' '}
              <a href="/legal/privacy" style={{ color: '#8E8E93', textDecoration: 'underline' }}>개인정보 처리방침</a>
              에 동의하게 됩니다.
            </p>
          </form>
        )}
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
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F1A2E' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(0,132,204,0.3)', borderTopColor: '#0084CC', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
