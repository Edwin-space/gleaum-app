'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getSchedules, addScheduleParticipant, removeScheduleParticipant, reflectSpaceExpenseToPersonalBudget } from '@/lib/db';
import { formatAmount } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { Schedule, SpaceMember } from '@/types';

// ── 상수 ──────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  shared:   { label: '공유', color: '#0084CC', bg: 'rgba(0,132,204,0.10)',   emoji: '🏠' },
  child:    { label: '자녀', color: '#059669', bg: 'rgba(5,150,105,0.10)',   emoji: '🧒' },
  expense:  { label: '지출', color: '#D97706', bg: 'rgba(217,119,6,0.10)',   emoji: '💰' },
  personal: { label: '개인', color: '#0891B2', bg: 'rgba(8,145,178,0.10)',   emoji: '👤' },
};

const FILTER_OPTIONS = [
  { key: '7',  label: '이번 주' },
  { key: '30', label: '이번 달' },
  { key: '90', label: '3개월'   },
] as const;

// ── 날짜 유틸 ─────────────────────────────────────────────
function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateHeader(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const wd = weekdays[date.getDay()];
  const base = `${m}월 ${d}일 (${wd})`;

  if (date.getTime() === today.getTime())    return `오늘  ${base}`;
  if (date.getTime() === tomorrow.getTime()) return `내일  ${base}`;
  return base;
}

function formatTime(d: Date): string {
  const h = d.getHours(), mi = d.getMinutes();
  const period = h < 12 ? '오전' : '오후';
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hh}:${String(mi).padStart(2, '0')}`;
}

function getDayStrip(days: number): { key: string; label: string; short: string }[] {
  const strip: { key: string; label: string; short: string }[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = toDateKey(d);
    const mo = d.getMonth() + 1;
    const da = d.getDate();
    const wd = weekdays[d.getDay()];
    const label = i === 0 ? '오늘' : i === 1 ? '내일' : `${mo}/${da}`;
    strip.push({ key, label, short: wd });
  }
  return strip;
}

// ── 컴포넌트 ──────────────────────────────────────────────
interface Props {
  spaceId: string | null;
  members: SpaceMember[];
  currentUserId: string;
}

export function SpaceScheduleTimeline({ spaceId, members, currentUserId }: Props) {
  const router = useRouter();
  const stripRef = useRef<HTMLDivElement>(null);

  const [schedules,    setSchedules]    = useState<Schedule[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filterDays,   setFilterDays]   = useState<'7' | '30' | '90'>('30');
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(new Date()));
  // scheduleId → loading state for bell button
  const [bellLoading,  setBellLoading]  = useState<Record<string, boolean>>({});
  const [reflecting,   setReflecting]   = useState<Record<string, boolean>>({});
  const [reflectedIds, setReflectedIds] = useState<Set<string>>(new Set());
  // locally tracked participant sets (optimistic)
  const [localParticipants, setLocalParticipants] = useState<Record<string, Set<string>>>({});

  // ── 일정 조회 ──────────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    const data = await getSchedules(spaceId);
    // 공간 타임라인은 공유 컨텍스트만 보여준다. 개인/private 기록은 가계부/개인 홈에만 표시.
    const sharedData = data.filter((schedule) => schedule.visibility !== 'private');
    setSchedules(sharedData);
    // init local participants map
    const map: Record<string, Set<string>> = {};
    sharedData.forEach(s => { map[s.id] = new Set(s.participants); });
    setLocalParticipants(map);
    setLoading(false);
  }, [spaceId]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // ── 날짜 필터 ──────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() + Number(filterDays));

  const filteredSchedules = schedules.filter(s => {
    const d = new Date(s.startTime); d.setHours(0, 0, 0, 0);
    return d >= today && d <= cutoff;
  });
  const spaceExpenses = filteredSchedules
    .filter((s) => s.type === 'expense' && s.visibility !== 'private')
    .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));

  // ── 날짜별 그루핑 ────────────────────────────────────
  const groupedByDate: Record<string, Schedule[]> = {};
  filteredSchedules.forEach(s => {
    const key = toDateKey(new Date(s.startTime));
    if (!groupedByDate[key]) groupedByDate[key] = [];
    groupedByDate[key].push(s);
  });

  // ── 날짜 스트립 (선택된 날짜의 일정만 보임) ────────────
  const dayStrip = getDayStrip(Number(filterDays));
  const displayedDates = selectedDate === '__all__'
    ? Object.keys(groupedByDate).sort()
    : (groupedByDate[selectedDate] ? [selectedDate] : []);

  // 날짜 스트립에서 일정 있는 날짜 표시용
  const datesWithSchedules = new Set(Object.keys(groupedByDate));

  // ── 날짜 탭 선택 시 스크롤 ────────────────────────────
  const selectDate = (key: string) => {
    setSelectedDate(key);
  };

  // ── 알림 토글 ──────────────────────────────────────────
  const toggleAlarm = async (schedule: Schedule) => {
    const isWatching = (localParticipants[schedule.id] ?? new Set()).has(currentUserId);
    setBellLoading(prev => ({ ...prev, [schedule.id]: true }));

    // 낙관적 업데이트
    setLocalParticipants(prev => {
      const next = { ...prev };
      const set = new Set(prev[schedule.id] ?? []);
      if (isWatching) set.delete(currentUserId);
      else            set.add(currentUserId);
      next[schedule.id] = set;
      return next;
    });

    if (isWatching) await removeScheduleParticipant(schedule.id);
    else            await addScheduleParticipant(schedule.id);

    setBellLoading(prev => ({ ...prev, [schedule.id]: false }));
  };

  const reflectExpense = async (schedule: Schedule) => {
    setReflecting((prev) => ({ ...prev, [schedule.id]: true }));
    const result = await reflectSpaceExpenseToPersonalBudget(schedule, {
      reflectionType: 'actual_paid',
    });
    setReflecting((prev) => ({ ...prev, [schedule.id]: false }));

    if (result) {
      setReflectedIds((prev) => new Set(prev).add(schedule.id));
      toast.success('개인 가계부에 반영했습니다');
    } else {
      toast.error('개인 가계부 반영에 실패했습니다');
    }
  };

  // ── 멤버 맵 (userId → member) ─────────────────────────
  const memberMap = new Map(members.map(m => [m.userId, m]));

  // ── 렌더 ──────────────────────────────────────────────
  return (
    <div style={{ marginBottom: '32px' }}>

      {/* Section heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '4px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--theme-text)', margin: 0 }}>
          공간 일정
        </h3>
        <button
          onClick={() => router.push('/space/schedule/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '13px', fontWeight: 800, color: '#0084CC',
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
          }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span>
          일정 추가
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => { setFilterDays(opt.key as typeof filterDays); setSelectedDate(toDateKey(new Date())); }}
            style={{
              padding: '6px 14px', borderRadius: '999px',
              fontSize: '12px', fontWeight: 800,
              background: filterDays === opt.key ? '#1A1B2E' : 'white',
              color: filterDays === opt.key ? 'white' : '#8E8E93',
              border: filterDays === opt.key ? 'none' : '1.5px solid #E5E5EA',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >{opt.label}</button>
        ))}
      </div>

      {/* Space expenses */}
      {spaceExpenses.length > 0 && (
        <div style={{
          background: 'var(--theme-surface)',
          borderRadius: '22px',
          padding: '18px',
          marginBottom: '18px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1.2px', color: '#D97706', margin: '0 0 4px', textTransform: 'uppercase' }}>
                Space Expenses
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--theme-text)', margin: 0 }}>
                공간 지출
              </h4>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', background: 'var(--theme-surface-muted)', padding: '4px 9px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
              {spaceExpenses.length}건
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {spaceExpenses.slice(0, 5).map((expense) => {
              const isReflected = reflectedIds.has(expense.id);
              const isBusy = reflecting[expense.id] ?? false;
              return (
                <div key={expense.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '16px',
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.12)',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '14px',
                    background: 'rgba(217,119,6,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}>
                    💰
                  </div>
                  <button
                    onClick={() => router.push(`/schedules/${expense.id}`)}
                    style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                  >
                    <p style={{ fontSize: '14px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {expense.title}
                    </p>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: 0 }}>
                      {formatAmount(expense.amount ?? 0)} · {formatDateHeader(toDateKey(expense.startTime))}
                    </p>
                  </button>
                  <button
                    onClick={() => reflectExpense(expense)}
                    disabled={isBusy || isReflected}
                    style={{
                      minWidth: '92px',
                      height: '36px',
                      borderRadius: '999px',
                      border: 'none',
                      background: isReflected ? 'rgba(46,232,149,0.14)' : '#1A1B2E',
                      color: isReflected ? '#059669' : 'white',
                      fontSize: '12px',
                      fontWeight: 900,
                      cursor: isBusy || isReflected ? 'default' : 'pointer',
                      opacity: isBusy ? 0.7 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isBusy ? '반영 중...' : isReflected ? '반영됨' : '내 가계부'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Date strip */}
      <div
        ref={stripRef}
        style={{
          display: 'flex', gap: '8px', overflowX: 'auto',
          paddingBottom: '12px', marginBottom: '8px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        <style>{`.strip-scroll::-webkit-scrollbar { display: none; }`}</style>
        {dayStrip.map(day => {
          const isSelected = selectedDate === day.key;
          const hasEvents  = datesWithSchedules.has(day.key);
          const [, mo, da] = day.key.split('-').map(Number);
          return (
            <button
              key={day.key}
              onClick={() => selectDate(day.key)}
              style={{
                flexShrink: 0,
                width: '52px',
                padding: '10px 4px',
                borderRadius: '16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                background: isSelected ? '#1A1B2E' : 'white',
                border: isSelected ? 'none' : '1.5px solid #E5E5EA',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isSelected ? '0 4px 16px rgba(26,27,46,0.20)' : 'none',
              }}
            >
              <span style={{
                fontSize: '10px', fontWeight: 700,
                color: isSelected ? 'rgba(255,255,255,0.60)' : '#8E8E93',
              }}>
                {day.short}
              </span>
              <span style={{
                fontSize: '16px', fontWeight: 900,
                color: isSelected ? 'white' : '#1A1B2E',
              }}>
                {da}
              </span>
              {/* 일정 있는 날 표시 점 */}
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: hasEvents
                  ? (isSelected ? 'rgba(12,201,181,1)' : '#0084CC')
                  : 'transparent',
              }} />
            </button>
          );
        })}
      </div>

      {/* 일정 목록 */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%',
            border: '3px solid #0084CC', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text-subtle)' }}>일정 불러오는 중...</span>
        </div>
      ) : displayedDates.length === 0 ? (
        /* 선택 날짜 일정 없음: 콤팩트 메시지 + 다가오는 일정 미리보기 */
        (() => {
          // 오늘 이후 가장 가까운 일정 최대 3개
          const now = new Date(); now.setHours(0, 0, 0, 0);
          const upcoming = schedules
            .filter(s => { const d = new Date(s.startTime); d.setHours(0,0,0,0); return d > now; })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 3);
          return (
            <div>
              {/* 콤팩트 빈 상태 메시지 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 18px', borderRadius: '16px',
                background: 'var(--theme-surface)', border: '1px solid rgba(0,0,0,0.04)',
                boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                marginBottom: upcoming.length > 0 ? '20px' : '0',
              }}>
                <span style={{ fontSize: '20px' }}>📅</span>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: 0 }}>
                  이 날 등록된 공간 일정이 없어요
                </p>
              </div>

              {/* 다가오는 일정 미리보기 */}
              {upcoming.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)', margin: '0 0 10px', paddingLeft: '2px', letterSpacing: '0.3px' }}>
                    다가오는 일정
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {upcoming.map(s => {
                      const d = new Date(s.startTime);
                      const mo = d.getMonth() + 1;
                      const da = d.getDate();
                      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                      const wd = weekdays[d.getDay()];
                      const typeCfg = TYPE_CONFIG[s.type] ?? TYPE_CONFIG.shared;
                      return (
                        <button
                          key={s.id}
                          onClick={() => router.push(`/schedules/${s.id}`)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 14px', borderRadius: '16px',
                            background: 'var(--theme-surface)', border: '1px solid rgba(0,0,0,0.04)',
                            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          {/* 날짜 뱃지 */}
                          <div style={{
                            width: '40px', height: '40px', flexShrink: 0,
                            borderRadius: '12px', background: typeCfg.bg,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: typeCfg.color, lineHeight: 1 }}>{mo}월</span>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: typeCfg.color, lineHeight: 1.2 }}>{da}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.title}
                            </p>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: '2px 0 0' }}>
                              {`${mo}월 ${da}일 (${wd})`} {formatTime(new Date(s.startTime))}
                            </p>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {displayedDates.map(dateKey => (
            <DateGroup
              key={dateKey}
              dateKey={dateKey}
              schedules={groupedByDate[dateKey] ?? []}
              memberMap={memberMap}
              currentUserId={currentUserId}
              localParticipants={localParticipants}
              bellLoading={bellLoading}
              onToggleAlarm={toggleAlarm}
              onNavigate={(id) => router.push(`/schedules/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── DateGroup ─────────────────────────────────────────────
interface DateGroupProps {
  dateKey:           string;
  schedules:         Schedule[];
  memberMap:         Map<string, SpaceMember>;
  currentUserId:     string;
  localParticipants: Record<string, Set<string>>;
  bellLoading:       Record<string, boolean>;
  onToggleAlarm:     (s: Schedule) => void;
  onNavigate:        (id: string) => void;
}

function DateGroup({ dateKey, schedules, memberMap, currentUserId, localParticipants, bellLoading, onToggleAlarm, onNavigate }: DateGroupProps) {
  return (
    <div>
      {/* Date header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '12px', paddingLeft: '2px',
      }}>
        <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#0084CC', flexShrink: 0 }} />
        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--theme-text)', letterSpacing: '-0.2px' }}>
          {formatDateHeader(dateKey)}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--theme-surface-muted)' }} />
        <span style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--theme-text-subtle)',
          padding: '2px 8px', background: 'var(--theme-surface-muted)', borderRadius: '999px',
        }}>
          {schedules.length}개
        </span>
      </div>

      {/* Timeline cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {schedules.map((schedule, idx) => {
          const isLast    = idx === schedules.length - 1;
          const typeCfg   = TYPE_CONFIG[schedule.type] ?? TYPE_CONFIG.shared;
          const creator   = memberMap.get(schedule.createdBy);
          const isMe      = schedule.createdBy === currentUserId;
          const isWatching = (localParticipants[schedule.id] ?? new Set()).has(currentUserId);
          const isBusy    = bellLoading[schedule.id] ?? false;

          return (
            <div key={schedule.id} style={{ display: 'flex', gap: '0' }}>
              {/* Timeline spine */}
              <div style={{ width: '44px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '18px' }}>
                {/* Dot */}
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: typeCfg.color,
                  border: '2px solid white',
                  boxShadow: `0 0 0 2px ${typeCfg.color}33`,
                  flexShrink: 0,
                  zIndex: 1,
                }} />
                {/* Line */}
                {!isLast && (
                  <div style={{
                    flex: 1, width: '2px',
                    background: 'linear-gradient(to bottom, #E5E5EA, transparent)',
                    marginTop: '4px',
                    minHeight: '24px',
                  }} />
                )}
              </div>

              {/* Card */}
              <div style={{ flex: 1, paddingBottom: isLast ? 0 : '10px' }}>
                <div
                  onClick={() => onNavigate(schedule.id)}
                  style={{
                    background: 'var(--theme-surface)',
                    borderRadius: '18px',
                    padding: '14px 16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                  }}
                >
                  {/* Top row: time + type badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>
                      {formatTime(new Date(schedule.startTime))}
                      {schedule.endTime && (
                        <span style={{ fontWeight: 600, color: '#C7C7CC' }}>
                          {' '}~{' '}{formatTime(new Date(schedule.endTime))}
                        </span>
                      )}
                    </span>
                    {/* Type badge */}
                    <span style={{
                      padding: '2px 8px', borderRadius: '999px',
                      fontSize: '10px', fontWeight: 800,
                      background: typeCfg.bg, color: typeCfg.color,
                    }}>
                      {typeCfg.emoji} {typeCfg.label}
                    </span>
                  </div>

                  {/* Title */}
                  <p style={{
                    fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)',
                    margin: '0 0 10px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {schedule.title}
                  </p>

                  {/* Location */}
                  {schedule.location?.address && (
                    <p style={{
                      fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-subtle)',
                      margin: '0 0 10px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      📍 {schedule.location.address}
                    </p>
                  )}

                  {/* Bottom row: creator + alarm button */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Creator chip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserAvatar
                        avatar={creator?.user?.avatar ?? '?'}
                        name={creator?.user?.name}
                        size={20}
                        radius={999}
                        fontSize={10}
                        style={{ background: 'var(--theme-surface-muted)' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)' }}>
                        {isMe ? '나' : (creator?.user?.name ?? '멤버')}
                      </span>
                      {isMe && (
                        <span style={{
                          padding: '1px 7px', borderRadius: '999px',
                          fontSize: '10px', fontWeight: 800,
                          background: 'rgba(0,132,204,0.08)', color: '#0084CC',
                        }}>내 일정</span>
                      )}
                    </div>

                    {/* Alarm button — 본인 일정이 아닐 때만 표시 */}
                    {!isMe && (
                      <button
                        onClick={() => onToggleAlarm(schedule)}
                        disabled={isBusy}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '6px 12px', borderRadius: '999px',
                          fontSize: '11px', fontWeight: 800,
                          background: isWatching
                            ? 'rgba(0,132,204,0.10)'
                            : 'rgba(0,0,0,0.04)',
                          color: isWatching ? '#0084CC' : '#8E8E93',
                          border: isWatching ? '1px solid rgba(0,132,204,0.25)' : '1px solid rgba(0,0,0,0.08)',
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                          opacity: isBusy ? 0.6 : 1,
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isBusy ? (
                          <>
                            <div style={{
                              width: '10px', height: '10px', borderRadius: '50%',
                              border: '2px solid currentColor', borderTopColor: 'transparent',
                              animation: 'spin 0.8s linear infinite',
                            }} />
                            처리 중
                          </>
                        ) : isWatching ? (
                          <>
                            <BellFilledIcon size={12} />
                            알림 받는 중
                          </>
                        ) : (
                          <>
                            <BellIcon size={12} />
                            알림 추가
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 벨 아이콘 ─────────────────────────────────────────────
function BellIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function BellFilledIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
