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
import { useSpace } from '@/hooks/useSpace';

import { useSchedules } from '@/hooks/useSchedules';
import { createSchedule } from '@/lib/db';
import { uploadScheduleAttachment } from '@/lib/db';
import { scheduleToast, toastError } from '@/lib/toast';
import { useRef } from 'react';

// 유형별 칩 설정
const typeConfig: Record<ScheduleType, { icon: string; activeColor: string; activeBg: string; label: string }> = {
  shared:   { icon: '👨‍👩‍👧‍👦', activeColor: '#0084CC', activeBg: '#0084CC',  label: '공유' },
  personal: { icon: '👤',       activeColor: '#0891B2', activeBg: '#0891B2',  label: '개인' },
  child:    { icon: '🧒',       activeColor: '#059669', activeBg: '#059669', label: '자녀' },
  expense:  { icon: '💰',       activeColor: '#D97706', activeBg: '#D97706', label: '지출' },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '12px', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.05em', marginBottom: '10px', textTransform: 'uppercase' }}>
      {children}
    </p>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '24px',
  padding: '20px',
  boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
  marginBottom: '12px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '52px',
  padding: '0 16px',
  borderRadius: '14px',
  fontSize: '15px',
  background: '#F7F7FA',
  border: '1.5px solid #EBEBF0',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
  color: '#1A1B2E',
  fontWeight: 600,
};

export default function NewSchedulePage() {
  const router = useRouter();
  const { user, spaceId } = useCurrentUser();
  const { space: group, members } = useSpace(spaceId);
  const { create } = useSchedules(spaceId);

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
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string; file?: File; uploading?: boolean }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // 첨부 파일 업로드 (미완료 항목만 처리)
      const attachmentUrls: string[] = [];
      for (const att of attachments) {
        if (att.url && !att.file) {
          // 이미 업로드된 항목
          attachmentUrls.push(att.url);
        } else if (att.file) {
          const url = await uploadScheduleAttachment(att.file);
          if (url) attachmentUrls.push(url);
        }
      }

      await create({
        title: title.trim(), type,
        startTime: startDateTime, endTime: endDateTime,
        status: 'pending',
        locationAddress: address || undefined,
        referenceUrl: refUrl || undefined,
        reminder, repeat,
        memo: attachmentUrls.length > 0
          ? `${memo || ''}${memo ? '\n' : ''}[첨부: ${attachmentUrls.join(', ')}]`
          : memo || undefined,
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

  // 파일 선택 핸들러
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (attachments.length + files.length > 10) {
      toastError('최대 10개까지 첨부할 수 있습니다');
      return;
    }
    const newItems = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }));
    setAttachments((prev) => [...prev, ...newItems]);
    // input 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = '';
  };

  const activeType = typeConfig[type];

  return (
    <div className="min-h-dvh pb-10" style={{ background: '#F5F5F9' }}>

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

      <div className="px-4 pt-5">

        {/* ── Card: 일정 유형 ── */}
        <div style={cardStyle}>
          <SectionLabel>일정 유형</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {scheduleTypes.map((t) => {
              const cfg = typeConfig[t];
              const selected = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="flex flex-col items-center gap-1.5 transition-all active:scale-95"
                  style={{
                    height: '72px',
                    borderRadius: '20px',
                    background: selected ? cfg.activeBg : '#F7F7FA',
                    border: selected ? 'none' : '1.5px solid #EBEBF0',
                    color: selected ? 'white' : '#8E8E93',
                    boxShadow: selected ? `0 4px 16px ${cfg.activeColor}40` : 'none',
                    position: 'relative',
                    justifyContent: 'center',
                  }}
                >
                  <span className="text-2xl">{cfg.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{cfg.label}</span>
                  {selected && (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.8)',
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Card 1: 제목 ── */}
        <div style={cardStyle}>
          <SectionLabel>제목 *</SectionLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일정 제목을 입력하세요"
            style={{
              ...inputStyle,
              borderColor: title ? '#0084CC' : '#EBEBF0',
            }}
          />
        </div>

        {/* ── Card 2: 날짜 & 시간 ── */}
        <div style={cardStyle}>
          <SectionLabel>날짜 & 시간</SectionLabel>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              ...inputStyle,
              borderColor: date ? '#0084CC' : '#EBEBF0',
              marginBottom: '10px',
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SectionLabel>시작 시간</SectionLabel>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStart(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: startTime ? '#0084CC' : '#EBEBF0',
                }}
              />
            </div>
            <div>
              <SectionLabel>종료 시간</SectionLabel>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEnd(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: endTime ? '#0084CC' : '#EBEBF0',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Card 3: 정기지출 전용 ── */}
        {type === 'expense' && (
          <div style={{ ...cardStyle, background: 'rgba(254,252,248,1)', border: '1.5px solid rgba(245,158,11,0.18)' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#D97706', marginBottom: '14px' }}>
              💰 정기지출 정보
            </p>

            <div style={{ marginBottom: '14px' }}>
              <SectionLabel>금액</SectionLabel>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    ...inputStyle,
                    borderColor: amount ? '#D97706' : 'rgba(245,158,11,0.25)',
                    paddingRight: '40px',
                  }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold"
                  style={{ color: '#D97706' }}>원</span>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
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

        {/* ── Card 4: 참여자 ── */}
        <div style={cardStyle}>
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
                      border: selected ? 'none' : '1.5px solid #EBEBF0',
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

        {/* ── Card 5: 장소 & 참고 URL ── */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '14px' }}>
            <SectionLabel>장소</SectionLabel>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2">📍</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="장소를 입력하세요"
                style={{
                  ...inputStyle,
                  paddingLeft: '40px',
                  borderColor: address ? '#0084CC' : '#EBEBF0',
                }}
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

          <div>
            <SectionLabel>참고 URL</SectionLabel>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2">🔗</span>
              <input
                value={refUrl}
                onChange={(e) => setRefUrl(e.target.value)}
                placeholder="참고 웹사이트 (선택)"
                style={{
                  ...inputStyle,
                  paddingLeft: '40px',
                  borderColor: refUrl ? '#0084CC' : '#EBEBF0',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Card 6: 알림 & 반복 ── */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '14px' }}>
            <SectionLabel>알림 설정</SectionLabel>
            <div className="flex gap-2 flex-wrap">
              {REMINDER_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setReminder(opt.value)}
                  className="px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all active:scale-95"
                  style={{
                    background: reminder === opt.value ? '#0084CC' : '#F7F7FA',
                    color: reminder === opt.value ? 'white' : '#8E8E93',
                    border: reminder === opt.value ? 'none' : '1.5px solid #EBEBF0',
                    boxShadow: reminder === opt.value ? '0 4px 12px rgba(0,132,204,0.30)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>반복 설정</SectionLabel>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as RepeatType)}
              style={{
                ...inputStyle,
                borderColor: repeat !== 'none' ? '#0084CC' : '#EBEBF0',
                cursor: 'pointer',
              }}
            >
              {(Object.entries(REPEAT_LABELS) as [RepeatType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Card 7: 사진 첨부 ── */}
        <div style={cardStyle}>
          <SectionLabel>사진 및 파일 첨부</SectionLabel>

          {/* 숨겨진 파일 인풋 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={attachments.length >= 10}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: '#F7F7FA', border: '1.5px dashed rgba(0,132,204,0.25)', color: '#0084CC' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            사진 / 파일 선택하기 ({attachments.length}/10)
          </button>

          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
              {attachments.map((a) => (
                <div key={a.id}
                  className="relative flex-shrink-0 w-20 h-20 rounded-[14px] overflow-hidden"
                  style={{ background: 'rgba(0,132,204,0.06)', border: '1.5px solid rgba(0,132,204,0.12)' }}>
                  {a.url && a.file?.type.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <span className="text-xl">📄</span>
                      <span className="text-[9px] px-1 text-center truncate w-full" style={{ color: '#8E8E93' }}>{a.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] mt-2" style={{ color: '#8E8E93' }}>
            최대 10개 · JPG, PNG, PDF 지원
          </p>
        </div>

        {/* ── Card 8: 메모 ── */}
        <div style={cardStyle}>
          <SectionLabel>메모</SectionLabel>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요 (선택)"
            rows={3}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '14px',
              fontSize: '15px',
              background: '#F7F7FA',
              border: `1.5px solid ${memo ? '#0084CC' : '#EBEBF0'}`,
              outline: 'none',
              resize: 'none',
              lineHeight: '1.6',
              boxSizing: 'border-box',
              color: '#1A1B2E',
              fontWeight: 600,
              transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* ── 저장 / 취소 버튼 ── */}
        <div className="grid grid-cols-2 gap-3 pt-2 pb-8">
          <button onClick={() => router.back()}
            className="h-[56px] rounded-[20px] text-[15px] font-bold transition-all active:scale-95"
            style={{ border: '1.5px solid #EBEBF0', color: '#8E8E93', background: 'white' }}>
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
