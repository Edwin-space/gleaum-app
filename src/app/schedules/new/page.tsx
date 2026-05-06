'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SCHEDULE_TYPE_LABELS,
  REPEAT_LABELS,
  REMINDER_OPTIONS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_ICONS,
  PAYMENT_METHOD_LABELS,
} from '@/types';
import type { ScheduleType, RepeatType, ExpenseCategory, PaymentMethod } from '@/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFamily } from '@/hooks/useFamily';
import { useSchedules } from '@/hooks/useSchedules';
import { createSchedule } from '@/lib/db';
import { scheduleToast, toastError } from '@/lib/toast';

// 입력 공통 스타일
const inputBase = 'w-full px-4 py-3.5 rounded-[16px] text-[15px] bg-white border-2 outline-none transition-all';

// 유형별 칩 설정
const typeConfig: Record<ScheduleType, { icon: string; activeColor: string; activeBg: string; label: string }> = {
  shared:   { icon: '👨‍👩‍👧‍👦', activeColor: '#0084CC', activeBg: 'rgba(0,132,204,0.10)',  label: '공유' },
  personal: { icon: '👤',       activeColor: '#0891B2', activeBg: 'rgba(6,182,212,0.10)',  label: '개인' },
  child:    { icon: '🧒',       activeColor: '#059669', activeBg: 'rgba(16,185,129,0.10)', label: '자녀' },
  expense:  { icon: '💰',       activeColor: '#D97706', activeBg: 'rgba(245,158,11,0.10)', label: '지출' },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-widest uppercase mb-2"
      style={{ color: '#8E8E93' }}>
      {children}
    </p>
  );
}

export default function NewSchedulePage() {
  const router = useRouter();
  const { user, familyGroupId } = useCurrentUser();
  const { members } = useFamily(familyGroupId);
  const { create } = useSchedules(familyGroupId);

  const [saving, setSaving] = useState(false);
  const [type, setType]         = useState<ScheduleType>('shared');
  const [title, setTitle]       = useState('');
  const [date, setDate]         = useState('');
  const [startTime, setStart]   = useState('');
  const [endTime, setEnd]       = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [address, setAddress]   = useState('');
  const [refUrl, setRefUrl]     = useState('');
  const [reminder, setReminder] = useState(30);
  const [repeat, setRepeat]     = useState<RepeatType>('none');
  const [memo, setMemo]         = useState('');
  const [amount, setAmount]               = useState('');
  const [category, setCategory]           = useState<ExpenseCategory>('education');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('auto');
  const [attachments, setAttachments] = useState<{ id: string; name: string; source: string }[]>([]);

  const scheduleTypes: ScheduleType[] = ['shared', 'personal', 'child', 'expense'];

  const toggleParticipant = (uid: string) => {
    setParticipants((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) { toastError('제목을 입력해주세요'); return; }
    if (!date) { toastError('날짜를 선택해주세요'); return; }
    setSaving(true);
    try {
      const startDateTime = new Date(`${date}T${startTime || '00:00'}:00`);
      const endDateTime   = endTime ? new Date(`${date}T${endTime}:00`) : undefined;
      const participantIds = participants.length > 0 ? participants : (user ? [user.id] : []);

      await create({
        title: title.trim(), type,
        startTime: startDateTime, endTime: endDateTime,
        status: 'pending',
        locationAddress: address || undefined,
        referenceUrl: refUrl || undefined,
        reminder, repeat,
        memo: memo || undefined,
        participantIds,
        amount: type === 'expense' && amount ? parseInt(amount) : undefined,
        expenseCategory: type === 'expense' ? category : undefined,
        paymentMethod: type === 'expense' ? paymentMethod : undefined,
      });
      router.back();
    } catch (e) {
      console.error('저장 오류:', e);
      scheduleToast.error('저장');
    } finally {
      setSaving(false);
    }
  };

  const activeType = typeConfig[type];

  return (
    <div className="min-h-dvh pb-10" style={{ background: '#FAFAFD' }}>

      {/* ── 상단 헤더 ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(250,250,253,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,132,204,0.06)',
          paddingTop: `calc(env(safe-area-inset-top) + 12px)`,
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,132,204,0.06)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#0084CC" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>

        <p className="text-[16px] font-bold" style={{ color: '#1A1B2E' }}>
          일정 추가
        </p>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-full text-[14px] font-bold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{
            background: saving ? '#9B89FC' : 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
            boxShadow: '0 4px 16px rgba(0,132,204,0.35)',
          }}
        >
          {saving ? '저장중' : '저장'}
        </button>
      </div>

      <div className="px-4 pt-5 space-y-6">

        {/* ── 일정 유형 ── */}
        <div>
          <SectionLabel>일정 유형</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {scheduleTypes.map((t) => {
              const cfg = typeConfig[t];
              const selected = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="py-3 rounded-[16px] text-[12px] font-bold flex flex-col items-center gap-1 transition-all active:scale-95"
                  style={{
                    background: selected ? cfg.activeBg : 'white',
                    border: selected ? `2px solid ${cfg.activeColor}40` : '2px solid rgba(0,132,204,0.06)',
                    color: selected ? cfg.activeColor : '#8E8E93',
                    boxShadow: selected ? `0 4px 16px ${cfg.activeColor}25` : 'none',
                  }}
                >
                  <span className="text-xl">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 제목 ── */}
        <div>
          <SectionLabel>제목 *</SectionLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일정 제목을 입력하세요"
            className={inputBase}
            style={{
              borderColor: title ? '#0084CC' : 'rgba(0,132,204,0.12)',
            }}
          />
        </div>

        {/* ── 날짜 & 시간 ── */}
        <div>
          <SectionLabel>날짜 *</SectionLabel>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputBase}
            style={{ borderColor: date ? '#0084CC' : 'rgba(0,132,204,0.12)' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <SectionLabel>시작 시간</SectionLabel>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStart(e.target.value)}
              className={inputBase}
              style={{ borderColor: startTime ? '#0084CC' : 'rgba(0,132,204,0.12)' }}
            />
          </div>
          <div>
            <SectionLabel>종료 시간</SectionLabel>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEnd(e.target.value)}
              className={inputBase}
              style={{ borderColor: endTime ? '#0084CC' : 'rgba(0,132,204,0.12)' }}
            />
          </div>
        </div>

        {/* ── 정기지출 전용 ── */}
        {type === 'expense' && (
          <div
            className="space-y-4 p-5 rounded-[20px]"
            style={{ background: 'rgba(245,158,11,0.05)', border: '2px solid rgba(245,158,11,0.15)' }}
          >
            <p className="text-[13px] font-bold" style={{ color: '#D97706' }}>
              💰 정기지출 정보
            </p>

            <div>
              <SectionLabel>금액</SectionLabel>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className={inputBase + ' pr-10'}
                  style={{ borderColor: amount ? '#D97706' : 'rgba(245,158,11,0.20)' }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold"
                  style={{ color: '#D97706' }}>원</span>
              </div>
            </div>

            <div>
              <SectionLabel>카테고리</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className="py-2.5 px-2 rounded-[12px] text-[12px] font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                    style={{
                      background: category === cat ? 'rgba(245,158,11,0.12)' : 'white',
                      border: category === cat ? '2px solid rgba(245,158,11,0.35)' : '2px solid rgba(245,158,11,0.12)',
                      color: category === cat ? '#D97706' : '#8E8E93',
                    }}
                  >
                    <span>{EXPENSE_CATEGORY_ICONS[cat]}</span>
                    <span className="truncate">{EXPENSE_CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>결제 수단</SectionLabel>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className="py-2 rounded-[12px] text-[12px] font-semibold transition-all active:scale-95"
                    style={{
                      background: paymentMethod === m ? 'rgba(245,158,11,0.12)' : 'white',
                      border: paymentMethod === m ? '2px solid rgba(245,158,11,0.35)' : '2px solid rgba(245,158,11,0.12)',
                      color: paymentMethod === m ? '#D97706' : '#8E8E93',
                    }}
                  >
                    {PAYMENT_METHOD_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 참여자 ── */}
        <div>
          <SectionLabel>참여자</SectionLabel>
          {members.length === 0 ? (
            <p className="text-[13px]" style={{ color: '#8E8E93' }}>
              가족 멤버를 불러오는 중...
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {members.map((u) => {
                const selected = participants.includes(u.id);
                return (
                  <button key={u.id} onClick={() => toggleParticipant(u.id)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                    style={{
                      background: selected ? '#0084CC' : 'white',
                      color: selected ? 'white' : '#8E8E93',
                      border: selected ? 'none' : '2px solid rgba(0,132,204,0.12)',
                      boxShadow: selected ? '0 4px 16px rgba(0,132,204,0.30)' : 'none',
                    }}
                  >
                    <span>{u.avatar}</span>
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 장소 ── */}
        <div>
          <SectionLabel>장소</SectionLabel>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">📍</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="장소를 입력하세요"
              className={inputBase + ' pl-10'}
              style={{ borderColor: address ? '#0084CC' : 'rgba(0,132,204,0.12)' }}
            />
          </div>
          {address && (
            <div className="mt-2 h-28 rounded-[16px] flex items-center justify-center"
              style={{ background: 'rgba(0,132,204,0.04)', border: '1.5px dashed rgba(0,132,204,0.15)' }}>
              <div className="text-center">
                <span className="text-3xl">🗺️</span>
                <p className="text-[12px] mt-1" style={{ color: '#8E8E93' }}>{address}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── 참고 URL ── */}
        <div>
          <SectionLabel>참고 URL</SectionLabel>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">🔗</span>
            <input
              value={refUrl}
              onChange={(e) => setRefUrl(e.target.value)}
              placeholder="참고 웹사이트 (선택)"
              className={inputBase + ' pl-10'}
              style={{ borderColor: refUrl ? '#0084CC' : 'rgba(0,132,204,0.12)' }}
            />
          </div>
        </div>

        {/* ── 알림 설정 ── */}
        <div>
          <SectionLabel>알림 설정</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {REMINDER_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setReminder(opt.value)}
                className="px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all active:scale-95"
                style={{
                  background: reminder === opt.value ? '#0084CC' : 'white',
                  color: reminder === opt.value ? 'white' : '#8E8E93',
                  border: reminder === opt.value ? 'none' : '2px solid rgba(0,132,204,0.12)',
                  boxShadow: reminder === opt.value ? '0 4px 12px rgba(0,132,204,0.30)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 반복 설정 ── */}
        <div>
          <SectionLabel>반복 설정</SectionLabel>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as RepeatType)}
            className={inputBase}
            style={{ borderColor: repeat !== 'none' ? '#0084CC' : 'rgba(0,132,204,0.12)' }}
          >
            {(Object.entries(REPEAT_LABELS) as [RepeatType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* ── 사진 첨부 ── */}
        <div>
          <SectionLabel>사진 및 파일 첨부</SectionLabel>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => setAttachments((prev) => [...prev, { id: Date.now().toString(), name: `사진_${prev.length + 1}.jpg`, source: 'local' }])}
              className="flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-[13px] font-semibold transition-all active:scale-95"
              style={{ background: 'white', border: '2px dashed rgba(0,132,204,0.25)', color: '#0084CC' }}
            >
              <span>📱</span> 내 휴대폰
            </button>
            <button
              onClick={() => setAttachments((prev) => [...prev, { id: Date.now().toString(), name: `드라이브_${prev.length + 1}.jpg`, source: 'google_drive' }])}
              className="flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-[13px] font-semibold transition-all active:scale-95"
              style={{ background: 'white', border: '2px dashed rgba(6,182,212,0.30)', color: '#0891B2' }}
            >
              <span>☁️</span> 구글 드라이브
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {attachments.map((a) => (
                <div key={a.id}
                  className="relative flex-shrink-0 w-20 h-20 rounded-[14px] flex items-center justify-center"
                  style={{ background: 'rgba(0,132,204,0.06)', border: '1.5px solid rgba(0,132,204,0.12)' }}>
                  <span className="text-2xl">{a.source === 'local' ? '🖼️' : '📄'}</span>
                  <button onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: '#EF4444' }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] mt-2" style={{ color: '#8E8E93' }}>
            최대 10개 · JPG, PNG, PDF 지원
          </p>
        </div>

        {/* ── 메모 ── */}
        <div>
          <SectionLabel>메모</SectionLabel>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요 (선택)"
            rows={3}
            className={inputBase + ' resize-none leading-relaxed'}
            style={{ borderColor: memo ? '#0084CC' : 'rgba(0,132,204,0.12)' }}
          />
        </div>

        {/* ── 저장 / 취소 버튼 ── */}
        <div className="grid grid-cols-2 gap-3 pt-2 pb-8">
          <button onClick={() => router.back()}
            className="h-[56px] rounded-[20px] text-[15px] font-bold transition-all active:scale-95"
            style={{ border: '2px solid rgba(0,132,204,0.15)', color: '#8E8E93' }}>
            취소
          </button>
          <button onClick={handleSave} disabled={saving}
            className="h-[56px] rounded-[20px] text-[15px] font-bold text-white transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
              boxShadow: '0 8px 24px rgba(0,132,204,0.35)',
            }}>
            {saving ? '저장 중...' : '일정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
