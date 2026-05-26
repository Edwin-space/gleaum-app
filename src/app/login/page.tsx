'use client';

import { useState, Suspense, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';
import { useAuth } from '@/hooks/useAuth';
import { trackEvent } from '@/lib/analytics';
import { isNativeApp } from '@/lib/native';

// ─── Google 아이콘 ────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

// ─── 이메일 아이콘 ────────────────────────────────────────────────────────────
function MailIcon({ color = '#8E8E93' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

// ─── 디버그 패널 (로고 5번 탭 → 활성화) ──────────────────────────────────────
function DebugPanel({ logs }: { logs: string[] }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)', borderTop: '1px solid #333',
      padding: '12px', maxHeight: '40vh', overflowY: 'auto',
    }}>
      <div style={{ color: '#0CC9B5', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
        🔍 AUTH DEBUG LOG
      </div>
      {logs.length === 0
        ? <div style={{ color: '#666', fontSize: '11px' }}>이벤트 없음 — 구글 로그인 시도해보세요</div>
        : logs.map((l, i) => (
          <div key={i} style={{ color: l.startsWith('❌') ? '#ff6b6b' : l.startsWith('✅') ? '#51cf66' : '#ccc', fontSize: '11px', marginBottom: '2px', fontFamily: 'monospace' }}>{l}</div>
        ))
      }
    </div>
  );
}

// ─── 로그인 폼 ─────────────────────────────────────────────────────────────────
function LoginForm() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? undefined;

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');

  // 디버그 모드 — 로고 5번 탭
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const logoTapCount = useRef(0);
  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    setDebugLogs(prev => [...prev.slice(-30), `[${time}] ${msg}`]);
  }, []);
  const handleLogoTap = () => {
    logoTapCount.current += 1;
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      setDebugMode(prev => !prev);
      setDebugLogs([]);
    }
  };

  // ── 네이티브 앱 OAuth 콜백 처리 ──────────────────────────────────────────
  // NativeAppProvider가 발생시키는 이벤트 구독:
  //   'gleaum:auth-processing' → 딥링크 수신 확인 (browserFinished 타임아웃 취소)
  //   'gleaum:auth-error'      → 스피너 리셋 + 에러 메시지 표시
  //   'gleaum:auth-success'    → 스피너 리셋 (router.replace('/home') 도 이미 호출됨)
  //
  // 타이밍 버그 방지:
  //   browserFinished(600ms) → exchangeCodeForSession 완료 전 리스너 제거 → 에러 무시 버그
  //   gleaum:auth-processing 수신 시 browserFinished 타임아웃을 취소해 이 버그를 방지.
  useEffect(() => {
    if (!googleLoading || !isNativeApp()) return;

    addLog('🔵 구글 OAuth 시작 — 이벤트 리스너 등록');

    let authHandled = false;
    let browserFinishedTimer: ReturnType<typeof setTimeout> | null = null;

    const handleAuthError = (e: Event) => {
      authHandled = true;
      if (browserFinishedTimer) clearTimeout(browserFinishedTimer);
      const msg = (e as CustomEvent<string>).detail;
      addLog(`❌ auth-error: ${msg}`);
      setGoogleLoading(false);
      setError(msg === 'invalid request: code verifier does not match'
        ? '인증 오류가 발생했습니다. 다시 시도해 주세요.'
        : '구글 로그인에 실패했습니다. 다시 시도해 주세요.');
    };
    const handleAuthSuccess = () => {
      authHandled = true;
      if (browserFinishedTimer) clearTimeout(browserFinishedTimer);
      addLog('✅ auth-success → /home 이동');
      setGoogleLoading(false);
    };

    let authProcessing = false;
    const handleAuthProcessing = () => {
      authProcessing = true;
      addLog('🟡 auth-processing: 딥링크 수신 — exchangeCodeForSession 대기');
      if (browserFinishedTimer) {
        clearTimeout(browserFinishedTimer);
        browserFinishedTimer = null;
      }
    };

    window.addEventListener('gleaum:auth-processing', handleAuthProcessing);
    window.addEventListener('gleaum:auth-error', handleAuthError);
    window.addEventListener('gleaum:auth-success', handleAuthSuccess);

    let browserListener: { remove: () => void } | undefined;
    (async () => {
      const { Browser } = await import('@capacitor/browser');
      browserListener = await Browser.addListener('browserFinished', () => {
        addLog(`🟠 browserFinished — authProcessing=${authProcessing}, authHandled=${authHandled}`);
        if (authProcessing) {
          addLog('   → 딥링크 수신됨, 처리 완료 대기 (15초 안전망)');
          browserFinishedTimer = setTimeout(() => {
            if (!authHandled) {
              addLog('❌ 15초 타임아웃 — 네트워크 오류');
              setGoogleLoading(false);
              setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
            }
          }, 15000);
        } else {
          addLog('   → 딥링크 미수신 (취소), 800ms 후 스피너 해제');
          browserFinishedTimer = setTimeout(() => {
            if (!authHandled) {
              addLog('   → 스피너 해제 (취소)');
              setGoogleLoading(false);
            }
          }, 800);
        }
        browserListener?.remove();
      });
    })();

    return () => {
      if (browserFinishedTimer) clearTimeout(browserFinishedTimer);
      window.removeEventListener('gleaum:auth-processing', handleAuthProcessing);
      window.removeEventListener('gleaum:auth-error', handleAuthError);
      window.removeEventListener('gleaum:auth-success', handleAuthSuccess);
      browserListener?.remove();
    };
  }, [googleLoading]);

  const handleGoogle = async () => {
    setError('');
    setDebugLogs([]); // 로그 초기화
    addLog('🔵 구글 로그인 버튼 클릭');
    setGoogleLoading(true);
    trackEvent('login', { method: 'google' });
    addLog('   → signInWithGoogle 호출 중...');
    await signInWithGoogle(next);
    addLog('   → 인앱 브라우저 오픈 완료 (대기 중)');
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setEmailLoading(true);
    setError('');
    try {
      await signInWithEmail(email, password);
      trackEvent('login', { method: 'email' });
      window.location.href = next || '/home';
    } catch {
      setError('이메일 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="landing-fullscreen" style={{
      minHeight: '100dvh',
      background: '#08080E',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 배경 블롭 */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-150px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,132,204,0.12), transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(12,201,181,0.08), transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* 네비 */}
      <nav style={{
        position: 'relative', zIndex: 10,
        padding: '20px 32px',
        display: 'flex', alignItems: 'center',
      }}>
        {/* 로고 5번 탭 → 디버그 모드 토글 */}
        <div onClick={handleLogoTap} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', cursor: 'pointer' }}>
          <GleaumLogoImg size={30} />
          <GleaumBI variant="white" width={80} />
        </div>
      </nav>

      {/* 디버그 패널 */}
      {debugMode && <DebugPanel logs={debugLogs} />}

      {/* 중앙 카드 */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '28px',
          padding: '40px 36px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          {!showEmail ? (
            <>
              {/* 헤더 */}
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                  fontSize: '26px', fontWeight: 800, color: 'white',
                  margin: '0 0 8px', letterSpacing: '-0.8px',
                  fontFamily: 'var(--font-display)',
                }}>
                  시작하기
                </h1>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                  계정을 만들거나 로그인하세요.<br />무료로 시작할 수 있습니다.
                </p>
              </div>

              {/* 구글 로그인 */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                style={{
                  width: '100%', height: '56px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  borderRadius: '16px', border: '1.5px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white', fontSize: '15px', fontWeight: 700,
                  cursor: googleLoading ? 'not-allowed' : 'pointer',
                  opacity: googleLoading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  marginBottom: '12px',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={(e) => { if (!googleLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              >
                {googleLoading ? (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                ) : (
                  <>
                    <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GoogleIcon />
                    </div>
                    구글 계정으로 계속하기
                  </>
                )}
              </button>

              {/* OR 구분선 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>또는</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* 이메일 버튼 */}
              <button
                onClick={() => setShowEmail(true)}
                style={{
                  width: '100%', height: '52px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  borderRadius: '16px', border: '1.5px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <MailIcon color="currentColor" />
                이메일 주소로 계속하기
              </button>

              {/* 약관 동의 문구 */}
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '20px', lineHeight: 1.65, margin: '20px 0 0' }}>
                가입 시 글리움의{' '}
                <Link href="/legal/terms" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>서비스 약관</Link>
                {' '}및{' '}
                <Link href="/legal/privacy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>개인정보 처리방침</Link>
                에 동의하게 됩니다.
              </p>
            </>
          ) : (
            /* 이메일 폼 */
            <>
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <button
                  onClick={() => { setShowEmail(false); setError(''); setEmail(''); setPassword(''); }}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M15 18L9 12L15 6"/>
                  </svg>
                </button>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
                  이메일 로그인
                </h2>
              </div>

              <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 이메일 */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <MailIcon color="rgba(255,255,255,0.4)" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일 주소"
                    required
                    style={{
                      width: '100%', height: '52px', padding: '0 16px 0 44px',
                      borderRadius: '14px', fontSize: '15px', fontWeight: 500,
                      border: `1.5px solid ${error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`,
                      background: 'rgba(255,255,255,0.06)',
                      outline: 'none', color: 'white', boxSizing: 'border-box',
                      fontFamily: 'var(--font-body)',
                    }}
                  />
                </div>

                {/* 비밀번호 */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
                      <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    required
                    style={{
                      width: '100%', height: '52px', padding: '0 16px 0 44px',
                      borderRadius: '14px', fontSize: '15px', fontWeight: 500,
                      border: `1.5px solid ${error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`,
                      background: 'rgba(255,255,255,0.06)',
                      outline: 'none', color: 'white', boxSizing: 'border-box',
                      fontFamily: 'var(--font-body)',
                    }}
                  />
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                    </svg>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#EF4444' }}>{error}</span>
                  </div>
                )}

                {/* 로그인 버튼 */}
                <button
                  type="submit"
                  disabled={emailLoading}
                  style={{
                    width: '100%', height: '54px',
                    borderRadius: '16px', border: 'none', cursor: emailLoading ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, #0084CC, #0CC9B5)',
                    color: 'white', fontSize: '15px', fontWeight: 700,
                    opacity: emailLoading ? 0.7 : 1, transition: 'all 0.2s',
                    marginTop: '4px',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {emailLoading ? '로그인 중...' : '로그인'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '20px', lineHeight: 1.65 }}>
                가입 시{' '}
                <Link href="/legal/terms" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>서비스 약관</Link>
                {' '}및{' '}
                <Link href="/legal/privacy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>개인정보 처리방침</Link>
                에 동의하게 됩니다.
              </p>
            </>
          )}
        </div>
      </div>

      {/* 하단 링크 */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '20px 32px',
        display: 'flex', justifyContent: 'center', gap: '24px',
      }}>
        {[
          { label: '개인정보처리방침', href: '/legal/privacy' },
          { label: '이용약관', href: '/legal/terms' },
          { label: '문의', href: 'mailto:helper@gleaum.com' },
        ].map(({ label, href }) => (
          <a key={label} href={href} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
          >{label}</a>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080E' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(0,132,204,0.3)', borderTopColor: '#0084CC' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
