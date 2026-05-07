'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { joinSpaceByCode } from '@/lib/db';

export function MobileFamily() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const { spaceId, refresh: refreshUser } = useCurrentUser();
  const { space: group, members, loading, refresh } = useSpace(spaceId);
  const router = useRouter();

  const inviteLink = group?.inviteCode ? `https://gleaum.com/invite/${group.inviteCode}` : '';

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    const result = await joinSpaceByCode(joinCode.trim().toUpperCase());
    setJoining(false);
    if (result.success) {
      await refreshUser();
      await refresh();
      setShowJoinModal(false);
      setJoinCode('');
    } else {
      setJoinError('유효하지 않은 공간 코드입니다.');
    }
  };

  return (
    <div
      className="min-h-dvh"
      style={{ background: '#FAFAFD', paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}
    >
      {/* ── Sticky frosted header ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: 'calc(env(safe-area-inset-top) + 12px) 20px 14px',
        background: 'rgba(250,250,253,0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.80)',
              border: '1px solid rgba(0,0,0,0.06)',
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B2E', letterSpacing: '-0.5px', margin: 0 }}>
            공간 관리
          </h1>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '120px', gap: '16px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '3px solid #0084CC',
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#8E8E93' }}>공간 정보를 불러오는 중...</p>
        </div>
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* ── Hero dark gradient card ── */}
          <div style={{ padding: '0 16px', marginTop: '20px', marginBottom: '32px' }}>
            <div style={{
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
              borderRadius: '32px',
              padding: '32px 28px',
              color: 'white',
              boxShadow: '0 16px 48px rgba(26,27,46,0.28)',
            }}>
              {/* Glow blobs */}
              <div style={{
                position: 'absolute', top: '-50px', right: '-50px',
                width: '200px', height: '200px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,132,204,0.25) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', bottom: '-30px', left: '-30px',
                width: '160px', height: '160px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(12,201,181,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {/* House tile */}
                <div style={{
                  width: '80px', height: '80px', borderRadius: '28px',
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '40px',
                  marginBottom: '20px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
                }}>
                  🏠
                </div>

                {/* Space name */}
                <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.6px' }}>
                  {group?.name ?? '나의 공간'}
                </h2>

                {/* Member count badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 16px', borderRadius: '999px',
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  marginBottom: '24px',
                }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0CC9B5' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.80)' }}>
                    {members.length}명의 멤버
                  </span>
                </div>

                {/* Invite code block */}
                {group?.inviteCode && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '24px',
                    padding: '20px 20px',
                  }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginBottom: '10px' }}>
                      SPACE INVITE CODE
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{ fontSize: '26px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '6px', color: '#0CC9B5' }}>
                        {group.inviteCode}
                      </span>
                      <button
                        onClick={copyInviteLink}
                        style={{
                          padding: '10px 20px', borderRadius: '14px',
                          background: 'white', border: 'none', cursor: 'pointer',
                          fontSize: '13px', fontWeight: 800, color: '#1A1B2E',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      >
                        {copied ? '복사됨 ✓' : '코드 복사'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Members section ── */}
          <div style={{ padding: '0 16px', marginBottom: '32px' }}>
            {/* Section heading */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '4px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1A1B2E', margin: 0 }}>
                공간 멤버
              </h3>
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', fontWeight: 800, color: '#0084CC',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                }}
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span>
                멤버 초대
              </button>
            </div>

            {/* Member cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '18px',
                    background: '#F5F5F7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px', flexShrink: 0,
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    {member.avatar}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px',
                        fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase',
                        background: member.role === 'parent' ? 'rgba(0,132,204,0.10)' : 'rgba(12,201,181,0.10)',
                        color: member.role === 'parent' ? '#0084CC' : '#0CC9B5',
                      }}>
                        {member.role === 'parent' ? 'Admin' : 'Member'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.email || '연결됨'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Join new space button */}
              <button
                onClick={() => setShowJoinModal(true)}
                style={{
                  width: '100%',
                  padding: '20px',
                  borderRadius: '20px',
                  border: '2px dashed #E5E5EA',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#8E8E93',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '20px' }}>🗝️</span>
                새로운 공간 합류
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invite modal ── */}
      {showInviteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.50)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              background: 'white',
              borderRadius: '32px 32px 0 0',
              padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '24px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: '#E5E5EA' }} />
            </div>

            {/* Icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '24px',
              background: 'rgba(0,132,204,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', margin: '0 auto 20px',
            }}>
              🔗
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1B2E', textAlign: 'center', margin: '0 0 8px' }}>
              멤버 초대하기
            </h3>
            <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, textAlign: 'center', lineHeight: 1.6, margin: '0 0 28px' }}>
              초대 링크를 공유하여 소중한 사람들을<br />이 공간으로 초대하세요.
            </p>

            <button
              onClick={copyInviteLink}
              style={{
                width: '100%', height: '58px', borderRadius: '18px',
                background: '#1A1B2E', border: 'none', cursor: 'pointer',
                fontSize: '16px', fontWeight: 800, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              {copied ? '링크 복사 완료 ✓' : '초대 링크 복사하기'}
            </button>
            <button
              onClick={() => setShowInviteModal(false)}
              style={{
                width: '100%', height: '58px', borderRadius: '18px',
                background: '#F5F5F7', border: 'none', cursor: 'pointer',
                fontSize: '15px', fontWeight: 800, color: '#8E8E93',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ── Join modal ── */}
      {showJoinModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.50)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowJoinModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              background: 'white',
              borderRadius: '32px 32px 0 0',
              padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '24px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: '#E5E5EA' }} />
            </div>

            {/* Icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '24px',
              background: 'rgba(12,201,181,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', margin: '0 auto 20px',
            }}>
              🗝️
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1B2E', textAlign: 'center', margin: '0 0 8px' }}>
              공간 참여하기
            </h3>
            <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>
              공유받은 참여 코드를 입력해 주세요.
            </p>

            {/* Code input */}
            <input
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
              placeholder="참여 코드 입력"
              style={{
                width: '100%',
                height: '60px',
                padding: '0 20px',
                borderRadius: '18px',
                fontSize: '22px',
                fontFamily: 'monospace',
                fontWeight: 900,
                textAlign: 'center',
                textTransform: 'uppercase',
                background: '#F5F5F7',
                border: `2px solid ${joinError ? '#EF4444' : joinCode ? '#0CC9B5' : 'transparent'}`,
                outline: 'none',
                boxSizing: 'border-box',
                letterSpacing: '4px',
                color: '#1A1B2E',
                marginBottom: '8px',
              }}
            />
            {joinError && (
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444', textAlign: 'center', marginBottom: '12px' }}>
                {joinError}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={handleJoin}
                disabled={joining || !joinCode.trim()}
                style={{
                  width: '100%', height: '58px', borderRadius: '18px',
                  background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                  border: 'none', cursor: joining || !joinCode.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '16px', fontWeight: 800, color: 'white',
                  opacity: joining || !joinCode.trim() ? 0.5 : 1,
                }}
              >
                {joining ? '확인 중...' : '참여 완료'}
              </button>
              <button
                onClick={() => setShowJoinModal(false)}
                style={{
                  width: '100%', height: '58px', borderRadius: '18px',
                  background: '#F5F5F7', border: 'none', cursor: 'pointer',
                  fontSize: '15px', fontWeight: 800, color: '#8E8E93',
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
