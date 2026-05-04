'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { formatAmount, formatMonthYear, getCategoryColor } from '@/lib/utils';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS } from '@/types';
import type { ExpenseCategory } from '@/types';

export default function BudgetPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const { familyGroupId } = useCurrentUser();
  const { schedules, loading } = useSchedules(familyGroupId);

  const expenses = schedules.filter(
    (s) => s.type === 'expense' &&
      s.startTime.getFullYear() === viewDate.getFullYear() &&
      s.startTime.getMonth()    === viewDate.getMonth()
  );

  const total        = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const completed    = expenses.filter((e) => e.status === 'completed').reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const completedCnt = expenses.filter((e) => e.status === 'completed').length;
  const pendingCnt   = expenses.filter((e) => e.status === 'pending').length;
  const completePct  = total > 0 ? Math.min((completed / total) * 100, 100) : 0;

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    if (!e.expenseCategory) return acc;
    acc[e.expenseCategory] = (acc[e.expenseCategory] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {});
  const categories = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const isCurrentMonth = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

  return (
    <div className="min-h-dvh pb-28 lg:max-w-[1440px] lg:mx-auto lg:px-8 lg:pt-10">
      <div className="lg:hidden">
        <AppHeader title="가계부" showLogo={false} />
      </div>

      {/* PC 전용 타이틀 */}
      <div className="hidden lg:flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#1A1B2E]">가계부</h1>
          <p className="text-[15px] text-[#8E8E93] mt-1">이번 달 자금 흐름을 스마트하게 관리하세요</p>
        </div>
        <div className="flex items-center gap-4 glass-card p-2 rounded-full">
          <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2.5"><path d="M15 18L9 12L15 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="text-[18px] font-bold px-4">{formatMonthYear(viewDate)}</span>
          <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2.5"><path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* 모바일 월 네비게이터 */}
      <div className="flex items-center justify-between px-5 py-3 lg:hidden">
        <button onClick={prevMonth}
          className="w-10 h-10 glass-card flex items-center justify-center rounded-full transition-all active:scale-90">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="var(--brand-blue)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="text-center">
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.5px' }}>
            {formatMonthYear(viewDate)}
          </h2>
          {isCurrentMonth && (
            <span className="text-[11px] font-semibold" style={{ color: 'var(--brand-blue)' }}>이번 달</span>
          )}
        </div>
        <button onClick={nextMonth}
          className="w-10 h-10 glass-card flex items-center justify-center rounded-full transition-all active:scale-90">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="var(--brand-blue)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--brand-teal)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <>
          {/* 월간 합계 히어로 카드 */}
          <div
            className="mx-4 mb-8 lg:mx-0 rounded-[28px] lg:rounded-[40px] overflow-hidden relative"
            style={{
              background: 'var(--brand-gradient)',
              boxShadow: '0 12px 40px rgba(0,132,204,0.30)',
            }}
          >
            {/* 장식 원 */}
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '160px', height: '160px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: '-30px', left: '30%',
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
            }} />

            <div className="px-6 py-6 relative z-10">
              <p className="text-[13px] text-white/70 mb-1">이번 달 정기지출</p>
              <p className="text-[36px] font-bold text-white" style={{ letterSpacing: '-1.5px' }}>
                {formatAmount(total)}
              </p>

              <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${completePct}%`, background: 'rgba(255,255,255,0.85)' }}
                />
              </div>

              <div className="flex justify-between mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white/80" />
                  <span className="text-[12px] text-white/70">
                    완료 {completedCnt}건 ({Math.round(completePct)}%)
                  </span>
                </div>
                <span className="text-[12px] text-white/70">예정 {pendingCnt}건</span>
              </div>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            {/* 왼쪽: 카테고리별 현황 (lg:4단) */}
            <div className="lg:col-span-5">
          {categories.length > 0 && (
            <div className="glass-card mx-4 mb-4 rounded-[24px] p-5">
              <h3 className="text-[14px] font-bold mb-4" style={{ color: 'var(--color-ink)' }}>
                카테고리별 지출
              </h3>
              <div className="space-y-4">
                {categories.map(([cat, amt]) => {
                  const category = cat as ExpenseCategory;
                  const pct = total > 0 ? (amt / total) * 100 : 0;
                  const catColor = getCategoryColor(category);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-sm flex-shrink-0"
                            style={{ background: `${catColor}18` }}
                          >
                            {EXPENSE_CATEGORY_ICONS[category]}
                          </div>
                          <span className="text-[13px] font-medium" style={{ color: 'var(--color-ink)' }}>
                            {EXPENSE_CATEGORY_LABELS[category]}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-bold" style={{ color: 'var(--color-ink)' }}>
                            {formatAmount(amt)}
                          </span>
                          <span className="text-[11px] ml-1.5" style={{ color: 'var(--color-ink-muted-80)' }}>
                            {Math.round(pct)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,132,204,0.08)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: catColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>

          {/* 오른쪽: 지출 목록 (lg:7단) */}
          <div className="lg:col-span-7">
            <div className="px-4 lg:px-0">
            <h3 className="text-[11px] font-bold mb-3 tracking-widest uppercase"
              style={{ color: 'var(--color-ink-muted-80)' }}>
              지출 내역
            </h3>
            {expenses.length > 0 ? (
              <div className="space-y-2">
                {expenses.map((e) => (
                  <div
                    key={e.id}
                    className="glass-card flex items-center gap-3 px-4 py-3.5 rounded-[20px]"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${getCategoryColor(e.expenseCategory ?? 'other')}15` }}
                    >
                      {EXPENSE_CATEGORY_ICONS[e.expenseCategory ?? 'other']}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
                        {e.title}
                      </p>
                      <p className="text-[12px]" style={{ color: 'var(--color-ink-muted-80)' }}>
                        매월 {e.startTime.getDate()}일 · {e.paymentMethod === 'auto' ? '자동이체' : e.paymentMethod === 'card' ? '카드' : '현금'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>
                        {formatAmount(e.amount ?? 0)}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{
                          background: e.status === 'completed' ? 'rgba(16,185,129,0.10)' : 'rgba(0,132,204,0.08)',
                          color:      e.status === 'completed' ? '#059669' : 'var(--brand-blue)',
                        }}
                      >
                        {e.status === 'completed' ? '완료' : '예정'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card flex flex-col items-center py-16 gap-4 rounded-[24px]">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,132,204,0.06)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                  </svg>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)' }}>등록된 지출이 없어요</p>
                <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>일정 추가에서 정기지출을 등록하세요</p>
              </div>
            )}
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
