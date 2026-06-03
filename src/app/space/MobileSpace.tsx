'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import {
  joinSpaceByCode, updateSpaceName, removeSpaceMember,
  getMySpaces, updateSpaceMemberRole, updateSpaceCoverImage,
  regenerateInviteCode,
} from '@/lib/db';
import { SpaceScheduleTimeline } from './SpaceScheduleTimeline';
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
  // (localStorage 'gleaum_lastSpaceId' 에 마지막 조회 공간 ID를 저장해
  //  홈 → 공간 재진입 시에도 동일한 공간을 복원)
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

  // ★ spaceId(profiles.family_group_id)가 바뀌면 activeSpaceId도 동기화
  //    (space/new 에서 새 공간 생성 후 돌아올 때 반영)
  useEffect(() => {
    if (spaceId && !activeSpaceId) {
      setActiveSpaceId(spaceId);
    }
  }, [spaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ★ activeSpaceId 변경 시 localStorage 저장 + optimistic 이름/초대코드 초기화
  //    스와이프로 공간 전환 시 이전 공간의 liveInviteCode 가 다른 공간에 노출되는 버그 수정
  useEffect(() => {
    if (!activeSpaceId) return;
    try { localStorage.setItem('gleaum_lastSpaceId', activeSpaceId); } catch {}
    setOptimisticSpaceName(null);
    setLiveInviteCode(undefined); // ★ 공간 전환 시 이전 공간의 초대 코드 초기화
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

  // useSpace를 activeSpaceId 기준으로 로드 (스와이프 전환 반영)
  const { space: group, members, myRole, loading, refresh } = useSpace(displaySpaceId);
  const isAdmin = myRole === 'admin';

  // ── 개인 공간 여부 (초대/공유 기능 비활성화) ─────────────────
  const personalSpaceId = (profile?.preferences as { personalSpaceId?: string } | null)?.personalSpaceId ?? null;
  const isPersonalSpace = !!displaySpaceId && displaySpaceId === personalSpaceId;

  // Role management
  const [editingRole, setEditingRole] = useState<string | null>(null); // memberId

  // Swipe
  const touchStartX = useRef<number>(0);
  const touchEndX   = useRef<number>(0);

  // ── 데이터 로드 ──────────────────────────────────────
  useEffect(() => {
    getMySpaces().then(spaces => {
      setMySpaces(spaces);
      // activeSpaceId 기준으로 index 결정, 없으면 spaceId, 그래도 없으면 0
      const currentId = activeSpaceId ?? spaceId;
      let idx = spaces.findIndex(s => s.id === currentId);
      if (idx < 0 && spaceId) idx = spaces.findIndex(s => s.id === spaceId);
      const finalIdx = idx >= 0 ? idx : 0;
      setSpaceIndex(finalIdx);
      // 실제 표시할 공간이 activeSpaceId와 다를 경우 activeSpaceId 보정
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

  // cover image 초기화 — 공간 전환 시 리셋 후 새 값 적용
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
    if (Math.abs(diff) < 60) return; // 임계값

    if (diff > 0 && spaceIndex < mySpaces.length - 1) {
      // 왼쪽 스와이프 → 다음 공간
      const next = spaceIndex + 1;
      setSpaceIndex(next);
      setActiveSpaceId(mySpaces[next].id);
    } else if (diff < 0 && spaceIndex > 0) {
      // 오른쪽 스와이프 → 이전 공간
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
      // ★ Optimistic update: 즉시 UI에 반영 (DB round-trip 기다리지 않음)
      setOptimisticSpaceName(editName.trim());
      // mySpaces 리스트도 즉시 반영
      setMySpaces(prev => prev.map(s =>
        s.id === displaySpaceId ? { ...s, name: editName.trim() } : s
      ));
      // localStorage 플래그 설정 (settings 페이지 sync용)
      try { localStorage.setItem('gleaum_space_name_updated', Date.now().toString()); } catch {}
      // useSpace 갱신 + mySpaces DB 재조회 (홈 복귀 후 재진입 시 최신 이름 보장)
      void refresh();
      void getMySpaces().then(spaces => {
        setMySpaces(spaces);
      });
    }
  };

  // group 데이터가 갱신되면 optimistic 이름 클리어
  useEffect(() => {
    if (group?.name) setOptimisticSpaceName(null);
  }, [group?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // 다른 페이지(공간 설정)에서 이름 변경 후 돌아왔을 때 재조회
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
    if (pathChanged || flagChanged) {
      refresh();
    }
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
  const handleRemoveMember = async (memberId: string) => {
    if (!displaySpaceId) return;
    if (!confirm('이 멤버를 공간에서 제거하시겠습니까?')) return;
    await removeSpaceMember(displaySpaceId, memberId);
    await refresh();
  };

  // ── 초대 링크 복사 ────────────────────────────────────
  const [liveInviteCode, setLiveInviteCode] = useState<string | undefined>(undefined);
  const currentInviteCode = liveInviteCode ?? group?.inviteCode;
  const isInviteCodeValid = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/invite/info?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
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
      } catch {
        return false;
      }
    }
  };

  const showCopyResult = (ok: boolean) => {
    if (ok) {
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2500);
    } else {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  // invite_code 가 없거나 오래된 코드면 자동 재발급 후 복사 (admin 전용)
  const copyInviteLink = async () => {
    const code = await ensureInviteCode();
    if (!code) return;
    showCopyResult(await writeClipboard(`https://gleaum.com/invite/${code}`));
  };


  const copyInviteCode = async () => {
    const code = await ensureInviteCode();
    if (!code) return;
    showCopyResult(await writeClipboard(code));
  };

  // ── 공유 메시지 빌더 ──────────────────────────────────────
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

  // ── invite_code 확보 유틸 (없으면 자동 생성) ─────────────
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
    } finally {
      setGeneratingCode(false);
    }
  };

  // ── 카카오톡 공유 (Web Share API → URL 스킴 폴백) ─────────
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

  // ── SMS 공유 ──────────────────────────────────────────────
  const shareViaSms = async () => {
    const code = await ensureInviteCode();
    if (!code) return;
    setShareSms(true);
    const message = buildShareMessage(code);
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
    setTimeout(() => setShareSms(false), 1500);
  };

  // ── 링크+메시지 전체 복사 ──────────────────────────────────
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
  // 공유 공간만 한도 카운팅 (개인 공간 제외)
  const sharedSpaceCount = mySpaces.filter(s => s.id !== personalSpaceId).length;
  const spaceAtLimit     = sharedSpaceCount >= FREE_MAX_SPACES;

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
      style={{ background: '#FAFAFD', paddingBottom: 'var(--scroll-bottom, calc(env(safe-area-inset-bottom) + 80px))' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Sticky frosted header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        padding: 'calc(env(safe-area-inset-top) + 12px) 20px 14px',
        background: 'rgba(250,250,253,0.82)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </button>

          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B2E', letterSpacing: '-0.5px', margin: 0, flex: 1 }}>
            공간
          </h1>

          {/* 공간 설정 버튼 (admin) */}
          {isAdmin && (
            <button
              onClick={() => router.push(`/space/settings${displaySpaceId ? `?sid=${displaySpaceId}` : ''}`)}
              style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '120px', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #0084CC', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#8E8E93' }}>공간 정보를 불러오는 중...</p>
        </div>
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* ── Hero dark gradient card ── */}
          <div style={{ padding: '0 16px', marginTop: '16px', marginBottom: '8px' }}>
            <div style={{
              position: 'relative', overflow: 'hidden',
              background: coverImageUrl
                ? 'none'
                : 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
              borderRadius: '28px', padding: '20px 20px 16px', color: 'white',
              boxShadow: '0 8px 32px rgba(26,27,46,0.22)',
            }}>
              {/* Cover image background */}
              {coverImageUrl && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 0,
                  backgroundImage: `url(${coverImageUrl})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }}/>
              )}
              {/* Overlay for readability */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 1,
                background: 'linear-gradient(135deg, rgba(26,27,46,0.85) 0%, rgba(45,46,74,0.80) 100%)',
                borderRadius: '32px',
              }} />

              {/* Glow blobs */}
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,132,204,0.25) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 2 }} />
              <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(12,201,181,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 2 }} />

              {/* 가로 레이아웃: 아이콘 + 공간명/멤버 카운트 */}
              <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

                  {/* 아이콘 + 커버 업로드 버튼 */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '18px',
                      background: 'rgba(255,255,255,0.10)',
                      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '30px',
                    }}>
                      {uploadingCover
                        ? <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                        : '🏠'}
                    </div>
                    {isAdmin && (
                      <>
                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                        <button
                          onClick={() => coverInputRef.current?.click()}
                          style={{
                            position: 'absolute', bottom: '-4px', right: '-4px',
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: 'white', border: '2px solid rgba(0,0,0,0.10)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          }}
                        >📷</button>
                      </>
                    )}
                  </div>

                  {/* 공간명 + 멤버 수 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditingName ? (
                      <div>
                        <input
                          ref={nameInputRef}
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') cancelEditing(); }}
                          style={{
                            width: '100%', height: '40px', padding: '0 12px', borderRadius: '12px',
                            fontSize: '16px', fontWeight: 800,
                            background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.35)',
                            outline: 'none', color: 'white', boxSizing: 'border-box',
                            letterSpacing: '-0.3px', marginBottom: '8px',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={handleSaveName} disabled={savingName || !editName.trim()}
                            style={{ padding: '6px 14px', borderRadius: '10px', background: '#0084CC', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: 'white', opacity: savingName || !editName.trim() ? 0.5 : 1 }}>
                            {savingName ? '저장 중...' : '저장'}
                          </button>
                          <button onClick={cancelEditing}
                            style={{ padding: '6px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.80)' }}>
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {optimisticSpaceName
                              ?? group?.name
                              ?? mySpaces.find(s => s.id === displaySpaceId)?.name
                              ?? '나의 공간'}
                          </h2>
                          {isAdmin && (
                            <button onClick={startEditing}
                              style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}>
                              ✏️
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isPersonalSpace ? (
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0CC9B5', padding: '2px 8px', borderRadius: '999px', background: 'rgba(12,201,181,0.15)', border: '1px solid rgba(12,201,181,0.25)' }}>
                              🔒 개인 공간
                            </span>
                          ) : (
                            <>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: memberAtLimit ? '#EF4444' : '#0CC9B5', flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
                                {memberCount}명 참여 중
                              </span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 멤버 아바타 미리보기 — 공유 공간만 */}
                {!isPersonalSpace && members.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {members.slice(0, 5).map(m => (
                      <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '999px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}>
                        <UserAvatar avatar={m.user?.avatar} name={m.user?.name} size={18} radius={999} fontSize={11} style={{ background: 'rgba(255,255,255,0.12)' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.80)' }}>
                          {m.userId === user?.id ? '나' : (m.user?.name ?? '멤버')}
                        </span>
                        {m.role === 'admin' && (
                          <span style={{ fontSize: '8px', fontWeight: 800, color: '#0CC9B5' }}>★</span>
                        )}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.50)' }}>+{members.length - 5}</span>
                    )}
                  </div>
                )}

                {/* Invite code — 개인 공간은 초대 불가, 공유 공간만 표시 */}
                {/* ★ loading 중에는 섹션 전체 숨김 — 로딩 완료 후 DB 값 기준으로 렌더링 */}
                {!isPersonalSpace && !loading && (currentInviteCode || isAdmin) && (
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '24px', padding: '20px', marginTop: '12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginBottom: '10px' }}>
                      SPACE INVITE CODE
                    </p>
                    {currentInviteCode ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <span style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '4px', color: '#0CC9B5', flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentInviteCode}
                        </span>
                        <button onClick={copyInviteCode} disabled={generatingCode}
                          style={{ padding: '10px 20px', borderRadius: '14px', background: copied ? '#0CC9B5' : copyError ? '#EF4444' : 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: (copied || copyError) ? 'white' : '#1A1B2E', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flexShrink: 0, transition: 'background 0.2s' }}>
                          {copied ? '복사됨 ✓' : copyError ? '복사 실패' : '코드 복사'}
                        </button>
                      </div>
                    ) : (
                      <button onClick={copyInviteLink} disabled={generatingCode}
                        style={{ width: '100%', padding: '12px', borderRadius: '14px', background: 'rgba(12,201,181,0.20)', border: '1px dashed rgba(12,201,181,0.50)', cursor: generatingCode ? 'wait' : 'pointer', fontSize: '13px', fontWeight: 800, color: '#0CC9B5', opacity: generatingCode ? 0.7 : 1 }}>
                        {generatingCode ? '코드 생성 중...' : '+ 초대 코드 생성하기'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 다중 공간 스와이프 인디케이터 (히어로 아래) ── */}
          {mySpaces.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '8px 0 4px' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
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
              <p style={{ fontSize: '10px', fontWeight: 600, color: '#AEAEB2', margin: 0 }}>
                ← 스와이프로 공간 전환 →
              </p>
            </div>
          )}

          {/* ── 공간 일정 타임라인 ── */}
          <SpaceScheduleTimeline
            spaceId={displaySpaceId}
            members={members}
            currentUserId={user?.id ?? ''}
          />

          {/* ── 공간 멤버 관리 ── */}
          <div style={{ padding: '0 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '4px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1A1B2E', margin: 0 }}>공간 멤버</h3>
              {!isPersonalSpace && (
                memberAtLimit ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#EF4444', padding: '5px 12px', borderRadius: '999px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <span>🔒</span> {memberCount}/{FREE_MAX_MEMBERS} 한도
                  </div>
                ) : (
                  <button onClick={() => setShowInviteModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#0084CC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span>
                    멤버 초대
                  </button>
                )
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map(member => {
                const isEditingThisRole = editingRole === member.id;
                return (
                  <div key={member.id} style={{
                    background: 'white', borderRadius: '20px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Avatar */}
                      <UserAvatar
                        avatar={member.user?.avatar}
                        name={member.user?.name}
                        size={52}
                        radius={18}
                        fontSize={26}
                        style={{ border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.userId === user?.id ? `${member.user?.name} (나)` : member.user?.name}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* 역할 배지 — admin이면 탭해서 변경 */}
                          <button
                            disabled={!isAdmin || member.userId === user?.id}
                            onClick={() => isAdmin && member.userId !== user?.id && setEditingRole(isEditingThisRole ? null : member.id)}
                            style={{
                              padding: '3px 10px', borderRadius: '999px',
                              fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px',
                              background: member.role === 'admin' ? 'rgba(0,132,204,0.10)' : member.role === 'viewer' ? 'rgba(142,142,147,0.10)' : 'rgba(12,201,181,0.10)',
                              color: member.role === 'admin' ? '#0084CC' : member.role === 'viewer' ? '#8E8E93' : '#0CC9B5',
                              border: isAdmin && member.userId !== user?.id ? '1px dashed currentColor' : 'none',
                              cursor: isAdmin && member.userId !== user?.id ? 'pointer' : 'default',
                            }}
                          >
                            {ROLE_LABELS[member.role]}
                            {isAdmin && member.userId !== user?.id && ' ▾'}
                          </button>
                          <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.user?.email || '연결됨'}
                          </span>
                        </div>
                      </div>

                      {/* 제거 버튼 */}
                      {isAdmin && member.userId !== user?.id && (
                        <button onClick={() => handleRemoveMember(member.userId)}
                          style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}>
                          ✕
                        </button>
                      )}
                    </div>

                    {/* 역할 변경 드롭다운 */}
                    {isEditingThisRole && (
                      <div style={{ borderTop: '1px solid #F2F2F7', padding: '8px 18px 14px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', margin: '0 0 8px' }}>역할 변경</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
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
                        <div style={{ marginTop: '8px' }}>
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

              {/* 멤버 없음 빈 상태 */}
              {members.length === 0 && (
                <div style={{
                  padding: '24px 20px', borderRadius: '20px',
                  background: 'white', border: '1px solid rgba(0,0,0,0.04)',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center',
                }}>
                  <span style={{ fontSize: '28px' }}>👥</span>
                  {isPersonalSpace ? (
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#8E8E93', margin: 0, lineHeight: 1.5 }}>
                      개인 공간은 나만 사용하는 공간이에요.<br/>
                      <span style={{ fontWeight: 600, fontSize: '12px' }}>공유 공간을 만들어 다른 사람과 함께해보세요!</span>
                    </p>
                  ) : (
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#8E8E93', margin: 0 }}>
                      이 공간에는 멤버가 존재하지 않아요!<br/>
                      <span style={{ fontWeight: 600, fontSize: '12px' }}>멤버를 초대해 함께 공간을 만들어가세요.</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── 내 공간 관리 (다른 공간 합류·생성) ── */}
          <div style={{ padding: '0 16px', marginBottom: '32px' }}>
            <div style={{ paddingLeft: '4px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#8E8E93', margin: 0 }}>내 공간 관리</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 공간 참여하기 */}
              <button
                onClick={() => setShowJoinModal(true)}
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: '20px',
                  border: '1.5px solid rgba(0,0,0,0.07)', background: 'white',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', textAlign: 'left',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(12,201,181,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🗝️</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 2px' }}>공간 참여하기</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', margin: 0 }}>초대 코드로 기존 공간에 합류</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>

              {/* 새 공간 만들기 */}
              <button
                disabled={spaceAtLimit}
                onClick={() => !spaceAtLimit && router.push('/space/new')}
                style={{
                  width: '100%', padding: '18px 20px', borderRadius: '20px',
                  border: `1.5px solid ${spaceAtLimit ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.07)'}`,
                  background: spaceAtLimit ? 'rgba(0,0,0,0.02)' : 'white',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: spaceAtLimit ? 'not-allowed' : 'pointer', textAlign: 'left',
                  boxShadow: spaceAtLimit ? 'none' : '0 2px 10px rgba(0,0,0,0.04)',
                }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: spaceAtLimit ? 'rgba(0,0,0,0.04)' : 'rgba(0,132,204,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {spaceAtLimit ? '🔒' : '🏡'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: spaceAtLimit ? '#C7C7CC' : '#1A1B2E', margin: '0 0 2px' }}>새 공간 만들기</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', margin: 0 }}>
                    {spaceAtLimit
                      ? `공유 공간 ${FREE_MAX_SPACES}개 한도 도달 (무료 플랜)`
                      : `현재 공유 공간 ${sharedSpaceCount}/${FREE_MAX_SPACES} 사용 중`}
                  </p>
                </div>
                {!spaceAtLimit && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>}
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
            style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '32px 32px 0 0', padding: '8px 24px calc(env(safe-area-inset-bottom) + 28px)', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 20px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: '#E5E5EA' }} />
            </div>

            {/* 아이콘 + 제목 */}
            <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: 'rgba(0,132,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px' }}>🔗</div>
            <h3 style={{ fontSize: '21px', fontWeight: 900, color: '#1A1B2E', textAlign: 'center', margin: '0 0 6px' }}>
              멤버 초대하기
            </h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, textAlign: 'center', margin: '0 0 4px' }}>
              {optimisticSpaceName ?? group?.name ?? '이 공간'}
            </p>
            <p style={{ fontSize: '12px', color: '#AEAEB2', fontWeight: 600, textAlign: 'center', margin: '0 0 24px' }}>
              현재 {memberCount}명 · {FREE_MAX_MEMBERS - memberCount}명 더 초대 가능
            </p>

            {/* 초대 코드 표시 */}
            {currentInviteCode && (
              <div style={{ background: '#F5F5F7', borderRadius: '16px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: '#8E8E93', margin: '0 0 4px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>초대 코드</p>
                  <span style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '4px', color: '#0CC9B5' }}>{currentInviteCode}</span>
                </div>
                <button
                  onClick={copyInviteCode}
                  style={{ padding: '8px 16px', borderRadius: '12px', background: 'white', border: '1.5px solid rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 800, color: '#1A1B2E', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                  코드만 복사
                </button>
              </div>
            )}

            {/* 3가지 공유 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>

              {/* 카카오톡 */}
              <button
                onClick={shareViaKakao}
                disabled={generatingCode || shareKakao}
                style={{
                  width: '100%', height: '58px', borderRadius: '18px',
                  background: '#FEE500', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  fontSize: '16px', fontWeight: 800, color: '#1A1B2E',
                  opacity: shareKakao ? 0.7 : 1, transition: 'opacity 0.2s',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4C12.95 4 4 11.82 4 21.4c0 6.06 3.84 11.38 9.6 14.44L11.2 44l10.56-5.44c.72.1 1.46.16 2.24.16 11.05 0 20-7.82 20-17.4C44 11.82 35.05 4 24 4z" fill="#1A1B2E"/>
                </svg>
                {shareKakao ? '공유 중...' : '카카오톡으로 공유'}
              </button>

              {/* 문자 메시지 */}
              <button
                onClick={shareViaSms}
                disabled={generatingCode || shareSms}
                style={{
                  width: '100%', height: '58px', borderRadius: '18px',
                  background: 'linear-gradient(135deg, #34C759, #30B050)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  fontSize: '16px', fontWeight: 800, color: 'white',
                  opacity: shareSms ? 0.7 : 1, transition: 'opacity 0.2s',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {shareSms ? '문자 앱 열기...' : '문자 메시지로 보내기'}
              </button>

              {/* 링크 복사 */}
              <button
                onClick={copyFullMessage}
                disabled={generatingCode}
                style={{
                  width: '100%', height: '58px', borderRadius: '18px',
                  background: copied ? '#0CC9B5' : copyError ? '#EF4444' : '#1A1B2E',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  fontSize: '16px', fontWeight: 800, color: 'white',
                  transition: 'background 0.2s',
                  opacity: generatingCode ? 0.7 : 1,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                {currentInviteCode ? buildShareMessage(currentInviteCode) : '초대 코드가 준비되면 최신 링크와 함께 초대문이 생성됩니다.'}
              </div>
            </details>

            <button
              onClick={() => setShowInviteModal(false)}
              style={{ width: '100%', height: '52px', borderRadius: '18px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ── Join modal ── */}
      {showJoinModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowJoinModal(false)}>
          <div style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '32px 32px 0 0', padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '24px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: '#E5E5EA' }} />
            </div>
            <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(12,201,181,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 20px' }}>🗝️</div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1B2E', textAlign: 'center', margin: '0 0 8px' }}>공간 참여하기</h3>
            <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>
              공유받은 참여 코드를 입력해 주세요.
            </p>
            <input
              value={joinCode} onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
              placeholder="참여 코드 입력"
              style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '18px', fontSize: '22px', fontFamily: 'monospace', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', background: '#F5F5F7', border: `2px solid ${joinError ? '#EF4444' : joinCode ? '#0CC9B5' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', letterSpacing: '4px', color: '#1A1B2E', marginBottom: '8px' }}
            />
            {joinError && <p style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444', textAlign: 'center', marginBottom: '12px' }}>{joinError}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button onClick={handleJoin} disabled={joining || !joinCode.trim()}
                style={{ width: '100%', height: '58px', borderRadius: '18px', background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', border: 'none', cursor: joining || !joinCode.trim() ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 800, color: 'white', opacity: joining || !joinCode.trim() ? 0.5 : 1 }}>
                {joining ? '확인 중...' : '참여 완료'}
              </button>
              <button onClick={() => setShowJoinModal(false)}
                style={{ width: '100%', height: '58px', borderRadius: '18px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
