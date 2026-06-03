'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { createSchedule, getSpaceSettings } from '@/lib/db';
import { toast } from 'sonner';
import type { RepeatType, SpaceMember } from '@/types';

const DEFAULT_SCHEDULE_TYPES = ['공지', '약속', '활동', '행사', '기타'];

const REMINDER_OPTIONS = [
  { value: 0,    label: '없음' },
  { value: 10,   label: '10분 전' },
  { value: 30,   label: '30분 전' },
  { value: 60,   label: '1시간 전' },
  { value: 1440, label: '하루 전' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.07em', marginBottom: '12px', textTransform: 'uppercase' }}>
      {children}
    </p>
  );
}

// ── 참여자 썸네일 리스트 (item 9) ─────────────────────────
function ParticipantPicker({
  members,
  selected,
  onToggle,
}: {
  members: SpaceMember[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const VISIBLE = 5;
  const visible  = members.slice(0, VISIBLE);
  const hidden   = members.slice(VISIBLE);
  const showing  = expanded ? members : visible;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {showing.map(member => {
          // ★ member.userId (auth UUID) 사용 — member.id는 space_members 레코드 UUID
          const isSelected = selected.includes(member.userId);
          const avatarIsUrl = !!member.user?.avatar &&
            (member.user.avatar.startsWith('http') || member.user.avatar.startsWith('data:'));
          return (
            <button
              key={member.userId}
              onClick={() => onToggle(member.userId)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Avatar circle */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px',
                background: isSelected
                  ? 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)'
                  : '#F5F5F7',
                border: isSelected ? '2px solid #0084CC' : '2px solid transparent',
                boxShadow: isSelected ? '0 4px 12px rgba(0,132,204,0.30)' : 'none',
                transition: 'all 0.15s',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {avatarIsUrl ? (
                  <img
                    src={member.user!.avatar}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover',
                      filter: isSelected ? 'brightness(0.7)' : 'none' }}
                  />
                ) : member.user?.avatar ? (
                  <span style={{ fontSize: '26px' }}>{member.user.avatar}</span>
                ) : (
                  <span style={{ fontSize: '20px', color: isSelected ? 'white' : '#8E8E93' }}>👤</span>
                )}
                {isSelected && (
                  <div style={{
                    position: 'absolute', bottom: '-2px', right: '-2px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: '#0084CC', border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </div>
              {/* Nickname */}
              <span style={{
                fontSize: '11px', fontWeight: isSelected ? 800 : 600,
                color: isSelected ? '#0084CC' : '#8E8E93',
                maxWidth: '56px', textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {member.user?.name ?? '멤버'}
              </span>
            </button>
          );
        })}

        {/* 더보기 버튼 */}
        {!expanded && hidden.length > 0 && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: '#F0F0F5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 800, color: '#0084CC',
              border: '2px solid #E0E0E8',
            }}>
              +{hidden.length}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93' }}>더보기</span>
          </button>
        )}
      </div>

      {/* 접기 버튼 (expanded 시) */}
      {expanded && hidden.length > 0 && (
        <button
          onClick={() => setExpanded(false)}
          style={{
            marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: 700, color: '#8E8E93',
            padding: '4px 0',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 15L12 9L6 15"/>
          </svg>
          접기
        </button>
      )}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────
export default function SpaceScheduleNewPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { spaceId, user, loading: userLoading } = useCurrentUser();
  const { space, members, myRole } = useSpace(spaceId);

  const [saving,        setSaving]        = useState(false);
  const [title,         setTitle]         = useState('');
  const [date,          setDate]          = useState(new Date().toISOString().split('T')[0]);
  const [startTime,     setStart]         = useState('09:00');
  const [endTime,       setEnd]           = useState('10:00');
  const [scheduleType,  setScheduleType]  = useState('');
  const [participants,  setParticipants]  = useState<string[]>([]);
  const [address,       setAddress]       = useState('');
  const [reminder,      setReminder]      = useState(15);
  const [repeat,        setRepeat]        = useState<RepeatType>('none');
  const [memo,          setMemo]          = useState('');
  const [customTypes,   setCustomTypes]   = useState<string[]>(DEFAULT_SCHEDULE_TYPES);
  const [typeOpen,      setTypeOpen]      = useState(false);

  // 공간 커스텀 유형 로드
  useEffect(() => {
    if (!spaceId) return;
    getSpaceSettings(spaceId).then(settings => {
      if (settings.scheduleTypes?.length) {
        setCustomTypes(settings.scheduleTypes);
        setScheduleType(settings.scheduleTypes[0]);
      } else {
        setScheduleType(DEFAULT_SCHEDULE_TYPES[0]);
      }
    });
  }, [spaceId]);

  // 참여자 초기화 (전체 선택) — userId(auth UUID) 사용
  useEffect(() => {
    if (members.length > 0 && participants.length === 0) {
      setParticipants(members.map(m => m.userId));
    }
  }, [members]);

  const toggleParticipant = (id: string) => {
    setParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('일정 제목을 입력해주세요'); return; }
    if (!spaceId) { toast.error('공간 정보를 불러오는 중입니다'); return; }
    if (myRole === 'viewer') { toast.error('조회 권한만 있어 일정을 등록할 수 없습니다'); return; }

    setSaving(true);
    try {
      await createSchedule(spaceId, {
        title: title.trim(),
        type: 'shared',
        startTime: new Date(`${date}T${startTime}`),
        endTime:   new Date(`${date}T${endTime}`),
        participantIds: participants,
        locationAddress: address || undefined,
        reminder,
        repeat,
        memo: memo || undefined,
      });
      toast.success('공간 일정이 등록되었습니다');
      router.back();
    } catch (e) {
      console.error(e);
      toast.error('일정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const cardBase: React.CSSProperties = {
    background: 'white', borderRadius: '20px', padding: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: '12px',
  };
  const inputBase: React.CSSProperties = {
    width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px',
    fontSize: '15px', background: '#F7F7FA', outline: 'none',
    boxSizing: 'border-box', color: '#1A1B2E', fontWeight: 600, fontFamily: 'inherit',
  };

  return (
    <div className="min-h-dvh" style={{ background: '#FAFAFD', paddingBottom: 'var(--scroll-bottom, calc(env(safe-area-inset-bottom) + 80px))' }}>
      {/* ── 헤더 ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px 14px',
        paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
        background: 'rgba(250,250,253,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <button
          onClick={() => router.back()}
          style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,132,204,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#0084CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1B2E', margin: 0, letterSpacing: '-0.03em' }}>
            공간 일정 등록
          </p>
          {space?.name && (
            <p style={{ fontSize: '12px', color: '#0084CC', fontWeight: 700, margin: '2px 0 0' }}>
              🏠 {space.name}
            </p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '9px 20px', borderRadius: '100px', border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: 800, color: 'white',
            background: saving ? 'rgba(0,132,204,0.5)' : 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
            boxShadow: saving ? 'none' : '0 4px 16px rgba(0,132,204,0.35)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>

      {/* ── 컨텐츠 ── */}
      <div style={{ padding: '16px 16px 0' }}>

        {/* 제목 */}
        <div style={cardBase}>
          <SectionLabel>제목 *</SectionLabel>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="일정 제목을 입력하세요"
            style={{ ...inputBase, height: '56px', fontSize: '17px', border: `1.5px solid ${title ? '#0084CC80' : '#EBEBF0'}` }}
          />
        </div>

        {/* 날짜 & 시간 */}
        <div style={cardBase}>
          <SectionLabel>날짜 &amp; 시간</SectionLabel>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ ...inputBase, height: '52px', border: `1.5px solid ${date ? '#0084CC80' : '#EBEBF0'}`, marginBottom: '10px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="time" value={startTime} onChange={e => setStart(e.target.value)}
              style={{ ...inputBase, flex: 1, minWidth: 0, border: `1.5px solid ${startTime ? '#0084CC80' : '#EBEBF0'}` }}
            />
            <span style={{ fontSize: '13px', color: '#C7C7CC', fontWeight: 600, flexShrink: 0 }}>~</span>
            <input type="time" value={endTime} onChange={e => setEnd(e.target.value)}
              style={{ ...inputBase, flex: 1, minWidth: 0, border: `1.5px solid ${endTime ? '#0084CC80' : '#EBEBF0'}` }}
            />
          </div>
        </div>

        {/* 일정 유형 드롭다운 (item 8) */}
        <div style={cardBase}>
          <SectionLabel>일정 유형</SectionLabel>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setTypeOpen(o => !o)}
              style={{
                ...inputBase, height: '52px', border: `1.5px solid ${scheduleType ? '#0084CC80' : '#EBEBF0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingRight: '14px', cursor: 'pointer', background: '#F7F7FA',
              } as React.CSSProperties}
            >
              <span style={{ fontSize: '15px', fontWeight: 700, color: scheduleType ? '#1A1B2E' : '#AEAEB2' }}>
                {scheduleType || '일정 유형 선택'}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round">
                <path d={typeOpen ? 'M18 15L12 9L6 15' : 'M6 9L12 15L18 9'}/>
              </svg>
            </button>

            {typeOpen && (
              <div style={{
                position: 'absolute', top: '56px', left: 0, right: 0, zIndex: 30,
                background: 'white', borderRadius: '14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}>
                {customTypes.map((t, i) => (
                  <button
                    key={t}
                    onClick={() => { setScheduleType(t); setTypeOpen(false); }}
                    style={{
                      width: '100%', padding: '14px 18px', textAlign: 'left',
                      background: scheduleType === t ? 'rgba(0,132,204,0.06)' : 'white',
                      border: 'none',
                      borderTop: i > 0 ? '1px solid #F2F2F7' : 'none',
                      cursor: 'pointer',
                      fontSize: '15px', fontWeight: scheduleType === t ? 800 : 600,
                      color: scheduleType === t ? '#0084CC' : '#1A1B2E',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    {t}
                    {scheduleType === t && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 참여자 (item 9) */}
        <div style={cardBase}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <SectionLabel>참여자</SectionLabel>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', marginBottom: '12px' }}>
              {participants.length}/{members.length}명 선택
            </span>
          </div>
          <ParticipantPicker
            members={members}
            selected={participants}
            onToggle={toggleParticipant}
          />
        </div>

        {/* 장소 */}
        <div style={cardBase}>
          <SectionLabel>장소 (선택)</SectionLabel>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>📍</span>
            <input
              value={address} onChange={e => setAddress(e.target.value)}
              placeholder="장소를 입력하세요"
              style={{ ...inputBase, border: `1.5px solid ${address ? '#0084CC80' : '#EBEBF0'}`, paddingLeft: '42px' }}
            />
          </div>
        </div>

        {/* 알림 */}
        <div style={cardBase}>
          <SectionLabel>알림 설정</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {REMINDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setReminder(opt.value)}
                style={{
                  padding: '9px 16px', borderRadius: '100px',
                  border: `1.5px solid ${reminder === opt.value ? 'transparent' : '#EBEBF0'}`,
                  cursor: 'pointer',
                  background: reminder === opt.value ? '#0084CC' : '#F7F7FA',
                  fontSize: '12px', fontWeight: 700,
                  color: reminder === opt.value ? 'white' : '#6E6E66',
                  boxShadow: reminder === opt.value ? '0 3px 12px rgba(0,132,204,0.30)' : 'none',
                  transition: 'all 0.15s',
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        {/* 메모 */}
        <div style={cardBase}>
          <SectionLabel>메모 (선택)</SectionLabel>
          <textarea
            value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="메모를 입력하세요"
            rows={3}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '14px',
              fontSize: '15px', background: '#F7F7FA',
              border: `1.5px solid ${memo ? '#0084CC80' : '#EBEBF0'}`,
              outline: 'none', boxSizing: 'border-box',
              color: '#1A1B2E', fontWeight: 500, fontFamily: 'inherit',
              lineHeight: 1.6, resize: 'none',
            }}
          />
        </div>

        {/* 하단 버튼 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '8px', paddingBottom: '32px' }}>
          <button
            onClick={() => router.back()}
            style={{ height: '56px', borderRadius: '20px', border: '1.5px solid #E0E0E5', cursor: 'pointer', fontSize: '15px', fontWeight: 700, color: '#6E6E66', background: 'white' }}
          >취소</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              height: '56px', borderRadius: '20px', border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '15px', fontWeight: 800, color: 'white',
              background: saving ? 'rgba(0,132,204,0.5)' : 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
              boxShadow: saving ? 'none' : '0 6px 20px rgba(0,132,204,0.35)',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '저장 중...' : '일정 등록'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
