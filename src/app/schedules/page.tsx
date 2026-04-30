'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { ScheduleCard } from '@/components/ui/Card';
import { sampleSchedules } from '@/lib/sampleData';
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

  const filtered = sampleSchedules.filter((s) => {
    const matchType   = filter === 'all' || s.type === filter;
    const matchSearch = !search || s.title.includes(search);
    return matchType && matchSearch;
  });

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader title="일정" showLogo={false} showBack={false} />

      {/* 검색 */}
      <div className="px-4 py-3">
        <div
          className="flex items-center gap-2 px-4 h-11 rounded-full"
          style={{ background: 'white', border: '1px solid var(--color-hairline)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="var(--color-ink-muted-48)" strokeWidth="1.8"/>
            <path d="M16.5 16.5L21 21" stroke="var(--color-ink-muted-48)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="일정 검색"
            className="flex-1 bg-transparent text-[15px] placeholder:text-[var(--color-ink-muted-48)]"
            style={{ fontFamily: "'Noto Sans KR',sans-serif" }}
          />
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
            style={{
              background: filter === f.key ? 'var(--color-primary)' : 'white',
              color:      filter === f.key ? 'white' : 'var(--color-ink-muted-48)',
              border:     filter === f.key ? 'none' : '1px solid var(--color-hairline)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 일정 목록 */}
      <div className="px-4 space-y-2">
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
            <p style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>
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

      <BottomNav />
    </div>
  );
}
