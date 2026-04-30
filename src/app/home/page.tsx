'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { ScheduleCard } from '@/components/ui/Card';
import { CalendarView } from '@/components/calendar/CalendarView';
import { sampleSchedules } from '@/lib/sampleData';
import { formatDateShort, isSameDay } from '@/lib/utils';
import type { Schedule } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const todaySchedules = sampleSchedules.filter(
    (s) => isSameDay(s.startTime, selectedDate)
  );

  const pendingChildSchedules = sampleSchedules.filter(
    (s) => s.type === 'child' && (s.status === 'pending' || s.status === 'in_progress')
      && isSameDay(s.startTime, new Date())
  );
  const completedToday = sampleSchedules.filter(
    (s) => s.type === 'child' && s.status === 'completed' && isSameDay(s.startTime, new Date())
  ).length;
  const missedToday = sampleSchedules.filter(
    (s) => s.type === 'child' && s.status === 'missed' && isSameDay(s.startTime, new Date())
  ).length;

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader showNotification notificationCount={2} />

      {/* 뷰 토글 */}
      <div className="flex px-4 pt-3 pb-0 gap-1">
        {(['month', 'week', 'day'] as const).map((v) => {
          const labels = { month: '월간', week: '주간', day: '일간' };
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex-1 py-2 text-[13px] font-medium rounded-xl transition-all"
              style={{
                background: view === v ? 'var(--color-primary)' : 'transparent',
                color: view === v ? 'white' : 'var(--color-ink-muted-48)',
              }}
            >
              {labels[v]}
            </button>
          );
        })}
      </div>

      {/* 캘린더 */}
      <div className="px-4 py-3">
        <CalendarView
          schedules={sampleSchedules}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* 자녀 일정 요약 (오늘) */}
      {(pendingChildSchedules.length > 0 || missedToday > 0) && (
        <Link href="/schedules/children" className="mx-4 mb-3 px-4 py-3 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform"
          style={{ background: 'rgba(46,232,149,0.08)', border: '1px solid rgba(46,232,149,0.2)' }}>
          <span style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '13px', color: 'var(--color-ink-muted-48)' }}>
            오늘 자녀 일정 →
          </span>
          <div className="flex gap-3">
            {completedToday > 0 && (
              <span className="text-[12px] font-semibold" style={{ color: 'var(--color-status-done)' }}>
                완료 {completedToday}건
              </span>
            )}
            {missedToday > 0 && (
              <span className="text-[12px] font-semibold" style={{ color: 'var(--color-status-missed)' }}>
                미완료 {missedToday}건
              </span>
            )}
            {pendingChildSchedules.length > 0 && (
              <span className="text-[12px] font-semibold" style={{ color: 'var(--color-status-progress)' }}>
                진행중 {pendingChildSchedules.length}건
              </span>
            )}
          </div>
        </Link>
      )}

      {/* 선택일 일정 목록 */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--color-ink)' }}>
            {formatDateShort(selectedDate)} 일정
          </h2>
          <span className="text-[12px]" style={{ color: 'var(--color-ink-muted-48)' }}>
            총 {todaySchedules.length}개
          </span>
        </div>

        {todaySchedules.length > 0 ? (
          <div className="space-y-2">
            {todaySchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onClick={() => router.push(`/schedules/${schedule.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <span className="text-4xl">📭</span>
            <p style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>
              등록된 일정이 없습니다
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
