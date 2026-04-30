'use client';

import { useState } from 'react';
import { getDaysInMonth, isSameDay, formatMonthYear, getScheduleTypeColor } from '@/lib/utils';
import type { Schedule } from '@/types';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

interface CalendarViewProps {
  schedules: Schedule[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function CalendarView({ schedules, selectedDate, onSelectDate }: CalendarViewProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const currentMonth = viewDate.getMonth();

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const goToday   = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(today);
  };

  // 날짜별 일정 유형 추출 (최대 3개 점)
  const getDotsForDay = (date: Date) => {
    const daySchedules = schedules.filter((s) => isSameDay(s.startTime, date));
    const types = [...new Set(daySchedules.map((s) => s.type))].slice(0, 3);
    return types;
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* 월 네비게이터 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>
            {formatMonthYear(viewDate)}
          </h2>
          <button
            onClick={goToday}
            className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(0,132,204,0.1)', color: 'var(--color-primary)' }}
          >
            오늘
          </button>
        </div>

        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 px-2">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className="text-center py-1 text-[11px] font-semibold"
            style={{ color: i === 5 ? '#0084CC' : i === 6 ? '#EF4444' : 'var(--color-ink-muted-48)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 px-2 pb-3">
        {days.map((date, idx) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday        = isSameDay(date, today);
          const isSelected     = isSameDay(date, selectedDate);
          const dots           = getDotsForDay(date);
          const dow            = idx % 7; // 0=월

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
                className="w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium"
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
              {/* 일정 도트 */}
              <div className="flex gap-0.5 mt-0.5 h-1.5">
                {dots.map((type, di) => (
                  <span
                    key={di}
                    className="w-1 h-1 rounded-full"
                    style={{ background: getScheduleTypeColor(type) }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
