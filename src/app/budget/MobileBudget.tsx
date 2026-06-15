'use client';

import { useState } from 'react';
import { formatAmount, formatMonthYear, parseDateInput } from '@/lib/utils';
import type { LedgerEntry, LedgerCategory, LedgerStatus, PaymentMethod, RecurFreq } from '@/types';
import type { BudgetViewProps } from './page';
import {
  ledgerCatLabel, ledgerCatIcon, ledgerCatColor,
  categoryOptions, formatInputAmount, localDateString,
  PAYMENT_METHODS, PAYMENT_METHOD_LABELS, RECUR_OPTIONS,
} from './ledgerHelpers';
import { ExpenseDoughnut } from '@/components/budget/ExpenseDoughnut';
import { AdSlot } from '@/components/AdSlot';

type EntryMode = 'recurring' | 'onetime';
type ListTab = 'all' | 'recurring' | 'onetime';

export function MobileBudget(props: BudgetViewProps) {
  const {
    loading, viewDate, prevMonth, nextMonth, isCurrentMonth,
    kind, setKind,
    incomeTotal, expenseTotal, net, savingsRate,
    entries, currentTotal, categories,
    fixedTotal, variableTotal, pendingCnt, completedCnt,
    recurringIncomeTotal, onceIncomeTotal, incomePendingCnt, incomeReceivedCnt,
    diff, isLess, lastMonthTotal,
    handleToggleStatus, handleAdd, handleUpdate, handleDelete,
  } = props;

  const isIncome = kind === 'income';

  const [listTab, setListTab] = useState<ListTab>('all');

  // ── 추가 모달 ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode]           = useState<EntryMode>('onetime');
  const [saving, setSaving]             = useState(false);
  const [newTitle, setNewTitle]         = useState('');
  const [newAmountRaw, setNewAmountRaw] = useState('');
  const [newDate, setNewDate]           = useState(localDateString());
  const [newCategory, setNewCategory]   = useState<LedgerCategory>('food');
  const [newPayment, setNewPayment]     = useState<PaymentMethod>('card');
  const [newRecur, setNewRecur]         = useState<RecurFreq>('monthly');

  // ── 수정 모달 ──
  const [editTarget, setEditTarget]     = useState<LedgerEntry | null>(null);
  const [editTitle, setEditTitle]       = useState('');
  const [editAmountRaw, setEditAmountRaw] = useState('');
  const [editDate, setEditDate]         = useState('');
  const [editCategory, setEditCategory] = useState<LedgerCategory>('food');
  const [editPayment, setEditPayment]   = useState<PaymentMethod>('card');
  const [editSaving, setEditSaving]     = useState(false);

  // ── 삭제 ──
  const [deleteTarget, setDeleteTarget] = useState<LedgerEntry | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const amountDisplay     = formatInputAmount(newAmountRaw);
  const editAmountDisplay = formatInputAmount(editAmountRaw);

  const isRecur = (e: LedgerEntry) => e.recurFreq !== 'none';

  const filtered =
    listTab === 'recurring' ? entries.filter(isRecur) :
    listTab === 'onetime'   ? entries.filter((e) => !isRecur(e)) :
    entries;

  const catOpts = categoryOptions(kind, addMode === 'recurring' ? 'fixed' : 'variable');
  const editCatOpts = [...categoryOptions(kind, 'fixed'), ...categoryOptions(kind, 'variable')]
    .filter((c, i, a) => a.indexOf(c) === i);

  const setMode = (m: EntryMode) => {
    setAddMode(m);
    setNewCategory(categoryOptions(kind, m === 'recurring' ? 'fixed' : 'variable')[0]);
    setNewRecur(m === 'recurring' ? 'monthly' : 'none');
  };

  const openAddModal = () => {
    const m: EntryMode = 'onetime';
    setAddMode(m);
    setNewTitle(''); setNewAmountRaw(''); setNewDate(localDateString());
    setNewCategory(categoryOptions(kind, 'variable')[0]);
    setNewPayment('card'); setNewRecur('none');
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!newTitle.trim() || !newAmountRaw) return;
    setSaving(true);
    const recurFreq: RecurFreq = addMode === 'recurring' ? newRecur : 'none';
    const ok = await handleAdd({
      kind, title: newTitle.trim(), amount: Number(newAmountRaw),
      date: parseDateInput(newDate), category: newCategory,
      method: isIncome ? undefined : newPayment, recurFreq,
    });
    setSaving(false);
    if (ok) setShowAddModal(false);
  };

  const openEditModal = (e: LedgerEntry) => {
    setEditTarget(e);
    setEditTitle(e.title);
    setEditAmountRaw(String(e.amount ?? ''));
    setEditDate(localDateString(e.occurredAt));
    setEditCategory(e.category);
    setEditPayment((e.method as PaymentMethod) ?? 'card');
  };

  const handleEditSave = async () => {
    if (!editTarget || !editTitle.trim() || !editAmountRaw) return;
    setEditSaving(true);
    const ok = await handleUpdate({
      id: editTarget.id, title: editTitle.trim(), amount: Number(editAmountRaw),
      date: parseDateInput(editDate), category: editCategory,
      method: editTarget.kind === 'income' ? undefined : editPayment,
    });
    setEditSaving(false);
    if (ok) setEditTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await handleDelete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── D-day (정기지출 미결제 전용) ──
  const today = new Date(); today.setHours(0, 0, 0, 0);
  function getDDay(e: LedgerEntry): { label: string; color: string; bg: string } | null {
    if (isIncome || !isRecur(e) || e.status === 'completed') return null;
    const payDate = new Date(e.occurredAt.getFullYear(), e.occurredAt.getMonth(), e.occurredAt.getDate());
    const diffDays = Math.round((payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1)   return { label: `D-${diffDays}`,            color: '#0084CC', bg: 'rgba(0,132,204,0.10)' };
    if (diffDays === 1) return { label: '내일 결제',                 color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' };
    if (diffDays === 0) return { label: '오늘 결제일',               color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' };
    return                { label: `${Math.abs(diffDays)}일 경과`,   color: '#EF4444', bg: 'rgba(239,68,68,0.10)' };
  }

  const accent = isIncome ? '#10B981' : '#0084CC';
  const recurLabel = isIncome ? '정기' : '고정';
  const onceLabel  = isIncome ? '일회' : '변동';

  return (
    <div className="min-h-dvh" style={{ background: 'var(--theme-bg)', paddingBottom: 'var(--scroll-bottom, calc(env(safe-area-inset-bottom) + 80px))' }}>
      {/* ── Hero Header ── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0F1A2E 0%, #0D2A22 50%, #1A3A2E 100%)', paddingTop: 'calc(env(safe-area-inset-top) + 52px)', paddingBottom: '36px', paddingLeft: '20px', paddingRight: '20px' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,232,149,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
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

      <div style={{ background: 'var(--theme-bg)', borderRadius: '24px 24px 0 0', marginTop: '-20px', position: 'relative', zIndex: 10, paddingTop: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px', paddingBottom: '40px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #0CC9B5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div>
            {/* ── 순액(흑자/적자) 요약 카드 ── */}
            <div style={{ padding: '0 16px' }}>
              <div style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', borderRadius: '28px', padding: '24px', boxShadow: '0 12px 40px rgba(0,132,204,0.30)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px', fontWeight: 600 }}>이번 달 순액 {net >= 0 ? '(흑자)' : '(적자)'}</p>
                <p style={{ fontSize: '34px', fontWeight: 800, color: 'white', letterSpacing: '-1.5px', margin: 0, lineHeight: 1.1 }}>{net >= 0 ? '+' : '−'}{formatAmount(Math.abs(net))}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.65)', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>수입</p>
                    <p style={{ fontSize: '17px', fontWeight: 800, color: 'white', margin: 0 }}>{formatAmount(incomeTotal)}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.65)', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>지출</p>
                    <p style={{ fontSize: '17px', fontWeight: 800, color: 'white', margin: 0 }}>{formatAmount(expenseTotal)}</p>
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '6px' }}>
                    <span>저축률</span><span>{savingsRate}%</span>
                  </div>
                  <div style={{ height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,0.20)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', background: 'rgba(255,255,255,0.85)', width: `${savingsRate}%`, transition: 'width 0.7s ease' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── 수입/지출 토글 ── */}
            <div style={{ padding: '12px 16px 0' }}>
              <div style={{ display: 'flex', gap: '6px', background: 'var(--theme-surface-muted)', borderRadius: '14px', padding: '5px' }}>
                {(['expense', 'income'] as const).map((k) => (
                  <button key={k} onClick={() => { setKind(k); setListTab('all'); }} style={{
                    flex: 1, padding: '11px', borderRadius: '10px', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer',
                    background: kind === k ? (k === 'income' ? '#10B981' : '#0084CC') : 'transparent',
                    color: kind === k ? 'white' : 'var(--theme-text-muted)', transition: 'all 0.15s',
                  }}>{k === 'income' ? '💰 수입' : '💳 지출'}</button>
                ))}
              </div>
            </div>

            {/* ── kind별 합계 미니 ── */}
            <div style={{ padding: '12px 16px 0' }}>
              <div style={{ background: 'var(--theme-surface)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', margin: '0 0 2px', fontWeight: 600 }}>{isIncome ? '이번 달 수입 합계' : '이번 달 지출 합계'}</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--theme-text)', margin: 0 }}>{formatAmount(currentTotal)}</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 700, color: 'var(--theme-text-subtle)', lineHeight: 1.7 }}>
                  {isIncome ? (
                    <>정기 {formatAmount(recurringIncomeTotal)}<br />일회 {formatAmount(onceIncomeTotal)}</>
                  ) : (
                    <>고정 {formatAmount(fixedTotal)} · 예정 {pendingCnt}<br />변동 {formatAmount(variableTotal)} · 반영 {completedCnt}</>
                  )}
                </div>
              </div>
            </div>

            {/* ── 전월 비교 ── */}
            <div style={{ padding: '12px 16px 0' }}>
              <div style={{ background: 'var(--theme-surface)', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--theme-text-subtle)', marginBottom: '6px' }}>Report</p>
                <p style={{ fontSize: '17px', fontWeight: 800, color: 'var(--theme-text)', margin: 0 }}>
                  지난달보다 <span style={{ color: isIncome ? (isLess ? '#D97706' : '#10B981') : (isLess ? '#10B981' : '#D97706') }}>{formatAmount(Math.abs(diff))}</span> {isLess ? (isIncome ? '덜 벌었어요' : '덜 썼어요 🎉') : (isIncome ? '더 벌었어요 🎉' : '더 썼어요')}
                </p>
                {lastMonthTotal > 0 && <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', marginTop: '4px', fontWeight: 500 }}>지난달: {formatAmount(lastMonthTotal)}</p>}
              </div>
            </div>

            {/* ── 카테고리 도넛 ── */}
            {categories.length > 0 && (
              <div style={{ padding: '12px 16px 0' }}>
                <div style={{ background: 'var(--theme-surface)', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)', marginBottom: '20px', width: '100%', textAlign: 'left' }}>{isIncome ? '수입 카테고리 비율' : '카테고리별 지출 비율'}</h3>
                  <ExpenseDoughnut categories={categories} total={currentTotal} colorOf={(c) => ledgerCatColor(kind, c as LedgerCategory)} />
                </div>
              </div>
            )}

            {/* ── 카테고리 막대 ── */}
            {categories.length > 0 && (
              <div style={{ padding: '12px 16px 0' }}>
                <div style={{ background: 'var(--theme-surface)', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)', marginBottom: '20px' }}>항목별 현황</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {categories.map(([cat, amt]) => {
                      const c = cat as LedgerCategory;
                      const pct = currentTotal > 0 ? (amt / currentTotal) * 100 : 0;
                      const col = ledgerCatColor(kind, c);
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', background: `${col}18` }}>{ledgerCatIcon(kind, c)}</div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text)' }}>{ledgerCatLabel(kind, c)}</span>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text)' }}>{formatAmount(amt)}</span>
                          </div>
                          <div style={{ height: '5px', borderRadius: '999px', background: 'var(--theme-surface-muted)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '999px', width: `${pct}%`, background: col, transition: 'width 1s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── 광고 ── */}
            <div style={{ padding: '0 16px', marginTop: '16px' }}>
              <AdSlot slotId="budget-list-top" width={335} height={60} adsenseSlotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BUDGET_TOP} />
            </div>

            {/* ── 목록 ── */}
            <div style={{ padding: '0 16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingLeft: '4px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['all', 'recurring', 'onetime'] as ListTab[]).map((tab) => (
                    <button key={tab} onClick={() => setListTab(tab)} style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', background: listTab === tab ? '#1A1B2E' : '#F0F0F5', color: listTab === tab ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>
                      {tab === 'all' ? '전체' : tab === 'recurring' ? recurLabel : onceLabel}
                    </button>
                  ))}
                </div>
                <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 800, color: accent, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span style={{ fontSize: '17px', lineHeight: 1 }}>＋</span> {isIncome ? '수입 추가' : '지출 추가'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filtered.length > 0 ? filtered.map((e) => {
                  const col = ledgerCatColor(kind, e.category);
                  const recur = isRecur(e);
                  const done = e.status === 'completed';
                  const dday = getDDay(e);
                  const overdue = dday?.color === '#EF4444';
                  return (
                    <div key={e.id} style={{ background: overdue ? 'rgba(239,68,68,0.02)' : 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: overdue ? '1px solid rgba(239,68,68,0.18)' : '1px solid rgba(0,0,0,0.04)', borderLeft: overdue ? '3px solid #EF4444' : undefined, padding: '14px 14px 14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', background: `${col}18`, flexShrink: 0 }}>{ledgerCatIcon(kind, e.category)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--theme-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: recur ? accent : '#10B981', background: recur ? `${accent}1A` : 'rgba(46,232,149,0.12)', padding: '2px 6px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{recur ? recurLabel : onceLabel}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', margin: 0, fontWeight: 500 }}>
                            {e.occurredAt.getDate()}일{!isIncome && e.method ? ` · ${PAYMENT_METHOD_LABELS[e.method as PaymentMethod]}` : ''}
                          </p>
                          {dday && <span style={{ fontSize: '10px', fontWeight: 800, color: dday.color, background: dday.bg, padding: '1px 7px', borderRadius: '6px', whiteSpace: 'nowrap' }}>{dday.label}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '15px', fontWeight: 800, color: isIncome ? '#10B981' : 'var(--theme-text)', margin: 0 }}>{isIncome ? '+' : ''}{formatAmount(e.amount ?? 0)}</p>
                          {recur && (
                            <button onClick={() => handleToggleStatus(e.id, e.status)} style={{ fontSize: '10px', fontWeight: 700, color: done ? '#10B981' : overdue ? '#EF4444' : accent, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginTop: '2px' }}>
                              {done ? (isIncome ? '✓ 수령' : '✓ 완료') : isIncome ? '수령예정' : overdue ? '미결제' : '결제예정'}
                            </button>
                          )}
                        </div>
                        <button onClick={() => openEditModal(e)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-subtle)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteTarget(e)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <button onClick={openAddModal} style={{ width: '100%', padding: '32px', borderRadius: '20px', border: '2px dashed #E5E5EA', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '32px' }}>{isIncome ? '💰' : '💳'}</span>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: 0 }}>{isIncome ? '수입을 추가해 보세요' : '지출을 추가해 보세요'}</p>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 추가 모달 ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>
          <div style={{ width: '100%', maxWidth: '600px', background: 'var(--theme-surface)', borderRadius: '32px 32px 0 0', padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '85dvh', overflowY: 'auto', overscrollBehavior: 'contain' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '20px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'var(--theme-surface-muted)' }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 16px' }}>{isIncome ? '수입 추가' : '지출 추가'}</h3>

            {/* 정기/일회 (또는 고정/변동) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px', background: 'var(--theme-surface-muted)', borderRadius: '16px', padding: '4px' }}>
              <button onClick={() => setMode('recurring')} style={{ padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', background: addMode === 'recurring' ? 'var(--theme-surface)' : 'transparent', color: addMode === 'recurring' ? 'var(--theme-text)' : 'var(--theme-text-muted)', boxShadow: addMode === 'recurring' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>🔒 {recurLabel}{isIncome ? '수입' : '지출'}</button>
              <button onClick={() => setMode('onetime')} style={{ padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', background: addMode === 'onetime' ? 'var(--theme-surface)' : 'transparent', color: addMode === 'onetime' ? 'var(--theme-text)' : 'var(--theme-text-muted)', boxShadow: addMode === 'onetime' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>💸 {onceLabel}{isIncome ? '수입' : '지출'}</button>
            </div>

            {/* 카테고리 */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>카테고리</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {catOpts.map((cat) => (
                  <button key={cat} onClick={() => setNewCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: `2px solid ${newCategory === cat ? ledgerCatColor(kind, cat) : 'transparent'}`, cursor: 'pointer', background: newCategory === cat ? `${ledgerCatColor(kind, cat)}22` : 'var(--theme-control-bg)', color: newCategory === cat ? ledgerCatColor(kind, cat) : 'var(--theme-text-muted)' }}>
                    <span>{ledgerCatIcon(kind, cat)}</span><span>{ledgerCatLabel(kind, cat)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 주기 (정기일 때) */}
            {addMode === 'recurring' && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>{isIncome ? '수령 주기' : '결제 주기'}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {RECUR_OPTIONS.map(({ value, label }) => (
                    <button key={value} onClick={() => setNewRecur(value)} style={{ flex: 1, padding: '9px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', background: newRecur === value ? 'var(--theme-control-active)' : 'var(--theme-control-bg)', color: newRecur === value ? 'var(--theme-bg)' : 'var(--theme-text-muted)' }}>{label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* 항목명 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>항목명</p>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={isIncome ? '예: 급여, 배당금, 환급' : '예: 외식, 마트, 넷플릭스'} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: 'var(--theme-surface-muted)', border: `2px solid ${newTitle ? accent : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }} />
            </div>

            {/* 금액 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>금액</p>
              <div style={{ position: 'relative' }}>
                <input type="text" inputMode="numeric" value={amountDisplay} onChange={(e) => setNewAmountRaw(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={{ width: '100%', height: '56px', padding: '0 40px 0 16px', borderRadius: '14px', fontSize: '22px', fontWeight: 800, background: 'var(--theme-surface-muted)', border: `2px solid ${newAmountRaw ? accent : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)', letterSpacing: '-0.5px' }} />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', fontWeight: 700, color: newAmountRaw ? accent : '#C7C7CC', pointerEvents: 'none' }}>원</span>
              </div>
            </div>

            {/* 날짜 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>{isIncome ? '수입 날짜' : '지출 날짜'}</p>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: 'var(--theme-surface-muted)', border: '2px solid transparent', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }} />
            </div>

            {/* 결제 방법 (지출만) */}
            {!isIncome && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>결제 방법</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PAYMENT_METHODS.map((m) => (
                    <button key={m} onClick={() => setNewPayment(m)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', background: newPayment === m ? 'var(--theme-control-active)' : 'var(--theme-control-bg)', color: newPayment === m ? 'var(--theme-bg)' : 'var(--theme-text-muted)' }}>{PAYMENT_METHOD_LABELS[m]}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: isIncome ? '12px' : 0 }}>
              <button onClick={handleSave} disabled={saving || !newTitle.trim() || !newAmountRaw} style={{ width: '100%', height: '58px', borderRadius: '18px', background: newTitle.trim() && newAmountRaw ? (isIncome ? 'linear-gradient(135deg, #10B981, #0CC9B5)' : 'linear-gradient(135deg, #0084CC, #0CC9B5)') : 'var(--theme-disabled-bg)', border: 'none', cursor: newTitle.trim() && newAmountRaw ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 800, color: newTitle.trim() && newAmountRaw ? 'white' : 'var(--theme-disabled-text)', opacity: saving ? 0.7 : 1 }}>{saving ? '저장 중...' : (isIncome ? '수입 등록' : '지출 등록')}</button>
              <button onClick={() => setShowAddModal(false)} style={{ width: '100%', height: '52px', borderRadius: '18px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 수정 모달 ── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setEditTarget(null)}>
          <div style={{ width: '100%', maxWidth: '600px', background: 'var(--theme-surface)', borderRadius: '32px 32px 0 0', padding: '8px 24px calc(env(safe-area-inset-bottom) + 32px)', maxHeight: '85dvh', overflowY: 'auto', overscrollBehavior: 'contain' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '20px' }}>
              <div style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'var(--theme-surface-muted)' }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 20px' }}>{editTarget.kind === 'income' ? '수입 수정' : '지출 수정'}</h3>

            <div style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>카테고리</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {editCatOpts.map((cat) => (
                  <button key={cat} onClick={() => setEditCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, border: `2px solid ${editCategory === cat ? ledgerCatColor(editTarget.kind, cat) : 'transparent'}`, cursor: 'pointer', background: editCategory === cat ? `${ledgerCatColor(editTarget.kind, cat)}22` : 'var(--theme-control-bg)', color: editCategory === cat ? ledgerCatColor(editTarget.kind, cat) : 'var(--theme-text-muted)' }}>
                    <span>{ledgerCatIcon(editTarget.kind, cat)}</span><span>{ledgerCatLabel(editTarget.kind, cat)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>항목명</p>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: 'var(--theme-surface-muted)', border: `2px solid ${editTitle ? accent : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>금액</p>
              <div style={{ position: 'relative' }}>
                <input type="text" inputMode="numeric" value={editAmountDisplay} onChange={(e) => setEditAmountRaw(e.target.value.replace(/[^0-9]/g, ''))} style={{ width: '100%', height: '56px', padding: '0 40px 0 16px', borderRadius: '14px', fontSize: '22px', fontWeight: 800, background: 'var(--theme-surface-muted)', border: `2px solid ${editAmountRaw ? accent : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }} />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', fontWeight: 700, color: '#C7C7CC', pointerEvents: 'none' }}>원</span>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>날짜</p>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: 'var(--theme-surface-muted)', border: '2px solid transparent', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }} />
            </div>

            {editTarget.kind === 'expense' && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', marginBottom: '8px' }}>결제 방법</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PAYMENT_METHODS.map((m) => (
                    <button key={m} onClick={() => setEditPayment(m)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', background: editPayment === m ? 'var(--theme-control-active)' : 'var(--theme-control-bg)', color: editPayment === m ? 'var(--theme-bg)' : 'var(--theme-text-muted)' }}>{PAYMENT_METHOD_LABELS[m]}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: editTarget.kind === 'income' ? '12px' : 0 }}>
              <button onClick={handleEditSave} disabled={editSaving || !editTitle.trim() || !editAmountRaw} style={{ width: '100%', height: '58px', borderRadius: '18px', background: editTitle.trim() && editAmountRaw ? 'linear-gradient(135deg, #0084CC, #0CC9B5)' : 'var(--theme-disabled-bg)', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 800, color: editTitle.trim() && editAmountRaw ? 'white' : 'var(--theme-disabled-text)', opacity: editSaving ? 0.7 : 1 }}>{editSaving ? '수정 중...' : '수정 완료'}</button>
              <button onClick={() => setEditTarget(null)} style={{ width: '100%', height: '52px', borderRadius: '18px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 ── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setDeleteTarget(null)}>
          <div style={{ background: 'var(--theme-surface)', borderRadius: '28px', padding: '28px', width: '100%', maxWidth: '340px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 6px' }}>{deleteTarget.kind === 'income' ? '수입 삭제' : '지출 삭제'}</h3>
              <p style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', margin: 0, lineHeight: 1.5 }}>
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
