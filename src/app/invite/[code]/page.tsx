'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { getBlockedBrowserInfo, tryOpenInChrome, type BlockedBrowserInfo } from '@/lib/browser';

// 공간 목적 → 이모지/설명
const PURPOSE_META: Record<string, { emoji: string; label: string }> = {
  family:  { emoji: '👨‍👩‍👧‍👦', label: '가족 공간' },
  couple:  { emoji: '💑',      label: '커플 공간' },
  friends: { emoji: '🙌',      label: '친구 모임' },
  work:    { emoji: '💼',      label: '업무 팀'   },
  other:   { emoji: '✨',      label: '공유 공간' },
};

type InviteInfo = {
  spaceName: string;
  purpose: string | null;
  memberCount: number;
};

type PageState =
  | 'loading_info'      // 초대 정보 조회 중
  | 'landing'           // 랜딩 페이지 표시 (비로그인)
  | 'logging_in'        // 구글 로그인 진행 중
  | 'joining'           // 합류 API 호출 중
  | 'success'
  | 'already_member'
  | 'invalid_code'
  | 'expired_code'
  | 'rate_limited'
  | 'error';

// ── Google 아이콘 ─────────────────────────────────────────────────────────────
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

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = typeof params.code === 'string' ? params.code.toUpperCase() : '';

  const { user, loading: userLoading } = useCurrentUser();
  const { signInWithGoogle } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading_info');
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [spaceName, setSpaceName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // 인앱 브라우저 감지
  const [blockedBrowser, setBlockedBrowser] = useState<BlockedBrowserInfo | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  useEffect(() => {
    const info = getBlockedBrowserInfo();
    if (!info) return;
    setBlockedBrowser(info);
    if (info.canAutoRedirect) setTimeout(() => tryOpenInChrome(window.location.href), 400);
  }, []);

  // 초대 정보 조회 (인증 불필요)
  useEffect(() => {
    if (!code) { setPageState('invalid_code'); return; }
    fetch(`/api/invite/info?code=${encodeURIComponent(code)}`)
      .then(async (res) => {
        if (res.status === 404) { setPageState('invalid_code'); return; }
        if (res.status === 410) { setPageState('expired_code'); return; }
        if (!res.ok) { setPageState('error'); return; }
        const data: InviteInfo = await res.json();
        setInviteInfo(data);
        // 정보 조회 완료 후 로그인 상태에 따라 분기 (userLoading 완료 후)
      })
      .catch(() => setPageState('error'));
  }, [code]);

  // inviteInfo + 유저 로딩 완료 → 분기
  useEffect(() => {
    if (!inviteInfo) return;        // 아직 정보 없음
    if (userLoading) return;        // 유저 로딩 중

    if (!user) {
      setPageState('landing');      // 비로그인 → 랜딩 페이지
    } else {
      setPageState('joining');      // 로그인 → 바로 합류
    }
  }, [inviteInfo, user, userLoading]);

  // 합류 API 호출
  const doJoin = useCallback(async () => {
    if (!code) return;
    setPageState('joining');
    try {
      const res = await fetch('/api/invite/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.status === 429) { setPageState('rate_limited'); return; }
      if (res.status === 410) { setPageState('expired_code'); return; }
      if (res.status === 404) { setPageState('invalid_code'); return; }
      const data = await res.json();
      if (data.alreadyMember) {
        setSpaceName(data.spaceName ?? '');
        setPageState('already_member');
      } else if (data.success) {
        setSpaceName(data.spaceName ?? '');
        setPageState('success');
        setTimeout(() => router.replace('/space'), 2000);
      } else {
        setPageState('invalid_code');
      }
    } catch {
      setPageState('error');
    }
  }, [code, router]);

  // 합류 상태로 전환 시 자동 실행
  useEffect(() => {
    if (pageState === 'joining') doJoin();
  }, [pageState, doJoin]);

  // 구글 로그인 — 완료 후 /invite/[code]로 돌아옴 → joining 상태로 자동 진행
  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signInWithGoogle(`/invite/${code}`);
  };

  // ── 인앱 브라우저 차단 ───────────────────────────────────────────────────────
  if (blockedBrowser) {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #0A0B1E 0%, #1A1B2E 60%, #0D2040 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'calc(env(safe-area-inset-top) + 32px) 24px calc(env(safe-area-inset-bottom) + 32px)',
      }}>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
        <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeUp 0.4s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 16px',
              background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
            }}>🚫</div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'white', margin: '0 0 10px', letterSpacing: '-0.4px', lineHeight: 1.3 }}>
              {blockedBrowser.appName} 내부 브라우저에서는<br />구글 로그인이 지원되지 않아요
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>
              Google 정책에 따라 앱 내부 브라우저에서는<br />구글 계정 로그인이 차단됩니다.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '24px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 800, color: '#F59E0B', margin: '0 0 14px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>해결 방법</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📱</div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, margin: 0 }}>{blockedBrowser.instruction}</p>
            </div>
            <div style={{ margin: '16px 0', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0, background: 'rgba(12,201,181,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔗</div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, margin: 0 }}>
                아래 버튼으로 링크를 복사하여<br />{blockedBrowser.isIOS ? 'Safari' : 'Chrome 또는 Safari'}에 붙여넣기 하세요
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              try { await navigator.clipboard.writeText(currentUrl); }
              catch {
                const el = document.createElement('textarea');
                el.value = currentUrl; el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
                document.body.appendChild(el); el.focus(); el.select();
                document.execCommand('copy'); document.body.removeChild(el);
              }
              setUrlCopied(true); setTimeout(() => setUrlCopied(false), 3000);
            }}
            style={{
              width: '100%', height: '58px', borderRadius: '18px', marginBottom: '12px',
              background: urlCopied ? 'rgba(12,201,181,0.25)' : 'linear-gradient(135deg, #0CC9B5, #0084CC)',
              border: urlCopied ? '1.5px solid rgba(12,201,181,0.50)' : 'none',
              cursor: 'pointer', fontSize: '16px', fontWeight: 900, color: 'white',
              boxShadow: urlCopied ? 'none' : '0 8px 24px rgba(0,132,204,0.35)',
              letterSpacing: '-0.3px', transition: 'all 0.2s',
            }}
          >
            {urlCopied ? '✓ 링크가 복사되었어요!' : '🔗 초대 링크 복사하기'}
          </button>
          {blockedBrowser.canAutoRedirect && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.30)', margin: 0, lineHeight: 1.6 }}>
              Chrome 앱이 설치된 경우 자동으로 열립니다.<br />열리지 않으면 위 버튼으로 링크를 복사해 주세요.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── 초대 정보 로딩 중 ────────────────────────────────────────────────────────
  if (pageState === 'loading_info') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080E' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(0,132,204,0.2)', borderTopColor: '#0084CC', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── 초대 랜딩 페이지 (비로그인) ─────────────────────────────────────────────
  if (pageState === 'landing') {
    const purposeMeta = PURPOSE_META[inviteInfo?.purpose ?? ''] ?? { emoji: '🏠', label: '공유 공간' };

    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #08080E 0%, #0A1628 50%, #0D2040 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'calc(env(safe-area-inset-top) + 24px) 24px calc(env(safe-area-inset-bottom) + 32px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <style>{`
          @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
          @keyframes pulse { 0%,100% { opacity:0.5; transform:scale(1); } 50% { opacity:0.8; transform:scale(1.05); } }
        `}</style>

        {/* 배경 블롭 */}
        <div style={{ position: 'absolute', top: '-120px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,132,204,0.18), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(12,201,181,0.12), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

          {/* 글리움 로고 */}
          <div style={{ textAlign: 'center', marginBottom: '32px', animation: 'fadeUp 0.4s ease' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #0084CC 0%, #0CC9B5 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 40px rgba(0,132,204,0.40)',
              fontSize: '32px',
            }}>🏡</div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>GLEAUM</p>
          </div>

          {/* 초대 메인 카드 */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '28px', padding: '32px 28px',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            marginBottom: '16px',
            animation: 'fadeUp 0.5s ease 0.1s both',
          }}>
            {/* 공간 정보 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '18px', flexShrink: 0,
                background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px',
              }}>
                {purposeMeta.emoji}
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#0CC9B5', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {purposeMeta.label}에 초대받았습니다
                </p>
                <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                  {inviteInfo?.spaceName ?? ''}
                </h1>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.40)', margin: '4px 0 0' }}>
                  현재 멤버 {inviteInfo?.memberCount ?? 0}명
                </p>
              </div>
            </div>

            {/* 구분선 */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 0 24px' }} />

            {/* 서비스 소개 */}
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 20px' }}>
              <strong style={{ color: 'white' }}>글리움</strong>은 연인·가족·모임의 일정, 가계부, 할 일을
              한 공간에서 함께 관리하는 라이프 네트워크 서비스입니다.
            </p>

            {/* 기능 하이라이트 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
              {[
                { icon: '🗓️', text: '공유 캘린더' },
                { icon: '💰', text: '가계부 공유' },
                { icon: '✅', text: '함께 할 일' },
                { icon: '📸', text: '추억 기록' },
              ].map((f) => (
                <div key={f.text} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <span style={{ fontSize: '16px' }}>{f.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.70)' }}>{f.text}</span>
                </div>
              ))}
            </div>

            {/* 구글 로그인 버튼 */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              style={{
                width: '100%', height: '58px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                borderRadius: '18px', border: '1.5px solid rgba(255,255,255,0.15)',
                background: googleLoading ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.10)',
                color: 'white', fontSize: '15px', fontWeight: 800,
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                opacity: googleLoading ? 0.7 : 1,
                transition: 'all 0.2s',
                letterSpacing: '-0.2px',
                boxShadow: googleLoading ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {googleLoading ? (
                <>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  로그인 중...
                </>
              ) : (
                <>
                  <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GoogleIcon />
                  </div>
                  구글 계정으로 공간 참여하기
                </>
              )}
            </button>
          </div>

          {/* 하단 안내 */}
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.7, animation: 'fadeUp 0.5s ease 0.2s both' }}>
            로그인하면 글리움 <a href="/legal/terms" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline' }}>이용약관</a> 및{' '}
            <a href="/legal/privacy" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline' }}>개인정보처리방침</a>에 동의한 것으로 간주됩니다.
          </p>
        </div>
      </div>
    );
  }

  // ── 합류 중 ──────────────────────────────────────────────────────────────────
  if (pageState === 'joining') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAFAFD' }}>
        <div style={{ position: 'fixed', top: '-80px', left: '-80px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', bottom: '-40px', right: '-40px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,153,255,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#0084CC', boxShadow: '0 12px 40px rgba(0,132,204,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '24px' }}>🏠</div>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(0,132,204,0.2)', borderTopColor: '#0084CC', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#1A1B2E', margin: 0 }}>공간에 합류하는 중...</p>
        <p style={{ fontSize: '13px', color: '#8E8E93', marginTop: '8px' }}>잠시만 기다려주세요</p>
      </div>
    );
  }

  // ── 성공 ──────────────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', background: '#FAFAFD' }}>
        <div style={{ position: 'fixed', top: '-80px', left: '-80px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="rgba(16,185,129,0.15)"/>
            <path d="M14 24L21 31L34 17" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px', letterSpacing: '-0.5px' }}>합류 완료!</h1>
        {spaceName && <p style={{ fontSize: '17px', fontWeight: 700, color: '#0084CC', margin: '0 0 4px' }}>{spaceName}</p>}
        <p style={{ fontSize: '15px', color: '#8E8E93', margin: 0 }}>이제 새로운 공간의 멤버입니다 🎉</p>
        <p style={{ fontSize: '13px', color: '#C7C7CC', marginTop: '32px' }}>잠시 후 관리 페이지로 이동합니다...</p>
      </div>
    );
  }

  // ── 이미 멤버 ─────────────────────────────────────────────────────────────────
  if (pageState === 'already_member') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', background: '#FAFAFD' }}>
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(0,132,204,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', marginBottom: '24px' }}>🏠</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px' }}>이미 멤버예요</h1>
        {spaceName && <p style={{ fontSize: '16px', fontWeight: 700, color: '#0084CC', margin: '0 0 4px' }}>{spaceName}</p>}
        <p style={{ fontSize: '14px', color: '#8E8E93', margin: '8px 0 0' }}>이미 이 공간에 속해 있습니다</p>
        <button onClick={() => router.replace('/space')} style={{ marginTop: '40px', width: '100%', maxWidth: '360px', height: '56px', borderRadius: '20px', background: '#0084CC', boxShadow: '0 8px 24px rgba(0,132,204,0.35)', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: 'white' }}>
          공간 관리로 이동
        </button>
      </div>
    );
  }

  // ── 유효하지 않은 코드 ───────────────────────────────────────────────────────
  if (pageState === 'invalid_code') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', background: '#FAFAFD' }}>
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="rgba(239,68,68,0.12)"/>
            <path d="M17 17L31 31M31 17L17 31" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px' }}>유효하지 않은 초대 코드</h1>
        <p style={{ fontSize: '14px', color: '#8E8E93' }}>초대 링크가 만료되었거나 올바르지 않습니다.<br />새로운 링크를 요청해 주세요.</p>
        <button onClick={() => router.replace('/home')} style={{ marginTop: '40px', width: '100%', maxWidth: '360px', height: '56px', borderRadius: '20px', background: '#0084CC', boxShadow: '0 8px 24px rgba(0,132,204,0.35)', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: 'white' }}>
          홈으로 이동
        </button>
      </div>
    );
  }

  // ── 만료된 코드 ───────────────────────────────────────────────────────────────
  if (pageState === 'expired_code') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', background: '#FAFAFD' }}>
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(245,158,11,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', marginBottom: '24px' }}>⏰</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px' }}>만료된 초대 코드</h1>
        <p style={{ fontSize: '14px', color: '#8E8E93' }}>이 초대 링크는 유효 기간이 지났습니다.<br />공간 관리자에게 새 초대 코드를 요청해 주세요.</p>
        <button onClick={() => router.replace('/home')} style={{ marginTop: '40px', width: '100%', maxWidth: '360px', height: '56px', borderRadius: '20px', background: '#0084CC', boxShadow: '0 8px 24px rgba(0,132,204,0.35)', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: 'white' }}>
          홈으로 이동
        </button>
      </div>
    );
  }

  // ── Rate Limit ────────────────────────────────────────────────────────────────
  if (pageState === 'rate_limited') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', background: '#FAFAFD' }}>
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', marginBottom: '24px' }}>🚫</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px' }}>잠시 후 시도해주세요</h1>
        <p style={{ fontSize: '14px', color: '#8E8E93' }}>너무 많은 시도가 있었습니다.<br />10분 후 다시 시도해 주세요.</p>
        <button onClick={() => router.replace('/home')} style={{ marginTop: '40px', width: '100%', maxWidth: '360px', height: '56px', borderRadius: '20px', background: '#0084CC', boxShadow: '0 8px 24px rgba(0,132,204,0.35)', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: 'white' }}>
          홈으로 이동
        </button>
      </div>
    );
  }

  // ── 에러 fallback ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', background: '#FAFAFD' }}>
      <p style={{ fontSize: '16px', fontWeight: 700, color: '#1A1B2E' }}>오류가 발생했습니다</p>
      <button onClick={() => router.replace('/home')} style={{ marginTop: '24px', padding: '12px 32px', borderRadius: '16px', background: '#0084CC', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: 'white' }}>
        홈으로
      </button>
    </div>
  );
}
