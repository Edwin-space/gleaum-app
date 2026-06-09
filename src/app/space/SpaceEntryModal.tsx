'use client';
import { useState } from 'react';
import { createSchedule } from '@/lib/db';
import { toast } from 'sonner';
import type { SpaceMember, Schedule, ExpenseCategory } from '@/types';

const EXPENSE_CATEGORIES = [
  { value: 'food',      label: '식비',   emoji: '🍽️' },
  { value: 'transport', label: '교통',   emoji: '🚗' },
  { value: 'housing',   label: '주거',   emoji: '🏠' },
  { value: 'culture',   label: '여가',   emoji: '🎮' },
  { value: 'medical',   label: '건강',   emoji: '💊' },
  { value: 'education', label: '교육',   emoji: '📚' },
  { value: 'daily',     label: '생활',   emoji: '🛍️' },
  { value: 'social',    label: '경조사', emoji: '🎁' },
] as const;

interface SpaceEntryModalProps {
  type: 'schedule' | 'expense';
  spaceId: string;
  members: SpaceMember[];
  currentUserId: string;
  onClose: () => void;
  onSaved: (schedule: Schedule) => void;
}

export function SpaceEntryModal({
  type, spaceId, members, currentUserId, onClose, onSaved,
}: SpaceEntryModalProps) {
  const isExpense = type === 'expense';
  const today = new Date().toISOString().slice(0, 10);

  const [title, setTitle]           = useState('');
  const [date, setDate]             = useState(today);
  const [time, setTime]             = useState('09:00');
  const [location, setLocation]     = useState('');
  const [memo, setMemo]             = useState('');
  const [amount, setAmount]         = useState('');
  const [category, setCategory]     = useState<string>('food');
  const [visibility, setVisibility] = useState<'space' | 'private'>('space');
  const [participants, setParticipants] = useState<string[]>(members.map(m => m.userId));
  const [saving, setSaving]         = useState(false);

  const toggleParticipant = (userId: string) => {
    setParticipants(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('제목을 입력하세요'); return; }
    if (isExpense && !amount.trim()) { toast.error('금액을 입력하세요'); return; }
    setSaving(true);
    const startTime = new Date(`${date}T${isExpense ? '00:00' : time}`);
    const input = isExpense
      ? {
          title: title.trim(),
          type: 'expense' as const,
          visibility: visibility as 'space' | 'private',
          startTime,
          endTime: startTime,
          amount: Number(amount.replace(/[^0-9]/g, '')),
          expenseCategory: category as ExpenseCategory,
          memo: memo.trim() || undefined,
          participantIds: participants,
          repeat: 'none' as const,
        }
      : {
          title: title.trim(),
          type: 'shared' as const,
          visibility: visibility as 'space' | 'private',
          startTime,
          endTime: new Date(`${date}T${time}`),
          locationAddress: location.trim() || undefined,
          memo: memo.trim() || undefined,
          participantIds: participants,
          repeat: 'none' as const,
        };
    const result = await createSchedule(spaceId, input);
    setSaving(false);
    if (result) {
      toast.success(isExpense ? '지출이 등록되었습니다' : '일정이 등록되었습니다');
      onSaved(result);
    } else {
      toast.error('저장에 실패했습니다');
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--theme-surface)', borderRadius: '32px', padding: '36px', width: '100%', maxWidth: '560px', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 4px' }}>
              {isExpense ? '지출 등록' : '일정 추가'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', margin: 0 }}>공간 공유 {isExpense ? '지출' : '일정'}</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-subtle)' }}
          >✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 제목 */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '6px' }}>제목 *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isExpense ? '예: 마트 장보기' : '예: 저녁 약속'}
              autoFocus
              style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', background: 'var(--theme-surface-muted)', border: `1.5px solid ${title ? '#0084CC' : 'transparent'}`, fontSize: '15px', fontWeight: 700, color: 'var(--theme-text)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
            />
          </div>

          {/* 날짜 + 시간/금액 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '6px' }}>날짜</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', background: 'var(--theme-surface-muted)', border: '1.5px solid transparent', fontSize: '14px', fontWeight: 700, color: 'var(--theme-text)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {isExpense ? (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '6px' }}>금액 *</label>
                <input
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', background: 'var(--theme-surface-muted)', border: `1.5px solid ${amount ? '#D97706' : 'transparent'}`, fontSize: '14px', fontWeight: 700, color: 'var(--theme-text)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '6px' }}>시간</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', background: 'var(--theme-surface-muted)', border: '1.5px solid transparent', fontSize: '14px', fontWeight: 700, color: 'var(--theme-text)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>

          {/* 지출 카테고리 */}
          {isExpense && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '8px' }}>카테고리</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    style={{
                      padding: '7px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 800,
                      background: category === cat.value ? 'rgba(217,119,6,0.12)' : 'var(--theme-surface-muted)',
                      border: `1.5px solid ${category === cat.value ? '#D97706' : 'transparent'}`,
                      color: category === cat.value ? '#D97706' : 'var(--theme-text-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 장소 (일정만) */}
          {!isExpense && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '6px' }}>장소</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="선택 사항"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', background: 'var(--theme-surface-muted)', border: '1.5px solid transparent', fontSize: '14px', fontWeight: 600, color: 'var(--theme-text)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* 메모 */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '6px' }}>메모</label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="선택 사항"
              rows={2}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', background: 'var(--theme-surface-muted)', border: '1.5px solid transparent', fontSize: '14px', fontWeight: 600, color: 'var(--theme-text)', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* 공개범위 */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '8px' }}>공개범위</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['space', 'private'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  style={{ flex: 1, padding: '10px', borderRadius: '14px', fontSize: '13px', fontWeight: 800, border: `1.5px solid ${visibility === v ? '#0084CC' : 'transparent'}`, background: visibility === v ? 'rgba(0,132,204,0.08)' : 'var(--theme-surface-muted)', color: visibility === v ? '#0084CC' : 'var(--theme-text-subtle)', cursor: 'pointer' }}
                >
                  {v === 'space' ? '🌐 공간 공개' : '🔒 나만 보기'}
                </button>
              ))}
            </div>
          </div>

          {/* 참여자 */}
          {members.length > 1 && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '8px' }}>참여자</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {members.map(m => {
                  const selected = participants.includes(m.userId);
                  const isMe = m.userId === currentUserId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => !isMe && toggleParticipant(m.userId)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, border: `1.5px solid ${selected ? '#0CC9B5' : 'transparent'}`, background: selected ? 'rgba(12,201,181,0.10)' : 'var(--theme-surface-muted)', color: selected ? '#0CC9B5' : 'var(--theme-text-subtle)', cursor: isMe ? 'default' : 'pointer' }}
                    >
                      {m.nickname ?? m.user?.name ?? '멤버'}{isMe ? ' (나)' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* 저장/취소 */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, height: '52px', borderRadius: '16px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}
          >취소</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 2, height: '52px', borderRadius: '16px', background: isExpense ? 'linear-gradient(135deg, #D97706, #F59E0B)' : 'linear-gradient(135deg, #0084CC, #0CC9B5)', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: '15px', fontWeight: 800, color: 'white', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? '저장 중...' : (isExpense ? '지출 등록' : '일정 추가')}
          </button>
        </div>
      </div>
    </div>
  );
}
