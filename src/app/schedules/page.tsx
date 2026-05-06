'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScheduleCard } from '@/components/ui/Card';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import type { ScheduleType } from '@/types';
import { SCHEDULE_TYPE_LABELS } from '@/types';

const FILTERS: { key: 'all' | ScheduleType; label: string }[] = [
  { key: 'all',      label: '전체' },
  { key: 'shared',   label: '공유일정' },
  { key: 'personal', label: '개인일정' },
  { key: 'child',    label: '자녀일정' },
  { key: 'expense',  label: '정기지출' },
];

export default function SchedulesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | ScheduleType>('all');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const { familyGroupId, user, loading: userLoading } = useCurrentUser();
  const { schedules, loading: schedulesLoading } = useSchedules(familyGroupId);

  const loading = userLoading || schedulesLoading;

  // 필터링 및 그룹화 로직
  const filtered = schedules.filter((s) => {
    const matchType   = filter === 'all' || s.type === filter;
    const q = search.toLowerCase();
    const matchSearch = !search || (
      s.title.toLowerCase().includes(q) ||
      (s.memo?.toLowerCase().includes(q) ?? false) ||
      (s.location?.address.toLowerCase().includes(q) ?? false)
    );
    return matchType && matchSearch;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // 날짜별 그룹화
  const grouped = filtered.reduce((acc, s) => {
    const d = new Date(s.startTime);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let groupKey = 'Upcoming';
    if (d.toDateString() === today.toDateString()) groupKey = 'Today';
    else if (d.toDateString() === tomorrow.toDateString()) groupKey = 'Tomorrow';
    else groupKey = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(s);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const todaySchedules = schedules.filter(s => new Date(s.startTime).toDateString() === new Date().toDateString());

  return (
    <div className="min-h-dvh pb-24 lg:max-w-[1440px] lg:mx-auto lg:px-8 lg:pt-10 relative">

      {/* ── [MOBILE] 스티키 헤더 ── */}
      <div
        className="lg:hidden"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '48px 20px 16px',
          background: 'rgba(245,245,249,0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
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

      {/* PC 전용 타이틀 */}
      <div className="hidden lg:flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#1A1B2E]">일정 관리</h1>
          <p className="text-[15px] text-[#8E8E93] mt-1">우리 가족의 모든 계획을 한눈에 확인하세요</p>
        </div>
        <Link
          href="/schedules/new"
          className="flex items-center gap-2 px-6 py-3.5 rounded-[20px] text-[15px] font-bold text-white transition-all active:scale-95 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', boxShadow: '0 8px 24px rgba(0,132,204,0.3)' }}
        >
          <span>➕</span>
          새 일정 추가
        </Link>
      </div>

      {/* ── [MOBILE] 히어로 섹션: 오늘 요약 (항상 표시) ── */}
      <div className="lg:hidden px-5 pt-5 pb-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
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
      <div className="px-5 lg:px-0 mb-8 mt-5 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
          {FILTERS.map((f) => (
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
        <div className="px-5 lg:px-0 space-y-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {Object.keys(grouped).length > 0 ? (
            Object.entries(grouped).map(([date, items]) => (
              <section key={date} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-[18px] font-black text-[#1A1B2E]">{date}</h2>
                  <div className="h-[1px] flex-1 bg-gray-100" />
                  <span className="text-[12px] font-bold text-[#8E8E93]">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
