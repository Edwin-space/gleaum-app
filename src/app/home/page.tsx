'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BottomNav } from '@/components/layout/BottomNav';
import { GleaumLogo } from '@/components/ui/GleaumLogo';
import { ScheduleCard } from '@/components/ui/Card';
import { CalendarView } from '@/components/calendar/CalendarView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { formatDateShort, isSameDay } from '@/lib/utils';
import type { HomeLayoutPreference, OnboardingPreferences } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const { user, profile, familyGroupId, loading: userLoading } = useCurrentUser();
  const { schedules, loading: schedulesLoading } = useSchedules(familyGroupId);

  const loading = userLoading || schedulesLoading;

  const todaySchedules = schedules.filter((s) => isSameDay(s.startTime, selectedDate));
  const childSchedules = schedules.filter((s) => s.type === 'child' && isSameDay(s.startTime, new Date()));
  const completedToday  = childSchedules.filter((s) => s.status === 'completed').length;
  const pendingToday    = childSchedules.filter((s) => s.status === 'pending' || s.status === 'in_progress').length;
  const missedToday     = childSchedules.filter((s) => s.status === 'missed').length;
  const totalChild      = childSchedules.length;
  const progressPct     = totalChild > 0 ? Math.round((completedToday / totalChild) * 100) : 0;
  const circumference   = 188.5;
  const dashOffset      = circumference - (circumference * progressPct) / 100;

  const viewLabels = { month: '월간', week: '주간', day: '일간' } as const;
  const preferences = (profile?.preferences ?? {}) as Partial<OnboardingPreferences>;
  const homeLayout = preferences.homeLayout ?? 'balanced';
  const primaryGoal = preferences.primaryGoal;

  useEffect(() => {
    if (!profile) return;
    if ('onboarding_completed_at' in profile && !profile.onboarding_completed_at) {
      router.replace('/onboarding');
    }
  }, [profile, router]);

  const homeCopy: Record<HomeLayoutPreference, { title: string; body: string; accent: string }> = {
    balanced: {
      title: '오늘의 균형을 맞춰볼까요?',
      body: '일정, 루틴, 자금, Space 소식을 한 화면에서 차분히 확인하세요.',
      accent: 'var(--brand-gradient)',
    },
    calendar_first: {
      title: '오늘 일정부터 선명하게 볼게요.',
      body: '가장 가까운 약속과 캘린더 흐름을 우선으로 보여드립니다.',
      accent: 'var(--brand-blue)',
    },
    routine_first: {
      title: '완료해야 할 루틴을 먼저 챙길게요.',
      body: '반복되는 습관과 완료 확인이 필요한 일을 놓치지 않게 도와드립니다.',
      accent: 'var(--brand-green)',
    },
    expense_first: {
      title: '다가오는 지출 흐름을 먼저 볼게요.',
      body: '정기결제와 공동비용 알림을 중심으로 홈을 구성합니다.',
      accent: '#F59E0B',
    },
    space_first: {
      title: '함께 관리하는 Space를 먼저 볼게요.',
      body: '친구, 연인, 가족과 연결된 일정과 자금 흐름을 우선합니다.',
      accent: 'var(--brand-teal)',
    },
  };
  const personalCopy = homeCopy[homeLayout];

  return (
    <div className="min-h-dvh pb-36">

      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 pt-12 pb-4"
        style={{ background: 'transparent' }}>
        <GleaumLogo variant="light" size="sm" showTagline={true} />
        <Link href="/notifications"
          className="w-11 h-11 glass-card rounded-full flex items-center justify-center overflow-hidden"
          style={{ border: '1.5px solid rgba(255,255,255,0.7)' }}>
          <span className="text-xl">{user?.avatar ?? '👤'}</span>
        </Link>
      </header>

      <div className="px-5 space-y-5">

        {/* ── 뷰 토글 Pill ── */}
        <div className="glass-card flex rounded-full p-1.5">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex-1 py-2.5 rounded-full text-[14px] font-bold transition-all"
              style={{
                background: view === v ? 'var(--color-ink)' : 'transparent',
                color:      view === v ? 'white' : 'var(--color-ink-muted-80)',
                boxShadow:  view === v ? '0 4px 12px rgba(26,27,46,0.2)' : 'none',
              }}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>

        {/* ── 캘린더 ── */}
        <div className="glass-card rounded-[24px] p-4">
          <CalendarView
            schedules={schedules}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {!loading && profile?.onboarding_completed_at && (
          <div className="glass-card rounded-[24px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold mb-2" style={{ color: 'var(--brand-teal)', letterSpacing: '0.08em' }}>
                  PERSONAL HOME
                </p>
                <h2 className="text-[20px] font-bold leading-tight mb-2" style={{ color: 'var(--color-ink)' }}>
                  {user?.displayName ?? user?.name ?? '나'}님, {personalCopy.title}
                </h2>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-ink-muted-80)' }}>
                  {personalCopy.body}
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap"
                style={{ background: 'rgba(255,255,255,0.72)', color: 'var(--color-ink)' }}>
                {primaryGoal ? '개인화됨' : '기본형'}
              </span>
            </div>
            <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,132,204,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: '68%', background: personalCopy.accent }} />
            </div>
          </div>
        )}

        {/* ── 로딩 ── */}
        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--brand-teal)', borderTopColor: 'transparent' }} />
          </div>
        )}

        {/* ── 자녀 일정 요약 카드 (원형 프로그레스) ── */}
        {!loading && totalChild > 0 && (
          <Link href="/schedules/children"
            className="flex items-center justify-between rounded-[24px] p-6 text-white active:scale-[0.98] transition-transform"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 8px 32px rgba(12,201,181,0.35)' }}>
            <div>
              <h2 className="text-[20px] font-bold tracking-tight mb-1">오늘 자녀 일정 →</h2>
              <p className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {pendingToday > 0 && `진행중 ${pendingToday}건`}
                {pendingToday > 0 && completedToday > 0 && ' · '}
                {completedToday > 0 && `완료 ${completedToday}건`}
                {missedToday > 0 && ` · 미완료 ${missedToday}건`}
              </p>
            </div>
            <div className="relative w-[68px] h-[68px] flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 68 68">
                <circle cx="34" cy="34" r="30" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                <circle cx="34" cy="34" r="30" stroke="white" strokeWidth="6" fill="none"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
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
              <span className="text-[13px] font-bold" style={{ color: 'var(--color-ink-muted-80)' }}>
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
              <div className="glass-card flex flex-col items-center justify-center py-14 gap-3 rounded-[24px]">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,132,204,0.08)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                  </svg>
                </div>
                <p className="font-semibold text-[15px]" style={{ color: 'var(--color-ink-muted-80)' }}>
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
