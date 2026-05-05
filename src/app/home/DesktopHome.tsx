'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ScheduleCard } from '@/components/ui/Card';
import { CalendarView } from '@/components/calendar/CalendarView';
import { formatDateShort, isSameDay } from '@/lib/utils';
import type { Schedule, HomeLayoutPreference, OnboardingPreferences } from '@/types';
import type { ProfileRow } from '@/lib/db';
import type { User } from '@/types';

interface DesktopHomeProps {
  user: User | null;
  profile: ProfileRow | null;
  schedules: Schedule[];
  loading: boolean;
}

export default function DesktopHome({ user, profile, schedules, loading }: DesktopHomeProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

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
  const homeLayout = (preferences.homeLayout ?? 'balanced') as HomeLayoutPreference;
  const primaryGoal = preferences.primaryGoal;

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
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '32px' }}>

        {/* 왼쪽: 캘린더 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 뷰 토글 */}
          <div className="glass-card" style={{ display: 'flex', borderRadius: '999px', padding: '6px' }}>
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '999px',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: view === v ? 'var(--color-ink)' : 'transparent',
                  color: view === v ? 'white' : 'var(--color-ink-muted-80)',
                  boxShadow: view === v ? '0 4px 12px rgba(26,27,46,0.2)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {viewLabels[v]}
              </button>
            ))}
          </div>

          {/* 캘린더 */}
          <div className="glass-card" style={{
            borderRadius: '24px',
            overflow: 'hidden',
            padding: view === 'month' ? '16px' : '0 0 8px 0',
          }}>
            <CalendarView
              schedules={schedules}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              view={view}
            />
          </div>
        </div>

        {/* 오른쪽: 메시지 + 일정 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 개인화 메시지 */}
          {!loading && profile?.onboarding_completed_at && (
            <div className="glass-card" style={{ borderRadius: '24px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-teal)', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    PERSONAL HOME
                  </p>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.3, color: 'var(--color-ink)', margin: '0 0 8px' }}>
                    {user?.displayName ?? user?.name ?? '나'}님, {personalCopy.title}
                  </h2>
                  <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--color-ink-muted-80)', margin: 0 }}>
                    {personalCopy.body}
                  </p>
                </div>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  background: 'rgba(255,255,255,0.72)',
                  color: 'var(--color-ink)',
                }}>
                  {primaryGoal ? '개인화됨' : '기본형'}
                </span>
              </div>
              <div style={{ marginTop: '16px', height: '6px', borderRadius: '999px', background: 'rgba(0,132,204,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', width: '68%', background: personalCopy.accent }} />
              </div>
            </div>
          )}

          {/* 로딩 */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--brand-teal)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {/* 자녀 일정 요약 */}
          {!loading && totalChild > 0 && (
            <Link href="/schedules/children" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '24px',
              padding: '24px',
              color: 'white',
              textDecoration: 'none',
              background: 'var(--brand-gradient)',
              boxShadow: '0 8px 32px rgba(12,201,181,0.35)',
              transition: 'transform 0.2s',
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', margin: '0 0 4px' }}>오늘 자녀 일정</h2>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                  {pendingToday > 0 && `진행중 ${pendingToday}건`}
                  {pendingToday > 0 && completedToday > 0 && ' · '}
                  {completedToday > 0 && `완료 ${completedToday}건`}
                  {missedToday > 0 && ` · 미완료 ${missedToday}건`}
                </p>
              </div>
              <div style={{ position: 'relative', width: '68px', height: '68px', flexShrink: 0 }}>
                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 68 68">
                  <circle cx="34" cy="34" r="30" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                  <circle cx="34" cy="34" r="30" stroke="white" strokeWidth="6" fill="none"
                    strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px' }}>
                  {progressPct}%
                </div>
              </div>
            </Link>
          )}

          {/* 선택일 일정 목록 */}
          {!loading && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 4px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--color-ink)', margin: 0 }}>
                  {formatDateShort(selectedDate)} 일정
                </h3>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink-muted-80)' }}>
                  총 {todaySchedules.length}개
                </span>
              </div>

              {todaySchedules.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {todaySchedules.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onClick={() => router.push(`/schedules/${schedule.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '56px 20px',
                  gap: '12px',
                  borderRadius: '24px',
                }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,132,204,0.08)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round">
                      <rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/>
                      <line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                    </svg>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-ink-muted-80)', margin: 0 }}>
                    등록된 일정이 없습니다
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
