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

function isTimelineSchedule(schedule: Schedule): boolean {
  return !(schedule.type === 'expense' && schedule.repeat === 'none');
}

export default function SchedulesPage() {
  const isDesktop = useIsDesktop();
  const [filter, setFilter] = useState<'all' | ScheduleType>('all');
  const [search, setSearch] = useState('');

  const { familyGroupId, profile, loading: userLoading } = useCurrentUser();
  const { schedules, loading: schedulesLoading } = useSchedules(familyGroupId);

  const loading = userLoading || schedulesLoading;

  // 필터링 및 그룹화 로직
  // 일회성 지출은 이미 발생한 돈의 흐름이므로 일정 타임라인에는 노출하지 않는다.
  const personalSpaceId = (profile?.preferences as { personalSpaceId?: string } | null)?.personalSpaceId ?? null;
  const isPersonalSpace = !!familyGroupId && familyGroupId === personalSpaceId;
  const timelineSchedules = schedules
    .filter(isTimelineSchedule)
    .filter((s) => isPersonalSpace || s.visibility !== 'private');
  const filtered = timelineSchedules.filter((s) => {
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

    const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
    let groupKey: string;
    if (d.toDateString() === today.toDateString())    groupKey = '오늘';
    else if (d.toDateString() === tomorrow.toDateString()) groupKey = '내일';
    else groupKey = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY[d.getDay()]})`;

    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(s);
    return acc;
  }, {} as Record<string, Schedule[]>);

  const todaySchedules = timelineSchedules.filter(s => new Date(s.startTime).toDateString() === new Date().toDateString());

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
