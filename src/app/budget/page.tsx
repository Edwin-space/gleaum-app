'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import type { ScheduleStatus, ExpenseCategory, PaymentMethod, ScheduleVisibility, RepeatType } from '@/types';

import { MobileBudget } from './MobileBudget';
import { DesktopBudget } from './DesktopBudget';

export type BudgetTab = 'space' | 'personal';

/** 지출 추가 입력값 */
export interface AddExpenseInput {
  title: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  repeat: RepeatType;        // 'none' = 일회성, 그 외 = 정기
  visibility: ScheduleVisibility; // 'space' | 'private'
}

export default function BudgetPage() {
  const isDesktop = useIsDesktop();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [tab, setTab] = useState<BudgetTab>('space');

  const { familyGroupId, user } = useCurrentUser();
  const { schedules, loading, updateStatus, create } = useSchedules(familyGroupId);
  const userId = user?.id;

  // 현재 선택된 달의 지출 전체
  const allExpenses = schedules.filter(
    (s) => s.type === 'expense' &&
      s.startTime.getFullYear() === viewDate.getFullYear() &&
      s.startTime.getMonth()    === viewDate.getMonth()
  );

  // 탭 필터: 공간(공유) vs 내 개인 지출
  const expenses = tab === 'personal'
    ? allExpenses.filter((s) => s.createdBy === userId && s.visibility === 'private')
    : allExpenses.filter((s) => s.visibility !== 'private');

  // 지난달 지출 (비교용)
  const lastMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  const lastMonthExpenses = schedules.filter(
    (s) => s.type === 'expense' &&
      s.startTime.getFullYear() === lastMonthDate.getFullYear() &&
      s.startTime.getMonth()    === lastMonthDate.getMonth() &&
      (tab === 'personal'
        ? s.createdBy === userId && s.visibility === 'private'
        : s.visibility !== 'private')
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
      position: isDesktop ? 'bottom-right' : 'top-center',
      duration: 1500,
    });
  };

  const handleAddExpense = async (input: AddExpenseInput): Promise<boolean> => {
    if (!familyGroupId) {
      toast.error('공간이 없습니다. 먼저 공간을 만들어 주세요.');
      return false;
    }
    try {
      const result = await create({
        title:          input.title,
        type:           'expense',
        startTime:      input.date,
        endTime:        input.date,
        amount:         input.amount,
        expenseCategory: input.category,
        paymentMethod:  input.paymentMethod,
        repeat:         input.repeat,
        visibility:     input.visibility,
      });
      if (result) {
        toast.success('지출이 등록되었습니다', {
          position: isDesktop ? 'bottom-right' : 'top-center',
          duration: 1500,
        });
        return true;
      }
      return false;
    } catch {
      toast.error('지출 등록에 실패했습니다');
      return false;
    }
  };

  const commonProps = {
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
  };

  if (isDesktop) {
    return <DesktopBudget {...commonProps} />;
  }

  return <MobileBudget {...commonProps} />;
}
