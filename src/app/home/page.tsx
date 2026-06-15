'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { useLedger } from '@/hooks/useLedger';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import MobileHome from './MobileHome';
import DesktopHome from './DesktopHome';
import type { Schedule, ScheduleStatus, RepeatType, ExpenseCategory, PaymentMethod } from '@/types';

function isTimelineSchedule(schedule: Schedule): boolean {
  return !(schedule.type === 'expense' && schedule.repeat === 'none');
}

export default function HomePage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const { user, profile, familyGroupId, loading: userLoading } = useCurrentUser();
  const personalSpaceId = (profile?.preferences as { personalSpaceId?: string } | null)?.personalSpaceId ?? null;
  const personalBudgetSpaceId = personalSpaceId ?? familyGroupId;
  const { schedules: activeSpaceSchedules, loading: schedulesLoading } = useSchedules(familyGroupId);
  // 가계부(지출)는 원장(ledger_entries) 기반 — /budget과 동일 소스로 일관성 유지
  const { entries: personalLedger, loading: ledgerLoading } = useLedger(personalBudgetSpaceId, 'personal');
  const loading = userLoading || schedulesLoading || ledgerLoading;
  const isPersonalSpace = !!familyGroupId && familyGroupId === personalSpaceId;
  const timelineSchedules = activeSpaceSchedules
    .filter(isTimelineSchedule)
    .filter((schedule) => isPersonalSpace || schedule.visibility !== 'private');
  // 홈 가계부 요약 카드용: 원장 지출 항목을 Schedule 형태로 매핑(컴포넌트 호환)
  const personalExpenses: Schedule[] = personalLedger
    .filter((e) => e.kind === 'expense')
    .map((e) => ({
      id:              e.id,
      title:           e.title,
      type:            'expense',
      startTime:       e.occurredAt,
      status:          (e.status === 'completed' ? 'completed' : 'pending') as ScheduleStatus,
      participants:    [],
      repeat:          e.recurFreq as RepeatType,
      visibility:      'private',
      amount:          e.amount,
      expenseCategory: e.category as ExpenseCategory,
      paymentMethod:   e.method as PaymentMethod | undefined,
      familyGroupId:   e.spaceId,
      createdBy:       e.ownerId,
    }));

  // 온보딩 미완료 시 리다이렉트
  useEffect(() => {
    if (!profile) return;
    if ('onboarding_completed_at' in profile && !profile.onboarding_completed_at) {
      router.replace('/onboarding');
    }
  }, [profile, router]);

  if (isDesktop) {
    return (
      <DesktopHome
        user={user}
        profile={profile}
        schedules={timelineSchedules}
        personalExpenses={personalExpenses}
        loading={loading}
      />
    );
  }

  return (
    <MobileHome
      user={user}
      profile={profile}
      schedules={timelineSchedules}
      personalExpenses={personalExpenses}
      loading={loading}
    />
  );
}
