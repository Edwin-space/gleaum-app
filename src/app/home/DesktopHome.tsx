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

  const todaySchedules = schedules.filter(s => isSameDay(s.startTime, selectedDate));
  const childSchedules = schedules.filter(s => s.type === 'child' && isSameDay(s.startTime, new Date()));
  const completedToday = childSchedules.filter(s => s.status === 'completed').length;
  const pendingToday   = childSchedules.filter(s => s.status === 'pending' || s.status === 'in_progress').length;
  const missedToday    = childSchedules.filter(s => s.status === 'missed').length;
  const totalChild     = childSchedules.length;
  const progressPct    = totalChild > 0 ? Math.round((completedToday / totalChild) * 100) : 0;
  const circumference  = 188.5;
  const dashOffset     = circumference - (circumference * progressPct) / 100;

  const viewLabels = { month: '월간', week: '주간', day: '일간' } as const;
  const preferences = (profile?.preferences ?? {}) as Partial<OnboardingPreferences>;
  const homeLayout = (preferences.homeLayout ?? 'balanced') as HomeLayoutPreference;
  const primaryGoal = preferences.primaryGoal;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '좋은 오후예요' : '좋은 저녁이에요';
  const displayName = user?.displayName ?? user?.name ?? '사용자';

  const homeCopy: Record<HomeLayoutPreference, { title: string; body: string }> = {
    balanced:      { title: '오늘의 균형을 맞춰볼까요?',      body: '일정, 루틴, 자금, Space 소식을 한 화면에서 확인하세요.' },
    calendar_first:{ title: '오늘 일정부터 선명하게 볼게요.',  body: '가장 가까운 약속과 캘린더 흐름을 우선으로 보여드립니다.' },
    routine_first: { title: '완료해야 할 루틴을 먼저 챙길게요.', body: '반복되는 습관과 완료 확인이 필요한 일을 놓치지 않게 도와드립니다.' },
    expense_first: { title: '다가오는 지출 흐름을 먼저 볼게요.', body: '정기결제와 공동비용 알림을 중심으로 홈을 구성합니다.' },
    space_first:   { title: 'Space를 먼저 볼게요.',           body: '친구, 연인과 연결된 공간의 일정과 자금 흐름을 우선합니다.' },
  };
  const personalCopy = homeCopy[homeLayout];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── 웰컴 히어로 ── */}
      <div style={{
        position: 'relative',
        padding: '36px 44px',
        borderRadius: '32px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
        marginBottom: '28px',
        boxShadow: '0 16px 48px rgba(26,27,46,0.22)',
        color: 'white',
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'rgba(0,132,204,0.18)', filter: 'blur(70px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '25%', width: '180px', height: '180px', background: 'rgba(12,201,181,0.14)', filter: 'blur(55px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', right: '25%', width: '120px', height: '120px', background: 'rgba(46,232,149,0.10)', filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', letterSpacing: '0.04em' }}>{greeting} 👋</p>
            <h1 style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.5px', margin: '0 0 8px' }}>
              {displayName}님, 오늘도 함께해요.
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, margin: 0 }}>
              {now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', padding: '16px 20px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', minWidth: '80px' }}>
              <p style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 4px', color: '#0CC9B5' }}>{schedules.filter(s => isSameDay(s.startTime, now)).length}</p>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>오늘 일정</p>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 20px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', minWidth: '80px' }}>
              <p style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 4px', color: '#2EE895' }}>{schedules.length}</p>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>전체 일정</p>
            </div>
            <Link href="/schedules/new" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '16px 24px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #0CC9B5, #0084CC)',
              color: 'white', textDecoration: 'none',
              fontSize: '14px', fontWeight: 800,
              boxShadow: '0 8px 24px rgba(0,132,204,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              일정 추가
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2-컬럼 메인 레이아웃 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '24px' }}>

        {/* 왼쪽: 캘린더 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 뷰 토글 */}
          <div style={{
            display: 'flex', background: 'var(--theme-surface)', borderRadius: '18px',
            padding: '5px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
          }}>
            {(['month', 'week', 'day'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: '13px',
                  fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: view === v ? '#1A1B2E' : 'transparent',
                  color: view === v ? 'white' : '#8E8E93',
                  boxShadow: view === v ? '0 4px 12px rgba(26,27,46,0.2)' : 'none',
                  transition: 'all 0.2s',
                }}
              >{viewLabels[v]}</button>
            ))}
          </div>

          {/* 캘린더 카드 */}
          <div style={{
            background: 'var(--theme-surface)', borderRadius: '24px',
            overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.04)',
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

        {/* 오른쪽: 요약 + 일정 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 개인화 메시지 카드 */}
          {!loading && profile?.onboarding_completed_at && (
            <div style={{
              background: 'var(--theme-surface)', borderRadius: '24px', padding: '22px 24px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: '#0CC9B5', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>PERSONAL HOME</p>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.3, color: 'var(--theme-text)', margin: '0 0 6px' }}>
                    {personalCopy.title}
                  </h2>
                  <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--theme-text-subtle)', fontWeight: 600, margin: 0 }}>
                    {personalCopy.body}
                  </p>
                </div>
                <span style={{
                  padding: '5px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 800,
                  background: '#F5F5F9', color: 'var(--theme-text-subtle)', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {primaryGoal ? '개인화됨' : '기본형'}
                </span>
              </div>
              <div style={{ marginTop: '16px', height: '4px', borderRadius: '999px', background: 'rgba(0,132,204,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', width: '68%', background: 'linear-gradient(90deg, #0CC9B5, #0084CC)', transition: 'width 0.8s ease' }} />
              </div>
            </div>
          )}

          {/* 자녀 일정 요약 */}
          {!loading && totalChild > 0 && (
            <Link href="/schedules/children" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderRadius: '24px', padding: '22px 24px', color: 'white', textDecoration: 'none',
              background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
              boxShadow: '0 8px 28px rgba(0,132,204,0.3)', transition: 'transform 0.2s, box-shadow 0.2s',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', margin: '0 0 4px' }}>오늘 자녀 일정</h2>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                  {pendingToday > 0 && `진행중 ${pendingToday}건`}
                  {pendingToday > 0 && completedToday > 0 && ' · '}
                  {completedToday > 0 && `완료 ${completedToday}건`}
                  {missedToday > 0 && ` · 미완료 ${missedToday}건`}
                </p>
              </div>
              <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" stroke="rgba(255,255,255,0.2)" strokeWidth="5" fill="none" />
                  <circle cx="30" cy="30" r="26" stroke="white" strokeWidth="5" fill="none"
                    strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                  {progressPct}%
                </div>
              </div>
            </Link>
          )}

          {/* 로딩 */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid rgba(12,201,181,0.2)', borderTopColor: '#0CC9B5', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}

          {/* 선택일 일정 목록 */}
          {!loading && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', padding: '0 2px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--theme-text)', margin: 0 }}>
                  {formatDateShort(selectedDate)} 일정
                </h3>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text-subtle)' }}>총 {todaySchedules.length}개</span>
              </div>

              {todaySchedules.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {todaySchedules.map(schedule => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onClick={() => router.push(`/schedules/${schedule.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '48px 20px', gap: '12px',
                  background: 'var(--theme-surface)', borderRadius: '24px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
                }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,132,204,0.06)' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="1.8" strokeLinecap="round">
                      <rect width="18" height="18" x="3" y="4" rx="2"/>
                      <line x1="16" x2="16" y1="2" y2="6"/>
                      <line x1="8" x2="8" y1="2" y2="6"/>
                      <line x1="3" x2="21" y1="10" y2="10"/>
                    </svg>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--theme-text-subtle)', margin: 0 }}>
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
