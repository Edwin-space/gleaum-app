'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import type { Schedule, ScheduleStatus, ExpenseCategory, PaymentMethod, RepeatType } from '@/types';

import { MobileBudget } from './MobileBudget';
import { DesktopBudget } from './DesktopBudget';

export type BudgetTab = 'personal' | 'space';

function isRecurringExpense(expense: Schedule): boolean {
  return expense.repeat !== 'none';
}

function isReflectedExpense(expense: Schedule): boolean {
  return !isRecurringExpense(expense) || expense.status === 'completed';
}

/** 지출 추가 입력값 — visibility는 탭에서 자동 결정 */
export interface AddExpenseInput {
  title: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  repeat: RepeatType; // 'none' = 일회성, 그 외 = 정기
}

export default function BudgetPage() {
  const isDesktop = useIsDesktop();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // 개인 탭이 기본 (공간 없는 사용자도 사용 가능)
  const [tab, setTab] = useState<BudgetTab>('personal');

  const { familyGroupId, user, hasSharedSpace } = useCurrentUser();
  // 공간 지출 탭은 공유 공간(명시적으로 만들거나 참여한 공간)이 있을 때만 활성화
  const hasSpace = hasSharedSpace;
  const { schedules, loading, updateStatus, create } = useSchedules(familyGroupId);
  const userId = user?.id;

  // 현재 선택된 달의 지출 전체
  const allExpenses = schedules.filter(
    (s) => s.type === 'expense' &&
      s.startTime.getFullYear() === viewDate.getFullYear() &&
      s.startTime.getMonth()    === viewDate.getMonth()
  );

  // 탭 필터
  // 개인: 내가 만든 private 지출
  // 공간: private이 아닌 공유 지출
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

  const completed    = expenses.filter(isReflectedExpense).reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const completedCnt = expenses.filter(isReflectedExpense).length;
  const pendingCnt   = expenses.filter((e) => isRecurringExpense(e) && e.status !== 'completed').length;
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
    // familyGroupId는 ensureUserSetup에서 항상 보장됨 (개인 공간 자동 생성)
    if (!familyGroupId) {
      toast.error('잠시 후 다시 시도해 주세요.');
      return false;
    }

    // 공간 지출은 공유 공간이 있어야 함
    if (tab === 'space' && !hasSharedSpace) {
      toast.error('공간 지출을 등록하려면 공유 공간이 필요합니다. 공간 탭에서 멤버를 초대해 보세요.');
      return false;
    }

    try {
      // visibility는 현재 탭에서 자동 결정
      const visibility = tab === 'personal' ? 'private' : 'space';
      const isOneTime = input.repeat === 'none';

      const result = await create({
        title:           input.title,
        type:            'expense',
        startTime:       input.date,
        endTime:         input.date,
        status:          isOneTime ? 'completed' : 'pending',
        automationPolicy: isOneTime ? 'reminder_only' : 'payment_due',
        amount:          input.amount,
        expenseCategory: input.category,
        paymentMethod:   input.paymentMethod,
        repeat:          input.repeat,
        visibility,
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
  };

  if (isDesktop) {
    return <DesktopBudget {...commonProps} />;
  }

  return <MobileBudget {...commonProps} />;
}
