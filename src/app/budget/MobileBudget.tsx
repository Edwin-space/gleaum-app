'use client';

import { formatAmount, formatMonthYear, getCategoryColor } from '@/lib/utils';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS } from '@/types';
import type { Schedule, ScheduleStatus, ExpenseCategory } from '@/types';
import type { BudgetTab } from './page';
import { ExpenseDoughnut } from '@/components/budget/ExpenseDoughnut';

interface MobileBudgetProps {
  loading: boolean;
  viewDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  isCurrentMonth: boolean;
  tab: BudgetTab;
  setTab: (t: BudgetTab) => void;
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
  tab,
  setTab,
  total,
  completePct,
  completedCnt,
  pendingCnt,
  diff,
  isLess,
  lastMonthTotal,
  categories,
  expenses,
  handleToggleStatus,
}: MobileBudgetProps) {
  return (
    <div
      className="min-h-dvh"
      style={{ background: '#FAFAFD', paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}
    >
      {/* ── Hero Header ── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0F1A2E 0%, #0D2A22 50%, #1A3A2E 100%)',
          paddingTop: 'calc(env(safe-area-inset-top) + 52px)',
          paddingBottom: '48px',
          paddingLeft: '20px',
          paddingRight: '20px',
        }}
      >
        {/* Glow blobs */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,232,149,0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30px', left: '-30px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(12,201,181,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Label */}
        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 800,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          marginBottom: '18px',
          position: 'relative',
          zIndex: 10,
        }}>
          글리움 가계부
        </p>

        {/* Month navigator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          position: 'relative',
          zIndex: 10,
        }}>
          <button
            onClick={prevMonth}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div style={{ textAlign: 'center', minWidth: '140px' }}>
            <h2 style={{
              fontSize: '30px',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-1px',
              margin: 0,
              lineHeight: 1.1,
            }}>
              {formatMonthYear(viewDate)}
            </h2>
            <div style={{ minHeight: '24px', marginTop: '8px' }}>
              {isCurrentMonth && (
                <span style={{
                  display: 'inline-block',
                  padding: '3px 14px',
                  borderRadius: '999px',
                  background: 'rgba(46,232,149,0.18)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#2EE895',
                  border: '1px solid rgba(46,232,149,0.28)',
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
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 탭 스위처 ── */}
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: '8px' }}>
        {([
          { key: 'space'    as BudgetTab, label: '🏠 공간 지출' },
          { key: 'personal' as BudgetTab, label: '👤 내 지출'   },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: tab === key ? 'white' : 'rgba(255,255,255,0.45)',
              color: tab === key ? '#1A1B2E' : '#8E8E93',
              boxShadow: tab === key ? '0 2px 12px rgba(0,0,0,0.10)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            border: '3px solid #0CC9B5',
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div>
          {/* ── Summary hero card (overlapping) ── */}
          <div style={{ padding: '0 16px', marginTop: '-24px', position: 'relative', zIndex: 20 }}>
            <div style={{
              background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
              borderRadius: '28px',
              padding: '24px 24px 20px',
              boxShadow: '0 12px 40px rgba(0,132,204,0.30)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* inner glow */}
              <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px', fontWeight: 600 }}>
                이번 달 정기지출
              </p>
              <p style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-1.5px', margin: 0, lineHeight: 1.1 }}>
                {formatAmount(total)}
              </p>
              {/* Progress bar */}
              <div style={{ marginTop: '16px', height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.20)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '999px',
                  background: 'rgba(255,255,255,0.85)',
                  width: `${Math.min(completePct, 100)}%`,
                  transition: 'width 0.7s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                  완료 {completedCnt}건 ({Math.round(completePct)}%)
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                  예정 {pendingCnt}건
                </span>
              </div>
            </div>
          </div>

          {/* ── Report card ── */}
          <div style={{ padding: '0 16px', marginTop: '20px' }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.04)',
              padding: '20px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#8E8E93', marginBottom: '6px' }}>
                Report
              </p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>
                지난달보다{' '}
                <span style={{ color: isLess ? '#10B981' : '#D97706' }}>
                  {formatAmount(Math.abs(diff))}
                </span>{' '}
                {isLess ? '덜 썼어요 🎉' : '더 썼어요'}
              </p>
              {lastMonthTotal > 0 && (
                <p style={{ fontSize: '13px', color: '#8E8E93', marginTop: '4px', fontWeight: 500 }}>
                  지난달: {formatAmount(lastMonthTotal)}
                </p>
              )}
            </div>
          </div>

          {/* ── Donut chart card ── */}
          <div style={{ padding: '0 16px', marginTop: '12px' }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.04)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1B2E', marginBottom: '20px', width: '100%', textAlign: 'left' }}>
                카테고리별 지출 비율
              </h3>
              {categories.length > 0 ? (
                <ExpenseDoughnut categories={categories} total={total} />
              ) : (
                <div style={{ padding: '40px 0', fontSize: '13px', color: '#8E8E93' }}>
                  데이터가 없습니다
                </div>
              )}
            </div>
          </div>

          {/* ── Category bar chart card ── */}
          <div style={{ padding: '0 16px', marginTop: '12px' }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.04)',
              padding: '24px',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1B2E', marginBottom: '20px' }}>
                항목별 현황
              </h3>
              {categories.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {categories.map(([cat, amt]) => {
                    const category = cat as ExpenseCategory;
                    const pct = total > 0 ? (amt / total) * 100 : 0;
                    const catColor = getCategoryColor(category);
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '10px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '18px',
                              background: `${catColor}18`,
                            }}>
                              {EXPENSE_CATEGORY_ICONS[category]}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E' }}>
                              {EXPENSE_CATEGORY_LABELS[category]}
                            </span>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E' }}>
                            {formatAmount(amt)}
                          </span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '999px', background: '#F5F5F7', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '999px',
                            width: `${pct}%`,
                            background: catColor,
                            transition: 'width 1s ease',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '13px', color: '#8E8E93' }}>
                  내역이 없습니다
                </div>
              )}
            </div>
          </div>

          {/* ── Expense list ── */}
          <div style={{ padding: '0 16px', marginTop: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#8E8E93', marginBottom: '12px', paddingLeft: '4px' }}>
              지출 내역
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expenses.length > 0 ? expenses.map((e) => {
                const catColor = getCategoryColor(e.expenseCategory ?? 'other');
                const isCompleted = e.status === 'completed';
                return (
                  <div
                    key={e.id}
                    style={{
                      background: 'white',
                      borderRadius: '20px',
                      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                      border: '1px solid rgba(0,0,0,0.04)',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    {/* Category icon circle */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px',
                      background: `${catColor}18`,
                      flexShrink: 0,
                    }}>
                      {EXPENSE_CATEGORY_ICONS[e.expenseCategory ?? 'other']}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.title}
                      </p>
                      <p style={{ fontSize: '12px', color: '#8E8E93', margin: '2px 0 0', fontWeight: 500 }}>
                        {e.startTime.getDate()}일 · {e.paymentMethod === 'auto' ? '자동이체' : '카드'}
                      </p>
                    </div>

                    {/* Amount + checkmark */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>
                        {formatAmount(e.amount ?? 0)}
                      </p>
                      <button
                        onClick={() => handleToggleStatus(e.id, e.status)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isCompleted ? '#10B981' : '#F5F5F7',
                          color: isCompleted ? 'white' : '#C7C7CC',
                          transition: 'background 0.2s',
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.04)',
                  padding: '60px 24px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#8E8E93',
                }}>
                  등록된 지출이 없습니다
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
