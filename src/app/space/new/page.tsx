'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSpace, updateSpaceSettings } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import type { SpacePurpose } from '@/types';

// ── 공간 목적 옵션 ─────────────────────────────────────────
const PURPOSES: Array<{ key: SpacePurpose; label: string; desc: string; emoji: string; color: string; bg: string }> = [
  { key: 'family',  label: '가족',     desc: '가족과 함께하는 일정 · 살림',     emoji: '👨‍👩‍👧‍👦', color: '#0084CC', bg: 'rgba(0,132,204,0.08)' },
  { key: 'couple',  label: '커플',     desc: '연인과 나누는 소중한 순간',         emoji: '💑',      color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  { key: 'friends', label: '친구 모임', desc: '친구들과 만들어가는 추억',          emoji: '🙌',      color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  { key: 'work',    label: '업무 팀',  desc: '팀원들과 효율적인 협업',            emoji: '💼',      color: '#0CC9B5', bg: 'rgba(12,201,181,0.08)' },
  { key: 'other',   label: '기타',     desc: '나만의 방식으로 자유롭게',          emoji: '✨',      color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
];

const TOTAL_STEPS = 4;

type KakaoShareWindow = Window & {
  Kakao?: {
    Share?: {
      sendDefault: (payload: {
        objectType: 'feed';
        content: {
          title: string;
          description: string;
          imageUrl: string;
          link: { mobileWebUrl: string; webUrl: string };
        };
        buttons: Array<{ title: string; link: { mobileWebUrl: string; webUrl: string } }>;
      }) => void;
    };
  };
};

export default function SpaceNewPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { refresh } = useCurrentUser();

  const [step,         setStep]         = useState(1);
  const [spaceName,    setSpaceName]    = useState('');
  const [purpose,      setPurpose]      = useState<SpacePurpose | null>(null);
  const [creating,     setCreating]     = useState(false);
  const [createdId,    setCreatedId]    = useState<string | null>(null);
  const [inviteLink,   setInviteLink]   = useState('');
  const [linkCopied,   setLinkCopied]   = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // ── 공간 생성 (step3 완료 시) ─────────────────────────────
  const handleCreate = async () => {
    if (!spaceName.trim()) {
      toast.error('공간 이름을 입력해주세요');
      setStep(2);
      return;
    }
    if (!purpose) {
      toast.error('공간 목적을 선택해주세요');
      return;
    }
    setCreating(true);
    try {
      const result = await createSpace(spaceName.trim());
      if (!result.id) {
        toast.error(`공간 생성 실패: ${result.error ?? '알 수 없는 오류'}`, { duration: 8000 });
        return;
      }
      const spaceId = result.id;
      const inviteCode = result.inviteCode;

      // settings 저장 — 실패해도 공간 생성은 계속 진행
      await updateSpaceSettings(spaceId, {
        purpose,
        scheduleTypes: ['공지', '약속', '활동', '행사', '기타'],
      }).catch(e => console.warn('[onboarding] settings 저장 실패:', e));

      // 캐시 갱신
      await refresh().catch(e => console.warn('[onboarding] refresh 실패:', e));

      // Analytics: 공간 생성 이벤트
      void trackEvent('space_create', { space_intent: purpose });

      setCreatedId(spaceId);
      // ★ 초대 링크는 invite_code 기반 URL 사용 (보안 + Rate Limit 보장)
      setInviteLink(`https://gleaum.com/invite/${inviteCode}`);
      setStep(4);
    } catch (e) {
      console.error('[handleCreate]', e);
      toast.error(`오류: ${e instanceof Error ? e.message : String(e)}`, { duration: 8000 });
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const shareKakao = async () => {
    const shareData = {
      title: `${spaceName} 공간 초대`,
      text: `글리움에서 "${spaceName}" 공간에 초대되었어요! 함께 일정을 공유해보세요 🎉`,
      url: inviteLink,
    };
    // 1) 네이티브 공유 시트 (모바일에서 카카오톡 포함)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }
    // 2) Kakao SDK 있으면 사용
    const kakao = typeof window !== 'undefined' ? (window as KakaoShareWindow).Kakao : undefined;
    if (kakao?.Share) {
      kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${spaceName} 공간에 초대합니다`,
          description: '글리움 공간에 참여해서 함께 일정을 공유해보세요!',
          imageUrl: 'https://gleaum.com/img/og_image.png',
          link: { mobileWebUrl: inviteLink, webUrl: inviteLink },
        },
        buttons: [{ title: '공간 참여하기', link: { mobileWebUrl: inviteLink, webUrl: inviteLink } }],
      });
      return;
    }
    // 3) fallback: 링크 복사
    copyLink();
  };

  // 새로 만든 공간 ID를 쿼리 파라미터로 넘겨 MobileSpace가 올바른 공간을 표시하게 함
  const goToSpace = () => {
    // localStorage에 새 공간 ID 저장 → MobileSpace가 이 공간을 우선 표시
    if (createdId) {
      try { localStorage.setItem('gleaum_lastSpaceId', createdId); } catch {}
    }
    router.replace(createdId ? `/space?sid=${createdId}` : '/space');
  };
  const skip = () => router.replace('/space');

  if (isDesktop) {
    const desktopPurposeColor: Record<SpacePurpose, string> = {
      family: '#0084CC',
      couple: '#0CC9B5',
      friends: '#2EE895',
      work: '#1A1B2E',
      other: '#F59E0B',
    };
    const selectedPurpose = purpose ? PURPOSES.find(p => p.key === purpose) : null;

    return (
      <main style={{
        minHeight: '100dvh',
        background: '#FAFAFD',
        padding: '44px 48px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-140px', left: '-120px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,232,149,0.16), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-150px', right: '-120px', width: '460px', height: '460px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,132,204,0.13), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{
          maxWidth: '1180px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 0.86fr) minmax(520px, 1.14fr)',
          gap: '28px',
          alignItems: 'stretch',
        }}>
          <aside style={{
            borderRadius: '32px',
            background: 'linear-gradient(150deg, #1A1B2E 0%, #2D2E4A 58%, #0D3145 100%)',
            color: 'white',
            padding: '36px',
            minHeight: 'calc(100dvh - 108px)',
            boxShadow: '0 24px 70px rgba(26,27,46,0.18)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(12,201,181,0.22), transparent 70%)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <button
                onClick={skip}
                style={{
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.82)',
                  borderRadius: '999px',
                  padding: '9px 15px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginBottom: '32px',
                }}
              >
                ← 공간으로 돌아가기
              </button>
              <p style={{ fontSize: '11px', fontWeight: 900, color: '#0CC9B5', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                New Space
              </p>
              <h1 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.08, margin: '0 0 18px' }}>
                함께 관리할<br />공간을 만드세요.
              </h1>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.62)', lineHeight: 1.75, margin: 0 }}>
                친구, 연인, 가족, 팀까지. 공간은 일정과 지출을 함께 묶어 관리하는 글리움의 확장 단위입니다.
              </p>
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '12px' }}>
              {[
                { icon: '📅', title: '공간 일정', desc: '멤버가 함께 보는 일정 흐름' },
                { icon: '💰', title: '공유 지출', desc: '공동 비용과 정산 맥락 관리' },
                { icon: '🔗', title: '초대 링크', desc: '코드와 링크로 빠르게 합류' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '15px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <span style={{ width: '44px', height: '44px', borderRadius: '16px', background: 'rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '23px', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 900, margin: '0 0 3px' }}>{item.title}</p>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.52)', margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section style={{
            borderRadius: '32px',
            background: 'rgba(255,255,255,0.84)',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 18px 56px rgba(0,132,204,0.09)',
            padding: '36px',
            minHeight: 'calc(100dvh - 108px)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {!createdId ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '30px' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 900, color: '#8E8E93', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>
                      Space Setup
                    </p>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1A1B2E', letterSpacing: '-0.04em', margin: '0 0 8px' }}>
                      공간 기본값 설정
                    </h2>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#8E8E93', lineHeight: 1.65, margin: 0 }}>
                      이름과 목적만 정하면 바로 초대 링크를 만들 수 있습니다.
                    </p>
                  </div>
                  <span style={{ padding: '8px 13px', borderRadius: '999px', background: 'rgba(0,132,204,0.08)', color: '#0084CC', fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap' }}>
                    빠른 생성
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '26px', flex: 1 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, color: '#1A1B2E', marginBottom: '10px' }}>
                      공간 이름
                    </label>
                    <input
                      ref={nameInputRef}
                      value={spaceName}
                      onChange={(e) => setSpaceName(e.target.value)}
                      placeholder="예: 우리집, 제주 여행 모임, 프로젝트 팀"
                      maxLength={30}
                      style={{
                        width: '100%',
                        height: '58px',
                        padding: '0 18px',
                        borderRadius: '18px',
                        border: `2px solid ${spaceName.trim() ? '#0CC9B5' : '#E8E8E4'}`,
                        background: spaceName.trim() ? 'white' : '#F5F5F3',
                        color: '#1A1B2E',
                        outline: 'none',
                        fontSize: '17px',
                        fontWeight: 800,
                        boxSizing: 'border-box',
                        boxShadow: spaceName.trim() ? '0 0 0 4px rgba(12,201,181,0.10)' : 'none',
                      }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {['우리집', '커플 공간', '친구 모임', '여행 준비', '프로젝트 팀'].map(s => (
                        <button
                          key={s}
                          onClick={() => setSpaceName(s)}
                          style={{ height: '34px', padding: '0 14px', borderRadius: '999px', border: '1.5px solid #E8E8E4', background: 'white', color: '#6E6E66', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 12px' }}>공간 목적</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      {PURPOSES.map(p => {
                        const active = purpose === p.key;
                        const color = desktopPurposeColor[p.key];
                        return (
                          <button
                            key={p.key}
                            onClick={() => setPurpose(p.key)}
                            style={{
                              minHeight: '94px',
                              padding: '18px',
                              borderRadius: '22px',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              cursor: 'pointer',
                              background: active ? `${color}12` : 'white',
                              border: `2px solid ${active ? `${color}55` : '#E8E8E4'}`,
                              boxShadow: active ? `0 8px 24px ${color}18` : '0 2px 10px rgba(0,0,0,0.035)',
                            }}
                          >
                            <span style={{ width: '48px', height: '48px', borderRadius: '17px', background: active ? color : '#F5F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '25px', flexShrink: 0 }}>
                              {p.emoji}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '15px', fontWeight: 900, color: active ? color : '#1A1B2E', margin: '0 0 3px' }}>{p.label}</p>
                              <p style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', margin: 0, lineHeight: 1.45 }}>{p.desc}</p>
                            </div>
                            {active && (
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93', margin: 0 }}>
                    {selectedPurpose ? `${selectedPurpose.label} 목적의 공간으로 시작합니다.` : '공간 목적을 선택해 주세요.'}
                  </p>
                  <button
                    onClick={handleCreate}
                    disabled={!spaceName.trim() || !purpose || creating}
                    style={{
                      minWidth: '174px',
                      height: '54px',
                      borderRadius: '999px',
                      border: 'none',
                      background: spaceName.trim() && purpose && !creating
                        ? 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)'
                        : '#E8E8E4',
                      color: spaceName.trim() && purpose && !creating ? 'white' : '#AEAEA8',
                      cursor: spaceName.trim() && purpose && !creating ? 'pointer' : 'not-allowed',
                      boxShadow: spaceName.trim() && purpose && !creating ? '0 10px 28px rgba(0,132,204,0.28)' : 'none',
                      fontSize: '15px',
                      fontWeight: 900,
                    }}
                  >
                    {creating ? '공간 생성 중...' : '공간 만들기'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '78px', height: '78px', borderRadius: '26px', background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', boxShadow: '0 12px 32px rgba(0,132,204,0.26)', marginBottom: '26px' }}>
                  🎉
                </div>
                <p style={{ fontSize: '11px', fontWeight: 900, color: '#0CC9B5', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>
                  Space Created
                </p>
                <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#1A1B2E', letterSpacing: '-0.04em', lineHeight: 1.15, margin: '0 0 12px' }}>
                  <span style={{ color: '#0084CC' }}>{spaceName}</span> 공간이<br />준비되었습니다.
                </h2>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#8E8E93', lineHeight: 1.7, margin: '0 0 30px' }}>
                  초대 링크를 공유하거나 바로 공간으로 이동해 첫 일정을 등록해 보세요.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '28px' }}>
                  {[
                    { title: '초대 링크 복사', desc: linkCopied ? '복사 완료' : '링크를 전달하세요', icon: '🔗', onClick: copyLink },
                    { title: '카카오톡 공유', desc: '친구에게 바로 전달', icon: '💬', onClick: shareKakao },
                    {
                      title: '공유 시트',
                      desc: '연락처/메신저 선택',
                      icon: '📱',
                      onClick: () => {
                        if (navigator.share) navigator.share({ title: `${spaceName} 공간 초대`, url: inviteLink });
                        else copyLink();
                      },
                    },
                  ].map(item => (
                    <button
                      key={item.title}
                      onClick={item.onClick}
                      style={{ minHeight: '132px', borderRadius: '24px', border: '1.5px solid #E8E8E4', background: 'white', cursor: 'pointer', padding: '18px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    >
                      <span style={{ width: '44px', height: '44px', borderRadius: '16px', background: 'rgba(0,132,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{item.icon}</span>
                      <span>
                        <strong style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#1A1B2E', marginBottom: '4px' }}>{item.title}</strong>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93' }}>{item.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <code style={{ display: 'block', borderRadius: '20px', background: '#F5F5F3', border: '1.5px solid rgba(0,132,204,0.14)', padding: '18px 20px', color: '#0084CC', fontSize: '13px', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 'auto' }}>
                  {inviteLink}
                </code>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '30px' }}>
                  <button
                    onClick={goToSpace}
                    style={{ height: '52px', padding: '0 24px', borderRadius: '999px', border: '1.5px solid #E8E8E4', background: 'white', color: '#6E6E66', cursor: 'pointer', fontSize: '14px', fontWeight: 900 }}
                  >
                    나중에 초대
                  </button>
                  <button
                    onClick={goToSpace}
                    style={{ height: '52px', padding: '0 28px', borderRadius: '999px', border: 'none', background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', color: 'white', cursor: 'pointer', boxShadow: '0 10px 28px rgba(0,132,204,0.28)', fontSize: '14px', fontWeight: 900 }}
                  >
                    공간 시작하기
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  // ── 공통 레이아웃 ─────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FAFAFD',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
    }}>

      {/* Progress bar */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18L9 12L15 6"/>
              </svg>
            </button>
          )}
          {step === 1 && <div style={{ width: '30px' }} />}
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93' }}>{step} / {TOTAL_STEPS}</span>
          <button
            onClick={skip}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#8E8E93', padding: '4px 0' }}
          >
            건너뛰기
          </button>
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} style={{
              flex: i + 1 === step ? 2 : 1,
              height: '4px', borderRadius: '999px',
              background: i + 1 <= step ? '#0084CC' : '#E5E5EA',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>

      {/* ── Step 1: 공간 소개 ── */}
      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px 0' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Illustration */}
            <div style={{
              width: '140px', height: '140px', borderRadius: '40px',
              background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '64px', marginBottom: '36px',
              boxShadow: '0 20px 60px rgba(26,27,46,0.25)',
            }}>🏠</div>

            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 16px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              공간이란<br />무엇인가요?
            </h1>
            <p style={{ fontSize: '16px', fontWeight: 500, color: '#8E8E93', lineHeight: 1.7, margin: '0 0 48px', maxWidth: '320px' }}>
              공간은 가족, 연인, 친구 등<br />나만의 그룹을 만들어<br />
              <strong style={{ color: '#0084CC' }}>일정 · 지출 · 정보</strong>를<br />함께 공유하는 곳입니다.
            </p>

            {/* Feature chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
              {[
                { icon: '📅', title: '공간 일정 공유', desc: '멤버 모두의 일정을 한눈에' },
                { icon: '💰', title: '가계부 함께 관리', desc: '공유 지출을 투명하게' },
                { icon: '🔔', title: '실시간 알림', desc: '중요 일정을 놓치지 않게' },
              ].map(f => (
                <div key={f.title} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 18px', borderRadius: '16px',
                  background: 'white', border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'left',
                }}>
                  <span style={{ fontSize: '26px' }}>{f.icon}</span>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>{f.title}</p>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#8E8E93', margin: '2px 0 0' }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            style={{
              width: '100%', height: '58px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
              border: 'none', cursor: 'pointer',
              fontSize: '17px', fontWeight: 800, color: 'white',
              boxShadow: '0 8px 24px rgba(0,132,204,0.35)',
              marginTop: '32px',
            }}
          >
            공간 만들어보기 →
          </button>
        </div>
      )}

      {/* ── Step 2: 공간 이름 ── */}
      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 24px 0' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0084CC', letterSpacing: '0.5px' }}>STEP 2</span>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1A1B2E', margin: '8px 0 10px', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
              공간 이름을<br />정해주세요
            </h1>
            <p style={{ fontSize: '14px', color: '#8E8E93', margin: '0 0 36px', lineHeight: 1.6 }}>
              나중에 언제든지 변경할 수 있어요
            </p>

            <input
              ref={nameInputRef}
              value={spaceName}
              onChange={e => setSpaceName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && spaceName.trim() && setStep(3)}
              placeholder="공간 이름 입력"
              autoFocus
              maxLength={30}
              style={{
                width: '100%', height: '60px', padding: '0 20px',
                borderRadius: '18px', fontSize: '19px', fontWeight: 700,
                background: 'white', border: `2px solid ${spaceName ? '#0084CC' : '#E5E5EA'}`,
                outline: 'none', color: '#1A1B2E', boxSizing: 'border-box',
                boxShadow: spaceName ? '0 0 0 4px rgba(0,132,204,0.12)' : 'none',
                transition: 'all 0.15s',
              }}
            />

            {/* Suggestions */}
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', margin: '20px 0 12px' }}>추천 예시</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['우리 가족 🏠', '오늘도 사랑해 💕', '친구들 모임 🙌', '우리 팀 💼', '소중한 우리 ✨'].map(s => (
                <button
                  key={s}
                  onClick={() => setSpaceName(s.replace(/\s*[🏠💕🙌💼✨]/u, '').trim())}
                  style={{
                    padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 700,
                    background: 'white', border: '1.5px solid #E5E5EA',
                    color: '#1A1B2E', cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >{s}</button>
              ))}
            </div>
          </div>

          <button
            onClick={() => spaceName.trim() && setStep(3)}
            disabled={!spaceName.trim()}
            style={{
              width: '100%', height: '58px', borderRadius: '18px',
              background: spaceName.trim()
                ? 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)'
                : '#E5E5EA',
              border: 'none', cursor: spaceName.trim() ? 'pointer' : 'not-allowed',
              fontSize: '17px', fontWeight: 800,
              color: spaceName.trim() ? 'white' : '#AEAEB2',
              boxShadow: spaceName.trim() ? '0 8px 24px rgba(0,132,204,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            다음
          </button>
        </div>
      )}

      {/* ── Step 3: 목적 선택 ── */}
      {step === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 24px 0' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0084CC', letterSpacing: '0.5px' }}>STEP 3</span>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1A1B2E', margin: '8px 0 10px', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
              어떤 목적으로<br />사용하실 건가요?
            </h1>
            <p style={{ fontSize: '14px', color: '#8E8E93', margin: '0 0 28px', lineHeight: 1.6 }}>
              목적에 맞게 기본 설정이 최적화됩니다
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PURPOSES.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPurpose(p.key)}
                  style={{
                    padding: '18px 20px', borderRadius: '18px', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                    background: purpose === p.key ? p.bg : 'white',
                    border: `2px solid ${purpose === p.key ? p.color + '50' : '#E5E5EA'}`,
                    boxShadow: purpose === p.key ? `0 4px 16px ${p.color}20` : '0 1px 4px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '32px', flexShrink: 0 }}>{p.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: purpose === p.key ? p.color : '#1A1B2E', margin: 0 }}>
                      {p.label}
                    </p>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#8E8E93', margin: '2px 0 0' }}>
                      {p.desc}
                    </p>
                  </div>
                  {purpose === p.key && (
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!purpose || creating}
            style={{
              width: '100%', height: '58px', borderRadius: '18px', marginTop: '28px',
              background: purpose && !creating
                ? 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)'
                : '#E5E5EA',
              border: 'none', cursor: purpose && !creating ? 'pointer' : 'not-allowed',
              fontSize: '17px', fontWeight: 800,
              color: purpose && !creating ? 'white' : '#AEAEB2',
              boxShadow: purpose && !creating ? '0 8px 24px rgba(0,132,204,0.35)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s',
            }}
          >
            {creating ? (
              <>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                공간 생성 중...
              </>
            ) : '공간 만들기 🎉'}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Step 4: 멤버 초대 ── */}
      {step === 4 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 24px 0' }}>
          <div style={{ flex: 1 }}>
            {/* Success badge */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '28px',
              background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '42px', marginBottom: '28px',
              boxShadow: '0 8px 24px rgba(0,132,204,0.30)',
            }}>🎉</div>

            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 10px', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
              <span style={{ color: '#0084CC' }}>{spaceName}</span><br />공간이 만들어졌어요!
            </h1>
            <p style={{ fontSize: '14px', color: '#8E8E93', margin: '0 0 36px', lineHeight: 1.6 }}>
              멤버를 초대해 함께 시작해보세요.<br />지금 초대하지 않아도 나중에 할 수 있어요.
            </p>

            {/* Invite options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {/* Link copy */}
              <button
                onClick={copyLink}
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: '18px', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                  background: linkCopied ? 'rgba(0,132,204,0.06)' : 'white',
                  border: `2px solid ${linkCopied ? 'rgba(0,132,204,0.30)' : '#E5E5EA'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(0,132,204,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🔗</div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>초대 링크 복사</p>
                  <p style={{ fontSize: '12px', color: '#8E8E93', margin: '2px 0 0' }}>
                    {linkCopied ? '✓ 링크가 복사되었어요!' : '링크를 공유해 초대하세요'}
                  </p>
                </div>
              </button>

              {/* KakaoTalk */}
              <button
                onClick={shareKakao}
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: '18px', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                  background: 'white', border: '2px solid #E5E5EA',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#FEE500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>💬</div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>카카오톡으로 공유</p>
                  <p style={{ fontSize: '12px', color: '#8E8E93', margin: '2px 0 0' }}>카카오 친구에게 바로 전달</p>
                </div>
              </button>

              {/* Contacts (native share) */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: `${spaceName} 공간 초대`, url: inviteLink });
                  } else {
                    copyLink();
                  }
                }}
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: '18px', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                  background: 'white', border: '2px solid #E5E5EA',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(52,199,89,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📱</div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>연락처에서 초대</p>
                  <p style={{ fontSize: '12px', color: '#8E8E93', margin: '2px 0 0' }}>스마트폰 연락처 공유 기능 활용</p>
                </div>
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={goToSpace}
              style={{
                width: '100%', height: '58px', borderRadius: '18px',
                background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                border: 'none', cursor: 'pointer',
                fontSize: '17px', fontWeight: 800, color: 'white',
                boxShadow: '0 8px 24px rgba(0,132,204,0.35)',
              }}
            >
              공간 시작하기
            </button>
            <button
              onClick={goToSpace}
              style={{
                width: '100%', height: '52px', borderRadius: '18px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '15px', fontWeight: 700, color: '#8E8E93',
              }}
            >
              나중에 초대하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
