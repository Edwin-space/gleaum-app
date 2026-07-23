'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { AccountCapabilityGate } from '@/components/AccountCapabilityGate';
import {
  getSpaceSettings, updateSpaceSettings, updateSpaceName,
  getSpaceWithMembers, removeSpaceMember, deleteSpace, regenerateInviteCode,
  convertSpaceToFamily,
} from '@/lib/db';
import type { SpaceMember } from '@/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { toast } from 'sonner';

const PURPOSES = [
  { key: 'family',  label: '가족',      emoji: '👨‍👩‍👧‍👦' },
  { key: 'couple',  label: '커플',      emoji: '💑'      },
  { key: 'friends', label: '친구 모임', emoji: '🙌'      },
  { key: 'work',    label: '업무 팀',   emoji: '💼'      },
  { key: 'other',   label: '기타',      emoji: '✨'      },
];

const DEFAULT_TYPES = ['공지', '약속', '활동', '행사', '기타'];

// ── 공간 삭제 확인 모달 ──────────────────────────────────────
function CloseSpaceModal({
  hasOtherMembers,
  onConfirm,
  onCancel,
}: {
  hasOtherMembers: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [closing, setClosing] = useState(false);
  const isReady = confirmText === '공간 삭제';

  const handleConfirm = async () => {
    if (!isReady || closing) return;
    setClosing(true);
    await onConfirm();
    setClosing(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '360px',
        background: 'var(--theme-surface)', borderRadius: '24px',
        padding: '28px 24px 24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* 경고 아이콘 */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.10)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--theme-text)', textAlign: 'center', margin: '0 0 10px' }}>
          공간 삭제
        </h2>

        {hasOtherMembers ? (
          <>
            <p style={{ fontSize: '14px', color: '#EF4444', fontWeight: 700, textAlign: 'center', margin: '0 0 8px' }}>
              멤버가 남아 있어 삭제할 수 없습니다
            </p>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', lineHeight: 1.6, textAlign: 'center', margin: '0 0 20px' }}>
              공간에 참여 중인 멤버를 모두 내보낸 후<br/>공간 삭제를 진행해 주세요.
            </p>
            <button
              onClick={onCancel}
              style={{
                width: '100%', height: '50px', borderRadius: '16px',
                border: 'none', background: 'var(--theme-surface-muted)', cursor: 'pointer',
                fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)',
              }}
            >확인</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', lineHeight: 1.7, margin: '0 0 18px' }}>
              공간을 삭제하면 <strong style={{ color: '#EF4444' }}>일정, 가계부, 설정 등 모든 데이터가 즉시 삭제</strong>되며 복구할 수 없습니다.
            </p>

            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text)', margin: '0 0 8px' }}>
              동의하시면 아래에 <span style={{ color: '#EF4444' }}>공간 삭제</span>를 입력해 주세요.
            </p>

            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="공간 삭제"
              autoFocus
              style={{
                width: '100%', height: '48px', padding: '0 14px',
                borderRadius: '14px', fontSize: '15px', fontWeight: 700,
                background: '#F7F7FA',
                border: `1.5px solid ${isReady ? '#EF4444' : '#E0E0E5'}`,
                outline: 'none', boxSizing: 'border-box',
                color: 'var(--theme-text)', marginBottom: '14px',
                textAlign: 'center', letterSpacing: '0.04em',
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, height: '50px', borderRadius: '16px',
                  border: '1.5px solid #E0E0E5', background: 'var(--theme-surface)',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: 'var(--theme-text-subtle)',
                }}
              >취소</button>
              <button
                onClick={handleConfirm}
                disabled={!isReady || closing}
                style={{
                  flex: 2, height: '50px', borderRadius: '16px',
                  border: 'none', cursor: isReady && !closing ? 'pointer' : 'not-allowed',
                  background: isReady ? '#EF4444' : '#E5E5EA',
                  color: isReady ? 'white' : '#AEAEB2',
                  fontSize: '14px', fontWeight: 800,
                  transition: 'background 0.2s',
                }}
              >{closing ? '삭제 중...' : '공간 삭제 확인'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function SpaceSettingsPage() {
  return (
    <AccountCapabilityGate
      capability="canManageSpaces"
      title="공간 설정 권한이 없습니다"
      description="보호자 관리 또는 미성년 계정에서는 공간 설정과 멤버 권한을 변경할 수 없습니다."
    >
      <SpaceSettingsContent />
    </AccountCapabilityGate>
  );
}

function SpaceSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();
  const { spaceId, personalSpaceId, user, loading: userLoading, refresh: refreshUser } = useCurrentUser();
  const targetSpaceId = searchParams.get('sid') ?? spaceId;
  const userId = user?.id ?? null;
  const { space, myRole, loading: spaceLoading, refresh: refreshSpace } = useSpace(targetSpaceId);
  const isAdmin = myRole === 'admin';
  const isFamilySpace = space?.spaceKind === 'family';
  const isPersonalSpace = targetSpaceId === personalSpaceId || space?.spaceKind === 'personal';

  // ── 공간 이름 ──────────────────────────────────────────────
  const [spaceName,     setSpaceName]     = useState('');
  const [editingName,   setEditingName]   = useState(false);
  const [savingName,    setSavingName]    = useState(false);

  // ── 설정 (목적 / 일정 유형) ────────────────────────────────
  const [purpose,       setPurpose]       = useState<string>('other');
  const [scheduleTypes, setScheduleTypes] = useState<string[]>(DEFAULT_TYPES);
  const [newType,       setNewType]       = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // ── 멤버 관리 ─────────────────────────────────────────────
  const [members,       setMembers]       = useState<SpaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [removingId,    setRemovingId]    = useState<string | null>(null);

  // ── 초대 코드 재발급 / 신규 생성 ───────────────────────────
  const [regenerating, setRegenerating] = useState(false);
  const [liveInviteCode, setLiveInviteCode] = useState<string | undefined>(undefined);
  const currentSettingsInviteCode = liveInviteCode ?? space?.inviteCode;

  // ── 공간 삭제 ─────────────────────────────────────────────
  const [showCloseModal, setShowCloseModal] = useState(false);

  // ── 설정 로드 ─────────────────────────────────────────────
  useEffect(() => {
    if (!targetSpaceId) return;
    // DB/space 상태가 비동기로 준비된 뒤 폼 기본값을 동기화한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpaceName(space?.name ?? '');

    getSpaceSettings(targetSpaceId).then(settings => {
      setPurpose(space?.spaceKind === 'family' ? 'family' : (settings.purpose ?? 'other'));
      if (settings.scheduleTypes?.length) setScheduleTypes(settings.scheduleTypes);
      setSettingsLoaded(true);
    });
  }, [targetSpaceId, space?.name, space?.spaceKind]);

  // ── 멤버 로드 ─────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    if (!targetSpaceId) return;
    setMembersLoading(true);
    const spaceData = await getSpaceWithMembers(targetSpaceId);
    setMembers(spaceData?.members ?? []);
    setMembersLoading(false);
  }, [targetSpaceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMembers();
  }, [loadMembers]);

  // ── 권한 없음 guard ──────────────────────────────────────
  useEffect(() => {
    if (!spaceLoading && !userLoading && myRole && myRole !== 'admin') {
      toast.error('공간 지기만 설정을 변경할 수 있습니다');
      router.back();
    }
  }, [myRole, spaceLoading, userLoading, router]);

  // ── 공간 이름 저장 ────────────────────────────────────────
  const handleSaveName = async (stayOnPage = false) => {
    if (!spaceName.trim() || !targetSpaceId) return;
    setSavingName(true);
    const ok = await updateSpaceName(targetSpaceId, spaceName.trim());
    setSavingName(false);
    setEditingName(false);
    if (ok) {
      try { localStorage.setItem('gleaum_space_name_updated', Date.now().toString()); } catch {}
      toast.success('공간 이름이 변경되었습니다');
      if (!stayOnPage) setTimeout(() => router.back(), 100);
    } else {
      toast.error('이름 변경에 실패했습니다');
    }
  };

  // ── 설정 저장 ─────────────────────────────────────────────
  const handleSaveSettings = async () => {
    if (!targetSpaceId) return;
    const convertsToFamily = !isPersonalSpace && purpose === 'family' && space?.spaceKind !== 'family';
    if (convertsToFamily && !window.confirm(
      '가족 공간으로 전환하면 기존 일정, 소식, 멤버는 유지되지만 일반 공간으로 되돌릴 수 없습니다. 전환할까요?',
    )) return;

    setSavingSettings(true);
    if (convertsToFamily) {
      const converted = await convertSpaceToFamily(targetSpaceId);
      if (!converted) {
        setSavingSettings(false);
        toast.error('가족 공간 전환에 실패했습니다');
        return;
      }
    }
    const ok = await updateSpaceSettings(targetSpaceId, { purpose, scheduleTypes });
    setSavingSettings(false);
    if (ok) {
      if (convertsToFamily) await refreshSpace();
      toast.success(convertsToFamily ? '가족 공간으로 전환했습니다' : '설정이 저장되었습니다');
    }
    else    toast.error('설정 저장에 실패했습니다');
  };

  // ── 일정 유형 ─────────────────────────────────────────────
  const addType = () => {
    const trimmed = newType.trim();
    if (!trimmed) return;
    if (scheduleTypes.includes(trimmed)) { toast.error('이미 존재하는 유형입니다'); return; }
    if (scheduleTypes.length >= 10)      { toast.error('최대 10개까지 등록할 수 있습니다'); return; }
    setScheduleTypes(prev => [...prev, trimmed]);
    setNewType('');
  };

  const removeType = (t: string) => {
    if (scheduleTypes.length <= 1) { toast.error('최소 1개의 유형이 필요합니다'); return; }
    setScheduleTypes(prev => prev.filter(x => x !== t));
  };

  // ── 멤버 내보내기 ─────────────────────────────────────────
  const handleRemoveMember = async (member: SpaceMember) => {
    if (!targetSpaceId) return;
    const isSelf = member.userId === userId;
    if (isSelf && isAdmin) {
      toast.error('공간 지기는 공간을 나갈 수 없습니다. 공간 삭제를 이용해주세요.');
      return;
    }
    const label  = isSelf ? '공간에서 나가시겠습니까?' : `${member.user?.name ?? '멤버'}를 내보내시겠습니까?`;
    if (!window.confirm(label)) return;

    setRemovingId(member.userId);
    const ok = await removeSpaceMember(targetSpaceId, member.userId);
    setRemovingId(null);

    if (ok) {
      toast.success(isSelf ? '공간에서 나갔습니다' : '멤버를 내보냈습니다');
      if (isSelf) {
        router.replace('/home');
      } else {
        await loadMembers();
      }
    } else {
      toast.error('처리에 실패했습니다');
    }
  };

  // ── 공간 삭제 ─────────────────────────────────────────────
  const otherMembers = members.filter(m => m.userId !== userId);
  const hasOtherMembers = otherMembers.length > 0;

  const handleRegenerateCode = async () => {
    if (!targetSpaceId) return;
    setRegenerating(true);
    const newCode = await regenerateInviteCode(targetSpaceId);
    setRegenerating(false);
    if (newCode) {
      setLiveInviteCode(newCode);
      toast.success(currentSettingsInviteCode ? '초대 코드가 재발급되었습니다' : '초대 코드가 생성되었습니다');
      await refreshSpace();
    } else {
      toast.error('재발급에 실패했습니다. 다시 시도해 주세요.');
    }
  };


  const isInviteCodeValid = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/invite/info?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleCopyInviteCode = async () => {
    if (!targetSpaceId) return;
    let code = currentSettingsInviteCode;

    if (!code || !(await isInviteCodeValid(code))) {
      setRegenerating(true);
      const newCode = await regenerateInviteCode(targetSpaceId);
      setRegenerating(false);

      if (!newCode || !(await isInviteCodeValid(newCode))) {
        toast.error('초대 코드 확인에 실패했습니다. 다시 시도해 주세요.');
        return;
      }

      code = newCode;
      setLiveInviteCode(newCode);
      await refreshSpace();
    }

    await navigator.clipboard.writeText(code);
    toast.success('초대 코드가 복사되었습니다');
  };

  const handleCloseSpace = async () => {
    if (!targetSpaceId) return;
    const result = await deleteSpace(targetSpaceId);
    if (result.ok) {
      toast.success('공간이 삭제되었습니다');
      try { localStorage.removeItem('gleaum_space_name_updated'); } catch {}
      await refreshUser();
      const nextPath = result.fallbackSpaceId
        ? `/space?sid=${encodeURIComponent(result.fallbackSpaceId)}`
        : '/space';
      router.replace(nextPath);
      router.refresh();
    } else {
      const message = result.error;
      if (message.includes('space_has_other_members')) toast.error('다른 멤버를 모두 내보낸 뒤 삭제해 주세요');
      else if (message.includes('family_space_has_dependents')) toast.error('연결된 자녀와 가족 이력이 있어 삭제할 수 없습니다');
      else if (message.includes('personal_space_locked')) toast.error('개인 공간은 삭제할 수 없습니다');
      else if (message.includes('space_admin_required')) toast.error('공간 지기만 삭제할 수 있습니다');
      else if (message.includes('space_not_found')) toast.error('이미 삭제되었거나 존재하지 않는 공간입니다');
      else toast.error('공간 삭제에 실패했습니다');
    }
  };

  const isLoading = userLoading || spaceLoading;

  // ── 공통 스타일 ──────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'var(--theme-surface)', borderRadius: '20px', padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: '16px',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)',
    letterSpacing: '0.06em', margin: '8px 0 10px 4px',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #0084CC', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isDesktop) {
    const desktopCard: React.CSSProperties = {
      background: 'rgba(255,255,255,0.82)',
      border: '1px solid rgba(255,255,255,0.85)',
      borderRadius: '28px',
      boxShadow: '0 18px 50px rgba(0,132,204,0.08)',
      padding: '28px',
    };

    const desktopLabel: React.CSSProperties = {
      fontSize: '11px',
      fontWeight: 900,
      color: 'var(--theme-text-subtle)',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      margin: '0 0 14px',
    };

    const mutedText: React.CSSProperties = {
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--theme-text-subtle)',
      lineHeight: 1.6,
      margin: 0,
    };

    return (
      <>
        {showCloseModal && (
          <CloseSpaceModal
            hasOtherMembers={hasOtherMembers}
            onConfirm={handleCloseSpace}
            onCancel={() => setShowCloseModal(false)}
          />
        )}

        <main style={{
          minHeight: '100dvh',
          background: 'var(--theme-bg)',
          padding: '44px 48px 64px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-120px', right: '-90px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,232,149,0.16), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-140px', left: '18%', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,132,204,0.12), transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1180px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', marginBottom: '28px' }}>
              <div>
                <button
                  onClick={() => router.back()}
                  style={{
                    border: 'none',
                    background: 'rgba(0,132,204,0.08)',
                    color: '#0084CC',
                    borderRadius: '999px',
                    padding: '9px 15px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginBottom: '18px',
                  }}
                >
                  ← 공간으로 돌아가기
                </button>
                <p style={{ ...desktopLabel, marginBottom: '8px' }}>Space Admin</p>
                <h1 style={{ fontSize: '34px', fontWeight: 900, color: 'var(--theme-text)', letterSpacing: '-0.04em', margin: '0 0 10px' }}>
                  공간 설정
                </h1>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--theme-text-muted)', lineHeight: 1.7, margin: 0 }}>
                  이름, 멤버, 초대 코드와 일정 유형을 한 화면에서 관리합니다.
                </p>
              </div>

              {isAdmin && settingsLoaded && (
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  style={{
                    minWidth: '154px',
                    height: '48px',
                    borderRadius: '999px',
                    border: 'none',
                    background: savingSettings ? 'rgba(0,132,204,0.45)' : 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: savingSettings ? 'not-allowed' : 'pointer',
                    boxShadow: savingSettings ? 'none' : '0 8px 24px rgba(0,132,204,0.24)',
                  }}
                >
                  {savingSettings ? '저장 중...' : '설정 저장'}
                </button>
              )}
            </header>

            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(360px, 0.85fr)', gap: '24px', alignItems: 'start' }}>
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={desktopCard}>
                  <p style={desktopLabel}>기본 정보</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '18px', alignItems: 'start' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--theme-text-subtle)', margin: '0 0 8px' }}>공간 이름</p>
                      {editingName ? (
                        <div>
                          <input
                            value={spaceName}
                            onChange={e => setSpaceName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveName(true);
                              if (e.key === 'Escape') { setEditingName(false); setSpaceName(space?.name ?? ''); }
                            }}
                            autoFocus
                            maxLength={30}
                            placeholder="변경할 공간 이름"
                            style={{
                              width: '100%',
                              height: '52px',
                              padding: '0 16px',
                              borderRadius: '16px',
                              border: '2px solid #0CC9B5',
                              background: 'var(--theme-surface)',
                              outline: 'none',
                              boxSizing: 'border-box',
                              color: 'var(--theme-text)',
                              fontSize: '17px',
                              fontWeight: 800,
                              boxShadow: '0 0 0 4px rgba(12,201,181,0.10)',
                              marginBottom: '10px',
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => { setEditingName(false); setSpaceName(space?.name ?? ''); }}
                              style={{ height: '42px', padding: '0 18px', borderRadius: '999px', border: '1.5px solid #E8E8E4', background: 'var(--theme-surface)', cursor: 'pointer', color: 'var(--theme-text-muted)', fontSize: '13px', fontWeight: 800 }}
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleSaveName(true)}
                              disabled={savingName || !spaceName.trim()}
                              style={{ height: '42px', padding: '0 22px', borderRadius: '999px', border: 'none', background: savingName || !spaceName.trim() ? '#E8E8E4' : '#0084CC', color: savingName || !spaceName.trim() ? '#AEAEA8' : 'white', cursor: savingName || !spaceName.trim() ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 900 }}
                            >
                              {savingName ? '저장 중...' : '이름 저장'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--theme-text)', margin: 0, letterSpacing: '-0.03em' }}>
                            {space?.name ?? spaceName}
                          </h2>
                          {isAdmin && (
                            <button
                              onClick={() => { setSpaceName(space?.name ?? ''); setEditingName(true); }}
                              style={{ height: '36px', padding: '0 14px', borderRadius: '999px', border: '1.5px solid rgba(0,132,204,0.18)', background: 'rgba(0,132,204,0.06)', color: '#0084CC', cursor: 'pointer', fontSize: '12px', fontWeight: 900 }}
                            >
                              편집
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #1A1B2E, #2D2E4A)', padding: '18px', color: 'white' }}>
                      <p style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.48)', margin: '0 0 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Members</p>
                      <p style={{ fontSize: '34px', fontWeight: 900, margin: '0 0 4px' }}>{members.length}</p>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.62)', margin: 0 }}>현재 참여 멤버</p>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '24px 0' }} />

                  <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--theme-text-subtle)', margin: '0 0 12px' }}>공간 목적</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px' }}>
                    {PURPOSES.map(p => {
                      const active = purpose === p.key;
                      return (
                        <button
                          key={p.key}
                          onClick={() => isAdmin && !isFamilySpace && !isPersonalSpace && setPurpose(p.key)}
                          disabled={!isAdmin || isFamilySpace || isPersonalSpace}
                          style={{
                            minHeight: '78px',
                            borderRadius: '18px',
                            border: `1.5px solid ${active ? 'rgba(0,132,204,0.45)' : '#E8E8E4'}`,
                            background: active ? 'rgba(0,132,204,0.08)' : 'white',
                            color: active ? '#0084CC' : '#6E6E66',
                            cursor: isAdmin && !isFamilySpace && !isPersonalSpace ? 'pointer' : 'default',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '7px',
                            fontSize: '13px',
                            fontWeight: 900,
                          }}
                        >
                          <span style={{ fontSize: '22px' }}>{p.emoji}</span>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  {isFamilySpace && (
                    <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', margin: '12px 0 0', lineHeight: 1.6 }}>
                      연결된 자녀와 가족 이력을 보호하기 위해 가족 공간은 일반 공간으로 되돌릴 수 없습니다.
                    </p>
                  )}
                  {isAdmin && purpose === 'family' && (
                    <button
                      onClick={() => router.push(`/space/children?sid=${encodeURIComponent(targetSpaceId ?? '')}`)}
                      style={{ width: '100%', minHeight: '50px', marginTop: '18px', borderRadius: '999px', border: '1.5px solid rgba(0,132,204,0.24)', background: 'rgba(0,132,204,0.07)', color: '#0084CC', cursor: 'pointer', fontSize: '14px', fontWeight: 900 }}
                    >
                      자녀 계정 연결 관리
                    </button>
                  )}
                </div>

                <div style={desktopCard}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
                    <div>
                      <p style={desktopLabel}>일정 유형</p>
                      <p style={mutedText}>공간 일정 등록 시 사용할 유형을 관리합니다. 최소 1개, 최대 10개까지 등록할 수 있어요.</p>
                    </div>
                    <span style={{ padding: '7px 12px', borderRadius: '999px', background: 'rgba(12,201,181,0.10)', color: '#0CC9B5', fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap' }}>
                      {scheduleTypes.length}/10
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
                    {scheduleTypes.map(t => (
                      <div
                        key={t}
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 14px', borderRadius: '999px', background: 'rgba(0,132,204,0.08)', border: '1.5px solid rgba(0,132,204,0.18)' }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#0084CC' }}>{t}</span>
                        {isAdmin && (
                          <button
                            onClick={() => removeType(t)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '15px', fontWeight: 900, padding: 0, lineHeight: 1 }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addType()}
                        placeholder="새 유형 이름 입력"
                        maxLength={10}
                        style={{ flex: 1, height: '48px', padding: '0 16px', borderRadius: '16px', border: '1.5px solid #E8E8E4', background: 'var(--theme-surface-muted)', color: 'var(--theme-text)', outline: 'none', fontSize: '14px', fontWeight: 700 }}
                      />
                      <button
                        onClick={addType}
                        disabled={!newType.trim()}
                        style={{ height: '48px', padding: '0 22px', borderRadius: '999px', border: 'none', background: newType.trim() ? '#0084CC' : '#E8E8E4', color: newType.trim() ? 'white' : '#AEAEA8', cursor: newType.trim() ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 900 }}
                      >
                        추가
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <aside style={{ display: 'grid', gap: '24px' }}>
                {isAdmin && !isPersonalSpace && (
                  <div style={desktopCard}>
                    <p style={desktopLabel}>초대 코드</p>
                    <p style={{ ...mutedText, marginBottom: '16px' }}>공유 공간에 멤버를 초대할 때 사용하는 코드입니다.</p>
                    {currentSettingsInviteCode ? (
                      <>
                        <code style={{ display: 'block', padding: '18px 16px', borderRadius: '18px', background: 'var(--theme-surface-muted)', color: '#0084CC', fontSize: '18px', fontWeight: 900, letterSpacing: '0.12em', textAlign: 'center', border: '1.5px solid rgba(0,132,204,0.14)', marginBottom: '12px' }}>
                          {currentSettingsInviteCode}
                        </code>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <button
                            onClick={handleCopyInviteCode}
                            style={{ height: '44px', borderRadius: '999px', border: 'none', background: '#0084CC', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 900 }}
                          >
                            코드 복사
                          </button>
                          <button
                            onClick={handleRegenerateCode}
                            disabled={regenerating}
                            style={{ height: '44px', borderRadius: '999px', border: '1.5px solid rgba(0,132,204,0.22)', background: 'var(--theme-surface)', color: '#0084CC', cursor: regenerating ? 'not-allowed' : 'pointer', opacity: regenerating ? 0.55 : 1, fontSize: '13px', fontWeight: 900 }}
                          >
                            {regenerating ? '처리 중' : '재발급'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={handleRegenerateCode}
                        disabled={regenerating}
                        style={{ width: '100%', height: '48px', borderRadius: '999px', border: '1.5px dashed rgba(0,132,204,0.45)', background: 'rgba(0,132,204,0.06)', color: '#0084CC', cursor: regenerating ? 'not-allowed' : 'pointer', opacity: regenerating ? 0.55 : 1, fontSize: '14px', fontWeight: 900 }}
                      >
                        {regenerating ? '생성 중...' : '+ 초대 코드 생성'}
                      </button>
                    )}
                  </div>
                )}

                <div style={desktopCard}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
                    <div>
                      <p style={desktopLabel}>멤버</p>
                      <p style={mutedText}>공간에 참여 중인 사용자와 권한을 확인합니다.</p>
                    </div>
                    <span style={{ padding: '7px 12px', borderRadius: '999px', background: 'rgba(0,132,204,0.08)', color: '#0084CC', fontSize: '12px', fontWeight: 900 }}>
                      {members.length}명
                    </span>
                  </div>

                  {membersLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '26px 0' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid #0084CC', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  ) : members.length === 0 ? (
                    <p style={{ ...mutedText, textAlign: 'center', padding: '20px 0' }}>멤버 정보를 불러올 수 없습니다</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {members.map(member => {
                        const isSelf = member.userId === userId;
                        const memberAdmin = member.role === 'admin';
                        const removing = removingId === member.userId;
                        const initials = (member.user?.name ?? '?').charAt(0).toUpperCase();

                        return (
                          <div key={member.userId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '18px', background: isSelf ? 'rgba(0,132,204,0.06)' : '#FAFAFD', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <UserAvatar
                              avatar={member.user?.avatar ?? initials}
                              name={member.user?.name}
                              size={42}
                              radius={999}
                              fontSize={16}
                              style={{
                                background: isSelf ? 'linear-gradient(135deg, #0CC9B5, #0084CC)' : '#E8E8E4',
                                color: isSelf ? 'white' : '#8E8E93',
                                fontWeight: 900,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <p style={{ fontSize: '14px', fontWeight: 900, color: 'var(--theme-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {member.user?.name ?? '알 수 없는 사용자'}
                                </p>
                                {isSelf && <span style={{ fontSize: '10px', fontWeight: 900, color: '#0084CC', background: 'rgba(0,132,204,0.10)', padding: '2px 7px', borderRadius: '999px' }}>나</span>}
                              </div>
                              <p style={{ fontSize: '12px', fontWeight: 800, color: memberAdmin ? '#F59E0B' : '#8E8E93', margin: '2px 0 0' }}>
                                {memberAdmin ? '공간 지기' : '공간 멤버'}
                              </p>
                            </div>
                            {isAdmin && !isSelf && (
                              <button
                                onClick={() => handleRemoveMember(member)}
                                disabled={removing}
                                style={{ height: '34px', padding: '0 12px', borderRadius: '999px', border: '1.5px solid rgba(239,68,68,0.25)', background: 'var(--theme-surface)', color: '#EF4444', cursor: removing ? 'not-allowed' : 'pointer', opacity: removing ? 0.55 : 1, fontSize: '12px', fontWeight: 900 }}
                              >
                                {removing ? '처리 중' : '내보내기'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {isAdmin && !isPersonalSpace && (
                  <div style={{ ...desktopCard, border: '1.5px solid rgba(239,68,68,0.18)', background: 'rgba(255,250,250,0.92)' }}>
                    <p style={{ ...desktopLabel, color: '#EF4444' }}>위험 구역</p>
                    <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 8px' }}>공간 삭제</h3>
                    <p style={{ ...mutedText, marginBottom: '16px' }}>
                      공간과 연결된 일정, 가계부, 설정 데이터가 삭제됩니다. 멤버가 남아 있으면 삭제할 수 없습니다.
                    </p>
                    <button
                      onClick={() => setShowCloseModal(true)}
                      style={{ height: '44px', padding: '0 18px', borderRadius: '999px', border: '1.5px solid rgba(239,68,68,0.35)', background: 'var(--theme-surface)', color: '#EF4444', cursor: 'pointer', fontSize: '13px', fontWeight: 900 }}
                    >
                      공간 삭제
                    </button>
                  </div>
                )}
              </aside>
            </section>
          </div>
        </main>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  return (
    <>
      {showCloseModal && (
        <CloseSpaceModal
          hasOtherMembers={hasOtherMembers}
          onConfirm={handleCloseSpace}
          onCancel={() => setShowCloseModal(false)}
        />
      )}

      <div style={{ background: 'var(--theme-surface-muted)', minHeight: '100dvh', paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}>

        {/* ── 헤더 ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          padding: 'calc(env(safe-area-inset-top) + 12px) 16px 12px',
          background: 'rgba(242,242,247,0.92)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button
            onClick={() => router.back()}
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,132,204,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#0084CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--theme-text)', margin: 0, letterSpacing: '-0.03em' }}>
            공간 관리
          </h1>
        </div>

        <div style={{ padding: '20px 16px 0', maxWidth: '600px', margin: '0 auto' }}>

          {/* ── 공간 이름 ── */}
          <p style={sectionLabel}>공간 기본 정보</p>
          <div style={card}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: '0 0 8px' }}>공간 이름</p>
            {editingName ? (
              <div>
                <input
                  value={spaceName}
                  onChange={e => setSpaceName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') { setEditingName(false); setSpaceName(space?.name ?? ''); }
                  }}
                  autoFocus
                  maxLength={30}
                  placeholder="변경할 공간 이름을 입력해주세요."
                  style={{
                    width: '100%', height: '50px', padding: '0 14px', borderRadius: '14px',
                    fontSize: '16px', fontWeight: 700, background: '#F7F7FA',
                    border: '1.5px solid #0084CC', outline: 'none',
                    boxSizing: 'border-box', color: 'var(--theme-text)', marginBottom: '10px',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setEditingName(false); setSpaceName(space?.name ?? ''); }}
                    style={{ flex: 1, height: '46px', borderRadius: '14px', border: '1.5px solid #E0E0E5', background: 'var(--theme-surface)', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: 'var(--theme-text-subtle)' }}
                  >취소</button>
                  <button
                    onClick={() => handleSaveName()}
                    disabled={savingName || !spaceName.trim()}
                    style={{ flex: 2, height: '46px', borderRadius: '14px', border: 'none', background: savingName || !spaceName.trim() ? 'rgba(0,132,204,0.4)' : '#0084CC', color: 'white', cursor: savingName || !spaceName.trim() ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 800 }}
                  >{savingName ? '저장 중...' : '저장'}</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <p style={{ fontSize: '17px', fontWeight: 800, color: 'var(--theme-text)', margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {space?.name ?? spaceName}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => { setSpaceName(space?.name ?? ''); setEditingName(true); }}
                    style={{ padding: '7px 14px', borderRadius: '12px', border: '1.5px solid #E0E0E5', background: 'var(--theme-surface)', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#0084CC', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >편집</button>
                )}
              </div>
            )}
          </div>

          {/* ── 공간 목적 ── */}
          <p style={sectionLabel}>공간 목적</p>
          <div style={card}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PURPOSES.map(p => (
                <button
                  key={p.key}
                  onClick={() => isAdmin && !isFamilySpace && !isPersonalSpace && setPurpose(p.key)}
                  disabled={!isAdmin || isFamilySpace || isPersonalSpace}
                  style={{
                    padding: '9px 16px', borderRadius: '999px',
                    border: `1.5px solid ${purpose === p.key ? '#0084CC' : '#E0E0E5'}`,
                    background: purpose === p.key ? 'rgba(0,132,204,0.08)' : 'white',
                    color: purpose === p.key ? '#0084CC' : '#8E8E93',
                    fontSize: '13px', fontWeight: 700, cursor: isAdmin && !isFamilySpace && !isPersonalSpace ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <span>{p.emoji}</span>{p.label}
                </button>
              ))}
            </div>
            {isFamilySpace && (
              <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', margin: '12px 0 0', lineHeight: 1.6 }}>
                연결된 자녀와 가족 이력을 보호하기 위해 가족 공간은 일반 공간으로 되돌릴 수 없습니다.
              </p>
            )}
            {isAdmin && purpose === 'family' && (
              <button
                onClick={() => router.push(`/space/children?sid=${encodeURIComponent(targetSpaceId ?? '')}`)}
                style={{ width: '100%', minHeight: '48px', marginTop: '14px', borderRadius: '999px', border: '1.5px solid rgba(0,132,204,0.24)', background: 'rgba(0,132,204,0.07)', color: '#0084CC', cursor: 'pointer', fontSize: '14px', fontWeight: 850 }}
              >
                자녀 계정 연결 관리
              </button>
            )}
          </div>

          {/* ── 일정 유형 관리 ── */}
          <p style={sectionLabel}>일정 유형 관리</p>
          <div style={card}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: '0 0 14px', lineHeight: 1.5 }}>
              공간 일정 등록 시 선택할 수 있는 유형을 관리합니다.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {scheduleTypes.map(t => (
                <div
                  key={t}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '999px', background: 'rgba(0,132,204,0.07)', border: '1.5px solid rgba(0,132,204,0.20)' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0084CC' }}>{t}</span>
                  {isAdmin && (
                    <button
                      onClick={() => removeType(t)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontSize: '14px', fontWeight: 700, padding: 0, lineHeight: 1 }}
                    >×</button>
                  )}
                </div>
              ))}
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addType()}
                  placeholder="새 유형 이름 입력"
                  maxLength={10}
                  style={{ flex: 1, height: '46px', padding: '0 14px', borderRadius: '14px', fontSize: '14px', fontWeight: 600, background: '#F7F7FA', border: '1.5px solid #EBEBF0', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }}
                />
                <button
                  onClick={addType}
                  disabled={!newType.trim()}
                  style={{ padding: '0 18px', height: '46px', borderRadius: '14px', border: 'none', cursor: newType.trim() ? 'pointer' : 'not-allowed', background: newType.trim() ? '#0084CC' : '#E5E5EA', color: newType.trim() ? 'white' : '#AEAEB2', fontSize: '14px', fontWeight: 800 }}
                >추가</button>
              </div>
            )}
          </div>

          {/* ── 설정 저장 버튼 ── */}
          {isAdmin && settingsLoaded && (
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              style={{
                width: '100%', height: '56px', borderRadius: '18px',
                background: savingSettings ? 'rgba(0,132,204,0.5)' : 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                border: 'none', cursor: savingSettings ? 'not-allowed' : 'pointer',
                fontSize: '16px', fontWeight: 800, color: 'white',
                boxShadow: savingSettings ? 'none' : '0 6px 20px rgba(0,132,204,0.30)',
                marginBottom: '24px',
              }}
            >
              {savingSettings ? '저장 중...' : '설정 저장'}
            </button>
          )}

          {/* ── 초대 코드 (admin 전용, 코드 없어도 표시하여 생성 가능하게) ── */}
          {isAdmin && (
            <>
              <p style={sectionLabel}>초대</p>
              <div style={card}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: '0 0 8px' }}>공간 초대 코드</p>
                {currentSettingsInviteCode ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', background: '#F7F7FA', fontSize: '15px', fontWeight: 800, color: '#0084CC', letterSpacing: '0.08em', border: '1.5px solid rgba(0,132,204,0.15)' }}>
                        {currentSettingsInviteCode}
                      </code>
                      <button
                        onClick={handleCopyInviteCode}
                        style={{ padding: '12px 14px', borderRadius: '14px', border: 'none', background: '#0084CC', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap' }}
                      >복사</button>
                    </div>
                    <button
                      onClick={handleRegenerateCode}
                      disabled={regenerating}
                      style={{
                        marginTop: '10px', width: '100%', padding: '10px',
                        borderRadius: '12px', border: '1.5px solid rgba(0,132,204,0.20)',
                        background: 'transparent', color: '#0084CC',
                        cursor: regenerating ? 'not-allowed' : 'pointer',
                        fontSize: '13px', fontWeight: 700,
                        opacity: regenerating ? 0.5 : 1,
                      }}
                    >
                      {regenerating ? '처리 중...' : '🔄 초대 코드 재발급'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleRegenerateCode}
                    disabled={regenerating}
                    style={{
                      width: '100%', padding: '14px',
                      borderRadius: '14px', border: '1.5px dashed rgba(0,132,204,0.40)',
                      background: 'rgba(0,132,204,0.05)', color: '#0084CC',
                      cursor: regenerating ? 'not-allowed' : 'pointer',
                      fontSize: '14px', fontWeight: 800,
                      opacity: regenerating ? 0.5 : 1,
                    }}
                  >
                    {regenerating ? '생성 중...' : '+ 초대 코드 생성하기'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── 멤버 관리 ── */}
          <p style={sectionLabel}>공간 멤버</p>
          <div style={card}>
            {membersLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid #0084CC', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : members.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', textAlign: 'center', padding: '12px 0', margin: 0 }}>멤버 정보를 불러올 수 없습니다</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {members.map((member, idx) => {
                  const isSelf    = member.userId === userId;
                  const isLast    = idx === members.length - 1;
                  const memberAdmin = member.role === 'admin';
                  const removing  = removingId === member.userId;
                  const initials  = (member.user?.name ?? '?').charAt(0).toUpperCase();

                  return (
                    <div
                      key={member.userId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 0',
                        borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      {/* 아바타 */}
                      <UserAvatar
                        avatar={member.user?.avatar ?? initials}
                        name={member.user?.name}
                        size={40}
                        radius={999}
                        fontSize={16}
                        style={{
                          flexShrink: 0,
                          background: isSelf ? 'linear-gradient(135deg, #0CC9B5, #0084CC)' : '#E5E5EA',
                          fontWeight: 800,
                          color: isSelf ? 'white' : '#8E8E93',
                        }}
                      />

                      {/* 이름 + 역할 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--theme-text)' }}>
                            {member.user?.name ?? '알 수 없는 사용자'}
                          </span>
                          {isSelf && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0084CC', background: 'rgba(0,132,204,0.10)', padding: '2px 8px', borderRadius: '999px' }}>나</span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: memberAdmin ? '#F59E0B' : '#8E8E93', fontWeight: 600 }}>
                          {memberAdmin ? '공간 지기' : '공간 멤버'}
                        </span>
                      </div>

                      {/* 내보내기 / 나가기 버튼 */}
                      {isAdmin && !isSelf && (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={removing}
                          style={{
                            padding: '6px 14px', borderRadius: '10px', flexShrink: 0,
                            border: '1.5px solid rgba(239,68,68,0.25)',
                            background: 'var(--theme-surface)',
                            color: '#EF4444',
                            fontSize: '12px', fontWeight: 700, cursor: removing ? 'not-allowed' : 'pointer',
                            opacity: removing ? 0.5 : 1,
                          }}
                        >
                          {removing ? '처리 중' : '내보내기'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 공간 삭제 ── */}
          {isAdmin && !isPersonalSpace && (
            <>
              <p style={{ ...sectionLabel, color: '#EF4444' }}>위험 구역</p>
              <div style={{ ...card, border: '1.5px solid rgba(239,68,68,0.20)', background: 'rgba(255,250,250,1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 4px' }}>공간 삭제</p>
                    <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', margin: 0, lineHeight: 1.5 }}>
                      공간과 모든 데이터가 즉시 삭제됩니다.<br/>
                      {hasOtherMembers && <span style={{ color: '#EF4444', fontWeight: 700 }}>멤버를 모두 내보낸 후 진행하세요.</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCloseModal(true)}
                    style={{
                      padding: '8px 16px', borderRadius: '12px', flexShrink: 0,
                      border: '1.5px solid rgba(239,68,68,0.40)',
                      background: 'var(--theme-surface)', color: '#EF4444',
                      fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                    }}
                  >폐쇄</button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
