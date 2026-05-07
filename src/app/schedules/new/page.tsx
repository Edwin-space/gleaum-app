'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { createSchedule } from '@/lib/db';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import type { ScheduleType, RepeatType, ExpenseCategory, PaymentMethod } from '@/types';

import { MobileNewSchedule } from './MobileNewSchedule';
import { DesktopNewSchedule } from './DesktopNewSchedule';

export default function NewSchedulePage() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { familyGroupId } = useCurrentUser();
  const { members } = useSpace(familyGroupId);

  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<ScheduleType>((searchParams.get('type') as ScheduleType) || 'shared');

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
    if (!familyGroupId) return;

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
    saving, type, setType, title, setTitle, date, setDate, startTime, setStart, endTime, setEnd,
    participants, toggleParticipant, members, address, setAddress, refUrl, setRefUrl,
    reminder, setReminder, repeat, setRepeat, memo, setMemo, amount, setAmount,
    category, setCategory, paymentMethod, setPaymentMethod, attachments,
    handleFileSelect, fileInputRef, removeAttachment, handleSave
  };

  if (isDesktop) {
    return <DesktopNewSchedule {...commonProps} />;
  }

  return <MobileNewSchedule {...commonProps} />;
}
