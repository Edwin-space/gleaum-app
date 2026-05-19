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
  const { familyGroupId, loading: userLoading, refresh } = useCurrentUser();
  const { members, myRole } = useSpace(familyGroupId);

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
  const [reminder, setReminder] = useState(15);
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
      setParticipants(members.map(m => m.id));
    }
  }, [members]);

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
    if (!familyGroupId) {
      // 아직 로딩 중이거나 공간 생성 중 — refresh() 재시도 트리거
      refresh();
      toast.error('스페이스 초기화 중입니다. 잠시 후 다시 시도해주세요 (3~5초)');
      return;
    }

    // viewer 역할은 일정 생성 불가
    if (myRole === 'viewer') {
      toast.error('조회 권한만 있어 일정을 생성할 수 없습니다');
      return;
    }

    setSaving(true);
    try {
      const start = new Date(`${date}T${startTime}`);
      const end   = new Date(`${date}T${endTime}`);

      await createSchedule(familyGroupId, {
        title: title.trim(),
        type,
        startTime: start,
        endTime: end,
        participantIds: participants,
        locationAddress: address || undefined,
        referenceUrl: refUrl || undefined,
        reminder,
        repeat,
        memo: memo || undefined,
        amount: type === 'expense' ? Number(amount) : undefined,
        expenseCategory: type === 'expense' ? category : undefined,
        paymentMethod: type === 'expense' ? paymentMethod : undefined,
        // expense 유형일 때 공유/개인 선택 적용
        visibility: type === 'expense' ? expenseVisibility : undefined,
      });

      trackEvent('schedule_create', {
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
