'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScheduleCard } from '@/components/ui/Card';
import type { Schedule, ScheduleType } from '@/types';

interface DesktopSchedulesProps {
  loading: boolean;
  grouped: Record<string, Schedule[]>;
  filter: 'all' | ScheduleType;
  setFilter: (f: 'all' | ScheduleType) => void;
  search: string;
  setSearch: (s: string) => void;
  filters: { key: 'all' | ScheduleType; label: string }[];
}

export function DesktopSchedules({
  loading,
  grouped,
  filter,
  setFilter,
  search,
  setSearch,
  filters
}: DesktopSchedulesProps) {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div className="max-w-[1440px] mx-auto px-10 pt-12 pb-20 animate-fade-in">
      {/* ── PC 헤더: 검색바 + 액션 ── */}
      <div className="flex items-center justify-between gap-8 mb-12">
        <div className="flex-1 max-w-[800px]">
          <div
            className="flex items-center gap-4 px-6 h-[60px] rounded-[24px] bg-white border transition-all duration-300"
            style={{
              borderColor: searchFocused ? 'var(--brand-teal)' : 'rgba(0,0,0,0.06)',
              boxShadow: searchFocused ? '0 8px 32px rgba(12,201,181,0.12)' : '0 4px 20px rgba(0,0,0,0.04)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? 'var(--brand-teal)' : '#8E8E93'} strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="찾으시는 일정이 있으신가요? (제목, 메모, 장소 검색)"
              className="flex-1 bg-transparent border-none outline-none text-[16px] font-medium text-[#1A1B2E]"
            />
          </div>
        </div>
        
        <Link
          href="/schedules/new"
          className="flex items-center gap-2 px-8 h-[60px] rounded-[24px] text-[16px] font-bold text-white transition-all active:scale-95 shadow-xl hover:-translate-y-0.5"
          style={{ 
            background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', 
            boxShadow: '0 10px 25px rgba(0,132,204,0.3)' 
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          일정 추가하기
        </Link>
      </div>

      <div className="flex gap-10 items-start">
        {/* ── 좌측 필터 패널 ── */}
        <div className="w-[260px] flex-shrink-0 sticky top-12">
          <h3 className="text-[12px] font-black text-[#8E8E93] uppercase tracking-widest mb-6 px-2">Filters</h3>
          <div className="space-y-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-[20px] transition-all text-left group"
                style={{
                  background: filter === f.key ? 'white' : 'transparent',
                  boxShadow: filter === f.key ? '0 10px 20px rgba(0,132,204,0.08)' : 'none',
                  border: filter === f.key ? '1px solid rgba(0,132,204,0.1)' : '1px solid transparent'
                }}
              >
                <span className={`text-[15px] font-bold ${filter === f.key ? 'text-[#0084CC]' : 'text-[#6E6E66]'}`}>
                  {f.label}
                </span>
                {filter === f.key && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0084CC]" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-[32px] bg-gradient-to-br from-[#1A1B2E] to-[#2D2E4A] text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-blue/20 blur-[40px] rounded-full" />
            <div className="relative z-10">
              <h4 className="text-[14px] font-bold mb-2">Smart Tip 💡</h4>
              <p className="text-[12px] leading-relaxed text-white/60">
                공유 일정은 가족 모두가 볼 수 있고,<br/>개인 일정은 나에게만 보여요.
              </p>
            </div>
          </div>
        </div>

        {/* ── 우측 일정 그리드 ── */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-32">
              <div className="w-10 h-10 rounded-full border-4 border-[#0084CC] border-t-transparent animate-spin" />
            </div>
          ) : Object.keys(grouped).length > 0 ? (
            <div className="space-y-16">
              {Object.entries(grouped).map(([date, items]) => (
                <section key={date} className="animate-fade-in-up">
                  <div className="flex items-center gap-6 mb-8">
                    <h2 className="text-[22px] font-black text-[#1A1B2E]">{date}</h2>
                    <div className="h-[1px] flex-1 bg-gray-100" />
                    <span className="px-4 py-1 rounded-full bg-gray-50 text-[13px] font-bold text-[#8E8E93]">
                      {items.length}개의 일정
                    </span>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {items.map((s) => (
                      <ScheduleCard
                        key={s.id}
                        schedule={s}
                        onClick={() => router.push(`/schedules/${s.id}`)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-40 gap-6 glass-card rounded-[40px]">
              <div className="w-24 h-24 rounded-full flex items-center justify-center bg-[#0084CC]/5 text-4xl">
                🗓️
              </div>
              <div className="text-center">
                <p className="text-[20px] font-bold text-[#1A1B2E]">일정이 비어있습니다</p>
                <p className="text-[15px] text-[#8E8E93] mt-2">새로운 계획을 세워보세요</p>
              </div>
              <Link
                href="/schedules/new"
                className="mt-4 px-10 py-4 rounded-[20px] text-[16px] font-bold text-white shadow-lg transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)' }}
              >
                일정 추가하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
