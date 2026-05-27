'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import {
  joinSpaceByCode, updateSpaceName, removeSpaceMember,
  getMySpaces, updateSpaceMemberRole, regenerateInviteCode,
} from '@/lib/db';
import { SpaceScheduleTimeline } from './SpaceScheduleTimeline';
import type { Space, SpaceRole } from '@/types';

const FREE_MAX_SPACES  = 2;
const FREE_MAX_MEMBERS = 10;

const ROLE_LABELS: Record<SpaceRole, string> = { admin: '관리자', editor: '편집자', viewer: '조회자' };
const ROLE_OPTIONS: SpaceRole[] = ['admin', 'editor', 'viewer'];

export function DesktopSpace() {
  const router = useRouter();
  const { spaceId, user, profile, refresh: refreshUser } = useCurrentUser();

  const [mySpaces,     setMySpaces]    = useState<Space[]>([]);
  const [spaceIndex,   setSpaceIndex]  = useState(0);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);

  const displaySpaceId = activeSpaceId ?? spaceId;
  const { space: group, members, myRole, loading, refresh } = useSpace(displaySpaceId);
  const isAdmin = myRole === 'admin';

  // ── 개인 공간 여부 ──────────────────────────────────────────
  const personalSpaceId = (profile?.preferences as { personalSpaceId?: string } | null)?.personalSpaceId ?? null;
  const isPersonalSpace = !!displaySpaceId && displaySpaceId === personalSpaceId;

  const memberCount   = members.length;
  const memberAtLimit = memberCount >= FREE_MAX_MEMBERS;
  const sharedSpaceCount = mySpaces.filter(s => s.id !== personalSpaceId).length;
  const spaceAtLimit     = sharedSpaceCount >= FREE_MAX_SPACES;

  // ── 초대 관련 상태 ─────────────────────────────────────────
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [copyError,       setCopyError]       = useState(false);
  const [generatingCode,  setGeneratingCode]  = useState(false);
  const [shareKakao,      setShareKakao]      = useState(false);
  const [shareSms,        setShareSms]        = useState(false);
  const [liveInviteCode,  setLiveInviteCode]  = useState<string | undefined>(undefined);

  // ── 공간 합류 상태 ─────────────────────────────────────────
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode,      setJoinCode]      = useState('');
  const [joining,       setJoining]       = useState(false);
  const [joinError,     setJoinError]     = useState('');
  const [joinSuccess,   setJoinSuccess]   = useState(false);

  // ── 이름 수정 모달 ─────────────────────────────────────────
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingTo,      setRenamingTo]      = useState('');
  const [renaming,        setRenaming]        = useState(false);

  // ── 역할 편집 ──────────────────────────────────────────────
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const currentInviteCode = liveInviteCode ?? group?.inviteCode;
  const inviteLink = currentInviteCode ? `https://gleaum.com/invite/${currentInviteCode}` : '';

  // ── 데이터 로드 ────────────────────────────────────────────
  useEffect(() => {
    getMySpaces().then(spaces => {
      setMySpaces(spaces);
      const currentId = activeSpaceId ?? spaceId;
      let idx = spaces.findIndex(s => s.id === currentId);
      if (idx < 0 && spaceId) idx = spaces.findIndex(s => s.id === spaceId);
      const finalIdx = idx >= 0 ? idx : 0;
      setSpaceIndex(finalIdx);
      if (spaces[finalIdx] && !activeSpaceId) {
        setActiveSpaceId(spaces[finalIdx].id);
      }
    });
  }, [spaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (spaceId && !activeSpaceId) setActiveSpaceId(spaceId);
  }, [spaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // group 갱신 시 liveInviteCode 클리어
  useEffect(() => {
    setLiveInviteCode(undefined);
  }, [group?.inviteCode]);

  // ── 공유 메시지 빌더 ───────────────────────────────────────
  const buildShareMessage = () => {
    const spaceName  = group?.name ?? '공간';
    const senderName = user?.displayName ?? user?.name ?? '글리움 사용자';
    const code = liveInviteCode ?? group?.inviteCode ?? '';
    const link = code ? `https://gleaum.com/invite/${code}` : 'https://gleaum.com';
    return [
      `✨ ${spaceName}에 초대합니다`,
      '',
      `안녕하세요! ${senderName}님이 글리움에서 ${spaceName}으로 초대장을 보내드립니다.`,
      '',
      `글리움은 나와 가장 소중한 사람들—연인, 가족, 모임—의 일상을 함께 연결하는 네트워크예요. ${senderName}님이 공간 지기로 운영 중인 ${spaceName}에서 일정, 자금, 루틴을 함께 나눠보세요.`,
      '',
      `아래 링크로 바로 입장하실 수 있어요 👇`,
      '',
      `📎 초대 링크`,
      link,
      '',
      `🔑 초대 코드   ${code}`,
      '',
      `글리움 앱이 없으시다면 먼저 설치해 주세요:`,
      `👉 https://gleaum.com/download`,
      '',
      `함께여서 더 빛나는 일상, 글리움에서 만나요 ✨`,
    ].join('\n');
  };

  const ensureInviteCode = async () => {
    if ((liveInviteCode ?? group?.inviteCode) || !isAdmin || !displaySpaceId) return;
    setGeneratingCode(true);
    try {
      const newCode = await regenerateInviteCode(displaySpaceId);
      if (newCode) { setLiveInviteCode(newCode); await refresh(); }
    } finally { setGeneratingCode(false); }
  };

  const copyInviteLink = async () => {
    let link = inviteLink;
    if (!link && isAdmin && displaySpaceId) {
      setGeneratingCode(true);
      try {
        const newCode = await regenerateInviteCode(displaySpaceId);
        if (newCode) {
          setLiveInviteCode(newCode);
          link = `https://gleaum.com/invite/${newCode}`;
          await refresh();
        }
      } finally { setGeneratingCode(false); }
    }
    if (!link) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = link;
        el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(el);
        el.focus(); el.select();
        ok = document.execCommand('copy');
        document.body.removeChild(el);
      } catch { /* ignore */ }
    }
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2500); }
    else    { setCopyError(true); setTimeout(() => setCopyError(false), 3000); }
  };

  const shareViaKakao = async () => {
    await ensureInviteCode();
    setShareKakao(true);
    const message = buildShareMessage();
    const code = liveInviteCode ?? group?.inviteCode ?? '';
    const link = code ? `https://gleaum.com/invite/${code}` : 'https://gleaum.com';
    try {
      if (navigator.share) {
        await navigator.share({ title: '글리움 공간 초대', text: message, url: link });
      } else {
        window.open(`kakaotalk://send?msg=${encodeURIComponent(message)}`, '_blank');
      }
    } catch { /* 사용자 취소 등 */ }
    setShareKakao(false);
  };

  const shareViaSms = async () => {
    await ensureInviteCode();
    setShareSms(true);
    const message = buildShareMessage();
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
    setTimeout(() => setShareSms(false), 1500);
  };

  const copyFullMessage = async () => {
    await ensureInviteCode();
    const message = buildShareMessage();
    let ok = false;
    try {
      await navigator.clipboard.writeText(message);
      ok = true;
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = message;
        el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(el);
        el.focus(); el.select();
        ok = document.execCommand('copy');
        document.body.removeChild(el);
      } catch { /* ignore */ }
    }
    if (ok) { setCopied(true); setCopyError(false); setTimeout(() => setCopied(false), 2500); }
    else    { setCopyError(true); setTimeout(() => setCopyError(false), 3000); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true); setJoinError('');
    const result = await joinSpaceByCode(joinCode.trim().toUpperCase());
    setJoining(false);
    if (result.success) {
      await refreshUser(); await refresh();
      await getMySpaces().then(setMySpaces);
      setShowJoinModal(false); setJoinCode('');
      setJoinSuccess(true);
      setTimeout(() => setJoinSuccess(false), 3000);
    } else {
      setJoinError('유효하지 않은 공간 코드입니다.');
    }
  };

  const handleRename = async () => {
    if (!renamingTo.trim() || !displaySpaceId) return;
    setRenaming(true);
    await updateSpaceName(displaySpaceId, renamingTo.trim());
    setRenaming(false);
    setShowRenameModal(false);
    await refresh();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!displaySpaceId) return;
    if (!confirm('이 멤버를 공간에서 제거하시겠습니까?')) return;
    await removeSpaceMember(displaySpaceId, memberId);
    await refresh();
  };

  const handleRoleChange = async (memberId: string, userId: string, role: SpaceRole) => {
    if (!displaySpaceId) return;
    await updateSpaceMemberRole(displaySpaceId, userId, role);
    setEditingRole(null);
    await refresh();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── 페이지 히어로 ── */}
      <div style={{
        position: 'relative', padding: '40px 44px', borderRadius: '32px',
        overflow: 'hidden', color: 'white',
        background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
        marginBottom: '24px',
        boxShadow: '0 16px 48px rgba(26,27,46,0.25)',
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '220px', height: '220px', background: 'rgba(0,132,204,0.18)', filter: 'blur(70px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '-20px', width: '180px', height: '180px', background: 'rgba(12,201,181,0.12)', filter: 'blur(55px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '28px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '38px', flexShrink: 0,
          }}>🏠</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
                {group?.name ?? '나의 공간'}
              </h1>
              {isAdmin && !isPersonalSpace && (
                <button
                  onClick={() => { setRenamingTo(group?.name ?? ''); setShowRenameModal(true); }}
                  style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '15px', flexShrink: 0,
                  }}
                >✏️</button>
              )}
              {isPersonalSpace ? (
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0CC9B5', padding: '3px 10px', borderRadius: '999px', background: 'rgba(12,201,181,0.15)', border: '1px solid rgba(12,201,181,0.25)' }}>
                  🔒 개인 공간
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(12,201,181,0.2)', border: '1px solid rgba(12,201,181,0.3)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: memberAtLimit ? '#EF4444' : '#0CC9B5' }} />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#0CC9B5', letterSpacing: '0.04em' }}>활성</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, margin: 0 }}>
              {isPersonalSpace
                ? '개인 일정과 루틴을 관리하는 나만의 공간'
                : `${memberCount}명이 함께하는 중 · 멤버를 초대하고 공간을 관리하세요`}
            </p>
          </div>

          {/* 초대 코드 — 공유 공간만 */}
          {!isPersonalSpace && currentInviteCode && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 8px' }}>INVITE CODE</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.12em', color: '#0CC9B5' }}>{currentInviteCode}</span>
                <button onClick={copyInviteLink} style={{
                  padding: '10px 18px', borderRadius: '14px',
                  background: copied ? 'rgba(12,201,181,0.25)' : 'rgba(255,255,255,0.12)',
                  color: 'white', fontSize: '13px', fontWeight: 800,
                  border: '1px solid rgba(255,255,255,0.18)',
                  cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.2s',
                }}>
                  {copied ? '✓ 복사됨' : '코드 복사'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 다중 공간 탭 */}
        {mySpaces.length > 1 && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
            {mySpaces.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setSpaceIndex(i); setActiveSpaceId(s.id); }}
                style={{
                  padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 800,
                  background: i === spaceIndex ? 'rgba(0,132,204,0.35)' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${i === spaceIndex ? 'rgba(0,132,204,0.60)' : 'rgba(255,255,255,0.12)'}`,
                  color: 'white', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {s.id === personalSpaceId ? '🔒 ' : ''}{s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 공간 일정 타임라인 ── */}
      <SpaceScheduleTimeline
        spaceId={displaySpaceId}
        members={members}
        currentUserId={user?.id ?? ''}
      />

      {/* ── 컨텐츠 그리드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginTop: '24px' }}>

        {/* 왼쪽: 멤버 리스트 */}
        <div style={{
          background: 'white', borderRadius: '28px', padding: '32px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 4px' }}>공간 멤버</h3>
              <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, margin: 0 }}>함께하는 소중한 사람들</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!isPersonalSpace && memberAtLimit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#EF4444', padding: '5px 12px', borderRadius: '999px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  🔒 {memberCount}/{FREE_MAX_MEMBERS}
                </div>
              )}
              {!isPersonalSpace && !memberAtLimit && (
                <div style={{ padding: '8px 16px', borderRadius: '999px', background: 'rgba(0,132,204,0.08)', color: '#0084CC', fontSize: '13px', fontWeight: 800 }}>
                  {memberCount}명
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(0,132,204,0.15)', borderTopColor: '#0084CC', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : members.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              {isPersonalSpace ? (
                <>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 8px' }}>개인 공간은 나만 사용하는 공간이에요</p>
                  <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600 }}>공유 공간을 만들어 다른 사람과 함께해보세요!</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 8px' }}>이 공간에는 멤버가 없어요!</p>
                  <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600 }}>초대 링크로 소중한 사람들을 초대해 보세요</p>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map((member) => {
                const isEditingThisRole = editingRole === member.id;
                return (
                  <div key={member.id} style={{
                    borderRadius: '20px', background: '#FAFAFA',
                    border: '1px solid rgba(0,0,0,0.03)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '18px',
                        background: 'white', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '28px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.07)', flexShrink: 0,
                      }}>{member.user?.avatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.userId === user?.id ? `${member.user?.name} (나)` : member.user?.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.user?.email || '연결됨'}</p>
                      </div>
                      {/* 역할 배지 */}
                      <button
                        disabled={!isAdmin || member.userId === user?.id}
                        onClick={() => isAdmin && member.userId !== user?.id && setEditingRole(isEditingThisRole ? null : member.id)}
                        style={{
                          padding: '6px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 800,
                          background: member.role === 'admin' ? 'rgba(0,132,204,0.1)' : member.role === 'viewer' ? 'rgba(142,142,147,0.1)' : 'rgba(12,201,181,0.1)',
                          color: member.role === 'admin' ? '#0084CC' : member.role === 'viewer' ? '#8E8E93' : '#0CC9B5',
                          border: isAdmin && member.userId !== user?.id ? '1px dashed currentColor' : 'none',
                          cursor: isAdmin && member.userId !== user?.id ? 'pointer' : 'default',
                        }}
                      >
                        {ROLE_LABELS[member.role]}
                        {isAdmin && member.userId !== user?.id && ' ▾'}
                      </button>
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
                    {/* 역할 변경 드롭다운 */}
                    {isEditingThisRole && (
                      <div style={{ borderTop: '1px solid #F2F2F7', padding: '10px 20px 16px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', margin: '0 0 8px' }}>역할 변경</p>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          {ROLE_OPTIONS.map(role => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(member.id, member.userId, role)}
                              style={{
                                flex: 1, padding: '10px 4px', borderRadius: '12px', fontSize: '12px', fontWeight: 800,
                                border: `2px solid ${member.role === role ? '#0084CC' : '#E5E5EA'}`,
                                background: member.role === role ? 'rgba(0,132,204,0.08)' : 'white',
                                color: member.role === role ? '#0084CC' : '#8E8E93',
                                cursor: 'pointer',
                              }}
                            >
                              {ROLE_LABELS[role]}
                            </button>
                          ))}
                        </div>
                        <div>
                          {ROLE_OPTIONS.map(role => (
                            <p key={role} style={{ fontSize: '10px', color: '#8E8E93', margin: '2px 0', fontWeight: 500 }}>
                              <strong style={{ color: '#1A1B2E' }}>{ROLE_LABELS[role]}</strong>: {role === 'admin' ? '공간 설정, 초대/추방, 일정 관리' : role === 'editor' ? '일정 등록·수정·삭제' : '일정 조회만 가능'}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 오른쪽: 액션 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 멤버 초대 카드 — 공유 공간만 */}
          {!isPersonalSpace && (
            <div style={{ background: 'white', borderRadius: '28px', padding: '28px', boxShadow: '0 2px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'rgba(0,132,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '16px' }}>🔗</div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px' }}>멤버 초대하기</h3>
              <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, margin: '0 0 20px', lineHeight: 1.65 }}>
                카카오톡, 문자, 링크 복사로 소중한 사람들을 초대하세요.
              </p>
              {currentInviteCode && (
                <div style={{
                  padding: '12px 16px', borderRadius: '14px', background: '#F7F7FA',
                  marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <div>
                    <p style={{ fontSize: '9px', fontWeight: 800, color: '#8E8E93', margin: '0 0 3px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>초대 코드</p>
                    <span style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '4px', color: '#0CC9B5' }}>{currentInviteCode}</span>
                  </div>
                  <button onClick={copyInviteLink} style={{ padding: '8px 14px', borderRadius: '10px', background: 'white', border: '1.5px solid rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 800, color: '#1A1B2E', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', whiteSpace: 'nowrap' }}>
                    코드만 복사
                  </button>
                </div>
              )}
              {memberAtLimit ? (
                <div style={{ padding: '12px 16px', borderRadius: '14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444', margin: 0 }}>🔒 멤버 {FREE_MAX_MEMBERS}명 한도 도달</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0084CC, #0CC9B5)',
                    color: 'white', fontSize: '14px', fontWeight: 800, border: 'none',
                    cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,132,204,0.25)',
                  }}
                >
                  초대 방법 선택하기 →
                </button>
              )}
            </div>
          )}

          {/* 개인 공간 안내 */}
          {isPersonalSpace && (
            <div style={{ background: 'white', borderRadius: '28px', padding: '28px', boxShadow: '0 2px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'rgba(12,201,181,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px' }}>개인 공간</h3>
              <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, margin: 0, lineHeight: 1.65 }}>
                개인 공간은 나만 사용하는 공간으로 외부 사람을 초대하거나 공유형 일정을 만들 수 없어요.
              </p>
            </div>
          )}

          {/* 안내 */}
          <div style={{ padding: '18px 20px', borderRadius: '20px', background: 'rgba(0,132,204,0.04)', border: '1px solid rgba(0,132,204,0.08)' }}>
            <p style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600, lineHeight: 1.75, margin: 0 }}>
              💡 공간 관리자는 멤버를 관리하고 공간의 이름을 수정할 수 있습니다. 더 많은 공간 기능이 곧 업데이트됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* ── 내 공간 관리 ── */}
      <div style={{ marginTop: '24px', background: 'white', borderRadius: '28px', padding: '28px', boxShadow: '0 2px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 4px' }}>내 공간 관리</h3>
          <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, margin: 0 }}>다른 공간에 합류하거나 새로운 공간을 만들어보세요</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

          {/* 공간 참여하기 */}
          <button
            onClick={() => setShowJoinModal(true)}
            style={{
              padding: '20px', borderRadius: '20px',
              border: '1.5px solid rgba(0,0,0,0.07)', background: '#FAFAFA',
              display: 'flex', alignItems: 'center', gap: '14px',
              cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(12,201,181,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🗝️</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 3px' }}>공간 참여하기</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', margin: 0 }}>초대 코드로 기존 공간에 합류</p>
            </div>
            {joinSuccess && <span style={{ fontSize: '13px', fontWeight: 800, color: '#0CC9B5' }}>✓ 합류됨</span>}
          </button>

          {/* 새 공간 만들기 */}
          <button
            disabled={spaceAtLimit}
            onClick={() => !spaceAtLimit && router.push('/space/new')}
            style={{
              padding: '20px', borderRadius: '20px',
              border: `1.5px solid ${spaceAtLimit ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.07)'}`,
              background: spaceAtLimit ? 'rgba(0,0,0,0.02)' : '#FAFAFA',
              display: 'flex', alignItems: 'center', gap: '14px',
              cursor: spaceAtLimit ? 'not-allowed' : 'pointer', textAlign: 'left',
              boxShadow: spaceAtLimit ? 'none' : '0 2px 10px rgba(0,0,0,0.04)',
            }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: spaceAtLimit ? 'rgba(0,0,0,0.04)' : 'rgba(0,132,204,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
              {spaceAtLimit ? '🔒' : '🏡'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: 800, color: spaceAtLimit ? '#C7C7CC' : '#1A1B2E', margin: '0 0 3px' }}>새 공간 만들기</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', margin: 0 }}>
                {spaceAtLimit
                  ? `공유 공간 ${FREE_MAX_SPACES}개 한도 도달 (무료 플랜)`
                  : `현재 공유 공간 ${sharedSpaceCount}/${FREE_MAX_SPACES} 사용 중`}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ── 초대 모달 ── */}
      {showInviteModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '32px', padding: '36px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: 'rgba(0,132,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px' }}>🔗</div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1B2E', textAlign: 'center', margin: '0 0 6px' }}>멤버 초대하기</h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, textAlign: 'center', margin: '0 0 4px' }}>{group?.name ?? '이 공간'}</p>
            <p style={{ fontSize: '12px', color: '#AEAEB2', fontWeight: 600, textAlign: 'center', margin: '0 0 24px' }}>
              현재 {memberCount}명 · {FREE_MAX_MEMBERS - memberCount}명 더 초대 가능
            </p>

            {/* 초대 코드 */}
            {currentInviteCode && (
              <div style={{ background: '#F5F5F7', borderRadius: '16px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: '#8E8E93', margin: '0 0 4px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>초대 코드</p>
                  <span style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '4px', color: '#0CC9B5' }}>{currentInviteCode}</span>
                </div>
                <button onClick={copyInviteLink} style={{ padding: '8px 16px', borderRadius: '12px', background: 'white', border: '1.5px solid rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 800, color: '#1A1B2E', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  코드만 복사
                </button>
              </div>
            )}

            {/* 3가지 공유 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {/* 카카오톡 */}
              <button onClick={shareViaKakao} disabled={generatingCode || shareKakao}
                style={{ width: '100%', height: '56px', borderRadius: '16px', background: '#FEE500', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px', fontWeight: 800, color: '#1A1B2E', opacity: shareKakao ? 0.7 : 1 }}>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4C12.95 4 4 11.82 4 21.4c0 6.06 3.84 11.38 9.6 14.44L11.2 44l10.56-5.44c.72.1 1.46.16 2.24.16 11.05 0 20-7.82 20-17.4C44 11.82 35.05 4 24 4z" fill="#1A1B2E"/>
                </svg>
                {shareKakao ? '공유 중...' : '카카오톡으로 공유'}
              </button>

              {/* 문자 메시지 */}
              <button onClick={shareViaSms} disabled={generatingCode || shareSms}
                style={{ width: '100%', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #34C759, #30B050)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px', fontWeight: 800, color: 'white', opacity: shareSms ? 0.7 : 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {shareSms ? '문자 앱 열기...' : '문자 메시지로 보내기'}
              </button>

              {/* 초대 메시지 복사 */}
              <button onClick={copyFullMessage} disabled={generatingCode}
                style={{ width: '100%', height: '56px', borderRadius: '16px', background: copied ? '#0CC9B5' : copyError ? '#EF4444' : '#1A1B2E', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px', fontWeight: 800, color: 'white', opacity: generatingCode ? 0.7 : 1, transition: 'background 0.2s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {copied ? '복사됨 ✓' : copyError ? '복사 실패' : generatingCode ? '준비 중...' : '초대 메시지 복사'}
              </button>
            </div>

            {/* 공유 메시지 미리보기 */}
            <details style={{ marginBottom: '16px' }}>
              <summary style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', cursor: 'pointer', padding: '4px 0', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                공유될 메시지 미리보기
              </summary>
              <div style={{ marginTop: '10px', padding: '14px 16px', borderRadius: '14px', background: '#F5F5F7', fontSize: '12px', fontWeight: 500, color: '#3C3C43', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {buildShareMessage()}
              </div>
            </details>

            <button onClick={() => setShowInviteModal(false)}
              style={{ width: '100%', height: '50px', borderRadius: '16px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ── 공간 합류 모달 ── */}
      {showJoinModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowJoinModal(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '32px', padding: '36px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(12,201,181,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 20px' }}>🗝️</div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1B2E', textAlign: 'center', margin: '0 0 8px' }}>공간 참여하기</h3>
            <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>공유받은 초대 코드를 입력하여 공간에 참여하세요.</p>
            <input
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="초대 코드 입력 (예: ABC123)"
              style={{
                width: '100%', padding: '16px', borderRadius: '16px',
                background: '#F7F7FA',
                border: `1.5px solid ${joinError ? '#EF4444' : joinCode ? '#0CC9B5' : 'transparent'}`,
                fontSize: '20px', fontFamily: 'monospace', fontWeight: 900,
                textAlign: 'center', textTransform: 'uppercase', outline: 'none',
                boxSizing: 'border-box', marginBottom: '8px', color: '#1A1B2E',
                letterSpacing: '0.15em', transition: 'border-color 0.2s',
              }}
            />
            {joinError && <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 700, textAlign: 'center', marginBottom: '12px' }}>{joinError}</p>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowJoinModal(false)}
                style={{ flex: 1, height: '52px', borderRadius: '16px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}>취소</button>
              <button onClick={handleJoin} disabled={joining || !joinCode.trim()}
                style={{ flex: 2, height: '52px', borderRadius: '16px', background: joinCode.trim() ? 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)' : '#F0F0F5', border: 'none', cursor: joinCode.trim() ? 'pointer' : 'default', fontSize: '15px', fontWeight: 800, color: joinCode.trim() ? 'white' : '#AEAEA8', opacity: joining ? 0.7 : 1 }}>
                {joining ? '확인 중...' : '참여 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 이름 수정 모달 ── */}
      {showRenameModal && isAdmin && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowRenameModal(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '28px', padding: '36px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 6px', textAlign: 'center' }}>공간 이름 수정</h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, textAlign: 'center', margin: '0 0 24px' }}>새로운 공간 이름을 입력하세요.</p>
            <input
              value={renamingTo}
              onChange={e => setRenamingTo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              placeholder="새 공간 이름"
              autoFocus
              style={{
                width: '100%', height: '56px', padding: '0 18px', borderRadius: '16px',
                fontSize: '17px', fontWeight: 700, background: '#F5F5F7',
                border: `2px solid ${renamingTo ? '#0084CC' : 'transparent'}`,
                outline: 'none', boxSizing: 'border-box', color: '#1A1B2E', marginBottom: '16px',
                transition: 'border-color 0.2s',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowRenameModal(false)}
                style={{ flex: 1, height: '52px', borderRadius: '16px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}>취소</button>
              <button onClick={handleRename} disabled={renaming || !renamingTo.trim()}
                style={{ flex: 2, height: '52px', borderRadius: '16px', background: '#0084CC', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'white', opacity: renaming || !renamingTo.trim() ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                {renaming ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
