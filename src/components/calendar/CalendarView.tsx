'use client';

import { useState, useMemo } from 'react';
import { isSameDay, formatMonthYear, getScheduleTypeColor } from '@/lib/utils';
import type { Schedule } from '@/types';

// ── 유틸 ────────────────────────────────────────────
function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const firstDow = (first.getDay() + 6) % 7; // 월=0, ..., 일=6
  const days: Date[] = [];
  for (let i = 0; i < firstDow; i++) {
    days.push(new Date(year, month, 1 - (firstDow - i)));
  }
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= lastDay; d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return days;
}

function getWeekDays(base: Date): Date[] {
  const dow = (base.getDay() + 6) % 7; // 월=0
  const monday = new Date(base);
  monday.setDate(base.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatWeekRange(days: Date[]): string {
  const s = days[0];
  const e = days[6];
  const sy = s.getFullYear(); const sm = s.getMonth() + 1; const sd = s.getDate();
  const em = e.getMonth() + 1; const ed = e.getDate();
  return sm === em
    ? `${sy}년 ${sm}월 ${sd}일 – ${ed}일`
    : `${sy}년 ${sm}월 ${sd}일 – ${em}월 ${ed}일`;
}

function formatDayFull(d: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function formatHour(h: number): string {
  return h === 0 ? '자정' : h < 12 ? `오전 ${h}시` : h === 12 ? '정오' : `오후 ${h - 12}시`;
}

const HOUR_HEIGHT = 56; // px per hour
const DAY_LABELS  = ['월', '화', '수', '목', '금', '토', '일'];
const TYPE_COLOR  = getScheduleTypeColor;

// ── Props ────────────────────────────────────────────
interface CalendarViewProps {
  schedules:    Schedule[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  view?:        'month' | 'week' | 'day';
}

// ════════════════════════════════════════════════════
// 메인 컴포넌트
// ════════════════════════════════════════════════════
export function CalendarView({
  schedules,
  selectedDate,
  onSelectDate,
  view = 'month',
}: CalendarViewProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() =>
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // ── 월간 네비게이션 ──
  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // ── 주간 네비게이션 ──
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const prevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    onSelectDate(d);
  };
  const nextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    onSelectDate(d);
  };

  // ── 일간 네비게이션 ──
  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(d);
  };
  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(d);
  };

  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(new Date());
  };

  // 날짜별 일정 유형 점 (최대 3)
  const getDotsForDay = (date: Date) => {
    const daySchedules = schedules.filter(s => isSameDay(s.startTime, date));
    return [...new Set(daySchedules.map(s => s.type))].slice(0, 3);
  };

  // 날짜별 일정 목록
  const getSchedulesForDay = (date: Date) =>
    schedules
      .filter(s => isSameDay(s.startTime, date))
      .sort((a, b) => +a.startTime - +b.startTime);

  // ── 시간 위치 계산 ──
  const getTopPct = (s: Schedule) => {
    const h = s.startTime.getHours() + s.startTime.getMinutes() / 60;
    return h * HOUR_HEIGHT;
  };
  const getHeightPct = (s: Schedule) => {
    if (!s.endTime) return HOUR_HEIGHT * 0.75;
    const dur = (+s.endTime - +s.startTime) / 3_600_000;
    return Math.max(dur * HOUR_HEIGHT, HOUR_HEIGHT * 0.5);
  };

  // ════════════════════════════════════════════════════
  // 렌더
  // ════════════════════════════════════════════════════
  if (view === 'month') {
    return <MonthView
      viewDate={viewDate} today={today} selectedDate={selectedDate}
      onSelectDate={onSelectDate} prevMonth={prevMonth} nextMonth={nextMonth}
      goToday={goToday} getDotsForDay={getDotsForDay}
    />;
  }

  if (view === 'week') {
    return <WeekView
      weekDays={weekDays} today={today} selectedDate={selectedDate}
      onSelectDate={onSelectDate} prevWeek={prevWeek} nextWeek={nextWeek}
      goToday={goToday} getSchedulesForDay={getSchedulesForDay}
      getTopPct={getTopPct} getHeightPct={getHeightPct}
    />;
  }

  // day
  return <DayView
    selectedDate={selectedDate} today={today}
    prevDay={prevDay} nextDay={nextDay} goToday={goToday}
    getSchedulesForDay={getSchedulesForDay}
    getTopPct={getTopPct} getHeightPct={getHeightPct}
  />;
}

// ════════════════════════════════════════════════════
// 월간 뷰
// ════════════════════════════════════════════════════
function MonthView({
  viewDate, today, selectedDate, onSelectDate,
  prevMonth, nextMonth, goToday, getDotsForDay,
}: {
  viewDate: Date; today: Date; selectedDate: Date;
  onSelectDate: (d: Date) => void;
  prevMonth: () => void; nextMonth: () => void; goToday: () => void;
  getDotsForDay: (d: Date) => string[];
}) {
  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const currentMonth = viewDate.getMonth();

  return (
    <div>
      {/* 헤더 */}
      <NavBar
        label={formatMonthYear(viewDate)}
        onPrev={prevMonth} onNext={nextMonth} onToday={goToday}
      />

      {/* 요일 */}
      <div className="grid grid-cols-7 px-1 pb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className="text-center py-1 text-[11px] font-semibold"
            style={{ color: i === 5 ? '#0084CC' : i === 6 ? '#EF4444' : 'var(--color-ink-muted-48)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 px-1 pb-2">
        {days.map((date, idx) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday    = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const dots = getDotsForDay(date);
          const dow = idx % 7;

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(date)}
              className="flex flex-col items-center pt-1 pb-2 rounded-xl active:scale-95 transition-transform"
              style={{
                background: isSelected && !isToday ? 'rgba(0,132,204,0.08)' : 'transparent',
                opacity: isCurrentMonth ? 1 : 0.3,
              }}
            >
              <span
                className="w-7 h-7 flex items-center justify-center rounded-full text-[13px]"
                style={{
                  background: isToday ? 'var(--color-primary)' : 'transparent',
                  color: isToday ? 'white'
                    : dow === 5 ? '#0084CC'
                    : dow === 6 ? '#EF4444'
                    : 'var(--color-ink)',
                  fontWeight: isToday || isSelected ? 700 : 400,
                }}
              >
                {date.getDate()}
              </span>
              <div className="flex gap-0.5 mt-0.5 h-1.5">
                {dots.map((type, di) => (
                  <span key={di} className="w-1 h-1 rounded-full"
                    style={{ background: TYPE_COLOR(type as import('@/types').ScheduleType) }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// 주간 뷰
// ════════════════════════════════════════════════════
function WeekView({
  weekDays, today, selectedDate, onSelectDate,
  prevWeek, nextWeek, goToday,
  getSchedulesForDay, getTopPct, getHeightPct,
}: {
  weekDays: Date[]; today: Date; selectedDate: Date;
  onSelectDate: (d: Date) => void;
  prevWeek: () => void; nextWeek: () => void; goToday: () => void;
  getSchedulesForDay: (d: Date) => Schedule[];
  getTopPct: (s: Schedule) => number;
  getHeightPct: (s: Schedule) => number;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const LABEL_W = 44; // 시간 레이블 너비(px)

  return (
    <div>
      {/* 헤더 */}
      <NavBar
        label={formatWeekRange(weekDays)}
        onPrev={prevWeek} onNext={nextWeek} onToday={goToday}
        compact
      />

      {/* 요일 + 날짜 헤더 */}
      <div className="flex border-b" style={{ borderColor: 'rgba(0,132,204,0.08)' }}>
        {/* 시간 레이블 공간 */}
        <div style={{ width: LABEL_W, flexShrink: 0 }} />
        {weekDays.map((d, i) => {
          const isToday    = isSameDay(d, today);
          const isSelected = isSameDay(d, selectedDate);
          const dow = i; // 월=0
          return (
            <button
              key={i}
              onClick={() => onSelectDate(d)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors active:bg-[rgba(0,132,204,0.04)]"
            >
              <span className="text-[10px] font-semibold"
                style={{ color: dow === 5 ? '#0084CC' : dow === 6 ? '#EF4444' : 'var(--color-ink-muted-48)' }}>
                {DAY_LABELS[i]}
              </span>
              <span
                className="w-7 h-7 flex items-center justify-center rounded-full text-[13px]"
                style={{
                  background: isToday ? 'var(--color-primary)'
                    : isSelected ? 'rgba(0,132,204,0.12)' : 'transparent',
                  color: isToday ? 'white'
                    : dow === 5 ? '#0084CC'
                    : dow === 6 ? '#EF4444'
                    : 'var(--color-ink)',
                  fontWeight: isToday || isSelected ? 700 : 400,
                }}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* 타임라인 스크롤 영역 */}
      <div
        className="overflow-y-auto"
        style={{ height: '340px', scrollbarWidth: 'none' }}
      >
        <div className="flex" style={{ position: 'relative' }}>
          {/* 시간 레이블 열 */}
          <div style={{ width: LABEL_W, flexShrink: 0 }}>
            {hours.map(h => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT, paddingTop: 2 }}
                className="flex items-start justify-end pr-2"
              >
                {h > 0 && (
                  <span className="text-[9px] font-medium" style={{ color: 'var(--color-ink-muted-48)' }}>
                    {h < 10 ? `0${h}` : h}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 날짜 열 7개 */}
          {weekDays.map((d, ci) => {
            const daySchedules = getSchedulesForDay(d);
            const isToday = isSameDay(d, today);
            const nowTop = isToday
              ? (today.getHours() + today.getMinutes() / 60) * HOUR_HEIGHT
              : -1;

            return (
              <div
                key={ci}
                className="flex-1 relative border-l"
                style={{
                  borderColor: 'rgba(0,132,204,0.06)',
                  height: HOUR_HEIGHT * 24,
                  background: isToday ? 'rgba(0,132,204,0.015)' : 'transparent',
                }}
              >
                {/* 시간선 */}
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t"
                    style={{
                      top: h * HOUR_HEIGHT,
                      borderColor: h % 6 === 0
                        ? 'rgba(0,132,204,0.12)'
                        : 'rgba(0,132,204,0.05)',
                    }}
                  />
                ))}

                {/* 현재 시간 바 */}
                {nowTop > 0 && (
                  <div
                    className="absolute w-full flex items-center z-10"
                    style={{ top: nowTop - 1 }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full ml-[-3px]"
                      style={{ background: '#EF4444' }} />
                    <div className="flex-1 h-[2px]" style={{ background: '#EF4444' }} />
                  </div>
                )}

                {/* 일정 블록 */}
                {daySchedules.map(s => {
                  const top = getTopPct(s);
                  const height = getHeightPct(s);
                  const color = TYPE_COLOR(s.type);
                  return (
                    <div
                      key={s.id}
                      className="absolute left-0.5 right-0.5 rounded-[6px] px-1 overflow-hidden z-20"
                      style={{
                        top,
                        height: Math.max(height, 20),
                        background: `${color}20`,
                        borderLeft: `2.5px solid ${color}`,
                      }}
                    >
                      <p
                        className="font-semibold leading-tight mt-0.5"
                        style={{ fontSize: '9px', color, lineClamp: 2 }}
                      >
                        {s.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// 일간 뷰
// ════════════════════════════════════════════════════
function DayView({
  selectedDate, today, prevDay, nextDay, goToday,
  getSchedulesForDay, getTopPct, getHeightPct,
}: {
  selectedDate: Date; today: Date;
  prevDay: () => void; nextDay: () => void; goToday: () => void;
  getSchedulesForDay: (d: Date) => Schedule[];
  getTopPct: (s: Schedule) => number;
  getHeightPct: (s: Schedule) => number;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isToday = isSameDay(selectedDate, today);
  const nowTop = isToday
    ? (today.getHours() + today.getMinutes() / 60) * HOUR_HEIGHT
    : -1;
  const daySchedules = getSchedulesForDay(selectedDate);
  const LABEL_W = 52;

  return (
    <div>
      <NavBar
        label={formatDayFull(selectedDate)}
        onPrev={prevDay} onNext={nextDay} onToday={goToday}
        compact
      />

      <div
        className="overflow-y-auto"
        style={{ height: '380px', scrollbarWidth: 'none' }}
      >
        <div className="flex" style={{ position: 'relative' }}>
          {/* 시간 레이블 */}
          <div style={{ width: LABEL_W, flexShrink: 0 }}>
            {hours.map(h => (
              <div key={h} style={{ height: HOUR_HEIGHT }}
                className="flex items-start justify-end pr-2 pt-0.5">
                {h > 0 && (
                  <span className="text-[10px] font-medium"
                    style={{ color: 'var(--color-ink-muted-48)' }}>
                    {formatHour(h)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 타임라인 */}
          <div
            className="flex-1 relative border-l"
            style={{ borderColor: 'rgba(0,132,204,0.08)', height: HOUR_HEIGHT * 24 }}
          >
            {/* 시간선 */}
            {hours.map(h => (
              <div key={h} className="absolute w-full border-t"
                style={{
                  top: h * HOUR_HEIGHT,
                  borderColor: h % 6 === 0 ? 'rgba(0,132,204,0.15)' : 'rgba(0,132,204,0.06)',
                }}
              />
            ))}

            {/* 현재시간 바 */}
            {nowTop > 0 && (
              <div className="absolute w-full flex items-center z-10"
                style={{ top: nowTop - 1 }}>
                <div className="w-2 h-2 rounded-full ml-[-4px]"
                  style={{ background: '#EF4444' }} />
                <div className="flex-1 h-[2px]" style={{ background: '#EF4444' }} />
              </div>
            )}

            {/* 일정 블록 (가로 겹침 처리) */}
            {daySchedules.map((s, idx) => {
              const top = getTopPct(s);
              const height = getHeightPct(s);
              const color = TYPE_COLOR(s.type);
              // 간단한 좌우 오프셋
              const left = `${(idx % 3) * 2}px`;

              return (
                <div
                  key={s.id}
                  className="absolute rounded-[10px] px-2.5 py-1.5 overflow-hidden z-20"
                  style={{
                    top,
                    left,
                    right: '6px',
                    height: Math.max(height, 28),
                    background: `${color}18`,
                    borderLeft: `3px solid ${color}`,
                    boxShadow: `0 2px 8px ${color}20`,
                  }}
                >
                  <p className="font-bold text-[12px] leading-tight truncate" style={{ color }}>
                    {s.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: `${color}99` }}>
                    {s.startTime.getHours().toString().padStart(2, '0')}:
                    {s.startTime.getMinutes().toString().padStart(2, '0')}
                    {s.endTime && ` – ${s.endTime.getHours().toString().padStart(2, '0')}:${s.endTime.getMinutes().toString().padStart(2, '0')}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 일정 없음 */}
      {daySchedules.length === 0 && (
        <div className="flex flex-col items-center py-8 gap-2 border-t"
          style={{ borderColor: 'rgba(0,132,204,0.06)' }}>
          <span className="text-2xl">📭</span>
          <p className="text-[13px]" style={{ color: 'var(--color-ink-muted-48)' }}>
            이 날 일정이 없습니다
          </p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// 공통 NavBar
// ════════════════════════════════════════════════════
function NavBar({
  label, onPrev, onNext, onToday, compact = false,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <button
        onClick={onPrev}
        className="w-8 h-8 flex items-center justify-center rounded-full active:bg-[rgba(0,132,204,0.08)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <div className="flex items-center gap-1.5">
        <span style={{
          fontSize: compact ? '13px' : '15px',
          fontWeight: 600,
          color: 'var(--color-ink)',
          letterSpacing: '-0.2px',
        }}>
          {label}
        </span>
        <button
          onClick={onToday}
          className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: 'rgba(0,132,204,0.1)', color: 'var(--color-primary)' }}
        >
          오늘
        </button>
      </div>

      <button
        onClick={onNext}
        className="w-8 h-8 flex items-center justify-center rounded-full active:bg-[rgba(0,132,204,0.08)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
