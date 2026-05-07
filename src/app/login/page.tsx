'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';
import { useAuth } from '@/hooks/useAuth';
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
    await signInWithGoogle(next);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email, password);
      window.location.href = next || '/home';
    } catch {
      setError('이메일 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── 상단 히어로 (다크 그라디언트) ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: 'linear-gradient(160deg, #0F1A2E 0%, #1A2E3A 50%, #0C2340 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '60px 28px 40px',
        overflow: 'hidden',
      }}>
        {/* 브랜드 글로우 블롭 */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(12,201,181,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '20px', left: '-80px',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,132,204,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '60%',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,232,149,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* 로고 — 공식 BI */}
        <div style={{ position: 'absolute', top: '52px', left: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GleaumLogoImg size={36} />
          <GleaumBI variant="white" width={100} />
        </div>

        {/* 헤드라인 */}
        <div style={{ position: 'relative', zIndex: 2, marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-1px',
            color: 'white',
            margin: '0 0 14px',
            fontFamily: 'var(--font-display)',
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
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
            나와 소중한 사람들의 일상을<br />하나의 앱으로 연결하세요.
          </p>
        </div>

        {/* 피처 칩 3개 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          {[
            { icon: '📅', label: '스마트 일정', color: 'rgba(0,132,204,0.3)' },
            { icon: '🤝', label: 'Space 공유', color: 'rgba(12,201,181,0.3)' },
            { icon: '💳', label: '자금 관리', color: 'rgba(46,232,149,0.3)' },
          ].map((f) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '999px',
              background: f.color,
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
            }}>
              <span style={{ fontSize: '13px' }}>{f.icon}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 하단 액션 시트 (화이트 카드) ── */}
      <div style={{
        background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '32px 24px 40px',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.12)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* 드래그 핸들 */}
        <div style={{
          width: '40px', height: '4px', borderRadius: '999px',
          background: '#E5E5EA', margin: '0 auto 28px',
        }} />

        {!showEmailForm ? (
          <>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 20px', letterSpacing: '-0.3px' }}>
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
                background: '#1A1B2E', color: 'white',
                fontSize: '16px', fontWeight: 700,
                boxShadow: '0 8px 24px rgba(26,27,46,0.2)',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
                marginBottom: '12px',
              }}
            >
              {loading ? (
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>
                  <div style={{ width: '36px', height: '36px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 48 48">
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
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

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#C7C7CC', marginTop: '20px', lineHeight: 1.6 }}>
              가입 시 글리움의 서비스 약관 및 개인정보 처리방침에<br />동의하게 됩니다.
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
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#F7F7FA', border: 'none', cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18L9 12L15 6"/></svg>
              </button>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>이메일 로그인</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                required
                style={{
                  width: '100%', height: '54px', padding: '0 18px',
                  borderRadius: '16px', fontSize: '15px', fontWeight: 500,
                  border: `1.5px solid ${error ? '#EF4444' : '#EBEBF0'}`,
                  background: '#F7F7FA', outline: 'none', color: '#1A1B2E',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                style={{
                  width: '100%', height: '54px', padding: '0 18px',
                  borderRadius: '16px', fontSize: '15px', fontWeight: 500,
                  border: `1.5px solid ${error ? '#EF4444' : '#EBEBF0'}`,
                  background: '#F7F7FA', outline: 'none', color: '#1A1B2E',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
              />
            </div>

            {error && (
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#EF4444', margin: '0 0 12px 4px' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '58px',
                borderRadius: '18px', border: 'none', cursor: 'pointer',
                background: '#1A1B2E', color: 'white',
                fontSize: '16px', fontWeight: 700,
                boxShadow: '0 8px 24px rgba(26,27,46,0.18)',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
                marginTop: '4px',
              }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#C7C7CC', marginTop: '16px' }}>
              가입 시 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.
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
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#FAFAFD' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(0,132,204,0.3)', borderTopColor: '#0084CC' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
