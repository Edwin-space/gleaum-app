'use client';

import { useState } from 'react';
import { formatAmount, formatMonthYear, getCategoryColor } from '@/lib/utils';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS, PAYMENT_METHOD_LABELS } from '@/types';
import type { Schedule, ScheduleStatus, ExpenseCategory, PaymentMethod, RepeatType } from '@/types';
import type { BudgetTab, AddExpenseInput } from './page';
import { ExpenseDoughnut } from '@/components/budget/ExpenseDoughnut';

interface MobileBudgetProps {
  loading: boolean;
  viewDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  isCurrentMonth: boolean;
  hasSpace: boolean;
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
  handleAddExpense: (input: AddExpenseInput) => Promise<boolean>;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['education', 'housing', 'utility', 'insurance', 'subscription', 'other'];
const PAYMENT_METHODS: PaymentMethod[] = ['card', 'auto', 'cash', 'other'];
const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: 'none',    label: '일회성' },
  { value: 'monthly', label: '매월' },
  { value: 'weekly',  label: '매주' },
  { value: 'yearly',  label: '매년' },
];

/** 숫자 문자열 → 천 단위 콤마 포맷 */
function formatInputAmount(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('ko-KR');
}

export function MobileBudget({
  loading,
  viewDate,
  prevMonth,
  nextMonth,
  isCurrentMonth,
  hasSpace,
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
  handleAddExpense,
}: MobileBudgetProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [newTitle, setNewTitle]         = useState('');
  const [newAmountRaw, setNewAmountRaw] = useState(''); // 순수 숫자 문자열
  const [newDate, setNewDate]           = useState(new Date().toISOString().split('T')[0]);
  const [newCategory, setNewCategory]   = useState<ExpenseCategory>('other');
  const [newPayment, setNewPayment]     = useState<PaymentMethod>('card');
  const [newRepeat, setNewRepeat]       = useState<RepeatType>('none');

  const amountDisplay = formatInputAmount(newAmountRaw);

  const openAddModal = () => {
    setNewTitle(''); setNewAmountRaw('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewCategory('other'); setNewPayment('card'); setNewRepeat('none');
    setShowAddModal(true);
  };

  const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    setNewAmountRaw(digits);
  };

  const handleSave = async () => {
    if (!newTitle.trim() || !newAmountRaw) return;
    setSaving(true);
    const ok = await handleAddExpense({
      title:         newTitle.trim(),
      amount:        Number(newAmountRaw),
      date:          new Date(newDate),
      category:      newCategory,
      paymentMethod: newPayment,
      repeat:        newRepeat,
    });
    setSaving(false);
    if (ok) setShowAddModal(false);
  };

  // 탭 레이블: 개인 먼저, 공간 두 번째
  const tabs: { key: BudgetTab; label: string; disabled?: boolean }[] = [
    { key: 'personal', label: '👤 개인 지출' },
    { key: 'space',    label: '🏠 공간 지출', disabled: !hasSpace },
  ];

  return (
    <div
      className="min-h-dvh"
      style={{ background: '#FAFAFD', paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
    >
      {/* ── Hero Header ── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0F1A2E 0%, #0D2A22 50%, #1A3A2E 100%)', paddingTop: 'calc(env(safe-area-inset-top) + 52px)', paddingBottom: '36px', paddingLeft: '20px', paddingRight: '20px' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,232,149,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(12,201,181,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '1.6px', textTransform: 'uppercase', marginBottom: '18px', position: 'relative', zIndex: 10 }}>글리움 가계부</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', position: 'relative', zIndex: 10 }}>
          <button onClick={prevMonth} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ textAlign: 'center', minWidth: '140px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: 'white', letterSpacing: '-1px', margin: 0, lineHeight: 1.1 }}>{formatMonthYear(viewDate)}</h2>
            <div style={{ minHeight: '24px', marginTop: '8px' }}>
              {isCurrentMonth && <span style={{ display: 'inline-block', padding: '3px 14px', borderRadius: '999px', background: 'rgba(46,232,149,0.18)', fontSize: '11px', fontWeight: 700, color: '#2EE895', border: '1px solid rgba(46,232,149,0.28)' }}>이번 달</span>}
            </div>
          </div>
          <button onClick={nextMonth} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {/* ── 바텀 시트: 탭 스위처가 상단, 카드가 하단 ─────────────────────
           hero 하단을 라운드로 덮어 올라오는 "시트" 패턴.
           탭과 카드가 별도 레이어에 있어 겹침 없음.
      ──────────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#FAFAFD',
        borderRadius: '24px 24px 0 0',
        marginTop: '-20px',
        position: 'relative',
        zIndex: 10,
        paddingTop: '16px',
      }}>
        {/* ── 탭 스위처 ── */}
        <div style={{ padding: '0 16px 0', display: 'flex', gap: '8px' }}>
          {tabs.map(({ key, label, disabled }) => (
            <button
              key={key}
              onClick={() => !disabled && setTab(key)}
              style={{
                flex: 1, height: '44px', borderRadius: '14px', fontSize: '13px', fontWeight: 800,
                border: disabled ? '1.5px dashed #E5E5EA' : (tab === key ? 'none' : '1.5px solid #E5E5EA'),
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                background: disabled ? 'transparent' : (tab === key ? 'white' : 'transparent'),
                color: disabled ? '#C7C7CC' : (tab === key ? '#1A1B2E' : '#8E8E93'),
                boxShadow: (!disabled && tab === key) ? '0 2px 12px rgba(0,0,0,0.10)' : 'none',
                opacity: disabled ? 0.55 : 1,
              }}
            >
              {label}
              {disabled && <span style={{ fontSize: '10px', marginLeft: '4px' }}>공간 필요</span>}
            </button>
          ))}
        </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px', paddingBottom: '40px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #0CC9B5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div>
          {/* ── Summary card ── */}
          <div style={{ padding: '0 16px', marginTop: '12px', position: 'relative', zIndex: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', borderRadius: '28px', padding: '24px 24px 20px', boxShadow: '0 12px 40px rgba(0,132,204,0.30)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px', fontWeight: 600 }}>
                {tab === 'personal' ? '개인 지출' : '공간 지출'}
              </p>
              <p style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-1.5px', margin: 0, lineHeight: 1.1 }}>{formatAmount(total)}</p>
              <div style={{ marginTop: '16px', height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.20)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', background: 'rgba(255,255,255,0.85)', width: `${Math.min(completePct, 100)}%`, transition: 'width 0.7s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>반영 {completedCnt}건 ({Math.round(completePct)}%)</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>정기 예정 {pendingCnt}건</span>
              </div>
            </div>
          </div>

          {/* ── Report ── */}
          <div style={{ padding: '0 16px', marginTop: '20px' }}>
            <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#8E8E93', marginBottom: '6px' }}>Report</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>
                지난달보다 <span style={{ color: isLess ? '#10B981' : '#D97706' }}>{formatAmount(Math.abs(diff))}</span> {isLess ? '덜 썼어요 🎉' : '더 썼어요'}
              </p>
              {lastMonthTotal > 0 && <p style={{ fontSize: '13px', color: '#8E8E93', marginTop: '4px', fontWeight: 500 }}>지난달: {formatAmount(lastMonthTotal)}</p>}
            </div>
          </div>

          {/* ── Donut chart ── */}
          <div style={{ padding: '0 16px', marginTop: '12px' }}>
            <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1B2E', marginBottom: '20px', width: '100%', textAlign: 'left' }}>카테고리별 지출 비율</h3>
              {categories.length > 0 ? <ExpenseDoughnut categories={categories} total={total} /> : <div style={{ padding: '40px 0', fontSize: '13px', color: '#8E8E93' }}>데이터가 없습니다</div>}
            </div>
          </div>

          {/* ── Category bars ── */}
          <div style={{ padding: '0 16px', marginTop: '12px' }}>
            <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1B2E', marginBottom: '20px' }}>항목별 현황</h3>
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
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: `${catColor}18` }}>{EXPENSE_CATEGORY_ICONS[category]}</div>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E' }}>{EXPENSE_CATEGORY_LABELS[category]}</span>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E' }}>{formatAmount(amt)}</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '999px', background: '#F5F5F7', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '999px', width: `${pct}%`, background: catColor, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '13px', color: '#8E8E93' }}>내역이 없습니다</div>}
            </div>
          </div>

          {/* ── Expense list ── */}
          <div style={{ padding: '0 16px', marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingLeft: '4px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#8E8E93', margin: 0 }}>지출 내역</p>
              <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 800, color: '#0084CC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
                <span style={{ fontSize: '17px', lineHeight: 1 }}>＋</span> 지출 추가
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expenses.length > 0 ? expenses.map((e) => {
                const catColor = getCategoryColor(e.expenseCategory ?? 'other');
                const isRecurring = e.repeat && e.repeat !== 'none';
                const isCompleted = !isRecurring || e.status === 'completed';
                return (
                  <div key={e.id} style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', background: `${catColor}18`, flexShrink: 0 }}>
                      {EXPENSE_CATEGORY_ICONS[e.expenseCategory ?? 'other']}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: isRecurring ? '#0084CC' : '#10B981', background: isRecurring ? 'rgba(0,132,204,0.1)' : 'rgba(46,232,149,0.12)', padding: '2px 6px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{isRecurring ? '정기' : '일회성'}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#8E8E93', margin: 0, fontWeight: 500 }}>
                        {e.startTime.getDate()}일 · {PAYMENT_METHOD_LABELS[e.paymentMethod ?? 'card']}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>{formatAmount(e.amount ?? 0)}</p>
                      <button
                        onClick={() => isRecurring && handleToggleStatus(e.id, e.status)}
                        aria-label={isRecurring ? '정기 지출 상태 변경' : '일회성 지출 반영됨'}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: isRecurring ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isCompleted ? '#10B981' : '#F5F5F7', color: isCompleted ? 'white' : '#C7C7CC', transition: 'background 0.2s', opacity: isRecurring ? 1 : 0.85 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <button onClick={openAddModal} style={{ width: '100%', padding: '32px', borderRadius: '20px', border: '2px dashed #E5E5EA', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <span style={{ fontSize: '32px' }}>💰</span>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#8E8E93', margin: 0 }}>{tab === 'personal' ? '개인 지출을 추가해 보세요' : '공간 지출을 추가해 보세요'}</p>
                  <p style={{ fontSize: '12px', color: '#C7C7CC', margin: 0 }}>일회성 및 정기 지출 모두 관리</p>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div> {/* ── 바텀 시트 닫기 ── */}

      {/* ── 지출 추가 모달 ── */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '32px 32px 0 0', padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '20px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: '#E5E5EA' }} />
            </div>

            {/* 제목 + 탭 표시 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1B2E', margin: 0 }}>
                {tab === 'personal' ? '개인 지출 추가' : '공간 지출 추가'}
              </h3>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: tab === 'personal' ? '#F5F5F7' : 'rgba(0,132,204,0.08)', color: tab === 'personal' ? '#8E8E93' : '#0084CC' }}>
                {tab === 'personal' ? '🔒 나만 보기' : '🏠 공간 공유'}
              </span>
            </div>

            {/* 지출 유형 */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>지출 유형</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {REPEAT_OPTIONS.map(({ value, label }) => (
                  <button key={value} onClick={() => setNewRepeat(value)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', background: newRepeat === value ? '#1A1B2E' : '#F5F5F7', color: newRepeat === value ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>{label}</button>
                ))}
              </div>
            </div>

            {/* 항목명 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>항목명</p>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="예: 넷플릭스, 관리비, 보험료"
                style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: '#F5F5F7', border: `2px solid ${newTitle ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: '#1A1B2E', transition: 'border-color 0.2s' }}
              />
            </div>

            {/* 금액 — 콤마 포맷 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>금액</p>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={handleAmountInput}
                  placeholder="0"
                  style={{ width: '100%', height: '56px', padding: '0 40px 0 16px', borderRadius: '14px', fontSize: '22px', fontWeight: 800, background: '#F5F5F7', border: `2px solid ${newAmountRaw ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: '#1A1B2E', transition: 'border-color 0.2s', letterSpacing: '-0.5px' }}
                />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', fontWeight: 700, color: newAmountRaw ? '#0084CC' : '#C7C7CC', pointerEvents: 'none' }}>원</span>
              </div>
              {newAmountRaw && Number(newAmountRaw) >= 10000 && (
                <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '6px', fontWeight: 600, paddingLeft: '4px' }}>
                  {(Number(newAmountRaw) / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만원
                </p>
              )}
            </div>

            {/* 날짜 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>{newRepeat === 'none' ? '지출 날짜' : '첫 결제일'}</p>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: '#F5F5F7', border: '2px solid transparent', outline: 'none', boxSizing: 'border-box', color: '#1A1B2E' }} />
            </div>

            {/* 카테고리 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>카테고리</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setNewCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', background: newCategory === cat ? '#1A1B2E' : '#F5F5F7', color: newCategory === cat ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>
                    <span>{EXPENSE_CATEGORY_ICONS[cat]}</span><span>{EXPENSE_CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 결제 방법 */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>결제 방법</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PAYMENT_METHODS.map((m) => (
                  <button key={m} onClick={() => setNewPayment(m)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', background: newPayment === m ? '#1A1B2E' : '#F5F5F7', color: newPayment === m ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>{PAYMENT_METHOD_LABELS[m]}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleSave} disabled={saving || !newTitle.trim() || !newAmountRaw} style={{ width: '100%', height: '58px', borderRadius: '18px', background: newTitle.trim() && newAmountRaw ? 'linear-gradient(135deg, #0084CC, #0CC9B5)' : '#F0F0F5', border: 'none', cursor: newTitle.trim() && newAmountRaw ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 800, color: newTitle.trim() && newAmountRaw ? 'white' : '#AEAEA8', opacity: saving ? 0.7 : 1, boxShadow: newTitle.trim() && newAmountRaw ? '0 8px 24px rgba(0,132,204,0.25)' : 'none' }}>
                {saving ? '저장 중...' : '지출 등록'}
              </button>
              <button onClick={() => setShowAddModal(false)} style={{ width: '100%', height: '52px', borderRadius: '18px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
