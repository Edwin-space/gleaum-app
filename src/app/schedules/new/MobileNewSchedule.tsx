'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  REPEAT_LABELS,
  REMINDER_OPTIONS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_ICONS,
  PAYMENT_METHOD_LABELS,
} from '@/types';
import type { User, ScheduleType, RepeatType, ExpenseCategory, PaymentMethod } from '@/types';

interface MobileNewScheduleProps {
  saving: boolean;
  type: ScheduleType;
  setType: (t: ScheduleType) => void;
  title: string;
  setTitle: (t: string) => void;
  date: string;
  setDate: (d: string) => void;
  startTime: string;
  setStart: (t: string) => void;
  endTime: string;
  setEnd: (t: string) => void;
  participants: string[];
  toggleParticipant: (id: string) => void;
  members: User[];
  address: string;
  setAddress: (a: string) => void;
  refUrl: string;
  setRefUrl: (u: string) => void;
  reminder: number;
  setReminder: (r: number) => void;
  repeat: RepeatType;
  setRepeat: (r: RepeatType) => void;
  memo: string;
  setMemo: (m: string) => void;
  amount: string;
  setAmount: (a: string) => void;
  category: ExpenseCategory;
  setCategory: (c: ExpenseCategory) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  attachments: any[];
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  removeAttachment: (id: string) => void;
  handleSave: () => void;
}

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
  background: 'white', borderRadius: '24px', padding: '20px',
  boxShadow: '0 2px 16px rgba(0,0,0,0.05)', marginBottom: '12px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', height: '52px', padding: '0 16px', borderRadius: '14px',
  fontSize: '15px', background: '#F7F7FA', border: '1.5px solid #EBEBF0',
  outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
  color: '#1A1B2E', fontWeight: 600,
};

export function MobileNewSchedule({
  saving, type, setType, title, setTitle, date, setDate, startTime, setStart, endTime, setEnd,
  participants, toggleParticipant, members, address, setAddress, refUrl, setRefUrl,
  reminder, setReminder, repeat, setRepeat, memo, setMemo, amount, setAmount,
  category, setCategory, paymentMethod, setPaymentMethod, attachments,
  handleFileSelect, fileInputRef, removeAttachment, handleSave
}: MobileNewScheduleProps) {
  const router = useRouter();
  const scheduleTypes: ScheduleType[] = ['shared', 'personal', 'child', 'expense'];

  return (
    <div className="min-h-dvh pb-10" style={{ background: '#F5F5F9' }}>
      {/* ── 상단 헤더 ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(250,250,253,0.92)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,132,204,0.06)', paddingTop: `calc(env(safe-area-inset-top) + 12px)`,
        }}
      >
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,132,204,0.06)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#0084CC" strokeWidth="2.2" strokeLinecap="round"/></svg>
        </button>
        <p className="text-[16px] font-bold">일정 추가</p>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-full text-[14px] font-bold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', boxShadow: '0 4px 16px rgba(0,132,204,0.35)' }}>
          {saving ? '저장중' : '저장'}
        </button>
      </div>

      <div className="px-4 pt-5">
        <div style={cardStyle}>
          <SectionLabel>일정 유형</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {scheduleTypes.map((t) => {
              const cfg = typeConfig[t];
              const selected = type === t;
              return (
                <button key={t} onClick={() => setType(t)} className="flex flex-col items-center gap-1.5"
                  style={{ height: '72px', borderRadius: '20px', background: selected ? cfg.activeBg : '#F7F7FA', border: selected ? 'none' : '1.5px solid #EBEBF0', color: selected ? 'white' : '#8E8E93', position: 'relative', justifyContent: 'center' }}>
                  <span className="text-2xl">{cfg.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={cardStyle}>
          <SectionLabel>제목 *</SectionLabel>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="일정 제목을 입력하세요" style={{ ...inputStyle, borderColor: title ? '#0084CC' : '#EBEBF0' }} />
        </div>

        <div style={cardStyle}>
          <SectionLabel>날짜 & 시간</SectionLabel>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, borderColor: date ? '#0084CC' : '#EBEBF0', marginBottom: '10px' }} />
          <div className="grid grid-cols-2 gap-3">
            <input type="time" value={startTime} onChange={(e) => setStart(e.target.value)} style={{ ...inputStyle, borderColor: startTime ? '#0084CC' : '#EBEBF0' }} />
            <input type="time" value={endTime} onChange={(e) => setEnd(e.target.value)} style={{ ...inputStyle, borderColor: endTime ? '#0084CC' : '#EBEBF0' }} />
          </div>
        </div>

        {type === 'expense' && (
          <div style={{ ...cardStyle, background: 'rgba(254,252,248,1)', border: '1.5px solid rgba(245,158,11,0.18)' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#D97706', marginBottom: '14px' }}>💰 정기지출 정보</p>
            <div className="relative mb-4">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" style={{ ...inputStyle, borderColor: amount ? '#D97706' : 'rgba(245,158,11,0.25)', paddingRight: '40px' }} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold" style={{ color: '#D97706' }}>원</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} className="py-2 rounded-[12px] text-[12px] font-semibold flex items-center gap-1.5"
                  style={{ background: category === cat ? 'rgba(245,158,11,0.12)' : 'white', border: '2px solid rgba(245,158,11,0.12)', color: category === cat ? '#D97706' : '#8E8E93' }}>
                  <span>{EXPENSE_CATEGORY_ICONS[cat]}</span><span className="truncate">{EXPENSE_CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)} className="py-2 rounded-[12px] text-[12px] font-semibold"
                  style={{ background: paymentMethod === m ? 'rgba(245,158,11,0.12)' : 'white', border: '2px solid rgba(245,158,11,0.12)', color: paymentMethod === m ? '#D97706' : '#8E8E93' }}>
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={cardStyle}>
          <SectionLabel>참여자</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {members.map((u) => {
              const selected = participants.includes(u.id);
              return (
                <button key={u.id} onClick={() => toggleParticipant(u.id)} className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold"
                  style={{ background: selected ? '#0084CC' : 'white', color: selected ? 'white' : '#8E8E93', border: '1.5px solid #EBEBF0' }}>
                  <span>{u.avatar}</span><span>{u.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={cardStyle}>
          <SectionLabel>장소</SectionLabel>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="장소를 입력하세요" style={{ ...inputStyle, borderColor: address ? '#0084CC' : '#EBEBF0', marginBottom: '14px' }} />
          <SectionLabel>참고 URL</SectionLabel>
          <input value={refUrl} onChange={(e) => setRefUrl(e.target.value)} placeholder="참고 웹사이트 (선택)" style={{ ...inputStyle, borderColor: refUrl ? '#0084CC' : '#EBEBF0' }} />
        </div>

        <div style={cardStyle}>
          <SectionLabel>알림 설정</SectionLabel>
          <div className="flex gap-2 flex-wrap mb-4">
            {REMINDER_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setReminder(opt.value)} className="px-3.5 py-2 rounded-full text-[12px] font-semibold"
                style={{ background: reminder === opt.value ? '#0084CC' : '#F7F7FA', color: reminder === opt.value ? 'white' : '#8E8E93', border: '1.5px solid #EBEBF0' }}>{opt.label}</button>
            ))}
          </div>
          <SectionLabel>반복 설정</SectionLabel>
          <select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatType)} style={inputStyle}>
            {Object.entries(REPEAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div style={cardStyle}>
          <SectionLabel>사진 및 파일 첨부</SectionLabel>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFileSelect} />
          <button onClick={() => fileInputRef.current?.click()} disabled={attachments.length >= 10} className="w-full py-3.5 rounded-[16px] text-[13px] font-semibold flex items-center justify-center gap-2"
            style={{ background: '#F7F7FA', border: '1.5px dashed rgba(0,132,204,0.25)', color: '#0084CC' }}>
            <span>📁</span> 사진 / 파일 선택하기 ({attachments.length}/10)
          </button>
          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pt-3">
              {attachments.map((a) => (
                <div key={a.id} className="relative w-20 h-20 rounded-[14px] overflow-hidden flex-shrink-0" style={{ border: '1px solid #eee' }}>
                  {a.file?.type.startsWith('image/') ? <img src={a.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📄</div>}
                  <button onClick={() => removeAttachment(a.id)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full text-[10px]">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <SectionLabel>메모</SectionLabel>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모를 입력하세요" rows={3} style={{ ...inputStyle, height: 'auto', padding: '12px 16px' }} />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 pb-8">
          <button onClick={() => router.back()} className="h-[56px] rounded-[20px] font-bold border border-gray-200">취소</button>
          <button onClick={handleSave} disabled={saving} className="h-[56px] rounded-[20px] font-bold text-white bg-brand-gradient">{saving ? '저장 중...' : '일정 저장'}</button>
        </div>
      </div>
    </div>
  );
}
