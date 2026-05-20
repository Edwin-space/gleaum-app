'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScheduleCard } from '@/components/ui/Card';
import type { Schedule, ScheduleType } from '@/types';

interface MobileSchedulesProps {
  loading: boolean;
  grouped: Record<string, Schedule[]>;
  todaySchedules: Schedule[];
  filter: 'all' | ScheduleType;
  setFilter: (f: 'all' | ScheduleType) => void;
  search: string;
  setSearch: (s: string) => void;
  filters: { key: 'all' | ScheduleType; label: string }[];
}

export function MobileSchedules({
  loading,
  grouped,
  todaySchedules,
  filter,
  setFilter,
  search,
  setSearch,
  filters
}: MobileSchedulesProps) {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div
      className="min-h-dvh"
      style={{
        background: '#FAFAFD',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
      }}
    >
      {/* ── 스티키 헤더 ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '48px 20px 16px',
          background: 'rgba(250,250,253,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#8E8E93',
              margin: '0 0 2px',
              letterSpacing: '0.2px',
            }}>
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 900,
              color: '#1A1B2E',
              margin: 0,
              letterSpacing: '-0.5px',
            }}>
              나의 일정
            </h1>
          </div>
          <button
            onClick={() => router.push('/schedules/new')}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 20px rgba(0,132,204,0.35)',
              cursor: 'pointer',
              transition: 'transform 0.15s',
              flexShrink: 0,
            }}
            onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.90)')}
            onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── 히어로: 오늘 요약 ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div
          style={{
            position: 'relative',
            padding: '24px',
            borderRadius: '28px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
            boxShadow: '0 12px 40px rgba(26,27,46,0.30)',
          }}
        >
          {/* Glow blobs */}
          <div style={{
            position: 'absolute',
            top: '-24px',
            right: '-24px',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,132,204,0.35) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '20%',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(12,201,181,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 10 }}>
            <p style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.55)',
              margin: '0 0 6px',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
            }}>
              Today&apos;s Focus
            </p>

            {!loading && todaySchedules.length === 0 ? (
              <>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: '0 0 14px', letterSpacing: '-0.3px' }}>
                  오늘 일정이 없어요 ☀️
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, margin: '0 0 14px' }}>
                  여유로운 하루를 즐기거나<br />새 일정을 추가해보세요
                </p>
                <span style={{
                  display: 'inline-block',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.10)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.70)',
                }}>
                  오늘 0개
                </span>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: '0 0 14px', letterSpacing: '-0.3px' }}>
                  오늘 {todaySchedules.length}개의 일정이 있어요
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.15)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'white',
                  }}>
                    오늘 {todaySchedules.length}개
                  </span>
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '999px',
                    background: 'rgba(46,232,149,0.20)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#2EE895',
                  }}>
                    완료 {todaySchedules.filter(s => s.status === 'completed').length}개
                  </span>
                  <span style={{
                    padding: '5px 14px',
                    borderRadius: '999px',
                    background: 'rgba(0,132,204,0.25)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#60CFFF',
                  }}>
                    예정 {todaySchedules.filter(s => s.status !== 'completed').length}개
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 검색 및 필터 ── */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 검색바 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 16px',
            height: '52px',
            borderRadius: '16px',
            background: 'white',
            border: searchFocused ? '1.5px solid #0CC9B5' : '1.5px solid rgba(0,0,0,0.06)',
            boxShadow: searchFocused
              ? '0 0 0 3px rgba(12,201,181,0.12), 0 4px 16px rgba(0,0,0,0.08)'
              : '0 2px 12px rgba(0,0,0,0.06)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={searchFocused ? '#0CC9B5' : '#8E8E93'}
            strokeWidth="2.5"
            style={{ transition: 'stroke 0.2s', flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="7"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="일정 검색..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontWeight: 500,
              color: '#1A1B2E',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: '#C7C7CC',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* 필터 칩 */}
        <div
          className="no-scrollbar"
          style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}
        >
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                flexShrink: 0,
                padding: '8px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: filter === f.key
                  ? 'linear-gradient(135deg, #0084CC 0%, #0CC9B5 100%)'
                  : 'white',
                color: filter === f.key ? 'white' : '#8E8E93',
                boxShadow: filter === f.key
                  ? '0 6px 16px rgba(0,132,204,0.30)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid #0084CC',
            borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── 일정 목록 (그룹화) ── */}
      {!loading && (
        <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.keys(grouped).length > 0 ? (
            Object.entries(grouped).map(([date, items]) => (
              <section key={date}>
                {/* Date group header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '14px',
                }}>
                  <h2 style={{
                    fontSize: '17px',
                    fontWeight: 900,
                    color: '#1A1B2E',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.3px',
                  }}>
                    {date}
                  </h2>
                  <div style={{
                    height: '1px',
                    flex: 1,
                    background: 'rgba(0,0,0,0.06)',
                  }} />
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#8E8E93',
                    background: '#F0F0F3',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    flexShrink: 0,
                  }}>
                    {items.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map((s) => (
                    <ScheduleCard
                      key={s.id}
                      schedule={s}
                      onClick={() => router.push(`/schedules/${s.id}`)}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            /* Empty state */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '80px 20px',
              gap: '16px',
              textAlign: 'center',
            }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(12,201,181,0.10) 0%, rgba(0,132,204,0.10) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="3"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>
                표시할 일정이 없습니다
              </p>
              <p style={{ fontSize: '13px', color: '#8E8E93', margin: 0 }}>
                새 일정을 추가해보세요
              </p>
              <Link
                href="/schedules/new"
                style={{
                  marginTop: '8px',
                  padding: '14px 32px',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'white',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                  boxShadow: '0 8px 20px rgba(0,132,204,0.30)',
                  display: 'inline-block',
                }}
              >
                첫 일정 만들기
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
