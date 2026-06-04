'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import MobileHome from './MobileHome';
import DesktopHome from './DesktopHome';
import type { Schedule } from '@/types';

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
  const shouldReuseActiveSchedules = !!familyGroupId && familyGroupId === personalBudgetSpaceId;
  const { schedules: loadedPersonalSchedules, loading: personalSchedulesLoading } = useSchedules(shouldReuseActiveSchedules ? null : personalBudgetSpaceId);
  const personalSchedules = shouldReuseActiveSchedules ? activeSpaceSchedules : loadedPersonalSchedules;
  const loading = userLoading || schedulesLoading || (!shouldReuseActiveSchedules && personalSchedulesLoading);
  const isPersonalSpace = !!familyGroupId && familyGroupId === personalSpaceId;
  const timelineSchedules = activeSpaceSchedules
    .filter(isTimelineSchedule)
    .filter((schedule) => isPersonalSpace || schedule.visibility !== 'private');
  const personalExpenses = personalSchedules.filter((schedule) =>
    schedule.type === 'expense' &&
    schedule.visibility === 'private' &&
    (!user?.id || schedule.createdBy === user.id)
  );

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
