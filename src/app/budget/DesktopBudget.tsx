'use client';

import { formatAmount, formatMonthYear, getCategoryColor } from '@/lib/utils';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS } from '@/types';
import type { Schedule, ScheduleStatus, ExpenseCategory } from '@/types';
import { ExpenseDoughnut } from '@/components/budget/ExpenseDoughnut';

interface DesktopBudgetProps {
  loading: boolean;
  viewDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  total: number;
  completePct: number;
  completedCnt: number;
  pendingCnt: number;
  diff: number;
  isLess: boolean;
  lastMonthTotal: number;
  categories: [string, number][];
  expenses: Schedule[];
  handleToggleStatus: (id: string, currentStatus: ScheduleStatus) => void;
}

export function DesktopBudget({
  loading,
  viewDate,
  prevMonth,
  nextMonth,
  total,
  completePct,
  completedCnt,
  pendingCnt,
  diff,
  isLess,
  lastMonthTotal,
  categories,
  expenses,
  handleToggleStatus
}: DesktopBudgetProps) {
  return (
    <div className="max-w-[1440px] mx-auto px-10 pt-12 pb-20 animate-fade-in">
      {/* ── PC 헤더 ── */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-[36px] font-black text-[#1A1B2E] tracking-tight">가계부 리포트</h1>
          <p className="text-[16px] text-[#8E8E93] mt-2">이번 달 자금 흐름과 소비 패턴을 분석합니다</p>
        </div>
        
        <div className="flex items-center gap-6 glass-card p-2 rounded-[28px] border-white/60">
          <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.5"><path d="M15 18L9 12L15 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="text-[20px] font-black px-4">{formatMonthYear(viewDate)}</span>
          <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.5"><path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-40">
          <div className="w-12 h-12 rounded-full border-4 border-[#0CC9B5] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* ── 좌측 패널 (요약 카드) ── */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl" style={{ background: 'var(--brand-gradient)' }}>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-[40px] rounded-full" />
              <div className="relative z-10">
                <p className="text-white/70 text-[14px] font-bold mb-2 uppercase tracking-widest">Monthly Total</p>
                <h2 className="text-[42px] font-black leading-tight mb-8 tracking-tighter">
                  {formatAmount(total)}
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[13px] font-bold mb-2">
                      <span>납부 진행률</span>
                      <span>{Math.round(completePct)}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full rounded-full bg-white transition-all duration-1000" style={{ width: `${completePct}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-[11px] text-white/50 uppercase font-bold mb-1">완료</p>
                      <p className="text-[18px] font-black">{completedCnt}건</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-white/50 uppercase font-bold mb-1">예정</p>
                      <p className="text-[18px] font-black">{pendingCnt}건</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 rounded-[40px]">
              <h3 className="text-[14px] font-black text-[#8E8E93] uppercase tracking-widest mb-6">Briefing</h3>
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl ${isLess ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {isLess ? '📉' : '📈'}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#6E6E66]">전월 대비</p>
                  <p className={`text-[20px] font-black mt-0.5 ${isLess ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(Math.abs(diff))} {isLess ? '절약' : '증가'}
                  </p>
                </div>
              </div>
              <p className="mt-6 text-[13px] leading-relaxed text-[#8E8E93] font-medium">
                지난달 지출({formatAmount(lastMonthTotal)}) 기준으로 이번 달은 <span className="font-bold text-[#1A1B2E]">{lastMonthTotal > 0 ? Math.round((Math.abs(diff) / lastMonthTotal) * 100) : 0}%</span> 변화하였습니다.
              </p>
            </div>
          </div>

          {/* ── 중앙/우측 패널 (차트 + 목록) ── */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-8 rounded-[40px] flex flex-col items-center justify-center min-h-[360px]">
                <h3 className="text-[16px] font-black mb-8 w-full">지출 카테고리 분석</h3>
                {categories.length > 0 ? (
                  <ExpenseDoughnut categories={categories} total={total} />
                ) : (
                  <div className="text-[#8E8E93] text-[15px]">분석할 데이터가 없습니다</div>
                )}
              </div>

              <div className="glass-card p-8 rounded-[40px]">
                <h3 className="text-[16px] font-black mb-8">상세 항목별 비율</h3>
                <div className="space-y-6">
                  {categories.length > 0 ? categories.map(([cat, amt]) => {
                    const category = cat as ExpenseCategory;
                    const pct = total > 0 ? (amt / total) * 100 : 0;
                    const catColor = getCategoryColor(category);
                    return (
                      <div key={cat} className="group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xl" style={{ background: `${catColor}15` }}>
                              {EXPENSE_CATEGORY_ICONS[category]}
                            </div>
                            <span className="text-[15px] font-bold">{EXPENSE_CATEGORY_LABELS[category]}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[15px] font-black">{formatAmount(amt)}</p>
                            <p className="text-[11px] font-bold text-[#8E8E93]">{Math.round(pct)}%</p>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-gray-50 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: catColor }} />
                        </div>
                      </div>
                    );
                  }) : <div className="py-20 text-center text-[#8E8E93]">내역 없음</div>}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-[40px] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-[16px] font-black">정기지출 내역</h3>
                <span className="text-[13px] font-bold text-[#8E8E93]">{expenses.length}건의 항목</span>
              </div>
              <div className="divide-y divide-gray-50">
                {expenses.length > 0 ? expenses.map((e) => (
                  <div key={e.id} className="px-8 py-5 flex items-center gap-6 hover:bg-gray-50/50 transition-colors">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm" style={{ background: `${getCategoryColor(e.expenseCategory ?? 'other')}15` }}>
                      {EXPENSE_CATEGORY_ICONS[e.expenseCategory ?? 'other']}
                    </div>
                    <div className="flex-1">
                      <p className="text-[16px] font-bold text-[#1A1B2E]">{e.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[13px] font-medium text-[#8E8E93]">{e.startTime.getDate()}일 결제</span>
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-[13px] font-medium text-[#8E8E93]">{e.paymentMethod === 'auto' ? '자동이체' : '카드 결제'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[18px] font-black text-[#1A1B2E]">{formatAmount(e.amount ?? 0)}</p>
                        <p className={`text-[11px] font-bold ${e.status === 'completed' ? 'text-green-600' : 'text-blue-500'}`}>
                          {e.status === 'completed' ? '결제완료' : '결제예정'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleStatus(e.id, e.status)}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${e.status === 'completed' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-32 text-center text-[#8E8E93]">
                    등록된 지출 내역이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
