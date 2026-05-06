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
      
      {/* ── [MOBILE] 프리미엄 헤더 ── */}
      <div className="lg:hidden px-6 pt-8 pb-4 flex items-center justify-between animate-fade-in">
        <div>
          <p className="text-[14px] font-bold text-[#8E8E93] mb-1">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
          <h1 className="text-[28px] font-black text-[#1A1B2E]">나의 일정</h1>
        </div>
        <button onClick={() => router.push('/schedules/new')} className="w-12 h-12 rounded-2xl bg-[#1A1B2E] flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
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

      {/* ── 히어로 섹션: 오늘 요약 ── */}
      {!loading && todaySchedules.length > 0 && (
        <div className="px-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative p-6 rounded-[32px] overflow-hidden text-white shadow-2xl" 
               style={{ background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)' }}>
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-brand-blue/20 blur-[40px] rounded-full" />
            <div className="relative z-10">
              <p className="text-[13px] font-bold text-white/60 mb-1 uppercase tracking-wider">Today's Focus</p>
              <h3 className="text-[20px] font-black mb-4">오늘 {todaySchedules.length}개의 일정이 있습니다.</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', fontSize: '12px', fontWeight: 700, color: 'white' }}>
                  오늘 {todaySchedules.length}개
                </span>
                <span style={{ padding: '4px 12px', borderRadius: '999px', background: 'rgba(46,232,149,0.2)', fontSize: '12px', fontWeight: 700, color: '#2EE895' }}>
                  완료 {todaySchedules.filter(s => s.status === 'completed').length}개
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 검색 및 필터 통합 영역 ── */}
      <div className="px-6 lg:px-0 mb-8 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div
          className="flex items-center gap-3 px-5 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="일정 검색..."
            className="flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-[#C7C7CC]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
              style={{
                background: filter === f.key ? '#1A1B2E' : 'white',
                color:      filter === f.key ? 'white' : '#8E8E93',
                boxShadow:  filter === f.key ? '0 8px 20px rgba(0,0,0,0.15)' : 'none',
                border:     filter === f.key ? 'none' : '1px solid #F2F2F7',
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
        <div className="px-6 lg:px-0 space-y-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-3xl">📭</div>
              <p className="text-[15px] font-bold text-[#8E8E93]">표시할 일정이 없습니다</p>
              <Link
                href="/schedules/new"
                className="mt-2 px-8 py-3.5 rounded-2xl text-[15px] font-bold text-white shadow-lg"
                style={{ background: 'var(--brand-gradient)' }}
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
