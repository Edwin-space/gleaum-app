'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
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

// ── 공통 입력 스타일 ──
const inputCls =
  'w-full px-4 py-3 rounded-xl text-[15px] bg-white border outline-none transition-all focus:border-[var(--color-primary)]';
const labelCls =
  'block text-[12px] font-semibold mb-1.5 tracking-wide uppercase';

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
  // 정기지출 전용
  const [amount, setAmount]               = useState('');
  const [category, setCategory]           = useState<ExpenseCategory>('education');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('auto');
  // 사진 첨부 (UI 전용)
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string; source: string }[]>([]);

  const scheduleTypes: ScheduleType[] = ['shared', 'personal', 'child', 'expense'];

  const toggleParticipant = (uid: string) => {
    setParticipants((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handlePhotoLocal = () => {
    const mockFile = { id: Date.now().toString(), name: '사진_' + (attachments.length + 1) + '.jpg', url: '', source: 'local' };
    setAttachments((prev) => [...prev, mockFile]);
  };

  const handlePhotoDrive = () => {
    const mockFile = { id: Date.now().toString(), name: '드라이브_파일_' + (attachments.length + 1) + '.jpg', url: '', source: 'google_drive' };
    setAttachments((prev) => [...prev, mockFile]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요');
      return;
    }
    if (!date) {
      alert('날짜를 선택해주세요');
      return;
    }

    setSaving(true);
    try {
      // 날짜 + 시간 조합
      const startDateTime = new Date(`${date}T${startTime || '00:00'}:00`);
      const endDateTime   = endTime ? new Date(`${date}T${endTime}:00`) : undefined;

      // 참여자가 없으면 현재 사용자 자동 포함
      const participantIds = participants.length > 0 ? participants : (user ? [user.id] : []);

      await create({
        title:            title.trim(),
        type,
        startTime:        startDateTime,
        endTime:          endDateTime,
        status:           'pending',
        locationAddress:  address || undefined,
        referenceUrl:     refUrl || undefined,
        reminder,
        repeat,
        memo:             memo || undefined,
        participantIds,
        amount:           type === 'expense' && amount ? parseInt(amount) : undefined,
        expenseCategory:  type === 'expense' ? category : undefined,
        paymentMethod:    type === 'expense' ? paymentMethod : undefined,
      });

      router.back();
    } catch (e) {
      console.error('저장 오류:', e);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh pb-10" style={{ background: 'var(--color-canvas-parchment)' }}>
      <AppHeader
        title="일정 추가"
        showLogo={false}
        showBack
        showNotification={false}
        rightAction={
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-full text-[14px] font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        }
      />

      <div className="px-4 pt-4 space-y-5">

        {/* ── 일정 유형 ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>일정 유형</label>
          <div className="grid grid-cols-4 gap-1.5">
            {scheduleTypes.map((t) => {
              const colors: Record<ScheduleType, string> = {
                shared:   'var(--color-schedule-shared)',
                personal: 'var(--color-schedule-personal)',
                child:    'var(--color-schedule-child)',
                expense:  'var(--color-schedule-expense)',
              };
              const selected = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                  style={{
                    background: selected ? colors[t] : 'white',
                    color: selected
                      ? (t === 'child' ? 'var(--brand-black)' : 'white')
                      : 'var(--color-ink-muted-48)',
                    border: selected ? 'none' : '1px solid var(--color-hairline)',
                  }}
                >
                  {SCHEDULE_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 제목 ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>제목 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일정 제목을 입력하세요"
            className={inputCls}
            style={{ borderColor: 'var(--color-hairline)', fontFamily: "'Noto Sans KR',sans-serif" }}
          />
        </div>

        {/* ── 날짜 & 시간 ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>날짜 *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
            style={{ borderColor: 'var(--color-hairline)' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>시작 시간</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStart(e.target.value)}
              className={inputCls}
              style={{ borderColor: 'var(--color-hairline)' }}
            />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>종료 시간</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEnd(e.target.value)}
              className={inputCls}
              style={{ borderColor: 'var(--color-hairline)' }}
            />
          </div>
        </div>

        {/* ── 정기지출 전용 필드 ── */}
        {type === 'expense' && (
          <div className="space-y-4 p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-[13px] font-semibold" style={{ color: '#B45309' }}>💰 정기지출 정보</p>

            <div>
              <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>금액</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className={inputCls + ' pr-10'}
                  style={{ borderColor: 'var(--color-hairline)' }}
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px]"
                  style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}
                >
                  원
                </span>
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>카테고리</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="py-2 px-2 rounded-xl text-[12px] font-medium flex items-center gap-1.5 transition-all"
                    style={{
                      background: category === cat ? 'rgba(245,158,11,0.15)' : 'white',
                      border: category === cat ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--color-hairline)',
                      color: category === cat ? '#B45309' : 'var(--color-ink-muted-48)',
                      fontFamily: "'Noto Sans KR',sans-serif",
                    }}
                  >
                    <span>{EXPENSE_CATEGORY_ICONS[cat]}</span>
                    <span>{EXPENSE_CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>결제 수단</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className="py-2 rounded-xl text-[12px] font-medium transition-all"
                    style={{
                      background: paymentMethod === m ? 'rgba(245,158,11,0.15)' : 'white',
                      border: paymentMethod === m ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--color-hairline)',
                      color: paymentMethod === m ? '#B45309' : 'var(--color-ink-muted-48)',
                      fontFamily: "'Noto Sans KR',sans-serif",
                    }}
                  >
                    {PAYMENT_METHOD_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 참여자 (실데이터 가족 멤버) ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>참여자</label>
          {members.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              가족 멤버를 불러오는 중...
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {members.map((u) => {
                const selected = participants.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleParticipant(u.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-[13px] font-medium transition-all"
                    style={{
                      background: selected ? 'var(--color-primary)' : 'white',
                      color: selected ? 'white' : 'var(--color-ink)',
                      border: selected ? 'none' : '1px solid var(--color-hairline)',
                      fontFamily: "'Noto Sans KR',sans-serif",
                    }}
                  >
                    <span>{u.avatar}</span>
                    <span>{u.name}</span>
                    <span className="text-[10px] opacity-70">({u.role === 'parent' ? '부모' : '자녀'})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 장소 ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>장소</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">📍</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="장소를 검색하세요"
              className={inputCls + ' pl-10'}
              style={{ borderColor: 'var(--color-hairline)', fontFamily: "'Noto Sans KR',sans-serif" }}
            />
          </div>
          {address && (
            <div
              className="mt-2 h-32 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: 'var(--color-hairline)' }}
            >
              <div className="text-center">
                <span className="text-3xl">🗺️</span>
                <p className="text-[12px] mt-1" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  {address}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── 참고 URL ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>참고 URL</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">🔗</span>
            <input
              value={refUrl}
              onChange={(e) => setRefUrl(e.target.value)}
              placeholder="참고 웹사이트를 입력하세요 (선택)"
              className={inputCls + ' pl-10'}
              style={{ borderColor: 'var(--color-hairline)' }}
            />
          </div>
        </div>

        {/* ── 알림 설정 ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>알림 설정</label>
          <div className="flex gap-2 flex-wrap">
            {REMINDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setReminder(opt.value)}
                className="px-3 py-2 rounded-full text-[12px] font-medium transition-all"
                style={{
                  background: reminder === opt.value ? 'var(--color-primary)' : 'white',
                  color: reminder === opt.value ? 'white' : 'var(--color-ink-muted-48)',
                  border: reminder === opt.value ? 'none' : '1px solid var(--color-hairline)',
                  fontFamily: "'Noto Sans KR',sans-serif",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 반복 설정 ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>반복 설정</label>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as RepeatType)}
            className={inputCls}
            style={{ borderColor: 'var(--color-hairline)', fontFamily: "'Noto Sans KR',sans-serif" }}
          >
            {(Object.entries(REPEAT_LABELS) as [RepeatType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* ── 사진 첨부 ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>사진 및 파일 첨부</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={handlePhotoLocal}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition-all active:scale-95"
              style={{
                background: 'white',
                border: '1px dashed var(--color-primary)',
                color: 'var(--color-primary)',
                fontFamily: "'Noto Sans KR',sans-serif",
              }}
            >
              <span>📱</span> 내 휴대폰
            </button>
            <button
              onClick={handlePhotoDrive}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition-all active:scale-95"
              style={{
                background: 'white',
                border: '1px dashed var(--color-schedule-shared)',
                color: 'var(--color-schedule-shared)',
                fontFamily: "'Noto Sans KR',sans-serif",
              }}
            >
              <span>☁️</span> 구글 드라이브
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden"
                  style={{ background: 'var(--color-hairline)' }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl">{a.source === 'local' ? '🖼️' : '📄'}</span>
                  </div>
                  <button
                    onClick={() => removeAttachment(a.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
            최대 10개 · JPG, PNG, PDF 지원
          </p>
        </div>

        {/* ── 메모 ── */}
        <div>
          <label className={labelCls} style={{ color: 'var(--color-ink-muted-48)' }}>메모</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요 (선택)"
            rows={3}
            className={inputCls + ' resize-none leading-relaxed'}
            style={{ borderColor: 'var(--color-hairline)', fontFamily: "'Noto Sans KR',sans-serif" }}
          />
        </div>

        {/* ── 저장 / 취소 버튼 ── */}
        <div className="grid grid-cols-2 gap-3 pt-2 pb-6">
          <button
            onClick={() => router.back()}
            className="h-12 rounded-2xl text-[15px] font-semibold transition-all active:scale-95"
            style={{
              border: '1px solid var(--color-hairline)',
              color: 'var(--color-ink-muted-48)',
              fontFamily: "'Noto Sans KR',sans-serif",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-12 rounded-2xl text-[15px] font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}
          >
            {saving ? '저장 중...' : '일정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
