'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { useSchedules } from '@/hooks/useSchedules';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import {
  joinSpaceByCode, updateSpaceName, removeSpaceMember,
  getMySpaces, updateSpaceMemberRole, updateSpaceCoverImage,
  regenerateInviteCode, updateSpaceMemberNickname,
} from '@/lib/db';
import { SpaceFeed } from './SpaceFeed';
import { KakaoAdBanner } from '@/components/ads/KakaoAdBanner';
import { SpaceEntryModal } from './SpaceEntryModal';
import { toast } from 'sonner';
import type { Space, SpaceMember, SpaceRole } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';

const FREE_MAX_SPACES  = 2;
const FREE_MAX_MEMBERS = 10;

// ── 역할 레이블 ────────────────────────────────────────────
const ROLE_LABELS: Record<SpaceRole, string> = { admin: '공간 지기', editor: '공간 운영자', viewer: '공간 멤버' };
const ROLE_OPTIONS: SpaceRole[] = ['admin', 'editor', 'viewer'];

export function MobileSpace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { spaceId, user, profile, loading: userLoading, refresh: refreshUser } = useCurrentUser();

  // space/new 에서 넘어올 때 새 공간 ID를 즉시 표시하기 위한 파라미터
  const sidParam = searchParams.get('sid');

  // ── 상태 ──────────────────────────────────────────────
  const [showInviteModal, setShowInviteModal]   = useState(false);
  const [showJoinModal,   setShowJoinModal]      = useState(false);
  const [copied,          setCopied]             = useState(false);
  const [copyError,       setCopyError]          = useState(false);
  const [generatingCode,  setGeneratingCode]     = useState(false);
  const [shareKakao,      setShareKakao]         = useState(false);
  const [shareSms,        setShareSms]           = useState(false);
  const [joinCode,        setJoinCode]           = useState('');
  const [joining,         setJoining]            = useState(false);
  const [joinError,       setJoinError]          = useState('');

  // Inline name editing
  const [isEditingName,       setIsEditingName]       = useState(false);
  const [editName,            setEditName]            = useState('');
  const [savingName,          setSavingName]          = useState(false);
  const [optimisticSpaceName, setOptimisticSpaceName] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Cover image
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // My spaces (for plan + swipe)
  const [mySpaces,     setMySpaces]     = useState<Space[]>([]);
  const [spaceIndex,   setSpaceIndex]   = useState(0);

  // 우선순위: 1) URL ?sid 파라미터  2) localStorage 최근 공간  3) profiles.family_group_id
  const initActiveSpace = (() => {
    if (typeof window === 'undefined') return spaceId;
    if (sidParam) return sidParam;
    try {
      const stored = localStorage.getItem('gleaum_lastSpaceId');
      if (stored) return stored;
    } catch {}
    return spaceId;
  })();
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(initActiveSpace);

  // FAB / 바텀 시트 상태
  const [showFabSheet,      setShowFabSheet]      = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showExpenseModal,  setShowExpenseModal]  = useState(false);
  const [showManageSheet,   setShowManageSheet]   = useState(false);

  // 관리 시트 내부 상태
  const [editingRole,    setEditingRole]    = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameValue,   setNicknameValue]  = useState('');
  const [savingNickname,  setSavingNickname] = useState(false);

  // Push subscriptions
  usePushSubscription();

  // ★ spaceId(profiles.family_group_id)가 바뀌면 activeSpaceId도 동기화
  useEffect(() => {
    if (spaceId && !activeSpaceId) {
      setActiveSpaceId(spaceId);
    }
  }, [spaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ★ activeSpaceId 변경 시 localStorage 저장 + optimistic 이름/초대코드 초기화
  useEffect(() => {
    if (!activeSpaceId) return;
    try { localStorage.setItem('gleaum_lastSpaceId', activeSpaceId); } catch {}
    setOptimisticSpaceName(null);
    setLiveInviteCode(undefined);
  }, [activeSpaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ★ 모바일 앱/PWA 포그라운드 복귀 시 최신 데이터 재조회
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
        void getMySpaces().then(setMySpaces);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ★ 스와이프된 공간 ID 우선 사용 (activeSpaceId) — 없으면 기본 spaceId
  const displaySpaceId = activeSpaceId ?? spaceId;

  const { space: group, members, myRole, loading, refresh } = useSpace(displaySpaceId);
  const isAdmin = myRole === 'admin';

  const { refresh: refreshSchedules } = useSchedules(displaySpaceId);

  // ── 개인 공간 여부 ─────────────────────────────────────────
  const personalSpaceId = (profile?.preferences as { personalSpaceId?: string } | null)?.personalSpaceId ?? null;
  const isPersonalSpace = !!displaySpaceId && displaySpaceId === personalSpaceId;

  // Swipe
  const touchStartX = useRef<number>(0);
  const touchEndX   = useRef<number>(0);

  // ── 데이터 로드 ──────────────────────────────────────
  useEffect(() => {
    getMySpaces().then(spaces => {
      setMySpaces(spaces);
      const currentId = activeSpaceId ?? spaceId;
      let idx = spaces.findIndex(s => s.id === currentId);
      if (idx < 0 && spaceId) idx = spaces.findIndex(s => s.id === spaceId);
      const finalIdx = idx >= 0 ? idx : 0;
      setSpaceIndex(finalIdx);
      if (spaces[finalIdx] && spaces[finalIdx].id !== activeSpaceId) {
        setActiveSpaceId(spaces[finalIdx].id);
      }
    });
  }, [spaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 공간이 없으면 온보딩으로
  useEffect(() => {
    if (!userLoading && !spaceId) {
      router.replace('/space/new');
    }
  }, [userLoading, spaceId, router]);

  // cover image 초기화
  useEffect(() => {
    setCoverImageUrl((group as any)?.coverImageUrl ?? null);
  }, [group]);

  // ── 스와이프 핸들러 ──────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) < 60) return;

    if (diff > 0 && spaceIndex < mySpaces.length - 1) {
      const next = spaceIndex + 1;
      setSpaceIndex(next);
      setActiveSpaceId(mySpaces[next].id);
    } else if (diff < 0 && spaceIndex > 0) {
      const prev = spaceIndex - 1;
      setSpaceIndex(prev);
      setActiveSpaceId(mySpaces[prev].id);
    }
  };

  // ── 공간 이름 편집 ────────────────────────────────────
  const startEditing = () => {
    setEditName(group?.name ?? '');
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };
  const cancelEditing = () => { setIsEditingName(false); setEditName(''); };
  const handleSaveName = async () => {
    if (!editName.trim() || !displaySpaceId) return;
    setSavingName(true);
    const ok = await updateSpaceName(displaySpaceId, editName.trim());
    setSavingName(false);
    setIsEditingName(false);
    if (ok) {
      setOptimisticSpaceName(editName.trim());
      setMySpaces(prev => prev.map(s =>
        s.id === displaySpaceId ? { ...s, name: editName.trim() } : s
      ));
      try { localStorage.setItem('gleaum_space_name_updated', Date.now().toString()); } catch {}
      void refresh();
      void getMySpaces().then(spaces => { setMySpaces(spaces); });
    }
  };

  // group 데이터가 갱신되면 optimistic 이름 클리어
  useEffect(() => {
    if (group?.name) setOptimisticSpaceName(null);
  }, [group?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // SpaceFeed의 + 버튼 → FAB 액션 시트 열기
  useEffect(() => {
    const handler = () => setShowFabSheet(true);
    window.addEventListener('gleaum:openFabSheet', handler);
    return () => window.removeEventListener('gleaum:openFabSheet', handler);
  }, []);

  // 다른 페이지에서 이름 변경 후 돌아왔을 때 재조회
  const prevPathname = useRef(pathname);
  const lastRefreshKey = useRef<string | null>(null);
  useEffect(() => {
    const pathChanged = prevPathname.current !== pathname && pathname === '/space';
    let flagChanged = false;
    try {
      const flag = localStorage.getItem('gleaum_space_name_updated');
      if (flag && flag !== lastRefreshKey.current) {
        lastRefreshKey.current = flag;
        flagChanged = true;
      }
    } catch {}
    if (pathChanged || flagChanged) { refresh(); }
    prevPathname.current = pathname;
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 커버 이미지 업로드 ────────────────────────────────
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !displaySpaceId) return;
    setUploadingCover(true);
    const url = await updateSpaceCoverImage(displaySpaceId, file);
    if (url) setCoverImageUrl(url);
    setUploadingCover(false);
  };

  // ── 멤버 역할 변경 ────────────────────────────────────
  const handleRoleChange = async (memberId: string, userId: string, role: SpaceRole) => {
    if (!displaySpaceId) return;
    await updateSpaceMemberRole(displaySpaceId, userId, role);
    setEditingRole(null);
    await refresh();
  };

  // ── 멤버 제거 ─────────────────────────────────────────
  const handleRemoveMember = async (userId: string) => {
    if (!displaySpaceId) return;
    if (!confirm('이 멤버를 공간에서 제거하시겠습니까?')) return;
    await removeSpaceMember(displaySpaceId, userId);
    await refresh();
  };

  // ── 닉네임 저장 ───────────────────────────────────────
  const handleSaveNickname = async () => {
    if (!displaySpaceId) return;
    setSavingNickname(true);
    const ok = await updateSpaceMemberNickname(displaySpaceId, nicknameValue);
    setSavingNickname(false);
    if (ok) {
      setEditingNickname(false);
      await refresh();
      toast.success('닉네임이 변경되었습니다.');
    }
  };

  // ── 공간 탈퇴 ─────────────────────────────────────────
  const handleLeaveSpace = async () => {
    if (!displaySpaceId || !user?.id) return;
    if (!confirm('이 공간에서 탈퇴하시겠습니까?')) return;
    await removeSpaceMember(displaySpaceId, user.id);
    await refreshUser();
    await getMySpaces().then(spaces => {
      setMySpaces(spaces);
      if (spaces.length > 0) {
        setSpaceIndex(0);
        setActiveSpaceId(spaces[0].id);
      } else {
        router.replace('/space/new');
      }
    });
    setShowManageSheet(false);
  };

  // ── 초대 링크 ────────────────────────────────────────
  const [liveInviteCode, setLiveInviteCode] = useState<string | undefined>(undefined);
  const currentInviteCode = liveInviteCode ?? group?.inviteCode;

  const isInviteCodeValid = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/invite/info?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
      return res.ok;
    } catch { return false; }
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
        document.body.appendChild(el);
        el.focus(); el.select();
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

  const copyInviteCode = async () => {
    const code = await ensureInviteCode();
    if (!code) return;
    showCopyResult(await writeClipboard(code));
  };

  const buildShareMessage = (inviteCode: string) => {
    const spaceName  = optimisticSpaceName ?? group?.name ?? '공간';
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

  const shareViaKakao = async () => {
    const code = await ensureInviteCode();
    if (!code) return;
    setShareKakao(true);
    const message = buildShareMessage(code);
    const link = `https://gleaum.com/invite/${code}`;
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
    const code = await ensureInviteCode();
    if (!code) return;
    setShareSms(true);
    const message = buildShareMessage(code);
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
    setTimeout(() => setShareSms(false), 1500);
  };

  const copyFullMessage = async () => {
    const code = await ensureInviteCode();
    if (!code) return;
    const message = buildShareMessage(code);
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

  // ── 공간 합류 ─────────────────────────────────────────
  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true); setJoinError('');
    const result = await joinSpaceByCode(joinCode.trim().toUpperCase());
    setJoining(false);
    if (result.success) {
      await refreshUser(); await refresh();
      await getMySpaces().then(setMySpaces);
      setShowJoinModal(false); setJoinCode('');
    } else {
      setJoinError('유효하지 않은 공간 코드입니다.');
    }
  };

  const memberCount   = members.length;
  const memberAtLimit = memberCount >= FREE_MAX_MEMBERS;
  const sharedSpaceCount = mySpaces.filter(s => s.id !== personalSpaceId).length;
  const spaceAtLimit     = sharedSpaceCount >= FREE_MAX_SPACES;
  const currentSpaceName = optimisticSpaceName ?? group?.name ?? mySpaces.find(s => s.id === displaySpaceId)?.name ?? '나의 공간';
  const myMember = members.find(m => m.userId === user?.id);

  // ── 로딩 ─────────────────────────────────────────────
  if (userLoading || (!displaySpaceId && !userLoading)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #0084CC', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh"
      style={{ background: 'var(--theme-bg)', paddingBottom: 'max(80px, calc(80px + env(safe-area-inset-bottom)))' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Sticky frosted header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        padding: 'calc(env(safe-area-inset-top) + 12px) 20px 14px',
        background: 'var(--theme-nav-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--theme-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 공간 아이콘 */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '12px',
            background: 'rgba(0,132,204,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', flexShrink: 0,
          }}>🏠</div>

          {/* 공간명 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--theme-text)', letterSpacing: '-0.5px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentSpaceName}
            </h1>
          </div>

          {/* 역할 뱃지 */}
          {myRole && (
            <span style={{
              fontSize: '10px', fontWeight: 800, letterSpacing: '0.2px',
              padding: '3px 8px', borderRadius: '999px',
              background: myRole === 'admin' ? 'rgba(0,132,204,0.10)' : myRole === 'editor' ? 'rgba(12,201,181,0.10)' : 'rgba(142,142,147,0.10)',
              color: myRole === 'admin' ? '#0084CC' : myRole === 'editor' ? '#0CC9B5' : '#8E8E93',
              flexShrink: 0,
            }}>
              {ROLE_LABELS[myRole]}
            </span>
          )}

          {/* 공간 관리 버튼 */}
          <button
            onClick={() => setShowManageSheet(true)}
            style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', cursor: 'pointer', flexShrink: 0 }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>

        {/* 공간 인디케이터 도트 */}
        {mySpaces.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '10px' }}>
            {mySpaces.map((s, i) => (
              <button
                key={i}
                onClick={() => { setSpaceIndex(i); setActiveSpaceId(mySpaces[i].id); }}
                title={s.name}
                style={{
                  width: i === spaceIndex ? '20px' : '6px',
                  height: '6px', borderRadius: '999px',
                  background: i === spaceIndex ? '#0084CC' : '#D1D1D6',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        )}
      </header>

      {/* ── 멤버 클러스터 (compact) ── */}
      {!isPersonalSpace && members.length > 0 && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', borderRadius: '16px',
            background: 'var(--theme-surface)',
            border: '1px solid var(--theme-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {members.slice(0, 5).map((m, i) => (
                <div key={m.id} style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: 5 - i }}>
                  <UserAvatar
                    avatar={m.user?.avatar}
                    name={m.user?.name}
                    size={28}
                    radius={999}
                    fontSize={13}
                    style={{ border: '2px solid var(--theme-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
                  />
                </div>
              ))}
              {members.length > 5 && (
                <div style={{
                  marginLeft: '-8px', width: '28px', height: '28px', borderRadius: '999px',
                  background: 'var(--theme-surface-muted)', border: '2px solid var(--theme-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 800, color: 'var(--theme-text-subtle)',
                }}>
                  +{members.length - 5}
                </div>
              )}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', flex: 1 }}>
              {memberCount}명이 함께하는 커뮤니티
            </span>
            {!memberAtLimit && (
              <button
                onClick={() => setShowInviteModal(true)}
                style={{ fontSize: '11px', fontWeight: 800, color: '#0084CC', background: 'rgba(0,132,204,0.08)', border: 'none', borderRadius: '999px', padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                + 초대
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 메인 콘텐츠: SpaceFeed ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #0084CC', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--theme-text-subtle)' }}>공간 정보를 불러오는 중...</p>
        </div>
      ) : (
        <>
          {/* ── 카카오 광고 배너 (320×100) ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <KakaoAdBanner
              adUnit="DAN-9QO2xcl8YeUyiixc"
              width={320}
              height={100}
            />
          </div>
          <SpaceFeed
            spaceId={displaySpaceId}
            members={members}
            currentUser={user ?? null}
            currentUserRole={myRole}
            spaceName={currentSpaceName}
            isMobile
          />
        </>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setShowFabSheet(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          right: '20px',
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', color: 'white', fontWeight: 400,
          boxShadow: '0 4px 16px rgba(0,132,204,0.35)',
          zIndex: 35,
          transition: 'transform 0.15s ease',
        }}
        aria-label="새 항목 추가"
      >
        ＋
      </button>

      {/* ── FAB 바텀 액션 시트 ── */}
      {showFabSheet && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setShowFabSheet(false)}
        >
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'var(--theme-surface)', borderRadius: '28px 28px 0 0',
              padding: `20px 20px calc(env(safe-area-inset-bottom) + 28px)`,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
              maxWidth: '600px', margin: '0 auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'var(--theme-surface-muted)' }} />
            </div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--theme-text-subtle)', marginBottom: '16px', textAlign: 'center', letterSpacing: '0.5px', textTransform: 'uppercase' }}>무엇을 추가할까요?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 게시물 작성 — SpaceFeed 내 CreatePostModal 트리거 */}
              <button
                onClick={() => {
                  setShowFabSheet(false);
                  // SpaceFeed의 작성 버튼을 프로그래매틱으로 트리거하기 위해 커스텀 이벤트 발생
                  window.dispatchEvent(new CustomEvent('gleaum:openCreatePost'));
                }}
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: '20px',
                  border: '1.5px solid rgba(0,0,0,0.06)', background: 'var(--theme-surface-muted)',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '24px' }}>💬</span>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px' }}>게시물 작성</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>일반·공지·투표·회비 게시물 올리기</p>
                </div>
              </button>

              {/* 일정 추가 */}
              <button
                onClick={() => { setShowFabSheet(false); setShowScheduleModal(true); }}
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: '20px',
                  border: '1.5px solid rgba(0,0,0,0.06)', background: 'var(--theme-surface-muted)',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '24px' }}>📅</span>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px' }}>일정 추가</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>공간 일정을 등록하고 멤버와 공유</p>
                </div>
              </button>

              {/* 지출 등록 */}
              <button
                onClick={() => { setShowFabSheet(false); setShowExpenseModal(true); }}
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: '20px',
                  border: '1.5px solid rgba(0,0,0,0.06)', background: 'var(--theme-surface-muted)',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '24px' }}>💰</span>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px' }}>지출 등록</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>공간 지출 내역 기록하기</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SpaceEntryModal: 일정 ── */}
      {showScheduleModal && displaySpaceId && user && (
        <SpaceEntryModal
          type="schedule"
          spaceId={displaySpaceId}
          members={members}
          currentUserId={user.id}
          onClose={() => setShowScheduleModal(false)}
          onSaved={() => { setShowScheduleModal(false); void refreshSchedules(); }}
        />
      )}

      {/* ── SpaceEntryModal: 지출 ── */}
      {showExpenseModal && displaySpaceId && user && (
        <SpaceEntryModal
          type="expense"
          spaceId={displaySpaceId}
          members={members}
          currentUserId={user.id}
          onClose={() => setShowExpenseModal(false)}
          onSaved={() => { setShowExpenseModal(false); void refreshSchedules(); }}
        />
      )}

      {/* ── 공간 관리 바텀 시트 ── */}
      {showManageSheet && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setShowManageSheet(false)}
        >
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'var(--theme-surface)', borderRadius: '28px 28px 0 0',
              padding: `0 0 calc(env(safe-area-inset-bottom) + 24px)`,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
              maxWidth: '600px', margin: '0 auto',
              maxHeight: '90dvh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px', position: 'sticky', top: 0, background: 'var(--theme-surface)', zIndex: 2 }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'var(--theme-surface-muted)' }} />
            </div>

            <div style={{ padding: '8px 20px 0', position: 'sticky', top: '22px', background: 'var(--theme-surface)', zIndex: 2, paddingBottom: '12px', borderBottom: '1px solid var(--theme-border)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--theme-text)', margin: 0 }}>공간 관리</h3>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: '4px 0 0' }}>{currentSpaceName}</p>
            </div>

            <div style={{ padding: '16px 20px 0' }}>

              {/* ── 공간 이름 수정 (admin) ── */}
              {isAdmin && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>공간 이름</p>
                  {isEditingName ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        ref={nameInputRef}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') cancelEditing(); }}
                        style={{
                          flex: 1, height: '44px', padding: '0 14px', borderRadius: '14px',
                          fontSize: '15px', fontWeight: 700,
                          background: 'var(--theme-surface-muted)',
                          border: '2px solid #0084CC',
                          outline: 'none', color: 'var(--theme-text)', boxSizing: 'border-box',
                        }}
                      />
                      <button onClick={handleSaveName} disabled={savingName || !editName.trim()}
                        style={{ padding: '0 16px', height: '44px', borderRadius: '14px', background: '#0084CC', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: 'white', opacity: savingName || !editName.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                        {savingName ? '저장...' : '저장'}
                      </button>
                      <button onClick={cancelEditing}
                        style={{ padding: '0 12px', height: '44px', borderRadius: '14px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--theme-text-subtle)', whiteSpace: 'nowrap' }}>
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={startEditing}
                      style={{
                        width: '100%', padding: '14px 16px', borderRadius: '16px',
                        background: 'var(--theme-surface-muted)', border: '1.5px solid var(--theme-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--theme-text)' }}>{currentSpaceName}</span>
                      <span style={{ fontSize: '13px', color: '#0084CC', fontWeight: 700 }}>수정 ✏️</span>
                    </button>
                  )}
                </div>
              )}

              {/* ── 커버 이미지 (admin) ── */}
              {isAdmin && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>커버 이미지</p>
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '16px',
                      background: 'var(--theme-surface-muted)', border: '1.5px dashed var(--theme-border)',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {coverImageUrl ? (
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundImage: `url(${coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                    ) : (
                      <span style={{ fontSize: '20px' }}>📷</span>
                    )}
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text-subtle)' }}>
                      {uploadingCover ? '업로드 중...' : coverImageUrl ? '커버 이미지 변경' : '커버 이미지 추가'}
                    </span>
                  </button>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
              )}

              {/* ── 초대 코드 (공유 공간, loading 완료 후) ── */}
              {!isPersonalSpace && !loading && (currentInviteCode || isAdmin) && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>초대 코드</p>
                  <div style={{ background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)', borderRadius: '16px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    {currentInviteCode ? (
                      <>
                        <span style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '4px', color: '#0CC9B5' }}>{currentInviteCode}</span>
                        <button onClick={copyInviteCode} disabled={generatingCode}
                          style={{ padding: '8px 14px', borderRadius: '12px', background: copied ? '#0CC9B5' : copyError ? '#EF4444' : 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: (copied || copyError) ? 'white' : '#1A1B2E', whiteSpace: 'nowrap' }}>
                          {copied ? '복사됨 ✓' : copyError ? '복사 실패' : '코드 복사'}
                        </button>
                      </>
                    ) : (
                      <button onClick={copyInviteCode} disabled={generatingCode}
                        style={{ fontSize: '13px', fontWeight: 800, color: '#0CC9B5', background: 'none', border: 'none', cursor: generatingCode ? 'wait' : 'pointer', opacity: generatingCode ? 0.7 : 1 }}>
                        {generatingCode ? '코드 생성 중...' : '+ 초대 코드 생성하기'}
                      </button>
                    )}
                  </div>
                  {!isPersonalSpace && !memberAtLimit && (
                    <button
                      onClick={() => { setShowManageSheet(false); setShowInviteModal(true); }}
                      style={{ width: '100%', marginTop: '8px', padding: '12px', borderRadius: '14px', background: 'rgba(0,132,204,0.08)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: '#0084CC' }}
                    >
                      멤버 초대하기
                    </button>
                  )}
                </div>
              )}

              {/* ── 멤버 목록 ── */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>멤버 ({memberCount}명)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {members.map(member => {
                    const isMe = member.userId === user?.id;
                    const isEditingThisRole = editingRole === member.id;
                    return (
                      <div key={member.id} style={{
                        background: 'var(--theme-surface-muted)', borderRadius: '16px',
                        border: '1px solid var(--theme-border)',
                      }}>
                        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <UserAvatar
                            avatar={member.user?.avatar}
                            name={member.user?.name}
                            size={44}
                            radius={14}
                            fontSize={22}
                            style={{ border: '2px solid var(--theme-surface)', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isMe ? `${member.user?.name ?? '나'} (나)` : member.user?.name ?? '멤버'}
                            </p>
                            <button
                              disabled={!isAdmin || isMe}
                              onClick={() => isAdmin && !isMe && setEditingRole(isEditingThisRole ? null : member.id)}
                              style={{
                                padding: '2px 8px', borderRadius: '999px',
                                fontSize: '10px', fontWeight: 800,
                                background: member.role === 'admin' ? 'rgba(0,132,204,0.10)' : member.role === 'viewer' ? 'rgba(142,142,147,0.10)' : 'rgba(12,201,181,0.10)',
                                color: member.role === 'admin' ? '#0084CC' : member.role === 'viewer' ? '#8E8E93' : '#0CC9B5',
                                border: isAdmin && !isMe ? '1px dashed currentColor' : 'none',
                                cursor: isAdmin && !isMe ? 'pointer' : 'default',
                              }}
                            >
                              {ROLE_LABELS[member.role]}{isAdmin && !isMe && ' ▾'}
                            </button>
                          </div>
                          {isAdmin && !isMe && (
                            <button onClick={() => handleRemoveMember(member.userId)}
                              style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>
                              ✕
                            </button>
                          )}
                        </div>

                        {/* 역할 변경 드롭다운 */}
                        {isEditingThisRole && (
                          <div style={{ borderTop: '1px solid var(--theme-border)', padding: '10px 14px 12px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {ROLE_OPTIONS.map(role => (
                                <button
                                  key={role}
                                  onClick={() => handleRoleChange(member.id, member.userId, role)}
                                  style={{
                                    flex: 1, padding: '8px 4px', borderRadius: '10px', fontSize: '11px', fontWeight: 800,
                                    border: `2px solid ${member.role === role ? '#0084CC' : '#E5E5EA'}`,
                                    background: member.role === role ? 'rgba(0,132,204,0.08)' : 'var(--theme-surface)',
                                    color: member.role === role ? '#0084CC' : '#8E8E93',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {ROLE_LABELS[role]}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 본인 닉네임 편집 */}
                        {isMe && (
                          <div style={{ borderTop: '1px solid var(--theme-border)', padding: '10px 14px 12px' }}>
                            {editingNickname ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                  value={nicknameValue}
                                  onChange={e => setNicknameValue(e.target.value)}
                                  placeholder="닉네임 입력 (비워두면 초기화)"
                                  style={{
                                    flex: 1, height: '36px', padding: '0 12px', borderRadius: '10px',
                                    fontSize: '13px', fontWeight: 600,
                                    background: 'var(--theme-surface)',
                                    border: '1.5px solid #0084CC',
                                    outline: 'none', color: 'var(--theme-text)', boxSizing: 'border-box',
                                  }}
                                />
                                <button onClick={handleSaveNickname} disabled={savingNickname}
                                  style={{ padding: '0 12px', height: '36px', borderRadius: '10px', background: '#0084CC', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: 'white', opacity: savingNickname ? 0.5 : 1 }}>
                                  {savingNickname ? '저장...' : '저장'}
                                </button>
                                <button onClick={() => setEditingNickname(false)}
                                  style={{ padding: '0 10px', height: '36px', borderRadius: '10px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)' }}>
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setNicknameValue((member as any).nickname ?? ''); setEditingNickname(true); }}
                                style={{ fontSize: '12px', fontWeight: 700, color: '#0084CC', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                              >
                                닉네임 편집 {(member as any).nickname ? `(현재: ${(member as any).nickname})` : '(미설정)'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 공간 합류 ── */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>내 공간 관리</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => { setShowManageSheet(false); setShowJoinModal(true); }}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '16px',
                      border: '1.5px solid var(--theme-border)', background: 'var(--theme-surface-muted)',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🗝️</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px' }}>공간 참여하기</p>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>초대 코드로 기존 공간에 합류</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-subtle)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>

                  <button
                    disabled={spaceAtLimit}
                    onClick={() => !spaceAtLimit && (setShowManageSheet(false), router.push('/space/new'))}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '16px',
                      border: `1.5px solid ${spaceAtLimit ? 'rgba(0,0,0,0.04)' : 'var(--theme-border)'}`,
                      background: spaceAtLimit ? 'var(--theme-surface-muted)' : 'var(--theme-surface-muted)',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      cursor: spaceAtLimit ? 'not-allowed' : 'pointer', textAlign: 'left',
                      opacity: spaceAtLimit ? 0.6 : 1,
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{spaceAtLimit ? '🔒' : '🏡'}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px' }}>새 공간 만들기</p>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>
                        {spaceAtLimit ? `공유 공간 ${FREE_MAX_SPACES}개 한도 도달` : `현재 ${sharedSpaceCount}/${FREE_MAX_SPACES} 사용 중`}
                      </p>
                    </div>
                    {!spaceAtLimit && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-subtle)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>}
                  </button>
                </div>
              </div>

              {/* ── 공간 탈퇴 (admin 아닌 경우) ── */}
              {!isAdmin && !isPersonalSpace && (
                <div style={{ marginBottom: '8px' }}>
                  <button
                    onClick={handleLeaveSpace}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: '16px',
                      border: '1.5px solid rgba(239,68,68,0.20)', background: 'rgba(239,68,68,0.05)',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🚪</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444', margin: '0 0 2px' }}>공간 탈퇴</p>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>이 공간에서 나가기</p>
                    </div>
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowManageSheet(false)}
                style={{ width: '100%', height: '50px', borderRadius: '16px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)', marginTop: '4px' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invite modal (공유 방법 3종) ── */}
      {showInviteModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{ width: '100%', maxWidth: '600px', background: 'var(--theme-surface)', borderRadius: '32px 32px 0 0', padding: '8px 24px calc(env(safe-area-inset-bottom) + 28px)', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 20px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'var(--theme-surface-muted)' }} />
            </div>

            <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: 'rgba(0,132,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px' }}>🔗</div>
            <h3 style={{ fontSize: '21px', fontWeight: 900, color: 'var(--theme-text)', textAlign: 'center', margin: '0 0 6px' }}>멤버 초대하기</h3>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', fontWeight: 600, textAlign: 'center', margin: '0 0 4px' }}>
              {currentSpaceName}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', fontWeight: 600, textAlign: 'center', margin: '0 0 24px' }}>
              현재 {memberCount}명 · {FREE_MAX_MEMBERS - memberCount}명 더 초대 가능
            </p>

            {currentInviteCode && (
              <div style={{ background: 'var(--theme-surface-muted)', borderRadius: '16px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--theme-text-subtle)', margin: '0 0 4px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>초대 코드</p>
                  <span style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '4px', color: '#0CC9B5' }}>{currentInviteCode}</span>
                </div>
                <button onClick={copyInviteCode}
                  style={{ padding: '8px 16px', borderRadius: '12px', background: 'var(--theme-surface)', border: '1.5px solid rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 800, color: 'var(--theme-text)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  코드만 복사
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <button onClick={shareViaKakao} disabled={generatingCode || shareKakao}
                style={{ width: '100%', height: '58px', borderRadius: '18px', background: '#FEE500', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px', fontWeight: 800, color: 'var(--theme-text)', opacity: shareKakao ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4C12.95 4 4 11.82 4 21.4c0 6.06 3.84 11.38 9.6 14.44L11.2 44l10.56-5.44c.72.1 1.46.16 2.24.16 11.05 0 20-7.82 20-17.4C44 11.82 35.05 4 24 4z" fill="var(--theme-text)"/>
                </svg>
                {shareKakao ? '공유 중...' : '카카오톡으로 공유'}
              </button>

              <button onClick={shareViaSms} disabled={generatingCode || shareSms}
                style={{ width: '100%', height: '58px', borderRadius: '18px', background: 'linear-gradient(135deg, #34C759, #30B050)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px', fontWeight: 800, color: 'white', opacity: shareSms ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {shareSms ? '문자 앱 열기...' : '문자 메시지로 보내기'}
              </button>

              <button onClick={copyFullMessage} disabled={generatingCode}
                style={{ width: '100%', height: '58px', borderRadius: '18px', background: copied ? '#0CC9B5' : copyError ? '#EF4444' : '#1A1B2E', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px', fontWeight: 800, color: 'white', transition: 'background 0.2s', opacity: generatingCode ? 0.7 : 1 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {copied ? '복사됨 ✓' : copyError ? '복사 실패' : generatingCode ? '준비 중...' : '초대 메시지 복사'}
              </button>
            </div>

            <details style={{ marginBottom: '16px' }}>
              <summary style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', cursor: 'pointer', padding: '4px 0', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-subtle)" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                공유될 메시지 미리보기
              </summary>
              <div style={{ marginTop: '10px', padding: '14px 16px', borderRadius: '14px', background: 'var(--theme-surface-muted)', fontSize: '12px', fontWeight: 500, color: '#3C3C43', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {currentInviteCode ? buildShareMessage(currentInviteCode) : '초대 코드가 준비되면 최신 링크와 함께 초대문이 생성됩니다.'}
              </div>
            </details>

            <button onClick={() => setShowInviteModal(false)}
              style={{ width: '100%', height: '52px', borderRadius: '18px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ── Join modal ── */}
      {showJoinModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowJoinModal(false)}>
          <div style={{ width: '100%', maxWidth: '600px', background: 'var(--theme-surface)', borderRadius: '32px 32px 0 0', padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '24px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'var(--theme-surface-muted)' }} />
            </div>
            <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(12,201,181,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 20px' }}>🗝️</div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--theme-text)', textAlign: 'center', margin: '0 0 8px' }}>공간 참여하기</h3>
            <p style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', fontWeight: 600, textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>
              공유받은 참여 코드를 입력해 주세요.
            </p>
            <input
              value={joinCode} onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
              placeholder="참여 코드 입력"
              style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '18px', fontSize: '22px', fontFamily: 'monospace', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', background: 'var(--theme-surface-muted)', border: `2px solid ${joinError ? '#EF4444' : joinCode ? '#0CC9B5' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', letterSpacing: '4px', color: 'var(--theme-text)', marginBottom: '8px' }}
            />
            {joinError && <p style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444', textAlign: 'center', marginBottom: '12px' }}>{joinError}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button onClick={handleJoin} disabled={joining || !joinCode.trim()}
                style={{ width: '100%', height: '58px', borderRadius: '18px', background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', border: 'none', cursor: joining || !joinCode.trim() ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 800, color: 'white', opacity: joining || !joinCode.trim() ? 0.5 : 1 }}>
                {joining ? '확인 중...' : '참여 완료'}
              </button>
              <button onClick={() => setShowJoinModal(false)}
                style={{ width: '100%', height: '58px', borderRadius: '18px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
