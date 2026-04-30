'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { sampleSchedules } from '@/lib/sampleData';
import { formatAmount, formatMonthYear, getCategoryColor } from '@/lib/utils';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS } from '@/types';
import type { ExpenseCategory } from '@/types';

export default function BudgetPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const expenses = sampleSchedules.filter(
    (s) => s.type === 'expense' &&
      s.startTime.getFullYear() === viewDate.getFullYear() &&
      s.startTime.getMonth()    === viewDate.getMonth()
  );

  const total        = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const completed    = expenses.filter((e) => e.status === 'completed').reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const completedCnt = expenses.filter((e) => e.status === 'completed').length;
  const pendingCnt   = expenses.filter((e) => e.status === 'pending').length;

  // 카테고리별 합계
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    if (!e.expenseCategory) return acc;
    acc[e.expenseCategory] = (acc[e.expenseCategory] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {});

  const categories = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader title="가계부" showLogo={false} />

      {/* 월 네비게이터 */}
      <div className="flex items-center justify-between px-6 py-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <h2 style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '17px', fontWeight: 700, color: 'var(--color-ink)' }}>
          {formatMonthYear(viewDate)}
        </h2>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* 월간 합계 카드 */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden" style={{ background: 'var(--brand-gradient)' }}>
        <div className="px-5 py-5">
          <p className="text-[13px] text-white/70 mb-1" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
            이번 달 정기지출
          </p>
          <p className="text-[32px] font-bold text-white" style={{ letterSpacing: '-1px' }}>
            {formatAmount(total)}
          </p>
          {/* 진행 바 */}
          <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/80 transition-all"
              style={{ width: total > 0 ? `${Math.min((completed / total) * 100, 100)}%` : '0%' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-white/60" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
              완료 {completedCnt}건
            </span>
            <span className="text-[11px] text-white/60" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
              예정 {pendingCnt}건
            </span>
          </div>
        </div>
      </div>

      {/* 카테고리별 현황 */}
      {categories.length > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
            카테고리별 지출
          </h3>
          <div className="space-y-3">
            {categories.map(([cat, amount]) => {
              const category = cat as ExpenseCategory;
              const pct = total > 0 ? (amount / total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{EXPENSE_CATEGORY_ICONS[category]}</span>
                      <span className="text-[13px]" style={{ fontFamily: "'Noto Sans KR',sans-serif", color: 'var(--color-ink)' }}>
                        {EXPENSE_CATEGORY_LABELS[category]}
                      </span>
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                      {formatAmount(amount)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-hairline)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: getCategoryColor(category) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 지출 목록 */}
      <div className="px-4">
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
          이번 달 지출 내역
        </h3>
        {expenses.length > 0 ? (
          <div className="space-y-2">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-2xl flex items-center gap-3 px-4 py-3"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              >
                <span className="text-2xl flex-shrink-0">
                  {EXPENSE_CATEGORY_ICONS[e.expenseCategory ?? 'other']}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    {e.title}
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    매월 {e.startTime.getDate()}일 · {e.paymentMethod === 'auto' ? '자동이체' : e.paymentMethod === 'card' ? '카드' : '현금'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>
                    {formatAmount(e.amount ?? 0)}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: e.status === 'completed' ? 'rgba(46,232,149,0.15)' : 'rgba(174,174,168,0.15)',
                      color:      e.status === 'completed' ? '#0A9E5C' : 'var(--color-ink-muted-48)',
                      fontFamily: "'Noto Sans KR',sans-serif",
                    }}
                  >
                    {e.status === 'completed' ? '완료' : '예정'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 gap-3">
            <span className="text-4xl">💰</span>
            <p style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>
              이번 달 등록된 지출이 없습니다
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
