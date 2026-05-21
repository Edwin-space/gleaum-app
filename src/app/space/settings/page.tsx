'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import {
  getSpaceSettings, updateSpaceSettings, updateSpaceName,
  getSpaceWithMembers, removeSpaceMember, deleteSpace, regenerateInviteCode,
} from '@/lib/db';
import type { SpaceMember } from '@/types';
import { toast } from 'sonner';

const PURPOSES = [
  { key: 'family',  label: '가족',      emoji: '👨‍👩‍👧‍👦' },
  { key: 'couple',  label: '커플',      emoji: '💑'      },
  { key: 'friends', label: '친구 모임', emoji: '🙌'      },
  { key: 'work',    label: '업무 팀',   emoji: '💼'      },
  { key: 'other',   label: '기타',      emoji: '✨'      },
];

const DEFAULT_TYPES = ['공지', '약속', '활동', '행사', '기타'];

// ── 공간 폐쇄 확인 모달 ──────────────────────────────────────
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
  const isReady = confirmText === '공간 폐쇄';

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
        background: 'white', borderRadius: '24px',
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

        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1B2E', textAlign: 'center', margin: '0 0 10px' }}>
          공간 폐쇄
        </h2>

        {hasOtherMembers ? (
          <>
            <p style={{ fontSize: '14px', color: '#EF4444', fontWeight: 700, textAlign: 'center', margin: '0 0 8px' }}>
              멤버가 남아 있어 폐쇄할 수 없습니다
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, textAlign: 'center', margin: '0 0 20px' }}>
              공간에 참여 중인 멤버를 모두 내보낸 후<br/>공간 폐쇄를 진행해 주세요.
            </p>
            <button
              onClick={onCancel}
              style={{
                width: '100%', height: '50px', borderRadius: '16px',
                border: 'none', background: '#F2F2F7', cursor: 'pointer',
                fontSize: '15px', fontWeight: 800, color: '#1A1B2E',
              }}
            >확인</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.7, margin: '0 0 18px' }}>
              공간을 폐쇄하면 <strong style={{ color: '#EF4444' }}>일정, 가계부, 설정 등 모든 데이터가 즉시 삭제</strong>되며 복구할 수 없습니다.
            </p>

            <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1B2E', margin: '0 0 8px' }}>
              동의하시면 아래에 <span style={{ color: '#EF4444' }}>공간 폐쇄</span>를 입력해 주세요.
            </p>

            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="공간 폐쇄"
              autoFocus
              style={{
                width: '100%', height: '48px', padding: '0 14px',
                borderRadius: '14px', fontSize: '15px', fontWeight: 700,
                background: '#F7F7FA',
                border: `1.5px solid ${isReady ? '#EF4444' : '#E0E0E5'}`,
                outline: 'none', boxSizing: 'border-box',
                color: '#1A1B2E', marginBottom: '14px',
                textAlign: 'center', letterSpacing: '0.04em',
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, height: '50px', borderRadius: '16px',
                  border: '1.5px solid #E0E0E5', background: 'white',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#6B7280',
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
              >{closing ? '폐쇄 중...' : '공간 폐쇄 확인'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function SpaceSettingsPage() {
  const router = useRouter();
  const { spaceId, user, loading: userLoading } = useCurrentUser();
  const userId = user?.id ?? null;
  const { space, myRole, loading: spaceLoading } = useSpace(spaceId);
  const isAdmin = myRole === 'admin';

  // ── 공간 이름 ──────────────────────────────────────────────
  const [spaceName,     setSpaceName]     = useState('');
  const [editingName,   setEditingName]   = useState(false);
  const [savingName,    setSavingName]    = useState(false);

  // ── 설정 (목적 / 일정 유형) ────────────────────────────────
  const [purpose,       setPurpose]       = useState<string>('family');
  const [scheduleTypes, setScheduleTypes] = useState<string[]>(DEFAULT_TYPES);
  const [newType,       setNewType]       = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // ── 멤버 관리 ─────────────────────────────────────────────
  const [members,       setMembers]       = useState<SpaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [removingId,    setRemovingId]    = useState<string | null>(null);

  // ── 초대 코드 재발급 ─────────────────────────────────────
  const [regenerating, setRegenerating] = useState(false);

  // ── 공간 폐쇄 ─────────────────────────────────────────────
  const [showCloseModal, setShowCloseModal] = useState(false);

  // ── 설정 로드 ─────────────────────────────────────────────
  useEffect(() => {
    if (!spaceId) return;
    setSpaceName(space?.name ?? '');

    getSpaceSettings(spaceId).then(settings => {
      if (settings.purpose) setPurpose(settings.purpose);
      if (settings.scheduleTypes?.length) setScheduleTypes(settings.scheduleTypes);
      setSettingsLoaded(true);
    });
  }, [spaceId, space?.name]);

  // ── 멤버 로드 ─────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    if (!spaceId) return;
    setMembersLoading(true);
    const spaceData = await getSpaceWithMembers(spaceId);
    setMembers(spaceData?.members ?? []);
    setMembersLoading(false);
  }, [spaceId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  // ── 권한 없음 guard ──────────────────────────────────────
  useEffect(() => {
    if (!spaceLoading && !userLoading && myRole && myRole !== 'admin') {
      toast.error('관리자만 설정을 변경할 수 있습니다');
      router.back();
    }
  }, [myRole, spaceLoading, userLoading, router]);

  // ── 공간 이름 저장 ────────────────────────────────────────
  const handleSaveName = async () => {
    if (!spaceName.trim() || !spaceId) return;
    setSavingName(true);
    const ok = await updateSpaceName(spaceId, spaceName.trim());
    setSavingName(false);
    setEditingName(false);
    if (ok) {
      try { localStorage.setItem('gleaum_space_name_updated', Date.now().toString()); } catch {}
      toast.success('공간 이름이 변경되었습니다');
      setTimeout(() => router.back(), 100);
    } else {
      toast.error('이름 변경에 실패했습니다');
    }
  };

  // ── 설정 저장 ─────────────────────────────────────────────
  const handleSaveSettings = async () => {
    if (!spaceId) return;
    setSavingSettings(true);
    const ok = await updateSpaceSettings(spaceId, { purpose, scheduleTypes });
    setSavingSettings(false);
    if (ok) toast.success('설정이 저장되었습니다');
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
    if (!spaceId) return;
    const isSelf = member.userId === userId;
    const label  = isSelf ? '공간에서 나가시겠습니까?' : `${member.user?.name ?? '멤버'}를 내보내시겠습니까?`;
    if (!window.confirm(label)) return;

    setRemovingId(member.userId);
    const ok = await removeSpaceMember(spaceId, member.userId);
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

  // ── 공간 폐쇄 ─────────────────────────────────────────────
  const otherMembers = members.filter(m => m.userId !== userId);
  const hasOtherMembers = otherMembers.length > 0;

  const handleRegenerateCode = async () => {
    if (!spaceId) return;
    setRegenerating(true);
    const newCode = await regenerateInviteCode(spaceId);
    setRegenerating(false);
    if (newCode) {
      toast.success('초대 코드가 재발급되었습니다');
      // 공간 정보 새로고침을 위해 페이지 새로 불러오기
      window.location.reload();
    } else {
      toast.error('재발급에 실패했습니다');
    }
  };

  const handleCloseSpace = async () => {
    if (!spaceId) return;
    const ok = await deleteSpace(spaceId);
    if (ok) {
      toast.success('공간이 폐쇄되었습니다');
      try { localStorage.removeItem('gleaum_space_name_updated'); } catch {}
      router.replace('/home');
    } else {
      toast.error('공간 폐쇄에 실패했습니다');
    }
  };

  const isLoading = userLoading || spaceLoading;

  // ── 공통 스타일 ──────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'white', borderRadius: '20px', padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: '16px',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 800, color: '#8E8E93',
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

  return (
    <>
      {showCloseModal && (
        <CloseSpaceModal
          hasOtherMembers={hasOtherMembers}
          onConfirm={handleCloseSpace}
          onCancel={() => setShowCloseModal(false)}
        />
      )}

      <div style={{ background: '#F2F2F7', minHeight: '100dvh', paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}>

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
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1B2E', margin: 0, letterSpacing: '-0.03em' }}>
            공간 관리
          </h1>
        </div>

        <div style={{ padding: '20px 16px 0', maxWidth: '600px', margin: '0 auto' }}>

          {/* ── 공간 이름 ── */}
          <p style={sectionLabel}>공간 기본 정보</p>
          <div style={card}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', margin: '0 0 8px' }}>공간 이름</p>
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
                    boxSizing: 'border-box', color: '#1A1B2E', marginBottom: '10px',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setEditingName(false); setSpaceName(space?.name ?? ''); }}
                    style={{ flex: 1, height: '46px', borderRadius: '14px', border: '1.5px solid #E0E0E5', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#8E8E93' }}
                  >취소</button>
                  <button
                    onClick={handleSaveName}
                    disabled={savingName || !spaceName.trim()}
                    style={{ flex: 2, height: '46px', borderRadius: '14px', border: 'none', background: savingName || !spaceName.trim() ? 'rgba(0,132,204,0.4)' : '#0084CC', color: 'white', cursor: savingName || !spaceName.trim() ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 800 }}
                  >{savingName ? '저장 중...' : '저장'}</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1B2E', margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {space?.name ?? spaceName}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => { setSpaceName(space?.name ?? ''); setEditingName(true); }}
                    style={{ padding: '7px 14px', borderRadius: '12px', border: '1.5px solid #E0E0E5', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#0084CC', whiteSpace: 'nowrap', flexShrink: 0 }}
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
                  onClick={() => isAdmin && setPurpose(p.key)}
                  style={{
                    padding: '9px 16px', borderRadius: '999px',
                    border: `1.5px solid ${purpose === p.key ? '#0084CC' : '#E0E0E5'}`,
                    background: purpose === p.key ? 'rgba(0,132,204,0.08)' : 'white',
                    color: purpose === p.key ? '#0084CC' : '#8E8E93',
                    fontSize: '13px', fontWeight: 700, cursor: isAdmin ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <span>{p.emoji}</span>{p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 일정 유형 관리 ── */}
          <p style={sectionLabel}>일정 유형 관리</p>
          <div style={card}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#8E8E93', margin: '0 0 14px', lineHeight: 1.5 }}>
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
                  style={{ flex: 1, height: '46px', padding: '0 14px', borderRadius: '14px', fontSize: '14px', fontWeight: 600, background: '#F7F7FA', border: '1.5px solid #EBEBF0', outline: 'none', boxSizing: 'border-box', color: '#1A1B2E' }}
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

          {/* ── 초대 코드 ── */}
          {space?.inviteCode && (
            <>
              <p style={sectionLabel}>초대</p>
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93', margin: 0 }}>공간 초대 코드</p>
                  {space.inviteCodeExpiresAt && (
                    <p style={{
                      fontSize: '11px', fontWeight: 600, margin: 0,
                      color: space.inviteCodeExpiresAt < new Date() ? '#EF4444' : '#AEAEB2',
                    }}>
                      {space.inviteCodeExpiresAt < new Date()
                        ? '⚠️ 만료됨'
                        : `~${space.inviteCodeExpiresAt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 까지`}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', background: '#F7F7FA', fontSize: '15px', fontWeight: 800, color: '#0084CC', letterSpacing: '0.08em', border: '1.5px solid rgba(0,132,204,0.15)' }}>
                    {space.inviteCode}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(space.inviteCode!); toast.success('초대 코드가 복사되었습니다'); }}
                    style={{ padding: '12px 14px', borderRadius: '14px', border: 'none', background: '#0084CC', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap' }}
                  >복사</button>
                </div>
                {/* 재발급 (admin 전용) */}
                {myRole === 'admin' && (
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
                    {regenerating ? '재발급 중...' : '🔄 코드 재발급 (7일 유효)'}
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
              <p style={{ fontSize: '14px', color: '#AEAEB2', textAlign: 'center', padding: '12px 0', margin: 0 }}>멤버 정보를 불러올 수 없습니다</p>
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
                      {member.user?.avatar ? (
                        <img
                          src={member.user.avatar}
                          alt={member.user.name}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                          background: isSelf ? 'linear-gradient(135deg, #0CC9B5, #0084CC)' : '#E5E5EA',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', fontWeight: 800,
                          color: isSelf ? 'white' : '#8E8E93',
                        }}>
                          {initials}
                        </div>
                      )}

                      {/* 이름 + 역할 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1B2E' }}>
                            {member.user?.name ?? '알 수 없는 사용자'}
                          </span>
                          {isSelf && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0084CC', background: 'rgba(0,132,204,0.10)', padding: '2px 8px', borderRadius: '999px' }}>나</span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: memberAdmin ? '#F59E0B' : '#8E8E93', fontWeight: 600 }}>
                          {memberAdmin ? '관리자' : '멤버'}
                        </span>
                      </div>

                      {/* 내보내기 / 나가기 버튼 */}
                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={removing}
                          style={{
                            padding: '6px 14px', borderRadius: '10px', flexShrink: 0,
                            border: `1.5px solid ${isSelf ? '#E0E0E5' : 'rgba(239,68,68,0.25)'}`,
                            background: 'white',
                            color: isSelf ? '#8E8E93' : '#EF4444',
                            fontSize: '12px', fontWeight: 700, cursor: removing ? 'not-allowed' : 'pointer',
                            opacity: removing ? 0.5 : 1,
                          }}
                        >
                          {removing ? '처리 중' : isSelf ? '나가기' : '내보내기'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 공간 폐쇄 ── */}
          {isAdmin && (
            <>
              <p style={{ ...sectionLabel, color: '#EF4444' }}>위험 구역</p>
              <div style={{ ...card, border: '1.5px solid rgba(239,68,68,0.20)', background: 'rgba(255,250,250,1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 4px' }}>공간 폐쇄</p>
                    <p style={{ fontSize: '12px', color: '#8E8E93', margin: 0, lineHeight: 1.5 }}>
                      공간과 모든 데이터가 즉시 삭제됩니다.<br/>
                      {hasOtherMembers && <span style={{ color: '#EF4444', fontWeight: 700 }}>멤버를 모두 내보낸 후 진행하세요.</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCloseModal(true)}
                    style={{
                      padding: '8px 16px', borderRadius: '12px', flexShrink: 0,
                      border: '1.5px solid rgba(239,68,68,0.40)',
                      background: 'white', color: '#EF4444',
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
