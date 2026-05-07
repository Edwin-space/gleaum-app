'use client';

import { formatAmount, formatMonthYear, getCategoryColor } from '@/lib/utils';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS } from '@/types';
import type { Schedule, ScheduleStatus, ExpenseCategory } from '@/types';
import { ExpenseDoughnut } from '@/components/budget/ExpenseDoughnut';

interface MobileBudgetProps {
  loading: boolean;
  viewDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  isCurrentMonth: boolean;
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

export function MobileBudget({
  loading,
  viewDate,
  prevMonth,
  nextMonth,
  isCurrentMonth,
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
}: MobileBudgetProps) {
  return (
    <div className="min-h-dvh pb-28">
      {/* ── [MOBILE] 통합 프리미엄 히어로 헤더 ── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0F1A2E 0%, #0D2A22 50%, #1A3A2E 100%)',
          padding: '56px 20px 32px',
        }}
      >
        {/* Glow blobs */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,232,149,0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20px', left: '-20px',
          width: '140px', height: '140px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(12,201,181,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <p style={{
          textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.50)',
          letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '16px', position: 'relative', zIndex: 10,
        }}>
          글리움 가계부
        </p>

        {/* 월 네비게이터 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', position: 'relative', zIndex: 10 }}>
          <button
            onClick={prevMonth}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.8px', margin: 0 }}>
              {formatMonthYear(viewDate)}
            </h2>
            <div style={{ minHeight: '22px', marginTop: '6px' }}>
              {isCurrentMonth && (
                <span style={{
                  padding: '3px 12px', borderRadius: '999px', background: 'rgba(46,232,149,0.20)',
                  fontSize: '11px', fontWeight: 700, color: '#2EE895', border: '1px solid rgba(46,232,149,0.30)',
                }}>
                  이번 달
                </span>
              )}
            </div>
          </div>

          <button
            onClick={nextMonth}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--brand-teal)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="animate-fade-in-up">
          {/* 월간 합계 히어로 카드 */}
          <div
            className="mx-4 mb-8 -mt-6 rounded-[28px] overflow-hidden relative z-20"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 12px 40px rgba(0,132,204,0.30)' }}
          >
            <div className="px-6 py-6 relative z-10">
              <p className="text-[13px] text-white/70 mb-1">이번 달 정기지출</p>
              <p className="text-[36px] font-bold text-white" style={{ letterSpacing: '-1.5px' }}>
                {formatAmount(total)}
              </p>
              <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white/85 transition-all duration-700" style={{ width: `${completePct}%` }} />
              </div>
              <div className="flex justify-between mt-3 text-[12px] text-white/70">
                <span>완료 {completedCnt}건 ({Math.round(completePct)}%)</span>
                <span>예정 {pendingCnt}건</span>
              </div>
            </div>
          </div>

          {/* 지출 리포트 */}
          <div className="px-4 mb-8">
            <div className="glass-card p-5 rounded-[24px] mb-4">
              <h3 className="text-[14px] font-bold text-[#8E8E93] mb-1 uppercase tracking-wider">Report</h3>
              <p className="text-[18px] font-bold text-[#1A1B2E]">
                지난달보다 {formatAmount(Math.abs(diff))} {isLess ? '덜 썼어요' : '더 썼어요'}
              </p>
            </div>

            <div className="glass-card p-6 rounded-[28px] flex flex-col items-center mb-4">
              <h3 className="text-[14px] font-bold mb-6 w-full text-left">카테고리별 지출 비율</h3>
              {categories.length > 0 ? (
                <ExpenseDoughnut categories={categories} total={total} />
              ) : (
                <div className="py-10 text-[13px] text-[#8E8E93]">데이터가 없습니다</div>
              )}
            </div>

            <div className="glass-card p-6 rounded-[28px]">
              <h3 className="text-[14px] font-bold mb-6">항목별 현황</h3>
              <div className="space-y-5">
                {categories.length > 0 ? categories.map(([cat, amt]) => {
                  const category = cat as ExpenseCategory;
                  const pct = total > 0 ? (amt / total) * 100 : 0;
                  const catColor = getCategoryColor(category);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-lg" style={{ background: `${catColor}15` }}>
                            {EXPENSE_CATEGORY_ICONS[category]}
                          </div>
                          <span className="text-[14px] font-bold">{EXPENSE_CATEGORY_LABELS[category]}</span>
                        </div>
                        <span className="text-[14px] font-bold">{formatAmount(amt)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-50 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: catColor }} />
                      </div>
                    </div>
                  );
                }) : <div className="py-10 text-center text-[13px] text-[#8E8E93]">내역이 없습니다</div>}
              </div>
            </div>
          </div>

          {/* 지출 내역 목록 */}
          <div className="px-4 pb-10">
            <h3 className="text-[11px] font-bold mb-3 tracking-widest uppercase text-[#8E8E93]">지출 내역</h3>
            <div className="space-y-2">
              {expenses.length > 0 ? expenses.map((e) => (
                <div key={e.id} className="glass-card flex items-center gap-3 px-4 py-3.5 rounded-[20px]">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ background: `${getCategoryColor(e.expenseCategory ?? 'other')}15` }}>
                    {EXPENSE_CATEGORY_ICONS[e.expenseCategory ?? 'other']}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold truncate">{e.title}</p>
                    <p className="text-[12px] text-[#8E8E93]">{e.startTime.getDate()}일 · {e.paymentMethod === 'auto' ? '자동이체' : '카드'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-bold">{formatAmount(e.amount ?? 0)}</p>
                    <button
                      onClick={() => handleToggleStatus(e.id, e.status)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center mt-1 ml-auto ${e.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                  </div>
                </div>
              )) : <div className="glass-card py-16 text-center text-[13px] text-[#8E8E93]">등록된 지출이 없습니다</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
