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
  const { schedules, loading: schedulesLoading } = useSchedules(familyGroupId);
  const loading = userLoading || schedulesLoading;
  const personalSpaceId = (profile?.preferences as { personalSpaceId?: string } | null)?.personalSpaceId ?? null;
  const isPersonalSpace = !!familyGroupId && familyGroupId === personalSpaceId;
  const timelineSchedules = schedules
    .filter(isTimelineSchedule)
    .filter((schedule) => isPersonalSpace || schedule.visibility !== 'private');

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
        loading={loading}
      />
    );
  }

  return (
    <MobileHome
      user={user}
      profile={profile}
      schedules={timelineSchedules}
      loading={loading}
    />
  );
}
