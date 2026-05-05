'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BottomNav } from '@/components/layout/BottomNav';
import { GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { ScheduleCard } from '@/components/ui/Card';
import { CalendarView } from '@/components/calendar/CalendarView';
import { formatDateShort, isSameDay } from '@/lib/utils';
import type { Schedule } from '@/types';
import type { ProfileRow } from '@/lib/db';
import type { OnboardingPreferences, User } from '@/types';

interface MobileHomeProps {
  user: User | null;
  profile: ProfileRow | null;
  schedules: Schedule[];
  loading: boolean;
}

export default function MobileHome({ user, profile, schedules, loading }: MobileHomeProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = new Date();
  const todaySchedules = schedules.filter((s) => isSameDay(s.startTime, selectedDate));
  const isToday = isSameDay(selectedDate, today);

  // 오늘 통계
  const todayAll = schedules.filter((s) => isSameDay(s.startTime, today));
  const completedCount = todayAll.filter((s) => s.status === 'completed').length;
  const pendingCount = todayAll.filter((s) => s.status === 'pending' || s.status === 'in_progress').length;
  const totalToday = todayAll.length;

  // 다가오는 일정 (오늘 이후, 최대 3개)
  const upcoming = schedules
    .filter((s) => s.startTime > today && s.status !== 'completed')
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 3);

  // 개인화 인사
  const preferences = (profile?.preferences ?? {}) as Partial<OnboardingPreferences>;
  const displayName = user?.displayName ?? user?.name ?? '사용자';
  const hour = today.getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '좋은 오후예요' : '좋은 저녁이에요';

  return (
    <div className="min-h-dvh pb-32" style={{ background: 'transparent' }}>

      {/* ── 헤더 ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '48px 20px 16px',
        background: 'transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GleaumAppIcon size={32} radius={10} />
            <span style={{
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-display)',
            }}>gleaum</span>
          </div>
          <Link href="/notifications" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.7)',
            fontSize: '20px',
            textDecoration: 'none',
          }}>
            {user?.avatar ?? '👤'}
          </Link>
        </div>
      </header>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── 인사 + 오늘 요약 카드 ── */}
        <div className="glass-card" style={{
          borderRadius: '24px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 장식 그라디언트 */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'var(--brand-gradient)',
            opacity: 0.08,
            pointerEvents: 'none',
          }} />

          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-teal)', marginBottom: '4px' }}>
            {greeting}
          </p>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--color-ink)',
            letterSpacing: '-0.5px',
            margin: '0 0 16px',
          }}>
            {displayName}님
          </h1>

          {/* 오늘 통계 */}
          {!loading && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}>
              <div style={{
                textAlign: 'center',
                padding: '12px 8px',
                borderRadius: '16px',
                background: 'rgba(0,132,204,0.06)',
              }}>
                <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-blue)', margin: 0 }}>
                  {totalToday}
                </p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted-80)', margin: '2px 0 0' }}>
                  오늘 전체
                </p>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '12px 8px',
                borderRadius: '16px',
                background: 'rgba(46,232,149,0.06)',
              }}>
                <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-green)', margin: 0 }}>
                  {completedCount}
                </p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted-80)', margin: '2px 0 0' }}>
                  완료
                </p>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '12px 8px',
                borderRadius: '16px',
                background: 'rgba(12,201,181,0.06)',
              }}>
                <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-teal)', margin: 0 }}>
                  {pendingCount}
                </p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted-80)', margin: '2px 0 0' }}>
                  남은 일정
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── 캘린더 토글 ── */}
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="glass-card"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2.5" strokeLinecap="round">
              <rect width="18" height="18" x="3" y="4" rx="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)' }}>
              {formatDateShort(selectedDate)}
            </span>
            {isToday && (
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'var(--brand-gradient)',
                color: 'white',
              }}>TODAY</span>
            )}
          </div>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-ink-muted-48)" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: calendarOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        {/* ── 캘린더 (접기/펼치기) ── */}
        {calendarOpen && (
          <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden', padding: '16px' }}>
            <CalendarView
              schedules={schedules}
              selectedDate={selectedDate}
              onSelectDate={(d) => { setSelectedDate(d); }}
              view="month"
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
              color: 'var(--color-ink)',
              letterSpacing: '-0.3px',
              margin: 0,
            }}>
              {formatDateShort(selectedDate)} 일정
            </h2>
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--brand-blue)',
            }}>
              {todaySchedules.length}개
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--brand-teal)', borderTopColor: 'transparent' }} />
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
            <div className="glass-card" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 20px',
              gap: '12px',
              borderRadius: '24px',
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round">
                  <rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
              </div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink-muted-80)', margin: 0 }}>
                등록된 일정이 없어요
              </p>
              <Link href="/schedules/new" style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--brand-blue)',
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
                color: 'var(--color-ink)',
                letterSpacing: '-0.3px',
                margin: 0,
              }}>
                다가오는 일정
              </h2>
              <Link href="/schedules" style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-ink-muted-48)',
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
                  className="glass-card"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.5)',
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
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand-blue)', lineHeight: 1 }}>
                      {s.startTime.getMonth() + 1}월
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1.1 }}>
                      {s.startTime.getDate()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-muted-80)', margin: '2px 0 0' }}>
                      {formatDateShort(s.startTime)}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-muted-48)" strokeWidth="2.5">
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
          <Link href="/schedules/new" className="glass-card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '20px 16px',
            borderRadius: '20px',
            textDecoration: 'none',
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>새 일정</span>
          </Link>

          <Link href="/budget" className="glass-card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '20px 16px',
            borderRadius: '20px',
            textDecoration: 'none',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(12,201,181,0.08)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-teal)" strokeWidth="2.5" strokeLinecap="round">
                <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>가계부</span>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
