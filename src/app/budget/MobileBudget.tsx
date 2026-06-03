'use client';

import { useState } from 'react';
import { formatAmount, formatMonthYear, getCategoryColor } from '@/lib/utils';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_ICONS,
  PAYMENT_METHOD_LABELS,
  FIXED_EXPENSE_CATEGORIES,
  VARIABLE_EXPENSE_CATEGORIES,
} from '@/types';
import type { Schedule, ScheduleStatus, ExpenseCategory, PaymentMethod, RepeatType } from '@/types';
import type { AddExpenseInput, EditExpenseInput } from './page';
import { ExpenseDoughnut } from '@/components/budget/ExpenseDoughnut';
import { AdSlot } from '@/components/AdSlot';

interface MobileBudgetProps {
  loading: boolean;
  viewDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  isCurrentMonth: boolean;
  total: number;
  fixedTotal: number;
  variableTotal: number;
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
  handleUpdateExpense: (input: EditExpenseInput) => Promise<boolean>;
  handleDeleteExpense: (id: string) => Promise<void>;
}

const PAYMENT_METHODS: PaymentMethod[] = ['card', 'auto', 'cash', 'other'];
const FIXED_REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: 'monthly', label: '매월' },
  { value: 'weekly',  label: '매주' },
  { value: 'yearly',  label: '매년' },
];

function formatInputAmount(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('ko-KR');
}

/** 로컬 날짜 문자열 반환 (YYYY-MM-DD) — UTC 기준 toISOString() 대신 사용 */
function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type ListTab = 'all' | 'fixed' | 'variable';
type ExpenseTypeTab = 'fixed' | 'variable';

export function MobileBudget({
  loading,
  viewDate,
  prevMonth,
  nextMonth,
  isCurrentMonth,
  total,
  fixedTotal,
  variableTotal,
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
  handleUpdateExpense,
  handleDeleteExpense,
}: MobileBudgetProps) {
  // ── 리스트 탭 ──
  const [listTab, setListTab] = useState<ListTab>('all');

  // ── 지출 추가 모달 ──
  const [showAddModal, setShowAddModal]       = useState(false);
  const [addType, setAddType]                 = useState<ExpenseTypeTab>('variable');
  const [saving, setSaving]                   = useState(false);
  const [newTitle, setNewTitle]               = useState('');
  const [newAmountRaw, setNewAmountRaw]       = useState('');
  const [newDate, setNewDate]                 = useState(localDateString());
  const [newCategory, setNewCategory]         = useState<ExpenseCategory>('food');
  const [newPayment, setNewPayment]           = useState<PaymentMethod>('card');
  const [newRepeat, setNewRepeat]             = useState<RepeatType>('monthly');

  // ── 수정 모달 ──
  const [editTarget, setEditTarget]           = useState<Schedule | null>(null);
  const [editTitle, setEditTitle]             = useState('');
  const [editAmountRaw, setEditAmountRaw]     = useState('');
  const [editDate, setEditDate]               = useState('');
  const [editCategory, setEditCategory]       = useState<ExpenseCategory>('food');
  const [editPayment, setEditPayment]         = useState<PaymentMethod>('card');
  const [editSaving, setEditSaving]           = useState(false);

  // ── 삭제 확인 ──
  const [deleteTarget, setDeleteTarget]       = useState<Schedule | null>(null);
  const [deleting, setDeleting]               = useState(false);

  // ── 유도된 값 ──
  const amountDisplay     = formatInputAmount(newAmountRaw);
  const editAmountDisplay = formatInputAmount(editAmountRaw);

  const filteredExpenses =
    listTab === 'fixed'    ? expenses.filter((e) => e.repeat && e.repeat !== 'none') :
    listTab === 'variable' ? expenses.filter((e) => !e.repeat || e.repeat === 'none') :
    expenses;

  // ── 지출 타입 변경 시 카테고리 기본값 리셋 ──
  const handleSetAddType = (t: ExpenseTypeTab) => {
    setAddType(t);
    setNewCategory(t === 'fixed' ? 'housing' : 'food');
    setNewRepeat(t === 'fixed' ? 'monthly' : 'none');
  };

  // ── 추가 모달 열기 ──
  const openAddModal = () => {
    setNewTitle(''); setNewAmountRaw('');
    setNewDate(localDateString());
    setAddType('variable'); setNewCategory('food');
    setNewPayment('card'); setNewRepeat('none');
    setShowAddModal(true);
  };

  // ── 추가 저장 ──
  const handleSave = async () => {
    if (!newTitle.trim() || !newAmountRaw) return;
    setSaving(true);
    const repeat: RepeatType = addType === 'variable' ? 'none' : newRepeat;
    const ok = await handleAddExpense({
      title:         newTitle.trim(),
      amount:        Number(newAmountRaw),
      date:          new Date(newDate),
      category:      newCategory,
      paymentMethod: newPayment,
      repeat,
    });
    setSaving(false);
    if (ok) setShowAddModal(false);
  };

  // ── 수정 모달 열기 ──
  const openEditModal = (e: Schedule) => {
    setEditTarget(e);
    setEditTitle(e.title);
    setEditAmountRaw(String(e.amount ?? ''));
    setEditDate(localDateString(e.startTime));
    setEditCategory(e.expenseCategory ?? 'other');
    setEditPayment(e.paymentMethod ?? 'card');
  };

  // ── 수정 저장 ──
  const handleEditSave = async () => {
    if (!editTarget || !editTitle.trim() || !editAmountRaw) return;
    setEditSaving(true);
    const ok = await handleUpdateExpense({
      id:            editTarget.id,
      title:         editTitle.trim(),
      amount:        Number(editAmountRaw),
      date:          new Date(editDate),
      category:      editCategory,
      paymentMethod: editPayment,
    });
    setEditSaving(false);
    if (ok) setEditTarget(null);
  };

  // ── 삭제 확인 ──
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await handleDeleteExpense(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const isFixed = (e: Schedule) => !!(e.repeat && e.repeat !== 'none');

  // ── D-day 계산 (고정지출 전용) ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getDDay(e: Schedule): { label: string; color: string; bg: string } | null {
    if (!isFixed(e) || e.status === 'completed') return null;
    const payDate = new Date(e.startTime.getFullYear(), e.startTime.getMonth(), e.startTime.getDate());
    const diffDays = Math.round((payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1)  return { label: `D-${diffDays}`,                 color: '#0084CC', bg: 'rgba(0,132,204,0.10)' };
    if (diffDays === 1) return { label: '내일 결제',                     color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' };
    if (diffDays === 0) return { label: '오늘 결제일',                   color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' };
    return               { label: `${Math.abs(diffDays)}일 경과`,        color: '#EF4444', bg: 'rgba(239,68,68,0.10)' };
  }

  return (
    <div
      className="min-h-dvh"
      style={{ background: '#FAFAFD', paddingBottom: 'var(--scroll-bottom, calc(env(safe-area-inset-bottom) + 80px))' }}
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

      {/* ── 바텀 시트 ── */}
      <div style={{ background: '#FAFAFD', borderRadius: '24px 24px 0 0', marginTop: '-20px', position: 'relative', zIndex: 10, paddingTop: '16px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px', paddingBottom: '40px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #0CC9B5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div>
            {/* ── 총액 + 고정/변동 분리 카드 ── */}
            <div style={{ padding: '0 16px', marginTop: '0' }}>
              <div style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', borderRadius: '28px', padding: '24px 24px 20px', boxShadow: '0 12px 40px rgba(0,132,204,0.30)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px', fontWeight: 600 }}>개인 지출 합계</p>
                <p style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-1.5px', margin: 0, lineHeight: 1.1 }}>{formatAmount(total)}</p>

                {/* 고정 / 변동 분리 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.65)', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>고정지출</p>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0 }}>{formatAmount(fixedTotal)}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: '2px 0 0', fontWeight: 600 }}>예정 {pendingCnt}건</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.65)', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>변동지출</p>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0 }}>{formatAmount(variableTotal)}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: '2px 0 0', fontWeight: 600 }}>반영 {completedCnt}건</p>
                  </div>
                </div>

                {/* 반영률 바 */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,0.20)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', background: 'rgba(255,255,255,0.85)', width: `${Math.min(completePct, 100)}%`, transition: 'width 0.7s ease' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Report ── */}
            <div style={{ padding: '0 16px', marginTop: '12px' }}>
              <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#8E8E93', marginBottom: '6px' }}>Report</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>
                  지난달보다 <span style={{ color: isLess ? '#10B981' : '#D97706' }}>{formatAmount(Math.abs(diff))}</span> {isLess ? '덜 썼어요 🎉' : '더 썼어요'}
                </p>
                {lastMonthTotal > 0 && <p style={{ fontSize: '13px', color: '#8E8E93', marginTop: '4px', fontWeight: 500 }}>지난달: {formatAmount(lastMonthTotal)}</p>}
              </div>
            </div>

            {/* ── Donut chart ── */}
            {categories.length > 0 && (
              <div style={{ padding: '0 16px', marginTop: '12px' }}>
                <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1B2E', marginBottom: '20px', width: '100%', textAlign: 'left' }}>카테고리별 지출 비율</h3>
                  <ExpenseDoughnut categories={categories} total={total} />
                </div>
              </div>
            )}

            {/* ── Category bars ── */}
            {categories.length > 0 && (
              <div style={{ padding: '0 16px', marginTop: '12px' }}>
                <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1B2E', marginBottom: '20px' }}>항목별 현황</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {categories.map(([cat, amt]) => {
                      const category = cat as ExpenseCategory;
                      const pct = total > 0 ? (amt / total) * 100 : 0;
                      const catColor = getCategoryColor(category);
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', background: `${catColor}18` }}>{EXPENSE_CATEGORY_ICONS[category]}</div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1B2E' }}>{EXPENSE_CATEGORY_LABELS[category]}</span>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1B2E' }}>{formatAmount(amt)}</span>
                          </div>
                          <div style={{ height: '5px', borderRadius: '999px', background: '#F5F5F7', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '999px', width: `${pct}%`, background: catColor, transition: 'width 1s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── 가계부 목록 상단 광고 ── */}
            <div style={{ padding: '0 16px', marginTop: '16px' }}>
              <AdSlot
                slotId="budget-list-top"
                width={335} height={60}
                adsenseSlotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BUDGET_TOP}
              />
            </div>

            {/* ── 지출 내역 ── */}
            <div style={{ padding: '0 16px', marginTop: '16px' }}>
              {/* 헤더 + 탭 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingLeft: '4px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['all', 'fixed', 'variable'] as ListTab[]).map((tab) => (
                    <button key={tab} onClick={() => setListTab(tab)} style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', background: listTab === tab ? '#1A1B2E' : '#F0F0F5', color: listTab === tab ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>
                      {tab === 'all' ? '전체' : tab === 'fixed' ? '고정' : '변동'}
                    </button>
                  ))}
                </div>
                <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 800, color: '#0084CC', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span style={{ fontSize: '17px', lineHeight: 1 }}>＋</span> 지출 추가
                </button>
              </div>

              {/* 리스트 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredExpenses.length > 0 ? filteredExpenses.map((e) => {
                  const catColor  = getCategoryColor(e.expenseCategory ?? 'other');
                  const fixed     = isFixed(e);
                  const done      = e.status === 'completed';
                  const ddayInfo  = getDDay(e);
                  const isOverdue = ddayInfo?.color === '#EF4444';
                  return (
                    <div key={e.id} style={{ background: isOverdue ? 'rgba(239,68,68,0.02)' : 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: isOverdue ? '1px solid rgba(239,68,68,0.18)' : '1px solid rgba(0,0,0,0.04)', borderLeft: isOverdue ? '3px solid #EF4444' : undefined, padding: '14px 14px 14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* 아이콘 */}
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', background: `${catColor}18`, flexShrink: 0 }}>
                        {EXPENSE_CATEGORY_ICONS[e.expenseCategory ?? 'other']}
                      </div>
                      {/* 내용 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: fixed ? '#0084CC' : '#10B981', background: fixed ? 'rgba(0,132,204,0.1)' : 'rgba(46,232,149,0.12)', padding: '2px 6px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{fixed ? '고정' : '변동'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ fontSize: '12px', color: '#8E8E93', margin: 0, fontWeight: 500 }}>
                            {e.startTime.getDate()}일 · {PAYMENT_METHOD_LABELS[e.paymentMethod ?? 'card']}
                          </p>
                          {ddayInfo && (
                            <span style={{ fontSize: '10px', fontWeight: 800, color: ddayInfo.color, background: ddayInfo.bg, padding: '1px 7px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                              {ddayInfo.label}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* 금액 + 액션 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>{formatAmount(e.amount ?? 0)}</p>
                          {fixed && (
                            <button onClick={() => handleToggleStatus(e.id, e.status)} style={{ fontSize: '10px', fontWeight: 700, color: done ? '#10B981' : isOverdue ? '#EF4444' : '#0084CC', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginTop: '2px' }}>
                              {done ? '✓ 완료' : isOverdue ? '미결제' : '결제예정'}
                            </button>
                          )}
                        </div>
                        {/* 수정 */}
                        <button onClick={() => openEditModal(e)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#F5F5F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {/* 삭제 */}
                        <button onClick={() => setDeleteTarget(e)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <button onClick={openAddModal} style={{ width: '100%', padding: '32px', borderRadius: '20px', border: '2px dashed #E5E5EA', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '32px' }}>💰</span>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#8E8E93', margin: 0 }}>
                      {listTab === 'fixed' ? '고정 지출을 추가해 보세요' : listTab === 'variable' ? '변동 지출을 추가해 보세요' : '지출을 추가해 보세요'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#C7C7CC', margin: 0 }}>고정 및 변동 지출 모두 관리</p>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 지출 추가 모달 ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>
          <div style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '32px 32px 0 0', padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '85dvh', overflowY: 'auto', overscrollBehavior: 'contain' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '20px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: '#E5E5EA' }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 16px' }}>지출 추가</h3>

            {/* 고정 / 변동 탭 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px', background: '#F5F5F7', borderRadius: '16px', padding: '4px' }}>
              <button onClick={() => handleSetAddType('fixed')} style={{ padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', background: addType === 'fixed' ? 'white' : 'transparent', color: addType === 'fixed' ? '#1A1B2E' : '#8E8E93', boxShadow: addType === 'fixed' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>🔒 고정지출</button>
              <button onClick={() => handleSetAddType('variable')} style={{ padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', background: addType === 'variable' ? 'white' : 'transparent', color: addType === 'variable' ? '#1A1B2E' : '#8E8E93', boxShadow: addType === 'variable' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>💸 변동지출</button>
            </div>

            {/* 카테고리 */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>카테고리</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(addType === 'fixed' ? FIXED_EXPENSE_CATEGORIES : VARIABLE_EXPENSE_CATEGORIES).map((cat) => (
                  <button key={cat} onClick={() => setNewCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: `2px solid ${newCategory === cat ? getCategoryColor(cat) : 'transparent'}`, cursor: 'pointer', background: newCategory === cat ? `${getCategoryColor(cat)}15` : '#F5F5F7', color: newCategory === cat ? getCategoryColor(cat) : '#8E8E93', transition: 'all 0.15s' }}>
                    <span>{EXPENSE_CATEGORY_ICONS[cat]}</span><span>{EXPENSE_CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 고정지출 주기 */}
            {addType === 'fixed' && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>결제 주기</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {FIXED_REPEAT_OPTIONS.map(({ value, label }) => (
                    <button key={value} onClick={() => setNewRepeat(value)} style={{ flex: 1, padding: '9px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', background: newRepeat === value ? '#1A1B2E' : '#F5F5F7', color: newRepeat === value ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>{label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* 항목명 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>항목명</p>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={addType === 'fixed' ? '예: 넷플릭스, 관리비, 보험료' : '예: 외식, 마트, 주유'} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: '#F5F5F7', border: `2px solid ${newTitle ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: '#1A1B2E', transition: 'border-color 0.2s' }} />
            </div>

            {/* 금액 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>금액</p>
              <div style={{ position: 'relative' }}>
                <input type="text" inputMode="numeric" value={amountDisplay} onChange={(e) => setNewAmountRaw(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={{ width: '100%', height: '56px', padding: '0 40px 0 16px', borderRadius: '14px', fontSize: '22px', fontWeight: 800, background: '#F5F5F7', border: `2px solid ${newAmountRaw ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: '#1A1B2E', transition: 'border-color 0.2s', letterSpacing: '-0.5px' }} />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', fontWeight: 700, color: newAmountRaw ? '#0084CC' : '#C7C7CC', pointerEvents: 'none' }}>원</span>
              </div>
              {newAmountRaw && Number(newAmountRaw) >= 10000 && (
                <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '6px', fontWeight: 600, paddingLeft: '4px' }}>{(Number(newAmountRaw) / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만원</p>
              )}
            </div>

            {/* 날짜 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>{addType === 'fixed' ? '첫 결제일' : '지출 날짜'}</p>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: '#F5F5F7', border: '2px solid transparent', outline: 'none', boxSizing: 'border-box', color: '#1A1B2E' }} />
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
              <button onClick={handleSave} disabled={saving || !newTitle.trim() || !newAmountRaw} style={{ width: '100%', height: '58px', borderRadius: '18px', background: newTitle.trim() && newAmountRaw ? 'linear-gradient(135deg, #0084CC, #0CC9B5)' : '#F0F0F5', border: 'none', cursor: newTitle.trim() && newAmountRaw ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 800, color: newTitle.trim() && newAmountRaw ? 'white' : '#AEAEA8', opacity: saving ? 0.7 : 1, boxShadow: newTitle.trim() && newAmountRaw ? '0 8px 24px rgba(0,132,204,0.25)' : 'none' }}>{saving ? '저장 중...' : '지출 등록'}</button>
              <button onClick={() => setShowAddModal(false)} style={{ width: '100%', height: '52px', borderRadius: '18px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 수정 모달 ── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setEditTarget(null)}>
          <div style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '32px 32px 0 0', padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)', maxHeight: '85dvh', overflowY: 'auto', overscrollBehavior: 'contain' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '20px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: '#E5E5EA' }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 20px' }}>지출 수정</h3>

            {/* 카테고리 */}
            <div style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>카테고리</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[...FIXED_EXPENSE_CATEGORIES, ...VARIABLE_EXPENSE_CATEGORIES].map((cat) => (
                  <button key={cat} onClick={() => setEditCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: `2px solid ${editCategory === cat ? getCategoryColor(cat) : 'transparent'}`, cursor: 'pointer', background: editCategory === cat ? `${getCategoryColor(cat)}15` : '#F5F5F7', color: editCategory === cat ? getCategoryColor(cat) : '#8E8E93', transition: 'all 0.15s' }}>
                    <span>{EXPENSE_CATEGORY_ICONS[cat]}</span><span>{EXPENSE_CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 항목명 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>항목명</p>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: '#F5F5F7', border: `2px solid ${editTitle ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: '#1A1B2E' }} />
            </div>

            {/* 금액 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>금액</p>
              <div style={{ position: 'relative' }}>
                <input type="text" inputMode="numeric" value={editAmountDisplay} onChange={(e) => setEditAmountRaw(e.target.value.replace(/[^0-9]/g, ''))} style={{ width: '100%', height: '56px', padding: '0 40px 0 16px', borderRadius: '14px', fontSize: '22px', fontWeight: 800, background: '#F5F5F7', border: `2px solid ${editAmountRaw ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: '#1A1B2E', letterSpacing: '-0.5px' }} />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', fontWeight: 700, color: '#C7C7CC', pointerEvents: 'none' }}>원</span>
              </div>
            </div>

            {/* 날짜 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>날짜</p>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: '#F5F5F7', border: '2px solid transparent', outline: 'none', boxSizing: 'border-box', color: '#1A1B2E' }} />
            </div>

            {/* 결제 방법 */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>결제 방법</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PAYMENT_METHODS.map((m) => (
                  <button key={m} onClick={() => setEditPayment(m)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', background: editPayment === m ? '#1A1B2E' : '#F5F5F7', color: editPayment === m ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>{PAYMENT_METHOD_LABELS[m]}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleEditSave} disabled={editSaving || !editTitle.trim() || !editAmountRaw} style={{ width: '100%', height: '58px', borderRadius: '18px', background: editTitle.trim() && editAmountRaw ? 'linear-gradient(135deg, #0084CC, #0CC9B5)' : '#F0F0F5', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 800, color: editTitle.trim() && editAmountRaw ? 'white' : '#AEAEA8', opacity: editSaving ? 0.7 : 1, boxShadow: editTitle.trim() && editAmountRaw ? '0 8px 24px rgba(0,132,204,0.25)' : 'none' }}>{editSaving ? '수정 중...' : '수정 완료'}</button>
              <button onClick={() => setEditTarget(null)} style={{ width: '100%', height: '52px', borderRadius: '18px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setDeleteTarget(null)}>
          <div style={{ background: 'white', borderRadius: '28px', padding: '28px', width: '100%', maxWidth: '340px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 6px' }}>지출 삭제</h3>
              <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0, lineHeight: 1.5 }}>
                <strong style={{ color: '#1A1B2E' }}>{deleteTarget.title}</strong>을(를)<br/>삭제하시겠습니까?
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, height: '52px', borderRadius: '16px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}>취소</button>
              <button onClick={confirmDelete} disabled={deleting} style={{ flex: 1, height: '52px', borderRadius: '16px', background: '#EF4444', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'white', opacity: deleting ? 0.7 : 1, boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>{deleting ? '삭제 중...' : '삭제'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
