'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import {
  joinSpaceByCode, updateSpaceName, removeSpaceMember,
  getMySpaces, updateSpaceMemberRole, updateSpaceCoverImage,
} from '@/lib/db';
import { SpaceScheduleTimeline } from './SpaceScheduleTimeline';
import type { Space, SpaceMember, SpaceRole } from '@/types';

const FREE_MAX_SPACES  = 2;
const FREE_MAX_MEMBERS = 10;

// ── 역할 레이블 ────────────────────────────────────────────
const ROLE_LABELS: Record<SpaceRole, string> = { admin: '관리자', editor: '편집자', viewer: '조회자' };
const ROLE_OPTIONS: SpaceRole[] = ['admin', 'editor', 'viewer'];

export function MobileSpace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { spaceId, user, loading: userLoading, refresh: refreshUser } = useCurrentUser();

  // space/new 에서 넘어올 때 새 공간 ID를 즉시 표시하기 위한 파라미터
  const sidParam = searchParams.get('sid');

  // ── 상태 ──────────────────────────────────────────────
  const [showInviteModal, setShowInviteModal]   = useState(false);
  const [showJoinModal,   setShowJoinModal]      = useState(false);
  const [copied,          setCopied]             = useState(false);
  const [joinCode,        setJoinCode]           = useState('');
  const [joining,         setJoining]            = useState(false);
  const [joinError,       setJoinError]          = useState('');

  // Inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName,      setEditName]      = useState('');
  const [savingName,    setSavingName]    = useState(false);
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

  // ★ 스와이프된 공간 ID 우선 사용 (activeSpaceId) — 없으면 기본 spaceId
  const displaySpaceId = activeSpaceId ?? spaceId;

  // useSpace를 activeSpaceId 기준으로 로드 (스와이프 전환 반영)
  const { space: group, members, myRole, loading, refresh } = useSpace(displaySpaceId);
  const isAdmin = myRole === 'admin';

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
    if (ok) {
      await refresh(); // refresh BEFORE exiting edit mode so new name shows immediately
    }
    setSavingName(false);
    setIsEditingName(false);
  };

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
  const inviteLink = group?.inviteCode ? `https://gleaum.com/invite/${group.inviteCode}` : '';
  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
  const spaceCount    = mySpaces.length;
  const spaceAtLimit  = spaceCount >= FREE_MAX_SPACES;

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
      style={{ background: '#FAFAFD', paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
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
              onClick={() => router.push('/space/settings')}
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
                            {group?.name ?? '나의 공간'}
                          </h2>
                          {isAdmin && (
                            <button onClick={startEditing}
                              style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}>
                              ✏️
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: memberAtLimit ? '#EF4444' : '#0CC9B5', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
                            {memberCount}명 참여 중
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 멤버 아바타 미리보기 */}
                {members.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {members.slice(0, 5).map(m => (
                      <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '999px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}>
                        <span style={{ fontSize: '11px' }}>{m.user?.avatar ?? '👤'}</span>
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

                {/* Invite code */}
                {group?.inviteCode && (
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '24px', padding: '20px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginBottom: '10px' }}>
                      SPACE INVITE CODE
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{ fontSize: '26px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '6px', color: '#0CC9B5' }}>
                        {group.inviteCode}
                      </span>
                      <button onClick={copyInviteLink}
                        style={{ padding: '10px 20px', borderRadius: '14px', background: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: '#1A1B2E', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        {copied ? '복사됨 ✓' : '코드 복사'}
                      </button>
                    </div>
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
          <div style={{ padding: '0 16px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '4px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1A1B2E', margin: 0 }}>공간 멤버</h3>
              {memberAtLimit ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#EF4444', padding: '5px 12px', borderRadius: '999px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <span>🔒</span> {memberCount}/{FREE_MAX_MEMBERS} 한도
                </div>
              ) : (
                <button onClick={() => setShowInviteModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#0084CC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span>
                  멤버 초대
                </button>
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
                      <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        {member.user?.avatar ?? '👤'}
                      </div>

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

              {/* 새로운 공간 합류 */}
              <button onClick={() => setShowJoinModal(true)}
                style={{ width: '100%', padding: '20px', borderRadius: '20px', border: '2px dashed #E5E5EA', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontWeight: 800, color: '#8E8E93', cursor: 'pointer' }}>
                <span style={{ fontSize: '20px' }}>🗝️</span>
                새로운 공간 합류
              </button>

              {/* 새 공간 만들기 */}
              <button
                disabled={spaceAtLimit}
                onClick={() => !spaceAtLimit && router.push('/space/new')}
                style={{
                  width: '100%', padding: '20px', borderRadius: '20px',
                  border: '2px dashed #E5E5EA',
                  background: spaceAtLimit ? 'rgba(0,0,0,0.02)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', fontSize: '14px', fontWeight: 800,
                  color: spaceAtLimit ? '#C7C7CC' : '#8E8E93',
                  cursor: spaceAtLimit ? 'not-allowed' : 'pointer',
                }}>
                <span style={{ fontSize: '20px' }}>{spaceAtLimit ? '🔒' : '🏡'}</span>
                새 공간 만들기
                {spaceAtLimit && (
                  <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 800, background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}>
                    {spaceCount}/{FREE_MAX_SPACES} 한도
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invite modal ── */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowInviteModal(false)}>
          <div style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '32px 32px 0 0', padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '24px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: '#E5E5EA' }} />
            </div>
            <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(0,132,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 20px' }}>🔗</div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1B2E', textAlign: 'center', margin: '0 0 8px' }}>멤버 초대하기</h3>
            <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, textAlign: 'center', lineHeight: 1.6, margin: '0 0 12px' }}>
              현재 {memberCount}명 · {FREE_MAX_MEMBERS - memberCount}명 더 초대 가능
            </p>
            <button onClick={copyInviteLink}
              style={{ width: '100%', height: '58px', borderRadius: '18px', background: '#1A1B2E', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              {copied ? '링크 복사 완료 ✓' : '초대 링크 복사하기'}
            </button>
            <button onClick={() => setShowInviteModal(false)}
              style={{ width: '100%', height: '58px', borderRadius: '18px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}>
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
