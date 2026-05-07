'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSchedules } from '@/hooks/useSchedules';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import type { ScheduleType, Schedule } from '@/types';

import { MobileSchedules } from './MobileSchedules';
import { DesktopSchedules } from './DesktopSchedules';

const FILTERS: { key: 'all' | ScheduleType; label: string }[] = [
  { key: 'all',      label: '전체' },
  { key: 'shared',   label: '공유일정' },
  { key: 'personal', label: '개인일정' },
  { key: 'child',    label: '자녀일정' },
  { key: 'expense',  label: '정기지출' },
];

export default function SchedulesPage() {
  const isDesktop = useIsDesktop();
  const [filter, setFilter] = useState<'all' | ScheduleType>('all');
  const [search, setSearch] = useState('');

  const { familyGroupId, loading: userLoading } = useCurrentUser();
  const { schedules, loading: schedulesLoading } = useSchedules(familyGroupId);

  const loading = userLoading || schedulesLoading;

  // 필터링 및 그룹화 로직
  const filtered = schedules.filter((s) => {
    const matchType   = filter === 'all' || s.type === filter;
    const q = search.toLowerCase();
    const matchSearch = !search || (
      s.title.toLowerCase().includes(q) ||
      (s.memo?.toLowerCase().includes(q) ?? false) ||
      (s.location?.address.toLowerCase().includes(q) ?? false)
    );
    return matchType && matchSearch;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // 날짜별 그룹화
  const grouped = filtered.reduce((acc, s) => {
    const d = new Date(s.startTime);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let groupKey = 'Upcoming';
    if (d.toDateString() === today.toDateString()) groupKey = 'Today';
    else if (d.toDateString() === tomorrow.toDateString()) groupKey = 'Tomorrow';
    else groupKey = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(s);
    return acc;
  }, {} as Record<string, Schedule[]>);

  const todaySchedules = schedules.filter(s => new Date(s.startTime).toDateString() === new Date().toDateString());

  const commonProps = {
    loading,
    grouped,
    filter,
    setFilter,
    search,
    setSearch,
    filters: FILTERS
  };

  if (isDesktop) {
    return <DesktopSchedules {...commonProps} />;
  }

  return (
    <MobileSchedules 
      {...commonProps} 
      todaySchedules={todaySchedules}
    />
  );
}
