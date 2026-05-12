'use client';

import { useState } from 'react';
import { formatAmount, formatMonthYear, getCategoryColor } from '@/lib/utils';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS, PAYMENT_METHOD_LABELS, REPEAT_LABELS } from '@/types';
import type { Schedule, ScheduleStatus, ExpenseCategory, PaymentMethod, RepeatType, ScheduleVisibility } from '@/types';
import type { BudgetTab, AddExpenseInput } from './page';
import { ExpenseDoughnut } from '@/components/budget/ExpenseDoughnut';

interface DesktopBudgetProps {
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

export function DesktopBudget({
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
  handleAddExpense,
}: DesktopBudgetProps) {
  // ── 지출 추가 모달 상태 ──
  const [showAddModal, setShowAddModal]   = useState(false);
  const [saving, setSaving]               = useState(false);
  const [newTitle, setNewTitle]           = useState('');
  const [newAmount, setNewAmount]         = useState('');
  const [newDate, setNewDate]             = useState(new Date().toISOString().split('T')[0]);
  const [newCategory, setNewCategory]     = useState<ExpenseCategory>('other');
  const [newPayment, setNewPayment]       = useState<PaymentMethod>('card');
  const [newRepeat, setNewRepeat]         = useState<RepeatType>('none');
  const [newVisibility, setNewVisibility] = useState<ScheduleVisibility>(tab === 'personal' ? 'private' : 'space');

  const openAddModal = () => {
    setNewTitle(''); setNewAmount(''); setNewDate(new Date().toISOString().split('T')[0]);
    setNewCategory('other'); setNewPayment('card'); setNewRepeat('none');
    setNewVisibility(tab === 'personal' ? 'private' : 'space');
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!newTitle.trim() || !newAmount) return;
    setSaving(true);
    const ok = await handleAddExpense({
      title:         newTitle.trim(),
      amount:        Number(newAmount),
      date:          new Date(newDate),
      category:      newCategory,
      paymentMethod: newPayment,
      repeat:        newRepeat,
      visibility:    newVisibility,
    });
    setSaving(false);
    if (ok) setShowAddModal(false);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── 페이지 헤더 ── */}
      <div style={{ position: 'relative', padding: '36px 44px', borderRadius: '28px', overflow: 'hidden', background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)', color: 'white', marginBottom: '28px', boxShadow: '0 14px 44px rgba(26,27,46,0.2)' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(245,158,11,0.15)', filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '20%', width: '150px', height: '150px', background: 'rgba(0,132,204,0.12)', filter: 'blur(48px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', margin: '0 0 6px' }}>가계부 리포트</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: 0 }}>이번 달 자금 흐름과 소비 패턴을 분석합니다</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* 지출 추가 버튼 */}
            <button
              onClick={openAddModal}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, #0CC9B5, #0084CC)', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 800, color: 'white', boxShadow: '0 4px 16px rgba(0,132,204,0.35)', whiteSpace: 'nowrap' }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>＋</span> 지출 추가
            </button>

            {/* 탭 스위처 */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.10)', borderRadius: '14px', padding: '4px', border: '1px solid rgba(255,255,255,0.12)' }}>
              {([{ key: 'space' as BudgetTab, label: '🏠 공간' }, { key: 'personal' as BudgetTab, label: '👤 개인' }]).map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)} style={{ padding: '7px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: tab === key ? 'rgba(255,255,255,0.18)' : 'transparent', color: tab === key ? 'white' : 'rgba(255,255,255,0.50)' }}>{label}</button>
              ))}
            </div>

            {/* 월 네비게이션 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '18px', padding: '6px', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <button onClick={prevMonth} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18L9 12L15 6"/></svg>
              </button>
              <span style={{ fontSize: '17px', fontWeight: 900, padding: '0 16px', letterSpacing: '-0.3px' }}>{formatMonthYear(viewDate)}</span>
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
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

          {/* ── 왼쪽 요약 패널 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 총액 카드 */}
            <div style={{ borderRadius: '28px', padding: '32px', color: 'white', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', boxShadow: '0 12px 36px rgba(0,132,204,0.3)' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.12)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>Monthly Total</p>
                <h2 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-1px', margin: '0 0 24px', lineHeight: 1 }}>{formatAmount(total)}</h2>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                    <span>납부 진행률</span><span>{Math.round(completePct)}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', background: 'white', transition: 'width 1s ease', width: `${completePct}%` }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <div><p style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>완료</p><p style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>{completedCnt}건</p></div>
                  <div><p style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>예정</p><p style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>{pendingCnt}건</p></div>
                </div>
              </div>
            </div>

            {/* 전월 비교 */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#C7C7CC', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>전월 비교</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: isLess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>{isLess ? '📉' : '📈'}</div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#8E8E93', margin: '0 0 4px' }}>전월 대비</p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: isLess ? '#10B981' : '#EF4444', margin: 0 }}>{formatAmount(Math.abs(diff))} {isLess ? '절약' : '증가'}</p>
                </div>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#8E8E93', fontWeight: 600, margin: 0 }}>
                지난달({formatAmount(lastMonthTotal)}) 대비{' '}
                <span style={{ fontWeight: 800, color: '#1A1B2E' }}>{lastMonthTotal > 0 ? Math.round((Math.abs(diff) / lastMonthTotal) * 100) : 0}%</span>{' '}
                {isLess ? '줄었습니다' : '늘었습니다'}.
              </p>
            </div>
          </div>

          {/* ── 오른쪽: 차트 + 목록 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 차트 2-컬럼 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '320px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 20px', width: '100%' }}>카테고리 분석</h3>
                {categories.length > 0 ? <ExpenseDoughnut categories={categories} total={total} /> : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#8E8E93', fontWeight: 600 }}>분석 데이터 없음</div>}
              </div>
              <div style={{ background: 'white', borderRadius: '24px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 20px' }}>항목별 비율</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {categories.length > 0 ? categories.map(([cat, amt]) => {
                    const category = cat as ExpenseCategory;
                    const pct = total > 0 ? (amt / total) * 100 : 0;
                    const catColor = getCategoryColor(category);
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: `${catColor}15` }}>{EXPENSE_CATEGORY_ICONS[category]}</div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1B2E' }}>{EXPENSE_CATEGORY_LABELS[category]}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '13px', fontWeight: 900, color: '#1A1B2E', margin: 0 }}>{formatAmount(amt)}</p>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: '#8E8E93', margin: 0 }}>{Math.round(pct)}%</p>
                          </div>
                        </div>
                        <div style={{ height: '5px', borderRadius: '999px', background: '#F5F5F9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '999px', background: catColor, width: `${pct}%`, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    );
                  }) : <div style={{ padding: '40px 0', textAlign: 'center', color: '#8E8E93', fontSize: '14px', fontWeight: 600 }}>내역 없음</div>}
                </div>
              </div>
            </div>

            {/* 지출 목록 */}
            <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid #F5F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>지출 내역</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93' }}>{expenses.length}건</span>
                  <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 800, color: '#0084CC', background: 'rgba(0,132,204,0.06)', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span> 추가
                  </button>
                </div>
              </div>
              {expenses.length > 0 ? (
                <div>
                  {expenses.map((e, idx) => {
                    const isRecurring = e.repeat && e.repeat !== 'none';
                    return (
                      <div key={e.id} style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: idx < expenses.length - 1 ? '1px solid #F7F7FA' : 'none', transition: 'background 0.15s' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', background: `${getCategoryColor(e.expenseCategory ?? 'other')}15`, flexShrink: 0 }}>
                          {EXPENSE_CATEGORY_ICONS[e.expenseCategory ?? 'other']}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                            {isRecurring && <span style={{ fontSize: '10px', fontWeight: 800, color: '#0084CC', background: 'rgba(0,132,204,0.08)', padding: '2px 7px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>정기</span>}
                            {e.visibility === 'private' && <span style={{ fontSize: '10px', fontWeight: 800, color: '#8E8E93', background: '#F5F5F7', padding: '2px 7px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>🔒 나만</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93' }}>{e.startTime.getDate()}일</span>
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#D0D0D0' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93' }}>{PAYMENT_METHOD_LABELS[e.paymentMethod ?? 'card']}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '16px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 2px' }}>{formatAmount(e.amount ?? 0)}</p>
                            <p style={{ fontSize: '11px', fontWeight: 700, margin: 0, color: e.status === 'completed' ? '#10B981' : '#0084CC' }}>{e.status === 'completed' ? '결제완료' : '결제예정'}</p>
                          </div>
                          <button onClick={() => handleToggleStatus(e.id, e.status)} style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: e.status === 'completed' ? '#10B981' : '#F0F0F5', color: e.status === 'completed' ? 'white' : '#D0D0D0', boxShadow: e.status === 'completed' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '40px', marginBottom: '12px' }}>💰</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1B2E', margin: '0 0 6px' }}>지출을 추가해 보세요</p>
                  <p style={{ fontSize: '13px', color: '#8E8E93', margin: '0 0 20px' }}>일회성 및 정기 지출 모두 관리할 수 있습니다</p>
                  <button onClick={openAddModal} style={{ padding: '12px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #0084CC, #0CC9B5)', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 800, color: 'white', boxShadow: '0 6px 20px rgba(0,132,204,0.25)' }}>＋ 첫 지출 추가하기</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 지출 추가 모달 (데스크탑: 중앙 다이얼로그) ── */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '28px', padding: '36px', width: '100%', maxWidth: '520px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 24px' }}>지출 추가</h3>

            {/* 유형 */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>지출 유형</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {REPEAT_OPTIONS.map(({ value, label }) => (
                  <button key={value} onClick={() => setNewRepeat(value)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', background: newRepeat === value ? '#1A1B2E' : '#F5F5F7', color: newRepeat === value ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>{label}</button>
                ))}
              </div>
            </div>

            {/* 공유 범위 */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>공유 범위</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {([
                  { val: 'space' as ScheduleVisibility, label: '🏠 공간 공유' },
                  { val: 'private' as ScheduleVisibility, label: '🔒 나만' },
                ] as { val: ScheduleVisibility; label: string }[]).map(({ val, label }) => (
                  <button key={val} onClick={() => setNewVisibility(val)} style={{ flex: 1, height: '44px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', background: newVisibility === val ? '#1A1B2E' : '#F5F5F7', color: newVisibility === val ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>{label}</button>
                ))}
              </div>
            </div>

            {/* 항목명 */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>항목명</p>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="예: 넷플릭스, 관리비, 보험료" onKeyDown={(e) => e.key === 'Enter' && handleSave()} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: '#F5F5F7', border: `2px solid ${newTitle ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: '#1A1B2E', transition: 'border-color 0.2s' }} />
            </div>

            {/* 금액 + 날짜 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>금액</p>
                <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0" style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '18px', fontWeight: 800, background: '#F5F5F7', border: `2px solid ${newAmount ? '#0084CC' : 'transparent'}`, outline: 'none', boxSizing: 'border-box', color: '#1A1B2E', transition: 'border-color 0.2s' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>{newRepeat === 'none' ? '지출 날짜' : '첫 결제일'}</p>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, background: '#F5F5F7', border: '2px solid transparent', outline: 'none', boxSizing: 'border-box', color: '#1A1B2E' }} />
              </div>
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
            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>결제 방법</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PAYMENT_METHODS.map((m) => (
                  <button key={m} onClick={() => setNewPayment(m)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', background: newPayment === m ? '#1A1B2E' : '#F5F5F7', color: newPayment === m ? 'white' : '#8E8E93', transition: 'all 0.15s' }}>{PAYMENT_METHOD_LABELS[m]}</button>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, height: '52px', borderRadius: '16px', background: '#F5F5F7', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: '#8E8E93' }}>취소</button>
              <button onClick={handleSave} disabled={saving || !newTitle.trim() || !newAmount} style={{ flex: 2, height: '52px', borderRadius: '16px', background: newTitle.trim() && newAmount ? 'linear-gradient(135deg, #0084CC, #0CC9B5)' : '#F0F0F5', border: 'none', cursor: newTitle.trim() && newAmount ? 'pointer' : 'not-allowed', fontSize: '15px', fontWeight: 800, color: newTitle.trim() && newAmount ? 'white' : '#AEAEA8', opacity: saving ? 0.7 : 1, boxShadow: newTitle.trim() && newAmount ? '0 6px 20px rgba(0,132,204,0.25)' : 'none' }}>{saving ? '저장 중...' : '지출 등록'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
