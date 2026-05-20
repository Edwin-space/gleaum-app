'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { getSpaceSettings, updateSpaceSettings, updateSpaceName } from '@/lib/db';
import { toast } from 'sonner';

const PURPOSES = [
  { key: 'family',  label: '가족',      emoji: '👨‍👩‍👧‍👦' },
  { key: 'couple',  label: '커플',      emoji: '💑'      },
  { key: 'friends', label: '친구 모임', emoji: '🙌'      },
  { key: 'work',    label: '업무 팀',   emoji: '💼'      },
  { key: 'other',   label: '기타',      emoji: '✨'      },
];

const DEFAULT_TYPES = ['공지', '약속', '활동', '행사', '기타'];

export default function SpaceSettingsPage() {
  const router = useRouter();
  const { spaceId, loading: userLoading } = useCurrentUser();
  const { space, myRole, loading: spaceLoading } = useSpace(spaceId);
  const isAdmin = myRole === 'admin';

  // ── 상태 ──────────────────────────────────────────────────
  const [spaceName,     setSpaceName]     = useState('');
  const [editingName,   setEditingName]   = useState(false);
  const [savingName,    setSavingName]    = useState(false);

  const [purpose,       setPurpose]       = useState<string>('family');
  const [scheduleTypes, setScheduleTypes] = useState<string[]>(DEFAULT_TYPES);
  const [newType,       setNewType]       = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // ── 설정 로드 ─────────────────────────────────────────────
  useEffect(() => {
    if (!spaceId) return;
    setSpaceName(space?.name ?? '');

    getSpaceSettings(spaceId).then(settings => {
      if (settings.purpose) setPurpose(settings.purpose);
      if (settings.scheduleTypes?.length) {
        setScheduleTypes(settings.scheduleTypes);
      }
      setSettingsLoaded(true);
    });
  }, [spaceId, space?.name]);

  // ── 권한 없음 guard ──────────────────────────────────────
  useEffect(() => {
    if (!spaceLoading && !userLoading && myRole && myRole !== 'admin') {
      toast.error('관리자만 설정을 변경할 수 있습니다');
      router.back();
    }
  }, [myRole, spaceLoading, userLoading]);

  const handleSaveName = async () => {
    if (!spaceName.trim() || !spaceId) return;
    setSavingName(true);
    const ok = await updateSpaceName(spaceId, spaceName.trim());
    setSavingName(false);
    setEditingName(false);
    if (ok) {
      // localStorage 플래그 → 공간 메인 페이지에서 이름 재조회 트리거
      try { localStorage.setItem('gleaum_space_name_updated', Date.now().toString()); } catch {}
      toast.success('공간 이름이 변경되었습니다');
      // 저장 후 공간 메인으로 자동 복귀 (100ms 딜레이로 toast 노출 후)
      setTimeout(() => router.back(), 100);
    } else {
      toast.error('이름 변경에 실패했습니다');
    }
  };

  const handleSaveSettings = async () => {
    if (!spaceId) return;
    setSavingSettings(true);
    const ok = await updateSpaceSettings(spaceId, { purpose, scheduleTypes });
    setSavingSettings(false);
    if (ok) toast.success('설정이 저장되었습니다');
    else    toast.error('설정 저장에 실패했습니다 (DB 마이그레이션 필요)');
  };

  const addType = () => {
    const trimmed = newType.trim();
    if (!trimmed) return;
    if (scheduleTypes.includes(trimmed)) {
      toast.error('이미 존재하는 유형입니다');
      return;
    }
    if (scheduleTypes.length >= 10) {
      toast.error('최대 10개까지 등록할 수 있습니다');
      return;
    }
    setScheduleTypes(prev => [...prev, trimmed]);
    setNewType('');
  };

  const removeType = (t: string) => {
    if (scheduleTypes.length <= 1) { toast.error('최소 1개의 유형이 필요합니다'); return; }
    setScheduleTypes(prev => prev.filter(x => x !== t));
  };

  const isLoading = userLoading || spaceLoading;

  // ── 공통 스타일 ──────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'white', borderRadius: '20px', padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: '16px',
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
          공간 설정
        </h1>
      </div>

      <div style={{ padding: '20px 16px 0', maxWidth: '600px', margin: '0 auto' }}>

        {/* ── 공간 이름 ── */}
        <p style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.06em', margin: '0 0 10px 4px' }}>공간 기본 정보</p>
        <div style={card}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93', margin: '0 0 10px' }}>공간 이름</p>
          {editingName ? (
            <div>
              <input
                value={spaceName}
                onChange={e => setSpaceName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setSpaceName(space?.name ?? ''); } }}
                autoFocus
                maxLength={30}
                placeholder="공간 이름 입력"
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>
                {space?.name ?? spaceName}
              </p>
              {isAdmin && (
                <button
                  onClick={() => setEditingName(true)}
                  style={{ padding: '7px 14px', borderRadius: '12px', border: '1.5px solid #E0E0E5', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#0084CC' }}
                >편집</button>
              )}
            </div>
          )}
        </div>

        {/* ── 공간 목적 ── */}
        <p style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.06em', margin: '8px 0 10px 4px' }}>공간 목적</p>
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
                <span>{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 일정 유형 관리 ── */}
        <p style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.06em', margin: '8px 0 10px 4px' }}>일정 유형 관리</p>
        <div style={card}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#8E8E93', margin: '0 0 14px', lineHeight: 1.5 }}>
            공간 일정 등록 시 선택할 수 있는 유형을 관리합니다.
          </p>

          {/* 현재 유형 목록 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {scheduleTypes.map(t => (
              <div
                key={t}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '999px',
                  background: 'rgba(0,132,204,0.07)', border: '1.5px solid rgba(0,132,204,0.20)',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0084CC' }}>{t}</span>
                {isAdmin && (
                  <button
                    onClick={() => removeType(t)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      width: '18px', height: '18px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#EF4444', fontSize: '14px', fontWeight: 700,
                      padding: 0, lineHeight: 1,
                    }}
                  >×</button>
                )}
              </div>
            ))}
          </div>

          {/* 유형 추가 (admin만) */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={newType}
                onChange={e => setNewType(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addType()}
                placeholder="새 유형 이름 입력"
                maxLength={10}
                style={{
                  flex: 1, height: '46px', padding: '0 14px', borderRadius: '14px',
                  fontSize: '14px', fontWeight: 600, background: '#F7F7FA',
                  border: '1.5px solid #EBEBF0', outline: 'none',
                  boxSizing: 'border-box', color: '#1A1B2E',
                }}
              />
              <button
                onClick={addType}
                disabled={!newType.trim()}
                style={{
                  padding: '0 18px', height: '46px', borderRadius: '14px',
                  border: 'none', cursor: newType.trim() ? 'pointer' : 'not-allowed',
                  background: newType.trim() ? '#0084CC' : '#E5E5EA',
                  color: newType.trim() ? 'white' : '#AEAEB2',
                  fontSize: '14px', fontWeight: 800,
                }}
              >추가</button>
            </div>
          )}
        </div>

        {/* ── 저장 버튼 ── */}
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
              marginBottom: '16px',
            }}
          >
            {savingSettings ? '저장 중...' : '설정 저장'}
          </button>
        )}

        {/* ── 초대 코드 ── */}
        {space?.inviteCode && (
          <>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.06em', margin: '8px 0 10px 4px' }}>초대</p>
            <div style={card}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93', margin: '0 0 8px' }}>공간 초대 코드</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <code style={{
                  flex: 1, padding: '12px 16px', borderRadius: '14px',
                  background: '#F7F7FA', fontSize: '16px', fontWeight: 800,
                  color: '#0084CC', letterSpacing: '0.08em', border: '1.5px solid rgba(0,132,204,0.15)',
                }}>
                  {space.inviteCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(space.inviteCode!);
                    toast.success('초대 코드가 복사되었습니다');
                  }}
                  style={{ padding: '12px 18px', borderRadius: '14px', border: 'none', background: '#0084CC', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 800 }}
                >복사</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
