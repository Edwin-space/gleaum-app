'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';
import { trackEvent } from '@/lib/analytics';
import { InlineFeedAd } from '@/components/InlineFeedAd';
import { ScheduleCard } from '@/components/ui/Card';
import { CalendarView } from '@/components/calendar/CalendarView';
import { formatDateShort, isSameDay } from '@/lib/utils';
import type { Schedule } from '@/types';
import type { ProfileRow } from '@/lib/db';
import type { HomeLayoutPreference, OnboardingPreferences, User } from '@/types';

interface MobileHomeProps {
  user: User | null;
  profile: ProfileRow | null;
  schedules: Schedule[];
  loading: boolean;
}

export default function MobileHome({ user, profile, schedules, loading }: MobileHomeProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ── 미결제 고정지출 배지 ──
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const overdueFixedCount = schedules.filter((s) =>
    s.type === 'expense' &&
    s.repeat !== 'none' &&
    s.status !== 'completed' &&
    s.startTime < todayMidnight
  ).length;

  // 개인화 인사 (homeLayout 기반 — DesktopHome과 동일한 copy)
  const preferences = (profile?.preferences ?? {}) as Partial<OnboardingPreferences>;
  const homeLayout = (preferences.homeLayout ?? 'balanced') as HomeLayoutPreference;

  const layoutCopy: Record<HomeLayoutPreference, string> = {
    balanced:       '일정, 루틴, 자금, Space를 한 화면에서 확인하세요.',
    calendar_first: '가장 가까운 약속과 캘린더 흐름을 우선으로 보여드립니다.',
    routine_first:  '반복되는 습관과 완료 확인이 필요한 일을 놓치지 않게 도와드립니다.',
    expense_first:  '정기결제와 공동비용 알림을 중심으로 홈을 구성합니다.',
    space_first:    '친구·연인과 연결된 공간의 일정과 소식을 우선합니다.',
  };

  const [calendarOpen, setCalendarOpen] = useState(() => homeLayout === 'calendar_first');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  const today = useMemo(() => new Date(), []);

  const todaySchedules = useMemo(
    () => schedules.filter((s) => isSameDay(s.startTime, selectedDate)),
    [schedules, selectedDate]
  );
  const isToday = useMemo(() => isSameDay(selectedDate, today), [selectedDate, today]);

  // 오늘 통계
  const { completedCount, pendingCount, totalToday } = useMemo(() => {
    const todayAll = schedules.filter((s) => isSameDay(s.startTime, today));
    return {
      totalToday: todayAll.length,
      completedCount: todayAll.filter((s) => s.status === 'completed').length,
      pendingCount: todayAll.filter((s) => s.status === 'pending' || s.status === 'in_progress').length,
    };
  }, [schedules, today]);

  // 다가오는 일정 (오늘 이후, 최대 3개)
  const upcoming = useMemo(
    () =>
      schedules
        .filter((s) => s.startTime > today && s.status !== 'completed')
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
        .slice(0, 3),
    [schedules, today]
  );

  // 개인화 인사
  const displayName = user?.displayName ?? user?.name ?? '사용자';
  const hour = today.getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '좋은 오후예요' : '좋은 저녁이에요';

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#FAFAFD',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)',
      }}
    >
      {/* ── 헤더 ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: 'calc(env(safe-area-inset-top) + 6px) 20px 10px',
        background: 'rgba(250,250,253,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GleaumLogoImg size={32} />
            <GleaumBI variant="dark" width={88} />
          </div>
          <Link
            href="/notifications"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              textDecoration: 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </Link>
        </div>
      </header>

      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ── 인사 + 오늘 요약 카드 ── */}
        <div style={{
          borderRadius: '28px',
          padding: '28px 24px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
          boxShadow: '0 16px 48px rgba(26,27,46,0.25)',
        }}>
          {/* 장식 글로우 */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,132,204,0.35) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '-20px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(12,201,181,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(12,201,181,0.90)', marginBottom: '4px', margin: '0 0 4px' }}>
              {greeting}
            </p>
            <h1 style={{
              fontSize: '26px',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.5px',
              margin: '0 0 6px',
            }}>
              {displayName}님
            </h1>
            <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.50)', margin: '0 0 16px', lineHeight: 1.5 }}>
              {layoutCopy[homeLayout]}
            </p>

            {/* 오늘 통계 */}
            {!loading && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '12px 8px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: 0 }}>
                    {totalToday}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.50)', margin: '2px 0 0' }}>
                    오늘 전체
                  </p>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '12px 8px',
                  borderRadius: '16px',
                  background: 'rgba(46,232,149,0.12)',
                  border: '1px solid rgba(46,232,149,0.15)',
                }}>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: '#2EE895', margin: 0 }}>
                    {completedCount}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.50)', margin: '2px 0 0' }}>
                    완료
                  </p>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '12px 8px',
                  borderRadius: '16px',
                  background: 'rgba(12,201,181,0.12)',
                  border: '1px solid rgba(12,201,181,0.15)',
                }}>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: '#0CC9B5', margin: 0 }}>
                    {pendingCount}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.50)', margin: '2px 0 0' }}>
                    남은 일정
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 인라인 광고 배너 ── */}
        <InlineFeedAd />

        {/* ── 캘린더 토글 ── */}
        <button
          onClick={() => {
            const next = !calendarOpen;
            setCalendarOpen(next);
            void trackEvent('calendar_toggle', { action: next ? 'open' : 'close' });
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderRadius: '20px',
            border: '1px solid rgba(0,0,0,0.04)',
            cursor: 'pointer',
            background: 'white',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.5" strokeLinecap="round">
              <rect width="18" height="18" x="3" y="4" rx="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1B2E' }}>
              {formatDateShort(selectedDate)}
            </span>
            {isToday && (
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                color: 'white',
              }}>TODAY</span>
            )}
          </div>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: calendarOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {/* ── 캘린더 (접기/펼치기) ── */}
        {calendarOpen && (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            overflow: 'hidden',
            padding: '16px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)',
          }}>
            {/* 뷰 탭 전환 */}
            <div style={{
              display: 'flex',
              background: '#F2F2F7',
              borderRadius: '12px',
              padding: '3px',
              marginBottom: '12px',
              gap: '2px',
            }}>
              {(['month', 'week', 'day'] as const).map((v) => {
                const labels = { month: '월간', week: '주간', day: '일간' };
                const active = calendarView === v;
                return (
                  <button
                    key={v}
                    onClick={() => setCalendarView(v)}
                    style={{
                      flex: 1,
                      height: '32px',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: active ? 800 : 600,
                      color: active ? '#1A1B2E' : '#8E8E93',
                      background: active ? 'white' : 'transparent',
                      cursor: 'pointer',
                      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                      transition: 'all 0.18s',
                    }}
                  >
                    {labels[v]}
                  </button>
                );
              })}
            </div>

            <CalendarView
              schedules={schedules}
              selectedDate={selectedDate}
              onSelectDate={(d) => { setSelectedDate(d); }}
              view={calendarView}
            />
          </div>
        )}

        {/* ── 오늘/선택일 일정 ── */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#1A1B2E',
              letterSpacing: '-0.3px',
              margin: 0,
            }}>
              {formatDateShort(selectedDate)} 일정
            </h2>
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#0084CC',
            }}>
              {todaySchedules.length}개
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2.5px solid #0CC9B5',
                borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          ) : todaySchedules.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todaySchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onClick={() => router.push(`/schedules/${schedule.id}`)}
                />
              ))}
            </div>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '24px',
              border: '1px solid rgba(0,0,0,0.04)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 20px',
              gap: '12px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,132,204,0.06)',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2" strokeLinecap="round">
                  <rect width="18" height="18" x="3" y="4" rx="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
              </div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#6E6E66', margin: 0 }}>
                등록된 일정이 없어요
              </p>
              <Link href="/schedules/new" style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#0084CC',
                textDecoration: 'none',
              }}>
                + 새 일정 추가
              </Link>
            </div>
          )}
        </div>

        {/* ── 다가오는 일정 ── */}
        {!loading && upcoming.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 800,
                color: '#1A1B2E',
                letterSpacing: '-0.3px',
                margin: 0,
              }}>
                다가오는 일정
              </h2>
              <Link href="/schedules" style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#8E8E93',
                textDecoration: 'none',
              }}>
                전체보기
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcoming.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/schedules/${s.id}`)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    border: '1px solid rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,132,204,0.06)',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#0084CC', lineHeight: 1 }}>
                      {s.startTime.getMonth() + 1}월
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', lineHeight: 1.1 }}>
                      {s.startTime.getDate()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6E6E66', margin: '2px 0 0' }}>
                      {formatDateShort(s.startTime)}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 빠른 액션 ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginTop: '4px',
        }}>
          <Link href="/schedules/new" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '20px 16px',
            borderRadius: '20px',
            textDecoration: 'none',
            background: 'white',
            border: '1px solid rgba(0,0,0,0.04)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,132,204,0.08)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" x2="12" y1="5" y2="19"/>
                <line x1="5" x2="19" y1="12" y2="12"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1B2E' }}>새 일정</span>
          </Link>

          <Link href="/budget" style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '20px 16px',
            borderRadius: '20px',
            textDecoration: 'none',
            background: 'white',
            border: overdueFixedCount > 0 ? '1px solid rgba(239,68,68,0.18)' : '1px solid rgba(0,0,0,0.04)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          }}>
            {overdueFixedCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#EF4444',
                color: 'white',
                borderRadius: '999px',
                minWidth: '20px',
                height: '20px',
                fontSize: '10px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
              }}>
                {overdueFixedCount}
              </div>
            )}
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: overdueFixedCount > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(12,201,181,0.08)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={overdueFixedCount > 0 ? '#EF4444' : '#0CC9B5'} strokeWidth="2.5" strokeLinecap="round">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1B2E' }}>가계부</span>
            {overdueFixedCount > 0 && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444', marginTop: '-4px' }}>미결제 {overdueFixedCount}건</span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
