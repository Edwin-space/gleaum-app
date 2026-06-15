'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLedger } from '@/hooks/useLedger';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import { materializeRecurringLedger } from '@/lib/db';
import type { LedgerEntry, LedgerKind, LedgerStatus, LedgerCategory, RecurFreq } from '@/types';

import { MobileBudget } from './MobileBudget';
import { DesktopBudget } from './DesktopBudget';
import { useSaveAdSheet } from '@/components/SaveAdSheet';

/** 수입/지출 추가 입력값 (원장 공용) */
export interface LedgerFormInput {
  kind: LedgerKind;
  title: string;
  amount: number;
  date: Date;
  category: LedgerCategory;
  method?: string;
  recurFreq: RecurFreq;
}
/** 수입/지출 수정 입력값 */
export interface LedgerEditInput {
  id: string;
  title: string;
  amount: number;
  date: Date;
  category: LedgerCategory;
  method?: string;
}

// 정기 수입·지출 이월은 세션당 달·공간별 1회만 실행
let materializedKey: string | null = null;

export default function BudgetPage() {
  const isDesktop = useIsDesktop();
  const today = new Date();

  const { showAd, AdSheet } = useSaveAdSheet();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [kind, setKind] = useState<LedgerKind>('expense');

  const { familyGroupId, personalSpaceId } = useCurrentUser();
  const effectiveSpaceId = personalSpaceId ?? familyGroupId;
  const { entries, loading, refresh, create, update, setStatus, remove } = useLedger(effectiveSpaceId, 'personal');

  // ── 정기 수입·지출 이월: 이번 달에 누락된 매월/매주/매년 인스턴스 생성 ──
  useEffect(() => {
    if (loading || !effectiveSpaceId) return;
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth()}-${effectiveSpaceId}`;
    if (materializedKey === key) return;
    materializedKey = key;
    void materializeRecurringLedger(effectiveSpaceId, 'personal').then((createdCount) => {
      if (createdCount > 0) void refresh();
    });
  }, [loading, effectiveSpaceId, refresh]);

  const inMonth = (d: Date, base: Date) =>
    d.getFullYear() === base.getFullYear() && d.getMonth() === base.getMonth();

  // ── 이번 달 항목 ──
  const monthEntries   = entries.filter((e) => inMonth(e.occurredAt, viewDate));
  const incomeEntries  = monthEntries.filter((e) => e.kind === 'income');
  const expenseEntries = monthEntries.filter((e) => e.kind === 'expense');

  const incomeTotal  = incomeEntries.reduce((s, e) => s + e.amount, 0);
  const expenseTotal = expenseEntries.reduce((s, e) => s + e.amount, 0);
  const net = incomeTotal - expenseTotal;                       // 순액(흑자/적자)
  const savingsRate = incomeTotal > 0 ? Math.max(0, Math.min(100, Math.round((net / incomeTotal) * 100))) : 0;

  // 현재 보고 있는 kind
  const current = kind === 'income' ? incomeEntries : expenseEntries;
  const currentTotal = kind === 'income' ? incomeTotal : expenseTotal;

  // ── 지출: 고정/변동 ──
  const fixedExpenses    = expenseEntries.filter((e) => e.recurFreq !== 'none');
  const variableExpenses = expenseEntries.filter((e) => e.recurFreq === 'none');
  const fixedTotal       = fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const variableTotal    = variableExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingCnt       = fixedExpenses.filter((e) => e.status !== 'completed').length;
  const completedCnt     = variableExpenses.filter((e) => e.status === 'completed').length;
  const completePct      = expenseTotal > 0
    ? Math.min((expenseEntries.filter((e) => e.status === 'completed').reduce((s, e) => s + e.amount, 0) / expenseTotal) * 100, 100)
    : 0;

  // ── 수입: 정기/비정기 ──
  const recurringIncome      = incomeEntries.filter((e) => e.recurFreq !== 'none');
  const onceIncome           = incomeEntries.filter((e) => e.recurFreq === 'none');
  const recurringIncomeTotal = recurringIncome.reduce((s, e) => s + e.amount, 0);
  const onceIncomeTotal      = onceIncome.reduce((s, e) => s + e.amount, 0);
  const incomePendingCnt     = recurringIncome.filter((e) => e.status !== 'completed').length;
  const incomeReceivedCnt    = incomeEntries.filter((e) => e.status === 'completed').length;

  // ── 전월 비교 (현재 kind) ──
  const lastMonthDate  = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  const lastMonthList  = entries.filter((e) => e.kind === kind && inMonth(e.occurredAt, lastMonthDate));
  const lastMonthTotal = lastMonthList.reduce((s, e) => s + e.amount, 0);
  const diff   = currentTotal - lastMonthTotal;
  const isLess = diff < 0;

  // ── 카테고리 (현재 kind) ──
  const byCategory = current.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const categories = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const isCurrentMonth = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

  const toastPos = isDesktop ? 'bottom-right' as const : 'top-center' as const;

  // ── 상태 토글 (지출: 결제완료 / 수입: 수령완료) ──
  const handleToggleStatus = async (id: string, currentStatus: LedgerStatus) => {
    const nextStatus: LedgerStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await setStatus(id, nextStatus);
    const entry = entries.find((e) => e.id === id);
    const isIncome = entry?.kind === 'income';
    toast.success(
      nextStatus === 'completed'
        ? (isIncome ? '수령 완료로 변경되었습니다' : '결제 완료로 변경되었습니다')
        : (isIncome ? '수령 예정으로 변경되었습니다' : '결제 예정으로 변경되었습니다'),
      { position: toastPos, duration: 1500 },
    );
  };

  const handleAdd = async (input: LedgerFormInput): Promise<boolean> => {
    if (!effectiveSpaceId) {
      toast.error('개인 공간을 준비하는 중입니다. 잠시 후 다시 시도해 주세요.');
      return false;
    }
    try {
      // 일회성: 이미 발생(지출완료/수령완료) → completed. 정기: 예정 → pending.
      const isOneTime = input.recurFreq === 'none';
      const result = await create({
        kind:       input.kind,
        scope:      'personal',
        spaceId:    effectiveSpaceId,
        title:      input.title,
        amount:     input.amount,
        category:   input.category,
        method:     input.method,
        occurredAt: input.date,
        status:     isOneTime ? 'completed' : 'pending',
        recurFreq:  input.recurFreq,
      });
      if (result) {
        toast.success(input.kind === 'income' ? '수입이 등록되었습니다' : '지출이 등록되었습니다', { position: toastPos, duration: 1500 });
        showAd();
        return true;
      }
      toast.error('등록에 실패했습니다. 잠시 후 다시 시도해 주세요.', { position: toastPos });
      return false;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`등록 실패: ${msg}`, { position: toastPos, duration: 5000 });
      return false;
    }
  };

  const handleUpdate = async (input: LedgerEditInput): Promise<boolean> => {
    try {
      const ok = await update(input.id, {
        title:      input.title,
        amount:     input.amount,
        occurredAt: input.date,
        category:   input.category,
        method:     input.method,
      });
      if (ok) toast.success('수정되었습니다', { position: toastPos, duration: 1500 });
      return ok;
    } catch {
      toast.error('수정에 실패했습니다');
      return false;
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    await remove(id);
    toast.success('삭제되었습니다', { position: toastPos, duration: 1500 });
  };

  const commonProps = {
    loading,
    viewDate,
    prevMonth,
    nextMonth,
    isCurrentMonth,
    kind,
    setKind,
    // 요약
    incomeTotal,
    expenseTotal,
    net,
    savingsRate,
    // 현재 kind
    entries: current as LedgerEntry[],
    currentTotal,
    categories,
    // 지출 전용
    fixedTotal,
    variableTotal,
    pendingCnt,
    completedCnt,
    completePct,
    // 수입 전용
    recurringIncomeTotal,
    onceIncomeTotal,
    incomePendingCnt,
    incomeReceivedCnt,
    // 전월 비교
    diff,
    isLess,
    lastMonthTotal,
    // 핸들러
    handleToggleStatus,
    handleAdd,
    handleUpdate,
    handleDelete,
  };

  if (isDesktop) {
    return <DesktopBudget {...commonProps} />;
  }
  return (
    <>
      <MobileBudget {...commonProps} />
      <AdSheet />
    </>
  );
}

/** Mobile/Desktop 공통 props 타입 */
export type BudgetViewProps = {
  loading: boolean;
  viewDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  isCurrentMonth: boolean;
  kind: LedgerKind;
  setKind: (k: LedgerKind) => void;
  incomeTotal: number;
  expenseTotal: number;
  net: number;
  savingsRate: number;
  entries: LedgerEntry[];
  currentTotal: number;
  categories: [string, number][];
  fixedTotal: number;
  variableTotal: number;
  pendingCnt: number;
  completedCnt: number;
  completePct: number;
  recurringIncomeTotal: number;
  onceIncomeTotal: number;
  incomePendingCnt: number;
  incomeReceivedCnt: number;
  diff: number;
  isLess: boolean;
  lastMonthTotal: number;
  handleToggleStatus: (id: string, status: LedgerStatus) => void;
  handleAdd: (input: LedgerFormInput) => Promise<boolean>;
  handleUpdate: (input: LedgerEditInput) => Promise<boolean>;
  handleDelete: (id: string) => Promise<void>;
};
