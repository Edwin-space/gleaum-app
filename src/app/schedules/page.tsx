'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
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

  const { familyGroupId, loading: userLoading } = useCurrentUser();
  const { schedules, loading: schedulesLoading } = useSchedules(familyGroupId);

  const loading = userLoading || schedulesLoading;

  const filtered = schedules.filter((s) => {
    const matchType   = filter === 'all' || s.type === filter;
    const q = search.toLowerCase();
    const matchSearch = !search || (
      s.title.toLowerCase().includes(q) ||
      (s.memo?.toLowerCase().includes(q) ?? false) ||
      (s.location?.address.toLowerCase().includes(q) ?? false)
    );
    return matchType && matchSearch;
  });

  return (
    <div className="min-h-dvh pb-24 lg:max-w-[1440px] lg:mx-auto lg:px-8 lg:pt-10">
      <div className="lg:hidden">
        <AppHeader title="일정" showLogo={false} showBack={false} />
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

      {/* 검색 및 필터 통합 영역 (PC/모바일 공용) */}
      <div className="lg:glass-card lg:p-6 lg:rounded-[32px] lg:mb-10 lg:flex lg:items-center lg:gap-6">
        <div
          className="flex items-center gap-2 px-4 h-11 rounded-full lg:flex-1 lg:h-14 lg:px-6"
          style={{ background: 'white', border: '1px solid var(--color-hairline)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="var(--color-ink-muted-48)" strokeWidth="1.8"/>
            <path d="M16.5 16.5L21 21" stroke="var(--color-ink-muted-48)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="어떤 일정을 찾으시나요?"
            className="flex-1 bg-transparent text-[15px] lg:text-[16px] placeholder:text-[var(--color-ink-muted-48)] outline-none"
          />
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto lg:px-0 lg:pb-0 lg:flex-nowrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex-shrink-0 px-4 py-2 lg:px-6 lg:py-3 rounded-full text-[13px] lg:text-[14px] font-bold transition-all"
            style={{
              background: filter === f.key ? 'var(--color-primary)' : 'rgba(0,132,204,0.04)',
              color:      filter === f.key ? 'white' : 'var(--color-ink-muted-48)',
              border:     filter === f.key ? 'none' : '1px solid rgba(0,132,204,0.08)',
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
          <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      )}

      {/* 일정 목록 */}
      {!loading && (
        <div className="px-4 lg:px-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length > 0 ? (
            filtered.map((s) => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                onClick={() => router.push(`/schedules/${s.id}`)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center py-20 gap-3">
              <span className="text-4xl">📭</span>
              <p style={{ fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>
                등록된 일정이 없습니다
              </p>
              <Link
                href="/schedules/new"
                className="mt-2 px-5 py-2.5 rounded-full text-[14px] font-semibold text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                일정 추가하기
              </Link>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
