'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import type { Schedule, ScheduleStatus, ExpenseCategory, PaymentMethod, RepeatType } from '@/types';

import { MobileBudget } from './MobileBudget';
import { DesktopBudget } from './DesktopBudget';
import { prepareInterstitial, showInterstitial } from '@/lib/admob';

/** 지출 추가 입력값 */
export interface AddExpenseInput {
  title: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  repeat: RepeatType;
}

/** 지출 수정 입력값 */
export interface EditExpenseInput {
  id: string;
  title: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
}

export default function BudgetPage() {
  const isDesktop = useIsDesktop();
  const today = new Date();

  // Interstitial 미리 로드
  useEffect(() => { void prepareInterstitial(); }, []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const { familyGroupId, user, personalSpaceId } = useCurrentUser();
  const effectivePersonalSpaceId = personalSpaceId ?? familyGroupId;
  const { schedules, loading, updateStatus, create, update, remove } = useSchedules(effectivePersonalSpaceId);
  const userId = user?.id;

  // 현재 달 개인 지출
  const allExpenses = schedules.filter(
    (s) => s.type === 'expense' &&
      s.startTime.getFullYear() === viewDate.getFullYear() &&
      s.startTime.getMonth()    === viewDate.getMonth()
  );
  const expenses = allExpenses.filter((s) => s.createdBy === userId && s.visibility === 'private');

  // 고정 / 변동 분리 (repeat !== 'none' = 고정)
  const fixedExpenses    = expenses.filter((s) => s.repeat && s.repeat !== 'none');
  const variableExpenses = expenses.filter((s) => !s.repeat || s.repeat === 'none');
  const fixedTotal       = fixedExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const variableTotal    = variableExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  // 지난달 비교
  const lastMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  const lastMonthExpenses = schedules.filter(
    (s) => s.type === 'expense' &&
      s.startTime.getFullYear() === lastMonthDate.getFullYear() &&
      s.startTime.getMonth()    === lastMonthDate.getMonth() &&
      s.createdBy === userId &&
      s.visibility === 'private'
  );

  const total          = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const diff           = total - lastMonthTotal;
  const isLess         = diff < 0;

  const completedCnt = expenses.filter((e) => e.status === 'completed').length;
  const pendingCnt   = fixedExpenses.filter((e) => e.status !== 'completed').length;
  const completePct  = total > 0 ? Math.min((expenses.filter((e) => e.status === 'completed').reduce((s, e) => s + (e.amount ?? 0), 0) / total) * 100, 100) : 0;

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
    toast.success(nextStatus === 'completed' ? '결제 완료로 변경되었습니다' : '결제 예정으로 변경되었습니다', {
      position: isDesktop ? 'bottom-right' : 'top-center',
      duration: 1500,
    });
  };

  const handleAddExpense = async (input: AddExpenseInput): Promise<boolean> => {
    if (!effectivePersonalSpaceId) {
      toast.error('개인 공간을 준비하는 중입니다. 잠시 후 다시 시도해 주세요.');
      return false;
    }
    try {
      const isOneTime = input.repeat === 'none';
      const result = await create({
        title:            input.title,
        type:             'expense',
        category:         'expense',
        startTime:        input.date,
        // 정기 지출은 endTime 미설정 → 크론 in_progress→missed 전환 방지
        // 일회성 지출은 이미 발생한 지출이므로 startTime과 동일하게 설정
        endTime:          isOneTime ? input.date : undefined,
        status:           isOneTime ? 'completed' : 'pending',
        // 지출은 크론 자동화 불필요 — 사용자가 직접 결제완료 토글
        automationPolicy: 'reminder_only',
        amount:           input.amount,
        expenseCategory:  input.category,
        paymentMethod:    input.paymentMethod,
        repeat:           input.repeat,
        visibility:       'private',
      });
      if (result) {
        toast.success('지출이 등록되었습니다', {
          position: isDesktop ? 'bottom-right' : 'top-center',
          duration: 1500,
        });
        // 지출 등록 후 Interstitial 표시 (페이지 이동 없음 — 닫으면 가계부로 복귀)
        void showInterstitial();
        return true;
      }
      return false;
    } catch {
      toast.error('지출 등록에 실패했습니다');
      return false;
    }
  };

  const handleUpdateExpense = async (input: EditExpenseInput): Promise<boolean> => {
    try {
      const ok = await update(input.id, {
        title:           input.title,
        amount:          input.amount,
        startTime:       input.date,
        endTime:         input.date,
        expenseCategory: input.category,
        paymentMethod:   input.paymentMethod,
      });
      if (ok) {
        toast.success('지출이 수정되었습니다', {
          position: isDesktop ? 'bottom-right' : 'top-center',
          duration: 1500,
        });
      }
      return ok;
    } catch {
      toast.error('지출 수정에 실패했습니다');
      return false;
    }
  };

  const handleDeleteExpense = async (id: string): Promise<void> => {
    await remove(id);
    toast.success('지출이 삭제되었습니다', {
      position: isDesktop ? 'bottom-right' : 'top-center',
      duration: 1500,
    });
  };

  const commonProps = {
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
  };

  if (isDesktop) {
    return <DesktopBudget {...commonProps} />;
  }
  return <MobileBudget {...commonProps} />;
}
