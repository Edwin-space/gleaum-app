'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BottomNav } from '@/components/layout/BottomNav';
import { GleaumLogo } from '@/components/ui/GleaumLogo';
import { ScheduleCard } from '@/components/ui/Card';
import { CalendarView } from '@/components/calendar/CalendarView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { formatDateShort, isSameDay } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const { user, familyGroupId, loading: userLoading } = useCurrentUser();
  const { schedules, loading: schedulesLoading } = useSchedules(familyGroupId);

  const loading = userLoading || schedulesLoading;

  const todaySchedules = schedules.filter((s) => isSameDay(s.startTime, selectedDate));
  const childSchedules = schedules.filter((s) => s.type === 'child' && isSameDay(s.startTime, new Date()));
  const completedToday  = childSchedules.filter((s) => s.status === 'completed').length;
  const pendingToday    = childSchedules.filter((s) => s.status === 'pending' || s.status === 'in_progress').length;
  const missedToday     = childSchedules.filter((s) => s.status === 'missed').length;
  const totalChild      = childSchedules.length;
  const progressPct     = totalChild > 0 ? Math.round((completedToday / totalChild) * 100) : 0;
  // SVG 원형 프로그레스: r=30, circumference=188.5
  const circumference   = 188.5;
  const dashOffset      = circumference - (circumference * progressPct) / 100;

  const viewLabels = { month: '월간', week: '주간', day: '일간' } as const;

  return (
    <div className="min-h-dvh pb-36">

      {/* ── 헤더 (인라인 — Figma 스타일) ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 pt-12 pb-4"
        style={{ background: 'transparent' }}>
        <div>
          <GleaumLogo variant="light" size="sm" showTagline={true} />
        </div>
        <Link href="/notifications"
          className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(0,132,204,0.1)', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,132,204,0.12)' }}>
          <span className="text-2xl">{user?.avatar ?? '👤'}</span>
        </Link>
      </header>

      <div className="px-5 space-y-6">

        {/* ── 뷰 토글 Pill ── */}
        <div className="flex bg-white rounded-full p-1.5 shadow-card">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex-1 py-2.5 rounded-full text-[14px] font-bold transition-all"
              style={{
                background: view === v ? '#0084CC' : 'transparent',
                color:      view === v ? 'white'   : '#8E8E93',
                boxShadow:  view === v ? '0 4px 12px rgba(0,132,204,0.3)' : 'none',
              }}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>

        {/* ── 캘린더 ── */}
        <div className="bg-white rounded-[24px] p-4 shadow-card">
          <CalendarView
            schedules={schedules}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* ── 로딩 ── */}
        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#0084CC', borderTopColor: 'transparent' }} />
          </div>
        )}

        {/* ── 자녀 일정 요약 카드 (원형 프로그레스) ── */}
        {!loading && totalChild > 0 && (
          <Link href="/schedules/children"
            className="flex items-center justify-between rounded-[24px] p-6 text-white active:scale-[0.98] transition-transform"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 8px 24px rgba(12,201,181,0.35)' }}>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight mb-1">오늘 자녀 일정 →</h2>
              <p className="text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {pendingToday > 0 && `진행중 ${pendingToday}건`}
                {pendingToday > 0 && completedToday > 0 && ' · '}
                {completedToday > 0 && `완료 ${completedToday}건`}
                {missedToday > 0 && ` · 미완료 ${missedToday}건`}
              </p>
            </div>
            {/* 원형 프로그레스 */}
            <div className="relative w-[68px] h-[68px] flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 68 68">
                <circle cx="34" cy="34" r="30" stroke="rgba(255,255,255,0.2)"
                  strokeWidth="6" fill="none" />
                <circle cx="34" cy="34" r="30" stroke="white"
                  strokeWidth="6" fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-[15px]">
                {progressPct}%
              </div>
            </div>
          </Link>
        )}

        {/* ── 선택일 일정 목록 ── */}
        {!loading && (
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
                {formatDateShort(selectedDate)} 일정
              </h3>
              <span className="text-[13px] font-bold" style={{ color: '#8E8E93' }}>
                총 {todaySchedules.length}개
              </span>
            </div>

            {todaySchedules.length > 0 ? (
              <div className="space-y-3">
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
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  style={{ background: 'rgba(0,132,204,0.1)' }}>
                  📭
                </div>
                <p className="font-semibold" style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  등록된 일정이 없습니다
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
