'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSpace, updateSpaceSettings } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
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

export default function SpaceNewPage() {
  const router = useRouter();
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
    if (!spaceName.trim()) return;
    setCreating(true);
    try {
      const spaceId = await createSpace(spaceName.trim());
      if (!spaceId) throw new Error('생성 실패');

      // settings 저장 (purpose + 기본 일정 유형)
      await updateSpaceSettings(spaceId, {
        purpose: purpose ?? 'other',
        scheduleTypes: ['공지', '약속', '활동', '행사', '기타'],
      });

      await refresh();
      setCreatedId(spaceId);
      // 초대 링크 생성 (inviteCode는 별도 조회 필요, 여기서는 경로 기반)
      setInviteLink(`https://gleaum.com/space/${spaceId}/join`);
      setStep(4);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const shareKakao = () => {
    // Kakao SDK가 있으면 실제 공유, 없으면 링크만 복사
    if (typeof window !== 'undefined' && (window as any).Kakao?.Share) {
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${spaceName} 공간에 초대합니다`,
          description: '글리움 공간에 참여해서 함께 일정을 공유해보세요!',
          imageUrl: 'https://gleaum.com/og_image.png',
          link: { mobileWebUrl: inviteLink, webUrl: inviteLink },
        },
        buttons: [{ title: '공간 참여하기', link: { mobileWebUrl: inviteLink, webUrl: inviteLink } }],
      });
    } else {
      copyLink();
    }
  };

  const goToSpace = () => router.replace('/space');
  const skip       = () => router.replace('/space');

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
