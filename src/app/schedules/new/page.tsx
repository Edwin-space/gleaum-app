'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { createSchedule } from '@/lib/db';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import type { ScheduleType, RepeatType, ExpenseCategory, PaymentMethod, ScheduleVisibility } from '@/types';

import { MobileNewSchedule } from './MobileNewSchedule';
import { DesktopNewSchedule } from './DesktopNewSchedule';
import { trackEvent } from '@/lib/analytics';

export default function NewSchedulePage() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    familyGroupId,
    loading: userLoading,
    refresh,
    hasSharedSpace,
    personalSpaceId,
    sharedSpaceId,
    user,
  } = useCurrentUser();
  const { members, myRole } = useSpace(sharedSpaceId);

  // 로딩 완료 후에도 familyGroupId 가 null 이면 공간 생성 재시도
  useEffect(() => {
    if (!userLoading && !familyGroupId) {
      refresh();
    }
  // refresh 는 매 렌더마다 새 참조 — familyGroupId / userLoading 변화에만 반응
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, familyGroupId]);

  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<ScheduleType>((searchParams.get('type') as ScheduleType) || 'personal');

  // Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStart] = useState('09:00');
  const [endTime, setEnd] = useState('10:00');
  const [participants, setParticipants] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [refUrl, setRefUrl] = useState('');
  // expense 유형은 reminder 0 (알림 없음) — 일반 지출 기록에 리마인더 알림 불필요
  const [reminder, setReminder] = useState(type === 'expense' ? 0 : 15);
  const [repeat, setRepeat] = useState<RepeatType>('none');
  const [memo, setMemo] = useState('');

  // Expense Fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [expenseVisibility, setExpenseVisibility] = useState<ScheduleVisibility>('space');

  // Attachments
  const [attachments, setAttachments] = useState<{ id: string; file: File | null; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (members.length > 0 && participants.length === 0) {
      setParticipants(members.map(m => m.userId));
    }
  }, [members]);

  // 유형이 expense로 변경되면 reminder를 0으로 리셋 (알림 불필요)
  useEffect(() => {
    if (type === 'expense') setReminder(0);
    else if (reminder === 0) setReminder(15);
  // reminder 값 변화에 반응하지 않도록 의도적으로 의존성 제외
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const toggleParticipant = (id: string) => {
    setParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file)
    }));
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 10));
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const filtered = prev.filter(a => a.id !== id);
      const target = prev.find(a => a.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return filtered;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('일정 제목을 입력해주세요');
      return;
    }
    const isPrivateExpense = type === 'expense' && expenseVisibility === 'private';
    const targetPersonalSpaceId = personalSpaceId ?? (!hasSharedSpace ? familyGroupId : null);
    const targetSpaceId = (type === 'personal' || isPrivateExpense)
      ? targetPersonalSpaceId
      : sharedSpaceId;

    if (!targetSpaceId) {
      // 아직 로딩 중이거나 공간 생성 중 — refresh() 재시도 트리거
      refresh();
      toast.error(type === 'personal' || isPrivateExpense
        ? '개인 공간을 준비하는 중입니다. 잠시 후 다시 시도해주세요.'
        : '공유 공간이 필요합니다. 먼저 공간을 만들거나 초대에 참여해 주세요.');
      return;
    }

    // 공유 공간 viewer 역할은 일정 생성 불가
    if (targetSpaceId === sharedSpaceId && myRole === 'viewer') {
      toast.error('조회 권한만 있어 일정을 생성할 수 없습니다');
      return;
    }

    setSaving(true);
    try {
      const start = new Date(`${date}T${startTime}`);
      const end   = new Date(`${date}T${endTime}`);

      await createSchedule(targetSpaceId, {
        title: title.trim(),
        type,
        startTime: start,
        endTime: end,
        participantIds: targetSpaceId === targetPersonalSpaceId
          ? (user?.id ? [user.id] : [])
          : participants,
        locationAddress: address || undefined,
        referenceUrl: refUrl || undefined,
        reminder,
        repeat,
        memo: memo || undefined,
        amount: type === 'expense' ? Number(amount) : undefined,
        expenseCategory: type === 'expense' ? category : undefined,
        paymentMethod: type === 'expense' ? paymentMethod : undefined,
        // 개인 일정/개인 지출은 개인 공간에 private으로, 공유 일정/공간 지출은 공유 공간에 저장
        visibility: type === 'personal' || isPrivateExpense ? 'private' : (type === 'expense' ? 'space' : undefined),
      });

      void trackEvent('schedule_create', {
        schedule_type: type,
        has_participants: participants.length > 0,
        has_reminder: reminder > 0,
        has_repeat: repeat !== 'none',
        has_expense: type === 'expense' && !!amount,
      });
      toast.success('일정이 등록되었습니다');
      router.push('/schedules');
    } catch (err) {
      console.error(err);
      toast.error('일정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const commonProps = {
    saving,
    userLoading,
    type, setType, title, setTitle, date, setDate, startTime, setStart, endTime, setEnd,
    participants, toggleParticipant, members, address, setAddress, refUrl, setRefUrl,
    reminder, setReminder, repeat, setRepeat, memo, setMemo, amount, setAmount,
    category, setCategory, paymentMethod, setPaymentMethod,
    expenseVisibility, setExpenseVisibility,
    attachments, handleFileSelect, fileInputRef, removeAttachment, handleSave,
  };

  if (isDesktop) {
    return <DesktopNewSchedule {...commonProps} />;
  }

  return <MobileNewSchedule {...commonProps} />;
}
