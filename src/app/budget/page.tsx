'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';

import { useSchedules } from '@/hooks/useSchedules';
import { formatAmount, formatMonthYear, getCategoryColor } from '@/lib/utils';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS } from '@/types';
import type { ExpenseCategory, ScheduleStatus } from '@/types';
import { ExpenseDoughnut } from '@/components/budget/ExpenseDoughnut';
import { toast } from 'sonner';

export default function BudgetPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const { familyGroupId } = useCurrentUser();
  const { schedules, loading, updateStatus } = useSchedules(familyGroupId);

  // 현재 선택된 달의 지출
  const expenses = schedules.filter(
    (s) => s.type === 'expense' &&
      s.startTime.getFullYear() === viewDate.getFullYear() &&
      s.startTime.getMonth()    === viewDate.getMonth()
  );

  // 지난달 지출 (비교용)
  const lastMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  const lastMonthExpenses = schedules.filter(
    (s) => s.type === 'expense' &&
      s.startTime.getFullYear() === lastMonthDate.getFullYear() &&
      s.startTime.getMonth()    === lastMonthDate.getMonth()
  );

  const total          = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const diff           = total - lastMonthTotal;
  const isLess         = diff < 0;

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

  const handleToggleStatus = async (id: string, currentStatus: ScheduleStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateStatus(id, nextStatus);
    toast.success(nextStatus === 'completed' ? '납부 완료로 변경되었습니다' : '결제 예정으로 변경되었습니다', {
      position: 'top-center',
      duration: 1500,
    });
  };

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

          {/* 지출 리포트 섹션: 차트 + 브리핑 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mx-4 mb-8 lg:mx-0">
            {/* 데이터 브리핑 (Premium Briefing) */}
            <div className="lg:col-span-12 glass-card p-6 rounded-[28px] mb-2 flex items-center justify-between overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-[14px] font-bold text-[#8E8E93] mb-1">Monthly Briefing</h3>
                <p className="text-[18px] font-bold text-[#1A1B2E]">
                  지난달보다 {formatAmount(Math.abs(diff))} {isLess ? '덜 썼어요' : '더 썼어요'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${isLess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {isLess ? '↓' : '↑'} {lastMonthTotal > 0 ? Math.round((Math.abs(diff) / lastMonthTotal) * 100) : 0}%
                  </div>
                  <span className="text-[11px] text-[#8E8E93]">전월 {formatAmount(lastMonthTotal)} 기준</span>
                </div>
              </div>
              <div className="opacity-10 absolute right-[-10px] top-[-10px]">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="var(--brand-blue)">
                  <path d="M21 21H3V3h2v16h16v2zM5 15l4.5-4.5 3 3L19 7l1.4 1.4L12.5 16.3l-3-3L5 17.8V15z"/>
                </svg>
              </div>
            </div>

            {/* 도넛 차트 (lg:5단) */}
            <div className="lg:col-span-5 glass-card p-6 rounded-[28px] flex flex-col items-center justify-center">
              <h3 className="text-[14px] font-bold mb-6 w-full text-left" style={{ color: 'var(--color-ink)' }}>
                카테고리별 지출 비율
              </h3>
              {categories.length > 0 ? (
                <ExpenseDoughnut categories={categories} total={total} />
              ) : (
                <div className="py-10 text-[13px] text-[#8E8E93]">표시할 데이터가 없습니다</div>
              )}
            </div>

            {/* 카테고리 상세 리스트 (lg:7단) */}
            <div className="lg:col-span-7 glass-card p-6 rounded-[28px]">
              <h3 className="text-[14px] font-bold mb-6" style={{ color: 'var(--color-ink)' }}>
                항목별 현황
              </h3>
              <div className="space-y-5">
                {categories.length > 0 ? categories.map(([cat, amt]) => {
                  const category = cat as ExpenseCategory;
                  const pct = total > 0 ? (amt / total) * 100 : 0;
                  const catColor = getCategoryColor(category);
                  return (
                    <div key={cat} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: `${catColor}15` }}
                          >
                            {EXPENSE_CATEGORY_ICONS[category]}
                          </div>
                          <span className="text-[14px] font-bold text-[#1A1B2E]">
                            {EXPENSE_CATEGORY_LABELS[category]}
                          </span>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className="text-[14px] font-bold text-[#1A1B2E]">
                            {formatAmount(amt)}
                          </span>
                          <span className="text-[11px] font-medium text-[#8E8E93]">
                            전체의 {Math.round(pct)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-50 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${pct}%`, background: catColor }}
                        />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-10 text-center text-[13px] text-[#8E8E93]">내역이 없습니다</div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-1 gap-8 items-start">


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
                    className="glass-card flex items-center gap-3 px-4 py-3.5 rounded-[20px] transition-all active:scale-[0.98]"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                      style={{ background: `${getCategoryColor(e.expenseCategory ?? 'other')}15` }}
                    >
                      {EXPENSE_CATEGORY_ICONS[e.expenseCategory ?? 'other']}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold truncate text-[#1A1B2E]">
                        {e.title}
                      </p>
                      <p className="text-[12px] text-[#8E8E93]">
                        {e.startTime.getDate()}일 · {e.paymentMethod === 'auto' ? '자동이체' : e.paymentMethod === 'card' ? '카드' : '현금'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[15px] font-bold text-[#1A1B2E]">
                          {formatAmount(e.amount ?? 0)}
                        </span>
                        <span className={`text-[10px] font-bold ${e.status === 'completed' ? 'text-green-600' : 'text-blue-500'}`}>
                          {e.status === 'completed' ? '결제완료' : '결제예정'}
                        </span>
                      </div>
                      
                      {/* 퀵 체크 버튼 */}
                      <button 
                        onClick={() => handleToggleStatus(e.id, e.status)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          e.status === 'completed' 
                            ? 'bg-green-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]' 
                            : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
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
          </div>
        </>
      )}

      
    </div>

  );
}
