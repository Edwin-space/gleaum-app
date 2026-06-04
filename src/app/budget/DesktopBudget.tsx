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

interface DesktopBudgetProps {
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

export function DesktopBudget({
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
}: DesktopBudgetProps) {
  // ── 리스트 탭 ──
  const [listTab, setListTab] = useState<ListTab>('all');

  // ── 지출 추가 모달 ──
  const [showAddModal, setShowAddModal]   = useState(false);
  const [addType, setAddType]             = useState<ExpenseTypeTab>('variable');
  const [saving, setSaving]               = useState(false);
  const [newTitle, setNewTitle]           = useState('');
  const [newAmountRaw, setNewAmountRaw]   = useState('');
  const [newDate, setNewDate]             = useState(localDateString());
  const [newCategory, setNewCategory]     = useState<ExpenseCategory>('food');
  const [newPayment, setNewPayment]       = useState<PaymentMethod>('card');
  const [newRepeat, setNewRepeat]         = useState<RepeatType>('monthly');

  // ── 수정 모달 ──
  const [editTarget, setEditTarget]       = useState<Schedule | null>(null);
  const [editTitle, setEditTitle]         = useState('');
  const [editAmountRaw, setEditAmountRaw] = useState('');
  const [editDate, setEditDate]           = useState('');
  const [editCategory, setEditCategory]   = useState<ExpenseCategory>('food');
  const [editPayment, setEditPayment]     = useState<PaymentMethod>('card');
  const [editSaving, setEditSaving]       = useState(false);

  // ── 삭제 확인 ──
  const [deleteTarget, setDeleteTarget]   = useState<Schedule | null>(null);
  const [deleting, setDeleting]           = useState(false);

  const amountDisplay     = formatInputAmount(newAmountRaw);
  const editAmountDisplay = formatInputAmount(editAmountRaw);

  const filteredExpenses =
    listTab === 'fixed'    ? expenses.filter((e) => e.repeat && e.repeat !== 'none') :
    listTab === 'variable' ? expenses.filter((e) => !e.repeat || e.repeat === 'none') :
    expenses;

  const handleSetAddType = (t: ExpenseTypeTab) => {
    setAddType(t);
    setNewCategory(t === 'fixed' ? 'housing' : 'food');
    setNewRepeat(t === 'fixed' ? 'monthly' : 'none');
  };

  const openAddModal = () => {
    setNewTitle(''); setNewAmountRaw(''); setNewDate(localDateString());
    setAddType('variable'); setNewCategory('food'); setNewPayment('card'); setNewRepeat('none');
    setShowAddModal(true);
  };

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

  const openEditModal = (e: Schedule) => {
    setEditTarget(e);
    setEditTitle(e.title);
    setEditAmountRaw(String(e.amount ?? ''));
    setEditDate(localDateString(e.startTime));
    setEditCategory(e.expenseCategory ?? 'other');
    setEditPayment(e.paymentMethod ?? 'card');
  };

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
    if (diffDays > 1)   return { label: `D-${diffDays}`,          color: '#0084CC', bg: 'rgba(0,132,204,0.10)' };
    if (diffDays === 1) return { label: '내일 결제',               color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' };
    if (diffDays === 0) return { label: '오늘 결제일',             color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' };
    return               { label: `${Math.abs(diffDays)}일 경과`, color: '#EF4444', bg: 'rgba(239,68,68,0.10)' };
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── 페이지 헤더 ── */}
      <div style={{ position: 'relative', padding: '36px 44px', borderRadius: '28px', overflow: 'hidden', background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)', color: 'white', marginBottom: '28px', boxShadow: '0 14px 44px rgba(26,27,46,0.2)' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(12,201,181,0.12)', filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '20%', width: '150px', height: '150px', background: 'rgba(0,132,204,0.12)', filter: 'blur(48px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', margin: '0 0 6px' }}>가계부 리포트</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: 0 }}>이번 달 자금 흐름과 소비 패턴을 분석합니다</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, #0CC9B5, #0084CC)', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 800, color: 'white', boxShadow: '0 4px 16px rgba(0,132,204,0.35)', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>＋</span> 지출 추가
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '18px', padding: '6px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <button onClick={prevMonth} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18L9 12L15 6"/></svg>
              </button>
              <span style={{ fontSize: '17px', fontWeight: 900, padding: '0 16px', letterSpacing: '-0.3px' }}>
                {formatMonthYear(viewDate)} {isCurrentMonth && <span style={{ fontSize: '12px', color: '#2EE895', fontWeight: 700 }}>· 이번 달</span>}
              </span>
              <button onClick={nextMonth} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18L15 12L9 6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(12,201,181,0.2)', borderTopColor: '#0CC9B5', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

          {/* ── 왼쪽 요약 패널 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 총액 카드 */}
            <div style={{ borderRadius: '28px', padding: '28px', color: 'white', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', boxShadow: '0 12px 36px rgba(0,132,204,0.3)' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.12)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>Monthly Total</p>
                <h2 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1px', margin: '0 0 20px', lineHeight: 1 }}>{formatAmount(total)}</h2>

                {/* 고정/변동 분리 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>고정지출</p>
                    <p style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 2px' }}>{formatAmount(fixedTotal)}</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 600 }}>예정 {pendingCnt}건</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>변동지출</p>
                    <p style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 2px' }}>{formatAmount(variableTotal)}</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 600 }}>반영 {completedCnt}건</p>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                    <span>지출 반영률</span><span>{Math.round(completePct)}%</span>
                  </div>
                  <div style={{ height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', background: 'var(--theme-surface)', transition: 'width 1s ease', width: `${completePct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 전월 비교 */}
            <div style={{ background: 'var(--theme-surface)', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#C7C7CC', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>전월 비교</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', background: isLess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>{isLess ? '📉' : '📈'}</div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: '0 0 3px' }}>전월 대비</p>
                  <p style={{ fontSize: '18px', fontWeight: 900, color: isLess ? '#10B981' : '#EF4444', margin: 0 }}>{formatAmount(Math.abs(diff))} {isLess ? '절약' : '증가'}</p>
                </div>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--theme-text-subtle)', fontWeight: 600, margin: 0 }}>
                지난달({formatAmount(lastMonthTotal)}) 대비{' '}
                <span style={{ fontWeight: 800, color: 'var(--theme-text)' }}>{lastMonthTotal > 0 ? Math.round((Math.abs(diff) / lastMonthTotal) * 100) : 0}%</span>{' '}
                {isLess ? '줄었습니다' : '늘었습니다'}.
              </p>
            </div>
          </div>

          {/* ── 오른쪽 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 차트 2-컬럼 */}
            {categories.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'var(--theme-surface)', borderRadius: '24px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '300px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 20px', width: '100%' }}>카테고리 분석</h3>
                  <ExpenseDoughnut categories={categories} total={total} />
                </div>
                <div style={{ background: 'var(--theme-surface)', borderRadius: '24px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 20px' }}>항목별 비율</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {categories.map(([cat, amt]) => {
                      const category = cat as ExpenseCategory;
                      const pct = total > 0 ? (amt / total) * 100 : 0;
                      const catColor = getCategoryColor(category);
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '34px', height: '34px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', background: `${catColor}15` }}>{EXPENSE_CATEGORY_ICONS[category]}</div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text)' }}>{EXPENSE_CATEGORY_LABELS[category]}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '13px', fontWeight: 900, color: 'var(--theme-text)', margin: 0 }}>{formatAmount(amt)}</p>
                              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: 0 }}>{Math.round(pct)}%</p>
                            </div>
                          </div>
                          <div style={{ height: '4px', borderRadius: '999px', background: '#F5F5F9', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '999px', background: catColor, width: `${pct}%`, transition: 'width 1s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 지출 목록 */}
            <div style={{ background: 'var(--theme-surface)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid #F5F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: 0 }}>지출 내역</h3>
                  {/* 탭 */}
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--theme-surface-muted)', borderRadius: '12px', padding: '3px' }}>
                    {(['all', 'fixed', 'variable'] as ListTab[]).map((tab) => (
                      <button key={tab} onClick={() => setListTab(tab)} style={{ padding: '5px 12px', borderRadius: '9px', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', background: listTab === tab ? 'white' : 'transparent', color: listTab === tab ? '#1A1B2E' : '#8E8E93', boxShadow: listTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                        {tab === 'all' ? '전체' : tab === 'fixed' ? '고정' : '변동'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)' }}>{filteredExpenses.length}건</span>
                  <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 800, color: '#0084CC', background: 'rgba(0,132,204,0.06)', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span> 추가
                  </button>
                </div>
              </div>

              {filteredExpenses.length > 0 ? (
                <div>
                  {filteredExpenses.map((e, idx) => {
                    const fixed     = isFixed(e);
                    const done      = e.status === 'completed';
                    const catColor  = getCategoryColor(e.expenseCategory ?? 'other');
                    const ddayInfo  = getDDay(e);
                    const isOverdue = ddayInfo?.color === '#EF4444';
                    return (
                      <div key={e.id} style={{ padding: '16px 28px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: idx < filteredExpenses.length - 1 ? '1px solid #F7F7FA' : 'none', background: isOverdue ? 'rgba(239,68,68,0.015)' : 'transparent', borderLeft: isOverdue ? '3px solid #EF4444' : '3px solid transparent' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', background: `${catColor}15`, flexShrink: 0 }}>
                          {EXPENSE_CATEGORY_ICONS[e.expenseCategory ?? 'other']}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: fixed ? '#0084CC' : '#10B981', background: fixed ? 'rgba(0,132,204,0.08)' : 'rgba(46,232,149,0.12)', padding: '2px 7px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{fixed ? '고정' : '변동'}</span>
                            {ddayInfo && (
                              <span style={{ fontSize: '10px', fontWeight: 800, color: ddayInfo.color, background: ddayInfo.bg, padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {ddayInfo.label}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-subtle)' }}>{EXPENSE_CATEGORY_LABELS[e.expenseCategory ?? 'other']}</span>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#D0D0D0' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-subtle)' }}>{e.startTime.getDate()}일</span>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#D0D0D0' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-subtle)' }}>{PAYMENT_METHOD_LABELS[e.paymentMethod ?? 'card']}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '16px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 2px' }}>{formatAmount(e.amount ?? 0)}</p>
                            {fixed && (
                              <button onClick={() => handleToggleStatus(e.id, e.status)} style={{ fontSize: '11px', fontWeight: 700, color: done ? '#10B981' : isOverdue ? '#EF4444' : '#0084CC', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                {done ? '✓ 결제완료' : isOverdue ? '미결제' : '결제예정'}
                              </button>
                            )}
                            {!fixed && <p style={{ fontSize: '11px', fontWeight: 700, margin: 0, color: '#10B981' }}>지출반영</p>}
                          </div>
                          {/* 수정 버튼 */}
                          <button onClick={() => openEditModal(e)} title="수정" style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-subtle)', transition: 'all 0.15s' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {/* 삭제 버튼 */}
                          <button onClick={() => setDeleteTarget(e)} title="삭제" style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', transition: 'all 0.15s' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '40px', marginBottom: '12px' }}>💰</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--theme-text)', margin: '0 0 6px' }}>
                    {listTab === 'fixed' ? '고정 지출이 없습니다' : listTab === 'variable' ? '변동 지출이 없습니다' : '지출을 추가해 보세요'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', margin: '0 0 20px' }}>고정 및 변동 지출을 구분해서 관리할 수 있습니다</p>
                  <button onClick={openAddModal} style={{ padding: '12px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #0084CC, #0CC9B5)', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 800, color: 'white', boxShadow: '0 6px 20px rgba(0,132,204,0.25)' }}>＋ 지출 추가하기</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 지출 추가 모달 (데스크탑: 중앙) ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: 'var(--theme-surface)', borderRadius: '28px', padding: '36px', width: '100%', maxWidth: '520px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--theme-text)', margin: 0 }}>지출 추가</h3>
              <button onClick={() => setShowAddModal(false)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-subtle)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* 고정 / 변동 탭 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px', background: 'var(--theme-surface-muted)', borderRadius: '16px', padding: '4px' }}>
              <button onClick={() => handleSetAddType('fixed')} style={{ padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', background: addType === 'fixed' ? 'white' : 'transparent', color: addType === 'fixed' ? '#1A1B2E' : '#8E8E93', boxShadow: addType === 'fixed' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>🔒 고정지출</button>
              <button onClick={() => handleSetAddType('variable')} style={{ padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', background: addType === 'variable' ? 'white' : 'transparent', color: addType === 'variable' ? '#1A1B2E' : '#8E8E93', boxShadow: addType === 'variable' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>💸 변동지출</button>
            </div>

            {/* 카테고리 */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>카테고리</p>
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
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>결제 주기</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {FIXED_REPEAT_OPTIONS.map(({ value, label }) => (
                    <button key={value} onClick={() => setNewRepeat(value)} style={{ flex: 1, padding: '9px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', background: newRepeat === value ? '#1A1B2E' : '#F5F5F7', color: newRepeat === value ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>{label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* 항목명 + 금액/날짜 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>항목명</p>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} placeholder={addType === 'fixed' ? '예: 넷플릭스, 관리비, 보험료' : '예: 외식, 마트, 주유'} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: 'var(--theme-surface-muted)', border: `2px solid ${newTitle ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)', transition: 'border-color 0.2s' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>금액</p>
                <div style={{ position: 'relative' }}>
                  <input type="text" inputMode="numeric" value={amountDisplay} onChange={(e) => setNewAmountRaw(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={{ width: '100%', height: '52px', padding: '0 40px 0 16px', borderRadius: '14px', fontSize: '18px', fontWeight: 800, background: 'var(--theme-surface-muted)', border: `2px solid ${newAmountRaw ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)', transition: 'border-color 0.2s' }} />
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: 700, color: 'var(--theme-text-subtle)', pointerEvents: 'none' }}>원</span>
                </div>
                {newAmountRaw && Number(newAmountRaw) >= 10000 && <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', marginTop: '5px', fontWeight: 600 }}>{(Number(newAmountRaw) / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만원</p>}
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>{addType === 'fixed' ? '첫 결제일' : '지출 날짜'}</p>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: 'var(--theme-surface-muted)', border: '2px solid transparent', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }} />
              </div>
            </div>

            {/* 결제 방법 */}
            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>결제 방법</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PAYMENT_METHODS.map((m) => (
                  <button key={m} onClick={() => setNewPayment(m)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', background: newPayment === m ? '#1A1B2E' : '#F5F5F7', color: newPayment === m ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>{PAYMENT_METHOD_LABELS[m]}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, height: '52px', borderRadius: '16px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>취소</button>
              <button onClick={handleSave} disabled={saving || !newTitle.trim() || !newAmountRaw} style={{ flex: 2, height: '52px', borderRadius: '16px', background: newTitle.trim() && newAmountRaw ? 'linear-gradient(135deg, #0084CC, #0CC9B5)' : '#F0F0F5', border: 'none', cursor: newTitle.trim() && newAmountRaw ? 'pointer' : 'not-allowed', fontSize: '15px', fontWeight: 800, color: newTitle.trim() && newAmountRaw ? 'white' : '#AEAEA8', opacity: saving ? 0.7 : 1 }}>{saving ? '저장 중...' : '지출 등록'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 수정 모달 ── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditTarget(null)}>
          <div style={{ background: 'var(--theme-surface)', borderRadius: '28px', padding: '36px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--theme-text)', margin: 0 }}>지출 수정</h3>
              <button onClick={() => setEditTarget(null)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-subtle)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* 카테고리 */}
            <div style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>카테고리</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[...FIXED_EXPENSE_CATEGORIES, ...VARIABLE_EXPENSE_CATEGORIES].map((cat) => (
                  <button key={cat} onClick={() => setEditCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: `2px solid ${editCategory === cat ? getCategoryColor(cat) : 'transparent'}`, cursor: 'pointer', background: editCategory === cat ? `${getCategoryColor(cat)}15` : '#F5F5F7', color: editCategory === cat ? getCategoryColor(cat) : '#8E8E93', transition: 'all 0.15s' }}>
                    <span>{EXPENSE_CATEGORY_ICONS[cat]}</span><span>{EXPENSE_CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>항목명</p>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEditSave()} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: 'var(--theme-surface-muted)', border: `2px solid ${editTitle ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>금액</p>
                <div style={{ position: 'relative' }}>
                  <input type="text" inputMode="numeric" value={editAmountDisplay} onChange={(e) => setEditAmountRaw(e.target.value.replace(/[^0-9]/g, ''))} style={{ width: '100%', height: '52px', padding: '0 40px 0 16px', borderRadius: '14px', fontSize: '18px', fontWeight: 800, background: 'var(--theme-surface-muted)', border: `2px solid ${editAmountRaw ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }} />
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: 700, color: 'var(--theme-text-subtle)', pointerEvents: 'none' }}>원</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>날짜</p>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: 'var(--theme-surface-muted)', border: '2px solid transparent', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }} />
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px', letterSpacing: '0.5px' }}>결제 방법</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PAYMENT_METHODS.map((m) => (
                  <button key={m} onClick={() => setEditPayment(m)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', background: editPayment === m ? '#1A1B2E' : '#F5F5F7', color: editPayment === m ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>{PAYMENT_METHOD_LABELS[m]}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEditTarget(null)} style={{ flex: 1, height: '52px', borderRadius: '16px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>취소</button>
              <button onClick={handleEditSave} disabled={editSaving || !editTitle.trim() || !editAmountRaw} style={{ flex: 2, height: '52px', borderRadius: '16px', background: editTitle.trim() && editAmountRaw ? 'linear-gradient(135deg, #0084CC, #0CC9B5)' : '#F0F0F5', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: editTitle.trim() && editAmountRaw ? 'white' : '#AEAEA8', opacity: editSaving ? 0.7 : 1 }}>{editSaving ? '수정 중...' : '수정 완료'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDeleteTarget(null)}>
          <div style={{ background: 'var(--theme-surface)', borderRadius: '28px', padding: '32px', width: '100%', maxWidth: '360px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 8px' }}>지출 삭제</h3>
              <p style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', margin: 0, lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--theme-text)' }}>{deleteTarget.title}</strong>을(를)<br/>삭제하시겠습니까?
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, height: '52px', borderRadius: '16px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>취소</button>
              <button onClick={confirmDelete} disabled={deleting} style={{ flex: 1, height: '52px', borderRadius: '16px', background: '#EF4444', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'white', opacity: deleting ? 0.7 : 1, boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>{deleting ? '삭제 중...' : '삭제'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
