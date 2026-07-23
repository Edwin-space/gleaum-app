'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getScheduleById, updateScheduleStatus, deleteSchedule } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import type { Schedule, ScheduleStatus } from '@/types';

import { MobileScheduleDetail } from './MobileScheduleDetail';
import { DesktopScheduleDetail } from './DesktopScheduleDetail';
import { trackEvent } from '@/lib/analytics';
import { notifToast } from '@/lib/toast';
import { canWriteScheduleBoundary } from '@/lib/data-boundaries';

const typeConfig = {
  shared:   { icon: '👨‍👩‍👧‍👦', gradient: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)' },
  personal: { icon: '👤',       gradient: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)' },
  child:    { icon: '🧒',       gradient: 'linear-gradient(135deg, #34D399 0%, #059669 100%)' },
  expense:  { icon: '💰',       gradient: 'linear-gradient(135deg, #FCD34D 0%, #D97706 100%)' },
};

const steps: { key: ScheduleStatus; label: string }[] = [
  { key: 'pending',     label: '대기중' },
  { key: 'in_progress', label: '진행중' },
  { key: 'completed',   label: '완료'   },
];

export default function ScheduleDetailPage() {
  const isDesktop = useIsDesktop();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { user } = useCurrentUser();

  const [schedule, setSchedule] = useState<Schedule | null | undefined>(undefined);
  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [renotifying, setRenotifying] = useState(false);
  const { members, myRole } = useSpace(schedule?.spaceId ?? schedule?.familyGroupId ?? null);

  useEffect(() => {
    if (!id) return;
    getScheduleById(id).then((s) => {
      setSchedule(s ?? null);
      if (s) {
        void trackEvent('schedule_view', {
          schedule_type: s.type,
          status: s.status,
        });
      }
    });
  }, [id]);

  const handleUpdateStatus = async (status: ScheduleStatus) => {
    if (!schedule || !canEdit) return;
    await updateScheduleStatus(schedule.id, status);
    setSchedule({ ...schedule, status });
    if (status === 'completed') {
      void trackEvent('schedule_complete', { schedule_type: schedule.type });
    }
    setShowCompletionModal(false);
  };

  const handleDelete = async () => {
    if (!schedule || !canEdit) return;
    void trackEvent('schedule_delete', { schedule_type: schedule.type });
    await deleteSchedule(schedule.id);
    router.back();
  };

  const handleRenotify = async () => {
    if (!schedule || !canEdit || renotifying) return;
    setRenotifying(true);
    try {
      const response = await fetch('/api/notifications/renotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: schedule.id,
          title: `🔔 재알림: ${schedule.title}`,
          body: '놓친 일정을 확인해주세요',
          url: `/schedules/${schedule.id}`,
        }),
      });
      if (!response.ok) throw new Error('renotify_failed');
      notifToast.sent(schedule.title);
    } catch {
      notifToast.error();
    } finally {
      setRenotifying(false);
    }
  };

  if (schedule === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-brand-blue" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">📭</span>
        <p style={{ color: 'var(--theme-text-subtle)' }}>일정을 찾을 수 없습니다</p>
        <button onClick={() => router.back()} className="px-8 py-3 rounded-full text-[14px] font-bold text-white bg-brand-blue">돌아가기</button>
      </div>
    );
  }

  const cfg = typeConfig[schedule.type];
  const participantUsers = members
    .filter((member) => schedule.participants.includes(member.userId))
    .map((member) => member.user)
    .filter((member) => member !== undefined);
  const currentStepIdx = steps.findIndex((s) => s.key === schedule.status);
  const canEdit = canWriteScheduleBoundary(
    user?.id ?? '',
    { createdBy: schedule.createdBy, visibility: schedule.visibility ?? null },
    myRole,
  );

  const commonProps = {
    schedule,
    id: id!,
    cfg,
    participantUsers,
    steps,
    currentStepIdx,
    canEdit,
    renotifying,
    showDeleteModal,
    setShowDeleteModal,
    showCompletionModal,
    setShowCompletionModal,
    handleUpdateStatus,
    handleDelete,
    handleRenotify,
  };

  if (isDesktop) {
    return <DesktopScheduleDetail {...commonProps} />;
  }

  return <MobileScheduleDetail {...commonProps} />;
}
