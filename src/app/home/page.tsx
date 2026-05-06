'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import MobileHome from './MobileHome';
import DesktopHome from './DesktopHome';

export default function HomePage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const { user, profile, familyGroupId, loading: userLoading } = useCurrentUser();
  const { schedules, loading: schedulesLoading } = useSchedules(familyGroupId);
  const loading = userLoading || schedulesLoading;

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
        schedules={schedules}
        loading={loading}
      />
    );
  }

  return (
    <MobileHome
      user={user}
      profile={profile}
      schedules={schedules}
      loading={loading}
    />
  );
}
