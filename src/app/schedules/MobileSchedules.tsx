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
    <div className="min-h-dvh pb-24 relative">
      {/* ── [MOBILE] 스티키 헤더 ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '48px 20px 16px',
          background: 'rgba(245,245,249,0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,132,204,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93', marginBottom: '2px', letterSpacing: '0.2px' }}>
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1A1B2E', margin: 0, letterSpacing: '-0.5px' }}>
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
            }}
            onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.90)')}
            onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── [MOBILE] 히어로 섹션: 오늘 요약 ── */}
      <div className="px-5 pt-5 pb-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
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
            position: 'absolute', top: '-24px', right: '-24px',
            width: '140px', height: '140px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,132,204,0.35) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20px', left: '20%',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(12,201,181,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 10 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: '6px', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              Today&apos;s Focus
            </p>

            {!loading && todaySchedules.length === 0 ? (
              <>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '14px', letterSpacing: '-0.3px' }}>
                  오늘 일정이 없어요 ☀️
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: '14px' }}>
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
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '14px', letterSpacing: '-0.3px' }}>
                  오늘 {todaySchedules.length}개의 일정이 있어요
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '5px 14px', borderRadius: '999px',
                    background: 'rgba(255,255,255,0.15)',
                    fontSize: '12px', fontWeight: 700, color: 'white',
                  }}>
                    오늘 {todaySchedules.length}개
                  </span>
                  <span style={{
                    padding: '5px 14px', borderRadius: '999px',
                    background: 'rgba(46,232,149,0.20)',
                    fontSize: '12px', fontWeight: 700, color: '#2EE895',
                  }}>
                    완료 {todaySchedules.filter(s => s.status === 'completed').length}개
                  </span>
                  <span style={{
                    padding: '5px 14px', borderRadius: '999px',
                    background: 'rgba(0,132,204,0.25)',
                    fontSize: '12px', fontWeight: 700, color: '#60CFFF',
                  }}>
                    예정 {todaySchedules.filter(s => s.status !== 'completed').length}개
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 검색 및 필터 통합 영역 ── */}
      <div className="px-5 mb-8 mt-5 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? '#0CC9B5' : '#8E8E93'} strokeWidth="2.5" style={{ transition: 'stroke 0.2s', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
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
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#C7C7CC', lineHeight: 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* 필터 칩 */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
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
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-3 border-brand-blue border-t-transparent animate-spin" />
        </div>
      )}

      {/* ── 일정 목록 (그룹화된 뷰) ── */}
      {!loading && (
        <div className="px-5 space-y-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {Object.keys(grouped).length > 0 ? (
            Object.entries(grouped).map(([date, items]) => (
              <section key={date} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-[18px] font-black text-[#1A1B2E]">{date}</h2>
                  <div className="h-[1px] flex-1 bg-gray-100" />
                  <span className="text-[12px] font-bold text-[#8E8E93]">{items.length}</span>
                </div>
                <div className="space-y-4">
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
            <div className="flex flex-col items-center py-32 gap-4">
              <div
                style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(12,201,181,0.10) 0%, rgba(0,132,204,0.10) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="3" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className="text-[15px] font-bold text-[#1A1B2E]">표시할 일정이 없습니다</p>
              <p className="text-[13px] text-[#8E8E93]">새 일정을 추가해보세요</p>
              <Link
                href="/schedules/new"
                className="mt-2 px-8 py-3.5 rounded-2xl text-[15px] font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', boxShadow: '0 8px 20px rgba(0,132,204,0.30)' }}
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
