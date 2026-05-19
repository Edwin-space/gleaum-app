'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { joinSpaceByCode, updateSpaceName, removeSpaceMember, getMySpaces } from '@/lib/db';
import type { Space } from '@/types';

const FREE_MAX_SPACES  = 2;
const FREE_MAX_MEMBERS = 10;

export function MobileSpace() {
  const [showInviteModal, setShowInviteModal]   = useState(false);
  const [showJoinModal,   setShowJoinModal]      = useState(false);
  const [copied,          setCopied]             = useState(false);
  const [joinCode,        setJoinCode]           = useState('');
  const [joining,         setJoining]            = useState(false);
  const [joinError,       setJoinError]          = useState('');

  // Inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName,      setEditName]      = useState('');
  const [saving,        setSaving]        = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // My spaces (for plan limit)
  const [mySpaces, setMySpaces] = useState<Space[]>([]);

  const { spaceId, user, refresh: refreshUser } = useCurrentUser();
  const { space: group, members, myRole, loading, refresh } = useSpace(spaceId);
  const isAdmin = myRole === 'admin';
  const router  = useRouter();

  const inviteLink = group?.inviteCode ? `https://gleaum.com/invite/${group.inviteCode}` : '';

  const memberCount     = members.length;
  const memberAtLimit   = memberCount >= FREE_MAX_MEMBERS;

  useEffect(() => {
    getMySpaces().then(setMySpaces);
  }, [spaceId]);

  const spaceCount   = mySpaces.length;
  const spaceAtLimit = spaceCount >= FREE_MAX_SPACES;

  /* ─── 공간 이름 인라인 편집 ─── */
  const startEditing = () => {
    setEditName(group?.name ?? '');
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const cancelEditing = () => {
    setIsEditingName(false);
    setEditName('');
  };

  const handleSaveName = async () => {
    if (!editName.trim() || !spaceId) return;
    setSaving(true);
    await updateSpaceName(spaceId, editName.trim());
    setSaving(false);
    setIsEditingName(false);
    await refresh();
  };

  /* ─── 멤버 제거 ─── */
  const handleRemoveMember = async (memberId: string) => {
    if (!spaceId) return;
    if (!confirm('이 멤버를 공간에서 제거하시겠습니까?')) return;
    await removeSpaceMember(spaceId, memberId);
    await refresh();
  };

  /* ─── 초대 링크 복사 ─── */
  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  /* ─── 공간 합류 ─── */
  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    const result = await joinSpaceByCode(joinCode.trim().toUpperCase());
    setJoining(false);
    if (result.success) {
      await refreshUser();
      await refresh();
      await getMySpaces().then(setMySpaces);
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

          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B2E', letterSpacing: '-0.5px', margin: 0, flex: 1 }}>
            공간
          </h1>

          {/* 공간 일정 추가 버튼 */}
          <button
            onClick={() => router.push('/schedules/new?type=shared')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '999px',
              background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
              border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 800, color: 'white',
              boxShadow: '0 4px 12px rgba(0,132,204,0.30)',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            공간 일정
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '120px', gap: '16px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '3px solid #0084CC', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#8E8E93' }}>공간 정보를 불러오는 중...</p>
        </div>
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* ── Hero dark gradient card ── */}
          <div style={{ padding: '0 16px', marginTop: '20px', marginBottom: '24px' }}>
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

                {/* Space name — inline editable */}
                {isEditingName ? (
                  <div style={{ width: '100%', marginBottom: '12px' }}>
                    <input
                      ref={nameInputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      style={{
                        width: '100%',
                        height: '52px',
                        padding: '0 16px',
                        borderRadius: '16px',
                        fontSize: '20px',
                        fontWeight: 800,
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.12)',
                        border: '2px solid rgba(255,255,255,0.35)',
                        outline: 'none',
                        color: 'white',
                        boxSizing: 'border-box',
                        letterSpacing: '-0.3px',
                        marginBottom: '10px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={handleSaveName}
                        disabled={saving || !editName.trim()}
                        style={{
                          padding: '9px 20px', borderRadius: '12px',
                          background: '#0084CC', border: 'none', cursor: 'pointer',
                          fontSize: '13px', fontWeight: 800, color: 'white',
                          opacity: saving || !editName.trim() ? 0.5 : 1,
                        }}
                      >
                        {saving ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={{
                          padding: '9px 20px', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)',
                          cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.80)',
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '26px', fontWeight: 900, margin: 0, letterSpacing: '-0.6px' }}>
                      {group?.name ?? '나의 공간'}
                    </h2>
                    {isAdmin && (
                      <button
                        onClick={startEditing}
                        style={{
                          width: '30px', height: '30px', borderRadius: '10px',
                          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: '14px', flexShrink: 0,
                        }}
                      >✏️</button>
                    )}
                  </div>
                )}

                {/* Member count badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 16px', borderRadius: '999px',
                  background: memberAtLimit ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.10)',
                  border: `1px solid ${memberAtLimit ? 'rgba(239,68,68,0.30)' : 'rgba(255,255,255,0.12)'}`,
                  marginBottom: '24px',
                }}>
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: memberAtLimit ? '#EF4444' : '#0CC9B5',
                  }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.80)' }}>
                    {memberCount}/{FREE_MAX_MEMBERS}명 · 무료플랜
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

          {/* ── 공간 플랜 현황 ── */}
          <div style={{ padding: '0 16px', marginBottom: '24px' }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>무료 플랜 현황</p>
                <span style={{
                  padding: '3px 10px', borderRadius: '999px',
                  fontSize: '11px', fontWeight: 800,
                  background: 'rgba(0,132,204,0.08)', color: '#0084CC',
                }}>FREE</span>
              </div>

              {/* 공간 사용량 */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93' }}>내 공간</span>
                  <span style={{
                    fontSize: '12px', fontWeight: 800,
                    color: spaceAtLimit ? '#EF4444' : '#1A1B2E',
                  }}>
                    {spaceCount}/{FREE_MAX_SPACES}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '999px', background: '#F0F0F5', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((spaceCount / FREE_MAX_SPACES) * 100, 100)}%`,
                    borderRadius: '999px',
                    background: spaceAtLimit
                      ? 'linear-gradient(90deg, #EF4444, #F97316)'
                      : 'linear-gradient(90deg, #0CC9B5, #0084CC)',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>

              {/* 멤버 사용량 */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93' }}>공간 멤버</span>
                  <span style={{
                    fontSize: '12px', fontWeight: 800,
                    color: memberAtLimit ? '#EF4444' : '#1A1B2E',
                  }}>
                    {memberCount}/{FREE_MAX_MEMBERS}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '999px', background: '#F0F0F5', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((memberCount / FREE_MAX_MEMBERS) * 100, 100)}%`,
                    borderRadius: '999px',
                    background: memberAtLimit
                      ? 'linear-gradient(90deg, #EF4444, #F97316)'
                      : 'linear-gradient(90deg, #0CC9B5, #0084CC)',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>

              {/* 업그레이드 힌트 */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(0,132,204,0.06) 0%, rgba(12,201,181,0.06) 100%)',
                border: '1px solid rgba(0,132,204,0.10)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '20px' }}>🎁</span>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 800, color: '#0084CC', margin: '0 0 2px' }}>
                    더 많은 공간 &amp; 멤버가 필요하신가요?
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', margin: 0, lineHeight: 1.4 }}>
                    광고 시청 또는 인앱결제 포인트로<br />추가 공간·멤버 슬롯을 확장할 수 있어요. (준비 중)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Members section ── */}
          <div style={{ padding: '0 16px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '4px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1A1B2E', margin: 0 }}>
                공간 멤버
              </h3>
              {memberAtLimit ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', fontWeight: 800, color: '#EF4444',
                  padding: '5px 12px', borderRadius: '999px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.15)',
                }}>
                  <span>🔒</span> 멤버 한도 초과
                </div>
              ) : (
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
              )}
            </div>

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
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '18px',
                    background: '#F5F5F7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px', flexShrink: 0,
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    {member.user?.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.user?.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px',
                        fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase',
                        background: member.role === 'admin' ? 'rgba(0,132,204,0.10)' : member.role === 'viewer' ? 'rgba(142,142,147,0.10)' : 'rgba(12,201,181,0.10)',
                        color: member.role === 'admin' ? '#0084CC' : member.role === 'viewer' ? '#8E8E93' : '#0CC9B5',
                      }}>
                        {member.role === 'admin' ? 'Admin' : member.role === 'viewer' ? 'Viewer' : 'Editor'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.user?.email || '연결됨'}
                      </span>
                    </div>
                  </div>
                  {isAdmin && member.userId !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'rgba(239,68,68,0.08)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: '14px', flexShrink: 0,
                      }}
                    >✕</button>
                  )}
                </div>
              ))}

              {/* 새로운 공간 합류 */}
              <button
                onClick={() => setShowJoinModal(true)}
                style={{
                  width: '100%', padding: '20px', borderRadius: '20px',
                  border: '2px dashed #E5E5EA', background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', fontSize: '14px', fontWeight: 800, color: '#8E8E93',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '20px' }}>🗝️</span>
                새로운 공간 합류
              </button>

              {/* 새 공간 만들기 — 한도 초과 시 잠금 */}
              <div style={{ position: 'relative' }}>
                <button
                  disabled={spaceAtLimit}
                  onClick={() => !spaceAtLimit && router.push('/space/create')}
                  style={{
                    width: '100%', padding: '20px', borderRadius: '20px',
                    border: '2px dashed #E5E5EA',
                    background: spaceAtLimit ? 'rgba(0,0,0,0.02)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '10px', fontSize: '14px', fontWeight: 800,
                    color: spaceAtLimit ? '#C7C7CC' : '#8E8E93',
                    cursor: spaceAtLimit ? 'not-allowed' : 'pointer',
                    opacity: spaceAtLimit ? 0.8 : 1,
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{spaceAtLimit ? '🔒' : '🏡'}</span>
                  새 공간 만들기
                  {spaceAtLimit && (
                    <span style={{
                      marginLeft: '4px',
                      padding: '2px 8px', borderRadius: '999px',
                      fontSize: '10px', fontWeight: 800,
                      background: 'rgba(239,68,68,0.10)', color: '#EF4444',
                    }}>
                      {spaceCount}/{FREE_MAX_SPACES} 한도 초과
                    </span>
                  )}
                </button>
              </div>
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
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: '600px', background: 'white',
              borderRadius: '32px 32px 0 0',
              padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '24px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: '#E5E5EA' }} />
            </div>
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

            {/* 멤버 잔여 슬롯 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              marginBottom: '20px',
              fontSize: '12px', fontWeight: 700,
              color: memberAtLimit ? '#EF4444' : '#8E8E93',
            }}>
              <span>{memberAtLimit ? '⚠️' : '👥'}</span>
              {memberAtLimit
                ? `멤버 한도 ${FREE_MAX_MEMBERS}명에 도달했습니다`
                : `현재 ${memberCount}명 · ${FREE_MAX_MEMBERS - memberCount}명 초대 가능`
              }
            </div>

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
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setShowJoinModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: '600px', background: 'white',
              borderRadius: '32px 32px 0 0',
              padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '24px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: '#E5E5EA' }} />
            </div>
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

            {spaceAtLimit && (
              <div style={{
                padding: '12px 16px', borderRadius: '14px', marginBottom: '16px',
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>🔒</span>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444', margin: 0, lineHeight: 1.4 }}>
                  무료 플랜 공간 한도({FREE_MAX_SPACES}개)에 도달했습니다.<br />
                  포인트로 추가 공간 슬롯을 구매하면 참여할 수 있어요.
                </p>
              </div>
            )}

            <input
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
              placeholder="참여 코드 입력"
              disabled={spaceAtLimit}
              style={{
                width: '100%', height: '60px', padding: '0 20px',
                borderRadius: '18px', fontSize: '22px', fontFamily: 'monospace',
                fontWeight: 900, textAlign: 'center', textTransform: 'uppercase',
                background: spaceAtLimit ? '#F0F0F5' : '#F5F5F7',
                border: `2px solid ${joinError ? '#EF4444' : joinCode ? '#0CC9B5' : 'transparent'}`,
                outline: 'none', boxSizing: 'border-box',
                letterSpacing: '4px', color: '#1A1B2E', marginBottom: '8px',
                cursor: spaceAtLimit ? 'not-allowed' : 'text',
                opacity: spaceAtLimit ? 0.6 : 1,
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
                disabled={joining || !joinCode.trim() || spaceAtLimit}
                style={{
                  width: '100%', height: '58px', borderRadius: '18px',
                  background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                  border: 'none',
                  cursor: joining || !joinCode.trim() || spaceAtLimit ? 'not-allowed' : 'pointer',
                  fontSize: '16px', fontWeight: 800, color: 'white',
                  opacity: joining || !joinCode.trim() || spaceAtLimit ? 0.5 : 1,
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
