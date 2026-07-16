'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { useSchedules } from '@/hooks/useSchedules';
import {
  joinSpaceByCode, updateSpaceName, removeSpaceMember,
  getMySpaces, updateSpaceMemberRole, regenerateInviteCode,
  updateSpaceMemberNickname,
} from '@/lib/db';
import { KakaoAdBanner } from '@/components/ads/KakaoAdBanner';
import { SpaceFeed } from './SpaceFeed';
import { SpaceEntryModal } from './SpaceEntryModal';
import { formatAmount } from '@/lib/utils';
import { toast } from 'sonner';
import type { Space, SpaceRole, Schedule } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { sendSpaceNotification } from '@/lib/spaceNotify';
import { SpaceSectionTabs, SpaceSwitcher, type SpaceSection } from './SpaceSwitcher';
import { SpaceScheduleTimeline } from './SpaceScheduleTimeline';
import { useAccountSession } from '@/components/AccountSessionProvider';

const FREE_MAX_SPACES  = 2;
const FREE_MAX_MEMBERS = 10;

const ROLE_LABELS: Record<SpaceRole, string> = {
  admin:  '공간 지기',
  editor: '운영자',
  viewer: '멤버',
};

const ROLE_COLORS: Record<SpaceRole, { bg: string; text: string }> = {
  admin:  { bg: 'rgba(0,132,204,0.10)',   text: '#0084CC' },
  editor: { bg: 'rgba(12,201,181,0.10)', text: '#0CC9B5' },
  viewer: { bg: 'rgba(142,142,147,0.10)', text: '#8E8E93' },
};

export function DesktopSpace() {
  const router  = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sidParam = searchParams.get('sid');
  const { spaceId, user, profile, refresh: refreshUser } = useCurrentUser();
  const { capabilities } = useAccountSession();

  const [mySpaces,      setMySpaces]     = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(sidParam ?? spaceId);

  const displaySpaceId = activeSpaceId ?? spaceId;
  const { space: group, members, myRole, loading, refresh } = useSpace(displaySpaceId);
  const { schedules, refresh: refreshSchedules } = useSchedules(displaySpaceId);
  const isAdmin = myRole === 'admin' && capabilities.canManageSpaces;

  // 푸시 알림 구독 (자동 등록)
  usePushSubscription();

  // ── 인라인 모달 상태 ───────────────────────────────────────
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showExpenseModal,  setShowExpenseModal]  = useState(false);
  const [activeSection,     setActiveSection]     = useState<SpaceSection>('feed');

  const personalSpaceId  = (profile?.preferences as { personalSpaceId?: string } | null)?.personalSpaceId ?? null;
  const isPersonalSpace  = !!displaySpaceId && displaySpaceId === personalSpaceId;

  const memberCount      = members.length;
  const memberAtLimit    = memberCount >= FREE_MAX_MEMBERS;
  const sharedSpaceCount = mySpaces.filter(s => s.id !== personalSpaceId).length;
  const spaceAtLimit     = sharedSpaceCount >= FREE_MAX_SPACES;

  // ── 이번 달 공간 지출 ──────────────────────────────────────
  const now = new Date();
  const thisMonthExpenses = schedules.filter(s => {
    if (s.type !== 'expense' || s.visibility === 'private') return false;
    const d = new Date(s.startTime);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const thisMonthTotal = thisMonthExpenses.reduce((sum, s) => sum + (s.amount ?? 0), 0);

  // ── 이번 달 공유 일정 ──────────────────────────────────────
  const thisMonthSchedules = schedules.filter(s => {
    if (s.type === 'expense' || s.visibility === 'private') return false;
    const d = new Date(s.startTime);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  // ── 초대 상태 ──────────────────────────────────────────────
  const [showInviteModal,  setShowInviteModal]  = useState(false);
  const [copied,           setCopied]           = useState(false);
  const [copyError,        setCopyError]        = useState(false);
  const [generatingCode,   setGeneratingCode]   = useState(false);
  const [shareKakao,       setShareKakao]       = useState(false);
  const [shareSms,         setShareSms]         = useState(false);
  const [liveInviteCode,   setLiveInviteCode]   = useState<string | undefined>(undefined);

  // ── 공간 합류 상태 ─────────────────────────────────────────
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode,      setJoinCode]      = useState('');
  const [joining,       setJoining]       = useState(false);
  const [joinError,     setJoinError]     = useState('');

  // ── 공간 관리 모달 ──────────────────────────────────────────
  const [showMgmtModal, setShowMgmtModal] = useState(false);

  // ── 이름 수정 모달 ─────────────────────────────────────────
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingTo,      setRenamingTo]      = useState('');
  const [renaming,        setRenaming]        = useState(false);

  // ── 역할 편집 ──────────────────────────────────────────────
  const [editingRole, setEditingRole] = useState<string | null>(null);

  // ── 닉네임 편집 ────────────────────────────────────────────
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput]     = useState('');
  const [savingNickname, setSavingNickname]   = useState(false);

  const currentInviteCode = liveInviteCode ?? group?.inviteCode;

  const isInviteCodeValid = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/invite/info?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
      return res.ok;
    } catch { return false; }
  };

  // ── 데이터 로드 ────────────────────────────────────────────
  useEffect(() => {
    getMySpaces().then(spaces => {
      setMySpaces(spaces);
      let storedSpaceId: string | null = null;
      try { storedSpaceId = localStorage.getItem('gleaum_lastSpaceId'); } catch {}
      const preferredIds = [sidParam, storedSpaceId, activeSpaceId, spaceId].filter(Boolean) as string[];
      const idx = preferredIds
        .map(id => spaces.findIndex(space => space.id === id))
        .find(index => index >= 0) ?? -1;
      const finalIdx = idx >= 0 ? idx : 0;
      const selected = spaces[finalIdx];
      if (selected && selected.id !== activeSpaceId) setActiveSpaceId(selected.id);
    });
  }, [sidParam, spaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLiveInviteCode(undefined); }, [group?.inviteCode]); // eslint-disable-line react-hooks/set-state-in-effect

  const selectSpace = (space: Space) => {
    setActiveSpaceId(space.id);
    try { localStorage.setItem('gleaum_lastSpaceId', space.id); } catch {}
    router.replace(`${pathname}?sid=${encodeURIComponent(space.id)}`, { scroll: false });
  };

  // ── 공유 메시지 빌더 ───────────────────────────────────────
  const buildShareMessage = (inviteCode: string) => {
    const spaceName  = group?.name ?? '공간';
    const senderName = user?.displayName ?? user?.name ?? '글리움 사용자';
    const link = `https://gleaum.com/invite/${inviteCode}`;
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
      `🔑 초대 코드   ${inviteCode}`,
      '',
      `글리움 앱이 없으시다면 먼저 설치해 주세요:`,
      `👉 https://gleaum.com/download`,
      '',
      `함께여서 더 빛나는 일상, 글리움에서 만나요 ✨`,
    ].join('\n');
  };

  const ensureInviteCode = async (): Promise<string | null> => {
    const existingCode = liveInviteCode ?? group?.inviteCode;
    if (existingCode && await isInviteCodeValid(existingCode)) return existingCode;
    if (!isAdmin || !displaySpaceId) {
      toast.error('유효한 초대 코드를 찾을 수 없습니다. 공간 지기에게 새 초대 코드를 요청해 주세요.');
      return null;
    }
    setGeneratingCode(true);
    try {
      const newCode = await regenerateInviteCode(displaySpaceId);
      if (newCode && await isInviteCodeValid(newCode)) {
        setLiveInviteCode(newCode);
        await refresh();
        return newCode;
      }
      toast.error('초대 코드 생성에 실패했습니다. 다시 시도해 주세요.');
      return null;
    } finally { setGeneratingCode(false); }
  };

  const writeClipboard = async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = value;
        el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(el); el.focus(); el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        return ok;
      } catch { return false; }
    }
  };

  const showCopyResult = (ok: boolean) => {
    if (ok) { setCopied(true); setCopyError(false); setTimeout(() => setCopied(false), 2500); }
    else    { setCopyError(true); setTimeout(() => setCopyError(false), 3000); }
  };

  const copyInviteCode  = async () => { const c = await ensureInviteCode(); if (c) showCopyResult(await writeClipboard(c)); };
  const copyFullMessage = async () => { const c = await ensureInviteCode(); if (c) showCopyResult(await writeClipboard(buildShareMessage(c))); };

  const shareViaKakao = async () => {
    const code = await ensureInviteCode(); if (!code) return;
    setShareKakao(true);
    const msg = buildShareMessage(code);
    try {
      if (navigator.share) await navigator.share({ title: '글리움 공간 초대', text: msg, url: `https://gleaum.com/invite/${code}` });
      else window.open(`kakaotalk://send?msg=${encodeURIComponent(msg)}`, '_blank');
    } catch { /* 취소 */ }
    setShareKakao(false);
  };

  const shareViaSms = async () => {
    const code = await ensureInviteCode(); if (!code) return;
    setShareSms(true);
    window.open(`sms:?body=${encodeURIComponent(buildShareMessage(code))}`, '_blank');
    setTimeout(() => setShareSms(false), 1500);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true); setJoinError('');
    const result = await joinSpaceByCode(joinCode.trim().toUpperCase());
    setJoining(false);
    if (result.success) {
      await refreshUser();
      const spaces = await getMySpaces();
      setMySpaces(spaces);
      const joinedSpace = spaces.find(space => space.id === result.spaceId);
      if (joinedSpace) selectSpace(joinedSpace);
      await refresh();
      setShowJoinModal(false); setJoinCode('');
      toast.success(result.alreadyMember ? '이미 참여 중인 공간으로 전환했습니다.' : '공간에 참여했습니다.');
    } else {
      setJoinError('유효하지 않은 공간 코드입니다.');
    }
  };

  const handleRename = async () => {
    if (!renamingTo.trim() || !displaySpaceId) return;
    setRenaming(true);
    await updateSpaceName(displaySpaceId, renamingTo.trim());
    setRenaming(false); setShowRenameModal(false);
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

  const handleSaveNickname = async () => {
    if (!displaySpaceId) return;
    setSavingNickname(true);
    const ok = await updateSpaceMemberNickname(displaySpaceId, nicknameInput);
    setSavingNickname(false);
    if (ok) {
      toast.success('닉네임이 저장되었습니다');
      setEditingNickname(false);
      await refresh();
    } else {
      toast.error('닉네임 저장에 실패했습니다');
    }
  };

  // ── 렌더 ──────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* 공간 컨텍스트: 전환과 핵심 액션을 한 줄에서 처리 */}
      <section style={{
        padding: '18px 20px', marginBottom: '20px', borderRadius: '24px',
        background: 'var(--theme-surface)', border: '1px solid var(--theme-border)',
        boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <SpaceSwitcher
            spaces={mySpaces}
            currentSpaceId={displaySpaceId}
            personalSpaceId={personalSpaceId}
            onSelect={selectSpace}
            onJoin={() => setShowJoinModal(true)}
            onCreate={() => router.push('/space/new')}
            createDisabled={spaceAtLimit}
          />

          <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--theme-border)' }} />

          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!loading && members.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {members.slice(0, 4).map((member, index) => (
                  <div key={member.id} title={member.user?.name} style={{ marginLeft: index ? '-8px' : 0, zIndex: 4 - index }}>
                    <UserAvatar
                      avatar={member.user?.avatar}
                      name={member.user?.name}
                      size={32}
                      radius={999}
                      fontSize={13}
                      style={{ border: '2px solid var(--theme-surface)' }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, color: 'var(--theme-text)', fontSize: '13px', fontWeight: 800 }}>
                {isPersonalSpace ? '나만 보는 개인 공간' : `${memberCount}명이 함께하는 공유 공간`}
              </p>
              <p style={{ margin: '3px 0 0', color: 'var(--theme-text-subtle)', fontSize: '11px', fontWeight: 600 }}>
                {myRole ? ROLE_LABELS[myRole] : '권한 확인 중'} · 일정 {thisMonthSchedules.length}개 · 지출 {thisMonthTotal > 0 ? formatAmount(thisMonthTotal) : '없음'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {isAdmin && !isPersonalSpace && (
              <button
                type="button"
                onClick={() => { setRenamingTo(group?.name ?? ''); setShowRenameModal(true); }}
                style={{ minHeight: '44px', padding: '0 14px', borderRadius: '14px', border: '1px solid var(--theme-border)', background: 'var(--theme-surface-muted)', color: 'var(--theme-text)', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
              >
                공간 설정
              </button>
            )}
            {capabilities.canInviteMembers && !isPersonalSpace && !memberAtLimit && (
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                style={{ minHeight: '44px', padding: '0 14px', borderRadius: '14px', border: '1px solid rgba(0,132,204,0.22)', background: 'rgba(0,132,204,0.08)', color: '#0084CC', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
              >
                멤버 초대
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              style={{ minHeight: '44px', padding: '0 16px', borderRadius: '14px', border: 'none', background: '#0084CC', color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,132,204,0.20)' }}
            >
              + 일정 추가
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          MAIN LAYOUT — 2 columns
      ════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start', minWidth: 0 }}>

        {/* ── 왼쪽 메인: 커뮤니티 피드 ────────── */}
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: '16px' }}>
            <SpaceSectionTabs value={activeSection} onChange={setActiveSection} />
          </div>

          {activeSection === 'feed' && (
            <>
              <KakaoAdBanner adUnit="DAN-UmNjtEgKug6zpii0" width={728} height={90} style={{ marginBottom: '20px' }} />
              <SpaceFeed
                spaceId={displaySpaceId}
                spaceName={isPersonalSpace ? undefined : group?.name}
                members={members}
                currentUser={user ?? null}
                currentUserRole={myRole}
              />
            </>
          )}
          {activeSection === 'schedule' && user && (
            <SpaceScheduleTimeline spaceId={displaySpaceId} members={members} currentUserId={user.id} />
          )}
          {activeSection === 'members' && (
            <section style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', borderRadius: '24px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid var(--theme-border)' }}>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--theme-text)', fontSize: '17px', fontWeight: 850 }}>공간 멤버</h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--theme-text-subtle)', fontSize: '12px', fontWeight: 600 }}>역할과 참여 상태를 한눈에 확인합니다.</p>
                </div>
                {!isPersonalSpace && !memberAtLimit && (
                  <button type="button" onClick={() => setShowInviteModal(true)} style={{ minHeight: '40px', padding: '0 14px', borderRadius: '13px', border: '1px solid rgba(0,132,204,0.20)', background: 'rgba(0,132,204,0.08)', color: '#0084CC', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>멤버 초대</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1px', background: 'var(--theme-border)' }}>
                {members.map(member => (
                  <div key={member.id} style={{ minHeight: '76px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--theme-surface)' }}>
                    <UserAvatar avatar={member.user?.avatar} name={member.user?.name} size={44} radius={15} fontSize={16} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--theme-text)', fontSize: '14px', fontWeight: 800 }}>{member.nickname || member.user?.displayName || member.user?.name || '사용자'}</p>
                      <p style={{ margin: '3px 0 0', color: 'var(--theme-text-subtle)', fontSize: '11px', fontWeight: 650 }}>{ROLE_LABELS[member.role]}{member.userId === user?.id ? ' · 나' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── 오른쪽 사이드바 ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── 다가오는 일정 위젯 ── */}
          {(() => {
            const nowDate = new Date(); nowDate.setHours(0, 0, 0, 0);
            const upcoming = schedules
              .filter(s => {
                if (s.type === 'expense' || s.visibility === 'private') return false;
                const d = new Date(s.startTime); d.setHours(0, 0, 0, 0);
                return d >= nowDate;
              })
              .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
              .slice(0, 3);
            return (
              <div style={{
                background: 'var(--theme-surface)', borderRadius: '24px', padding: '20px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--theme-text)', margin: 0 }}>다가오는 일정</h3>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '10px', background: 'rgba(0,132,204,0.08)', border: '1px solid rgba(0,132,204,0.15)', color: '#0084CC', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    추가
                  </button>
                </div>
                {upcoming.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <p style={{ fontSize: '20px', margin: '0 0 6px' }}>📅</p>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: 0 }}>예정된 일정이 없어요</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {upcoming.map(s => {
                      const d = new Date(s.startTime);
                      const mo = d.getMonth() + 1;
                      const da = d.getDate();
                      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                      const wd = weekdays[d.getDay()];
                      const todayCheck = new Date(); todayCheck.setHours(0,0,0,0);
                      const isToday = d.getTime() === todayCheck.getTime();
                      return (
                        <button
                          key={s.id}
                          onClick={() => router.push(`/schedules/${s.id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '14px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                        >
                          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: isToday ? 'rgba(0,132,204,0.12)' : 'rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: isToday ? '#0084CC' : 'var(--theme-text-subtle)' }}>{mo}월</span>
                            <span style={{ fontSize: '15px', fontWeight: 900, color: isToday ? '#0084CC' : 'var(--theme-text)', lineHeight: 1.1 }}>{da}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--theme-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: '1px 0 0' }}>{isToday ? '오늘' : `${mo}/${da} (${wd})`}</p>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setActiveSection('schedule')}
                      style={{ fontSize: '12px', fontWeight: 800, color: '#0084CC', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', textAlign: 'center' }}
                    >
                      모든 일정 보기 →
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── 공간 관리 ── */}
          {!isPersonalSpace && (
            <div style={{
              background: 'var(--theme-surface)', borderRadius: '24px', padding: '18px 20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
            }}>
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--theme-text)', margin: 0 }}>공간 관리</h3>
                {myRole && (
                  <span style={{
                    fontSize: '10px', fontWeight: 800, letterSpacing: '0.03em',
                    padding: '2px 9px', borderRadius: '999px',
                    background: ROLE_COLORS[myRole].bg, color: ROLE_COLORS[myRole].text,
                  }}>
                    {ROLE_LABELS[myRole]}
                  </span>
                )}
              </div>

              {/* 관리 액션 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* 멤버 관리 */}
                <button
                  onClick={() => setShowMgmtModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '12px', width: '100%',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-surface-muted)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>👥</span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: 'var(--theme-text)' }}>멤버 관리</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--theme-text-subtle)', background: 'var(--theme-surface-muted)', padding: '2px 8px', borderRadius: '999px' }}>
                    {memberCount}명
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-subtle)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>

                {/* 공간 이름 수정 (admin만) */}
                {isAdmin && (
                  <button
                    onClick={() => { setRenamingTo(group?.name ?? ''); setShowRenameModal(true); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '12px', width: '100%',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-surface-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>✏️</span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: 'var(--theme-text)' }}>공간 이름 수정</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-subtle)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                )}

                {/* 멤버 초대 (admin/editor) */}
                {capabilities.canInviteMembers && (isAdmin || myRole === 'editor') && !memberAtLimit && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '12px', width: '100%',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-surface-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>🔗</span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: 'var(--theme-text)' }}>멤버 초대</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-subtle)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                )}

                {/* 구분선 */}
                <div style={{ height: '1px', background: 'var(--theme-surface-muted)', margin: '6px 4px' }} />

                {/* 공간 탈퇴 */}
                {!isAdmin && (
                  <button
                    onClick={async () => {
                      if (!displaySpaceId || !user) return;
                      if (!confirm('정말 이 공간에서 탈퇴하시겠습니까?')) return;
                      await removeSpaceMember(displaySpaceId, user.id);
                      await refreshUser();
                      router.push('/space');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '12px', width: '100%',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>🚪</span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: '#EF4444' }}>공간 탈퇴</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── 공간 지출 요약 (공유 공간만) ── */}
          {capabilities.canViewHouseholdBudget && !isPersonalSpace && (
            <div style={{
              background: 'var(--theme-surface)', borderRadius: '24px', padding: '24px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 2px' }}>
                    공간 지출
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', fontWeight: 600, margin: 0 }}>
                    이번 달 공유 지출
                  </p>
                </div>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '7px 13px', borderRadius: '12px',
                    background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.15)',
                    color: '#D97706', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                  추가
                </button>
              </div>

              {thisMonthExpenses.length === 0 ? (
                <div style={{
                  padding: '20px', borderRadius: '14px',
                  background: 'rgba(245,158,11,0.04)', border: '1px dashed rgba(245,158,11,0.18)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '24px', margin: '0 0 6px' }}>💸</p>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: 0 }}>
                    이번 달 등록된 지출이 없어요
                  </p>
                </div>
              ) : (
                <>
                  {/* 총액 */}
                  <div style={{
                    padding: '14px 16px', borderRadius: '16px',
                    background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.12)',
                    marginBottom: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#D97706' }}>이번 달 합계</span>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#D97706', letterSpacing: '-0.5px' }}>
                      {formatAmount(thisMonthTotal)}
                    </span>
                  </div>
                  {/* 최근 지출 목록 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {thisMonthExpenses.slice(0, 4).map(expense => (
                      <button
                        key={expense.id}
                        onClick={() => router.push(`/schedules/${expense.id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', borderRadius: '12px',
                          background: 'var(--theme-surface-muted)', border: 'none',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                        }}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                          background: 'rgba(217,119,6,0.10)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px',
                        }}>💰</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--theme-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {expense.title}
                          </p>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: '1px 0 0' }}>
                            {formatAmount(expense.amount ?? 0)}
                          </p>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    ))}
                    {thisMonthExpenses.length > 4 && (
                      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--theme-text-subtle)', textAlign: 'center', margin: '4px 0 0' }}>
                        + {thisMonthExpenses.length - 4}건 더 있음
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
        {/* ── 사이드바 끝 ── */}
      </div>

      {/* ════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════ */}

      {/* ════ 일정 추가 모달 ════ */}
      {showScheduleModal && displaySpaceId && (
        <SpaceEntryModal
          type="schedule"
          spaceId={displaySpaceId}
          members={members}
          currentUserId={user?.id ?? ''}
          onClose={() => setShowScheduleModal(false)}
          onSaved={async (s: Schedule) => {
            await refreshSchedules();
            setShowScheduleModal(false);
            if (!isPersonalSpace && group?.name) {
              const d = new Date(s.startTime);
              const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`;
              void sendSpaceNotification({
                spaceId: displaySpaceId,
                spaceName: group.name,
                message: `${dateStr} 일정 "${s.title}"이 추가되었어요. 확인해보세요.`,
                url: '/space',
                excludeUserId: user?.id,
              });
            }
          }}
        />
      )}

      {/* ════ 지출 등록 모달 ════ */}
      {showExpenseModal && displaySpaceId && (
        <SpaceEntryModal
          type="expense"
          spaceId={displaySpaceId}
          members={members}
          currentUserId={user?.id ?? ''}
          onClose={() => setShowExpenseModal(false)}
          onSaved={async (s: Schedule) => {
            await refreshSchedules();
            setShowExpenseModal(false);
            if (!isPersonalSpace && group?.name) {
              const d = new Date(s.startTime);
              const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`;
              void sendSpaceNotification({
                spaceId: displaySpaceId,
                spaceName: group.name,
                message: `${group.name} 공간에 ${dateStr} 지출항목 "${s.title}"이 추가되었어요. 확인해보세요.`,
                url: '/space',
                excludeUserId: user?.id,
              });
            }
          }}
        />
      )}

      {/* ════ 공간 관리 모달 ════ */}
      {showMgmtModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowMgmtModal(false)}
        >
          <div
            style={{ background: 'var(--theme-surface)', borderRadius: '32px', padding: '0', width: '100%', maxWidth: '540px', maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid var(--theme-surface-muted)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 4px' }}>공간 관리</h3>
                  <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', fontWeight: 600, margin: 0 }}>{group?.name}</p>
                </div>
                <button
                  onClick={() => setShowMgmtModal(false)}
                  style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--theme-text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >✕</button>
              </div>
            </div>

            {/* 스크롤 영역 */}
            <div style={{ overflow: 'auto', flex: 1, padding: '24px 32px' }}>

              {/* ── 멤버 목록 ── */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--theme-text-subtle)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>멤버 {memberCount}명</h4>
                  {capabilities.canInviteMembers && isAdmin && !memberAtLimit && (
                    <button
                      onClick={() => { setShowMgmtModal(false); setShowInviteModal(true); }}
                      style={{ fontSize: '12px', fontWeight: 800, color: '#0084CC', background: 'rgba(0,132,204,0.08)', border: '1px solid rgba(0,132,204,0.15)', padding: '5px 14px', borderRadius: '999px', cursor: 'pointer' }}
                    >
                      + 초대하기
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {members.map((member) => {
                    const roleColors = ROLE_COLORS[member.role];
                    const isMe = member.userId === user?.id;
                    const isEditingThisRole = editingRole === member.id;
                    return (
                      <div key={member.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '16px', background: 'var(--theme-surface-muted)' }}>
                          <UserAvatar avatar={member.user?.avatar} name={member.user?.name} size={40} radius={14} fontSize={18} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {member.nickname ?? member.user?.name ?? '멤버'}{isMe ? ' (나)' : ''}
                            </p>
                            {member.nickname && (
                              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: '1px 0 0' }}>{member.user?.name}</p>
                            )}
                            {isMe && !editingNickname && (
                              <button
                                onClick={() => { setNicknameInput(member.nickname ?? ''); setEditingNickname(true); }}
                                style={{ fontSize: '11px', fontWeight: 700, color: '#0084CC', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0 0' }}
                              >
                                닉네임 {member.nickname ? '수정' : '설정'}
                              </button>
                            )}
                            {isMe && editingNickname && (
                              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }} onClick={e => e.stopPropagation()}>
                                <input
                                  value={nicknameInput}
                                  onChange={e => setNicknameInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && void handleSaveNickname()}
                                  placeholder="공간 닉네임"
                                  autoFocus
                                  style={{ flex: 1, padding: '6px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, background: 'var(--theme-surface)', border: '1.5px solid #0084CC', outline: 'none', color: 'var(--theme-text)', minWidth: 0 }}
                                />
                                <button onClick={handleSaveNickname} disabled={savingNickname} style={{ padding: '6px 12px', borderRadius: '10px', background: '#0084CC', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 800, color: 'white' }}>
                                  {savingNickname ? '...' : '저장'}
                                </button>
                                <button onClick={() => setEditingNickname(false)} style={{ padding: '6px 10px', borderRadius: '10px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>
                                  취소
                                </button>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <button
                              disabled={!isAdmin || isMe}
                              onClick={() => isAdmin && !isMe && setEditingRole(isEditingThisRole ? null : member.id)}
                              style={{
                                padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 800,
                                background: roleColors.bg, color: roleColors.text,
                                border: isAdmin && !isMe ? '1px dashed currentColor' : 'none',
                                cursor: isAdmin && !isMe ? 'pointer' : 'default',
                              }}
                            >
                              {ROLE_LABELS[member.role]}{isAdmin && !isMe ? ' ▾' : ''}
                            </button>
                            {isAdmin && !isMe && (
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444', fontSize: '12px' }}
                              >✕</button>
                            )}
                          </div>
                        </div>
                        {/* 역할 편집 */}
                        {isEditingThisRole && (
                          <div style={{ margin: '4px 0 6px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(0,132,204,0.04)', border: '1px solid rgba(0,132,204,0.10)' }}>
                            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', margin: '0 0 8px' }}>역할 변경</p>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {(['admin', 'editor', 'viewer'] as SpaceRole[]).map(role => (
                                <button
                                  key={role}
                                  onClick={() => handleRoleChange(member.id, member.userId, role)}
                                  style={{
                                    flex: 1, padding: '8px 4px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                                    border: `2px solid ${member.role === role ? '#0084CC' : '#E5E5EA'}`,
                                    background: member.role === role ? 'rgba(0,132,204,0.08)' : 'white',
                                    color: member.role === role ? '#0084CC' : '#8E8E93', cursor: 'pointer',
                                  }}
                                >
                                  {ROLE_LABELS[role]}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 초대 코드 */}
                {currentInviteCode && (
                  <div style={{ marginTop: '14px', padding: '14px 16px', borderRadius: '16px', background: 'rgba(12,201,181,0.06)', border: '1px solid rgba(12,201,181,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '9px', fontWeight: 800, color: '#0CC9B5', margin: '0 0 3px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>초대 코드</p>
                      <span style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '4px', color: '#0CC9B5' }}>{currentInviteCode}</span>
                    </div>
                    <button onClick={copyInviteCode} style={{ padding: '7px 14px', borderRadius: '12px', background: copied ? 'rgba(12,201,181,0.20)' : 'var(--theme-surface)', border: '1px solid rgba(0,0,0,0.06)', fontSize: '12px', fontWeight: 800, color: copied ? '#0CC9B5' : 'var(--theme-text)', cursor: 'pointer' }}>
                      {copied ? '✓ 복사됨' : '복사'}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 초대 모달 */}
      {showInviteModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{ background: 'var(--theme-surface)', borderRadius: '32px', padding: '36px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: 'rgba(0,132,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px' }}>🔗</div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--theme-text)', textAlign: 'center', margin: '0 0 6px' }}>멤버 초대하기</h3>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', fontWeight: 600, textAlign: 'center', margin: '0 0 4px' }}>{group?.name ?? '이 공간'}</p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', fontWeight: 600, textAlign: 'center', margin: '0 0 24px' }}>
              현재 {memberCount}명 · {FREE_MAX_MEMBERS - memberCount}명 더 초대 가능
            </p>

            {currentInviteCode && (
              <div style={{ background: 'var(--theme-surface-muted)', borderRadius: '16px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--theme-text-subtle)', margin: '0 0 4px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>초대 코드</p>
                  <span style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '4px', color: '#0CC9B5' }}>{currentInviteCode}</span>
                </div>
                <button onClick={copyInviteCode} style={{ padding: '8px 16px', borderRadius: '12px', background: 'var(--theme-surface)', border: '1.5px solid rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 800, color: 'var(--theme-text)', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  코드만 복사
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <button onClick={shareViaKakao} disabled={generatingCode || shareKakao}
                style={{ width: '100%', height: '56px', borderRadius: '16px', background: '#FEE500', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px', fontWeight: 800, color: '#1A1B2E', opacity: shareKakao ? 0.7 : 1 }}>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4C12.95 4 4 11.82 4 21.4c0 6.06 3.84 11.38 9.6 14.44L11.2 44l10.56-5.44c.72.1 1.46.16 2.24.16 11.05 0 20-7.82 20-17.4C44 11.82 35.05 4 24 4z" fill="#1A1B2E"/>
                </svg>
                {shareKakao ? '공유 중...' : '카카오톡으로 공유'}
              </button>
              <button onClick={shareViaSms} disabled={generatingCode || shareSms}
                style={{ width: '100%', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #34C759, #30B050)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px', fontWeight: 800, color: 'white', opacity: shareSms ? 0.7 : 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {shareSms ? '문자 앱 열기...' : '문자 메시지로 보내기'}
              </button>
              <button onClick={copyFullMessage} disabled={generatingCode}
                style={{ width: '100%', height: '56px', borderRadius: '16px', background: copied ? '#0CC9B5' : copyError ? '#EF4444' : '#1A1B2E', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '15px', fontWeight: 800, color: 'white', opacity: generatingCode ? 0.7 : 1, transition: 'background 0.2s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {copied ? '복사됨 ✓' : copyError ? '복사 실패' : generatingCode ? '준비 중...' : '초대 메시지 복사'}
              </button>
            </div>

            <details style={{ marginBottom: '16px' }}>
              <summary style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                공유될 메시지 미리보기
              </summary>
              <div style={{ marginTop: '10px', padding: '14px 16px', borderRadius: '14px', background: 'var(--theme-surface-muted)', fontSize: '12px', fontWeight: 500, color: '#3C3C43', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {currentInviteCode ? buildShareMessage(currentInviteCode) : '초대 코드가 준비되면 최신 링크와 함께 초대문이 생성됩니다.'}
              </div>
            </details>

            <button onClick={() => setShowInviteModal(false)}
              style={{ width: '100%', height: '50px', borderRadius: '16px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 공간 합류 모달 */}
      {showJoinModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowJoinModal(false)}
        >
          <div
            style={{ background: 'var(--theme-surface)', borderRadius: '32px', padding: '36px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(12,201,181,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 20px' }}>🗝️</div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--theme-text)', textAlign: 'center', margin: '0 0 8px' }}>공간 참여하기</h3>
            <p style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', fontWeight: 600, textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>공유받은 초대 코드를 입력하여 공간에 참여하세요.</p>
            <input
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="초대 코드 입력 (예: ABC123)"
              style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F7F7FA', border: `1.5px solid ${joinError ? '#EF4444' : joinCode ? '#0CC9B5' : 'transparent'}`, fontSize: '20px', fontFamily: 'monospace', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', outline: 'none', boxSizing: 'border-box', marginBottom: '8px', color: 'var(--theme-text)', letterSpacing: '0.15em', transition: 'border-color 0.2s' }}
            />
            {joinError && <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 700, textAlign: 'center', marginBottom: '12px' }}>{joinError}</p>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowJoinModal(false)}
                style={{ flex: 1, height: '52px', borderRadius: '16px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>취소</button>
              <button onClick={handleJoin} disabled={joining || !joinCode.trim()}
                style={{ flex: 2, height: '52px', borderRadius: '16px', background: joinCode.trim() ? 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)' : '#F0F0F5', border: 'none', cursor: joinCode.trim() ? 'pointer' : 'default', fontSize: '15px', fontWeight: 800, color: joinCode.trim() ? 'white' : '#AEAEA8', opacity: joining ? 0.7 : 1 }}>
                {joining ? '확인 중...' : '참여 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이름 수정 모달 */}
      {showRenameModal && isAdmin && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowRenameModal(false)}
        >
          <div
            style={{ background: 'var(--theme-surface)', borderRadius: '28px', padding: '36px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 6px', textAlign: 'center' }}>공간 이름 수정</h3>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', fontWeight: 600, textAlign: 'center', margin: '0 0 24px' }}>새로운 공간 이름을 입력하세요.</p>
            <input
              value={renamingTo}
              onChange={e => setRenamingTo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              placeholder="새 공간 이름"
              autoFocus
              style={{ width: '100%', height: '56px', padding: '0 18px', borderRadius: '16px', fontSize: '17px', fontWeight: 700, background: 'var(--theme-surface-muted)', border: `2px solid ${renamingTo ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)', marginBottom: '16px', transition: 'border-color 0.2s' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowRenameModal(false)}
                style={{ flex: 1, height: '52px', borderRadius: '16px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>취소</button>
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
