'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getBlockedBrowserInfo, tryOpenInChrome, type BlockedBrowserInfo } from '@/lib/browser';

type PageState = 'loading' | 'joining' | 'success' | 'already_member' | 'invalid_code' | 'expired_code' | 'rate_limited' | 'error';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = typeof params.code === 'string' ? params.code.toUpperCase() : '';
  const { user, spaceId, loading: userLoading } = useCurrentUser();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [spaceName, setSpaceName] = useState<string>('');
  const [blockedBrowser, setBlockedBrowser] = useState<BlockedBrowserInfo | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  // ★ 인앱 브라우저 감지 — Google OAuth 차단 환경 조기 차단
  useEffect(() => {
    const info = getBlockedBrowserInfo();
    if (!info) return;
    setBlockedBrowser(info);
    // Android: Chrome intent: scheme으로 자동 리다이렉트 시도
    if (info.canAutoRedirect) {
      setTimeout(() => tryOpenInChrome(window.location.href), 400);
    }
  }, []);

  useEffect(() => {
    // 유저 로딩 중이면 대기
    if (userLoading) return;

    // 비로그인 → 로그인 페이지로 (next 파라미터로 현재 경로 전달)
    if (!user) {
      router.replace(`/login?next=/invite/${code}`);
      return;
    }

    // 로그인 상태 → 서버 API로 합류 시도 (Rate Limit + 만료 검증 포함)
    const doJoin = async () => {
      setPageState('joining');

      try {
        const res = await fetch('/api/invite/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (res.status === 429) {
          setPageState('rate_limited');
          return;
        }
        if (res.status === 410) {
          setPageState('expired_code');
          return;
        }
        if (res.status === 404) {
          setPageState('invalid_code');
          return;
        }

        const data = await res.json();

        if (data.alreadyMember) {
          setSpaceName(data.spaceName ?? '');
          setPageState('already_member');
        } else if (data.success) {
          setSpaceName(data.spaceName ?? '');
          setPageState('success');
          // 2초 후 /space(공간관리)로 이동
          setTimeout(() => router.replace('/space'), 2000);
        } else {
          setPageState('invalid_code');
        }
      } catch {
        setPageState('error');
      }
    };

    doJoin();
  }, [user, userLoading, code, router]);

  // ── 인앱 브라우저 차단 안내 (Google OAuth 불가 환경) ──
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

          {/* 경고 아이콘 */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 16px',
              background: 'rgba(245,158,11,0.15)',
              border: '1.5px solid rgba(245,158,11,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
            }}>🚫</div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'white', margin: '0 0 10px', letterSpacing: '-0.4px', lineHeight: 1.3 }}>
              {blockedBrowser.appName} 내부 브라우저에서는<br />구글 로그인이 지원되지 않아요
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>
              Google 정책에 따라 앱 내부 브라우저에서는<br />
              구글 계정 로그인이 차단됩니다.
            </p>
          </div>

          {/* 안내 카드 */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '24px', padding: '24px',
            marginBottom: '20px',
          }}>
            <p style={{ fontSize: '12px', fontWeight: 800, color: '#F59E0B', margin: '0 0 14px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              해결 방법
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0,
                background: 'rgba(245,158,11,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>📱</div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, margin: 0 }}>
                {blockedBrowser.instruction}
              </p>
            </div>
            <div style={{ margin: '16px 0', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0,
                background: 'rgba(12,201,181,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>🔗</div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, margin: 0 }}>
                아래 버튼으로 링크를 복사하여<br />
                {blockedBrowser.isIOS ? 'Safari' : 'Chrome 또는 Safari'}에 붙여넣기 하세요
              </p>
            </div>
          </div>

          {/* URL 복사 버튼 */}
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(currentUrl);
              } catch {
                // fallback: textarea copy
                const el = document.createElement('textarea');
                el.value = currentUrl;
                el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
                document.body.appendChild(el);
                el.focus(); el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
              }
              setUrlCopied(true);
              setTimeout(() => setUrlCopied(false), 3000);
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

          {/* 자동 리다이렉트 안내 (Android) */}
          {blockedBrowser.canAutoRedirect && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.30)', margin: 0, lineHeight: 1.6 }}>
              Chrome 앱이 설치된 경우 자동으로 열립니다.<br />
              열리지 않으면 위 버튼으로 링크를 복사해 주세요.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── 로딩 / 합류 중 ──
  if (pageState === 'loading' || pageState === 'joining') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6"
        style={{ background: '#FAFAFD' }}
      >
        <div style={{
          position: 'fixed', top: '-80px', left: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'fixed', bottom: '-40px', right: '-40px',
          width: '420px', height: '420px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,153,255,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div
          className="w-20 h-20 rounded-[24px] flex items-center justify-center mb-6"
          style={{ background: '#0084CC', boxShadow: '0 12px 40px rgba(0,132,204,0.35)' }}
        >
          <span className="text-4xl">🏠</span>
        </div>

        <div
          className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin mb-4"
          style={{ borderColor: 'rgba(0,132,204,0.2)', borderTopColor: '#0084CC' }}
        />

        <p className="text-[16px] font-bold" style={{ color: '#1A1B2E' }}>
          {pageState === 'joining' ? '공간에 합류하는 중...' : '확인 중...'}
        </p>
        <p className="text-[13px] mt-2" style={{ color: '#8E8E93' }}>잠시만 기다려주세요</p>
      </div>
    );
  }

  // ── 성공 ──
  if (pageState === 'success') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#FAFAFD' }}
      >
        <div style={{
          position: 'fixed', top: '-80px', left: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'fixed', bottom: '-40px', right: '-40px',
          width: '420px', height: '420px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,153,255,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(16,185,129,0.12)' }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="rgba(16,185,129,0.15)"/>
            <path d="M14 24L21 31L34 17" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="text-[28px] font-bold mb-2" style={{ color: '#1A1B2E' }}>
          합류 완료!
        </h1>
        {spaceName && (
          <p className="text-[17px] font-semibold mb-1" style={{ color: '#0084CC' }}>
            {spaceName}
          </p>
        )}
        <p className="text-[15px]" style={{ color: '#8E8E93' }}>
          이제 새로운 공간의 멤버입니다 🎉
        </p>

        <p className="text-[13px] mt-8" style={{ color: '#C7C7CC' }}>
          잠시 후 관리 페이지로 이동합니다...
        </p>
      </div>
    );
  }

  // ── 이미 멤버 ──
  if (pageState === 'already_member') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#FAFAFD' }}
      >
        <div style={{
          position: 'fixed', top: '-80px', left: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(0,132,204,0.10)' }}
        >
          <span className="text-5xl">🏠</span>
        </div>

        <h1 className="text-[28px] font-bold mb-2" style={{ color: '#1A1B2E' }}>
          이미 멤버예요
        </h1>
        {spaceName && (
          <p className="text-[16px] font-semibold mb-1" style={{ color: '#0084CC' }}>
            {spaceName}
          </p>
        )}
        <p className="text-[14px] mt-2" style={{ color: '#8E8E93' }}>
          이미 이 공간에 속해 있습니다
        </p>

        <button
          onClick={() => router.replace('/space')}
          className="mt-10 w-full h-[56px] rounded-[20px] font-bold text-[16px] text-white transition-transform active:scale-[0.97]"
          style={{ background: '#0084CC', boxShadow: '0 8px 24px rgba(0,132,204,0.35)' }}
        >
          공간 관리로 이동
        </button>
      </div>
    );
  }

  // ── 유효하지 않은 코드 ──
  if (pageState === 'invalid_code') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#FAFAFD' }}
      >
        <div style={{
          position: 'fixed', top: '-80px', left: '-80px',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,235,153,0.55) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(239,68,68,0.10)' }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="rgba(239,68,68,0.12)"/>
            <path d="M17 17L31 31M31 17L17 31" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="text-[28px] font-bold mb-2" style={{ color: '#1A1B2E' }}>
          유효하지 않은 초대 코드
        </h1>
        <p className="text-[14px] mt-2" style={{ color: '#8E8E93' }}>
          초대 링크가 만료되었거나 올바르지 않습니다.<br />
          새로운 링크를 요청해 주세요.
        </p>

        <div
          className="mt-6 px-6 py-3 rounded-[16px]"
          style={{ background: 'rgba(239,68,68,0.06)' }}
        >
          <p className="text-[12px]" style={{ color: '#C7C7CC' }}>입력된 코드</p>
          <p className="text-[15px] font-mono font-bold mt-1" style={{ color: '#EF4444' }}>
            {code}
          </p>
        </div>

        <button
          onClick={() => router.replace('/home')}
          className="mt-10 w-full h-[56px] rounded-[20px] font-bold text-[16px] text-white transition-transform active:scale-[0.97]"
          style={{ background: '#0084CC', boxShadow: '0 8px 24px rgba(0,132,204,0.35)' }}
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  // ── 만료된 코드 ──
  if (pageState === 'expired_code') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#FAFAFD' }}
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(245,158,11,0.10)' }}
        >
          <span className="text-5xl">⏰</span>
        </div>
        <h1 className="text-[28px] font-bold mb-2" style={{ color: '#1A1B2E' }}>
          만료된 초대 코드
        </h1>
        <p className="text-[14px] mt-2" style={{ color: '#8E8E93' }}>
          이 초대 링크는 유효 기간이 지났습니다.<br />
          공간 관리자에게 새 초대 코드를 요청해 주세요.
        </p>
        <button
          onClick={() => router.replace('/home')}
          className="mt-10 w-full h-[56px] rounded-[20px] font-bold text-[16px] text-white transition-transform active:scale-[0.97]"
          style={{ background: '#0084CC', boxShadow: '0 8px 24px rgba(0,132,204,0.35)' }}
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  // ── Rate Limit 초과 ──
  if (pageState === 'rate_limited') {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#FAFAFD' }}
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(239,68,68,0.10)' }}
        >
          <span className="text-5xl">🚫</span>
        </div>
        <h1 className="text-[28px] font-bold mb-2" style={{ color: '#1A1B2E' }}>
          잠시 후 시도해주세요
        </h1>
        <p className="text-[14px] mt-2" style={{ color: '#8E8E93' }}>
          너무 많은 시도가 있었습니다.<br />
          10분 후 다시 시도해 주세요.
        </p>
        <button
          onClick={() => router.replace('/home')}
          className="mt-10 w-full h-[56px] rounded-[20px] font-bold text-[16px] text-white transition-transform active:scale-[0.97]"
          style={{ background: '#0084CC', boxShadow: '0 8px 24px rgba(0,132,204,0.35)' }}
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  // ── 에러 (fallback) ──
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#FAFAFD' }}
    >
      <p className="text-[16px] font-bold" style={{ color: '#1A1B2E' }}>오류가 발생했습니다</p>
      <button
        onClick={() => router.replace('/home')}
        className="mt-6 px-8 py-3 rounded-[16px] font-bold text-white"
        style={{ background: '#0084CC' }}
      >
        홈으로
      </button>
    </div>
  );
}
