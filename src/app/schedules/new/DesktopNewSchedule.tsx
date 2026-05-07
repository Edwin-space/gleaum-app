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

interface DesktopNewScheduleProps {
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

const typeConfig: Record<ScheduleType, { icon: string; activeColor: string; label: string }> = {
  shared:   { icon: '👨‍👩‍👧‍👦', activeColor: '#0084CC', label: '공유' },
  personal: { icon: '👤',       activeColor: '#0891B2', label: '개인' },
  child:    { icon: '🧒',       activeColor: '#059669', label: '자녀' },
  expense:  { icon: '💰',       activeColor: '#D97706', label: '지출' },
};

function FieldSet({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[13px] font-black text-[#8E8E93] uppercase tracking-widest px-1">{label}</label>
      {children}
    </div>
  );
}

const inputStyle = "w-full h-14 px-6 rounded-[18px] bg-gray-50/50 border border-gray-100 focus:border-brand-blue focus:bg-white outline-none text-[16px] font-bold transition-all";

export function DesktopNewSchedule({
  saving, type, setType, title, setTitle, date, setDate, startTime, setStart, endTime, setEnd,
  participants, toggleParticipant, members, address, setAddress, refUrl, setRefUrl,
  reminder, setReminder, repeat, setRepeat, memo, setMemo, amount, setAmount,
  category, setCategory, paymentMethod, setPaymentMethod, attachments,
  handleFileSelect, fileInputRef, removeAttachment, handleSave
}: DesktopNewScheduleProps) {
  const router = useRouter();
  const scheduleTypes: ScheduleType[] = ['shared', 'personal', 'child', 'expense'];

  return (
    <div className="max-w-[1200px] mx-auto px-10 pt-16 pb-32 animate-fade-in">
      <div className="flex items-center justify-between mb-16">
        <div>
          <h1 className="text-[36px] font-black text-[#1A1B2E] tracking-tight">새 일정 만들기</h1>
          <p className="text-[16px] text-[#8E8E93] mt-2">함께 나눌 소중한 시간을 기록하세요</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.back()} className="px-10 h-14 rounded-[20px] font-black text-[#8E8E93] bg-gray-100 hover:bg-gray-200 transition-colors">취소</button>
          <button onClick={handleSave} disabled={saving} className="px-12 h-14 rounded-[20px] font-black text-white bg-brand-gradient shadow-xl active:scale-95 transition-all">
            {saving ? '저장 중...' : '일정 등록하기'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12 items-start">
        {/* ── 좌측 섹션: 핵심 정보 ── */}
        <div className="col-span-12 lg:col-span-7 space-y-12">
          
          <FieldSet label="일정 유형">
            <div className="grid grid-cols-4 gap-4">
              {scheduleTypes.map((t) => {
                const cfg = typeConfig[t];
                const selected = type === t;
                return (
                  <button key={t} onClick={() => setType(t)} className={`flex flex-col items-center justify-center gap-3 h-32 rounded-[28px] border-2 transition-all ${selected ? 'bg-white shadow-xl border-brand-blue' : 'bg-gray-50/50 border-transparent hover:border-gray-200'}`}>
                    <span className="text-4xl">{cfg.icon}</span>
                    <span className={`text-[15px] font-black ${selected ? 'text-brand-blue' : 'text-[#8E8E93]'}`}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </FieldSet>

          <div className="glass-card p-10 rounded-[40px] space-y-8">
            <FieldSet label="제목 *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="일정 제목을 입력하세요" className={`${inputStyle} text-[20px] h-16`} />
            </FieldSet>

            <div className="grid grid-cols-2 gap-6">
              <FieldSet label="날짜">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputStyle} />
              </FieldSet>
              <div className="grid grid-cols-2 gap-4">
                <FieldSet label="시작 시간">
                  <input type="time" value={startTime} onChange={(e) => setStart(e.target.value)} className={inputStyle} />
                </FieldSet>
                <FieldSet label="종료 시간">
                  <input type="time" value={endTime} onChange={(e) => setEnd(e.target.value)} className={inputStyle} />
                </FieldSet>
              </div>
            </div>
          </div>

          {type === 'expense' && (
            <div className="p-10 rounded-[40px] space-y-8 border-2 border-amber-100 bg-amber-50/20">
              <FieldSet label="정기지출 금액">
                <div className="relative">
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`${inputStyle} border-amber-200 focus:border-amber-500`} />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-amber-600">원</span>
                </div>
              </FieldSet>
              <div className="grid grid-cols-2 gap-6">
                <FieldSet label="카테고리">
                  <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={inputStyle}>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{EXPENSE_CATEGORY_ICONS[k as ExpenseCategory]} {v}</option>)}
                  </select>
                </FieldSet>
                <FieldSet label="지출 수단">
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={inputStyle}>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </FieldSet>
              </div>
            </div>
          )}

          <FieldSet label="메모">
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="일정에 대한 추가 정보를 입력하세요" rows={6} className={`${inputStyle} h-auto py-6 resize-none`} />
          </FieldSet>
        </div>

        {/* ── 우측 섹션: 부가 정보 ── */}
        <div className="col-span-12 lg:col-span-5 space-y-12">
          
          <div className="glass-card p-10 rounded-[40px] space-y-10">
            <FieldSet label="참여자 선택">
              <div className="flex flex-wrap gap-3">
                {members.map((u) => {
                  const selected = participants.includes(u.id);
                  return (
                    <button key={u.id} onClick={() => toggleParticipant(u.id)} className={`flex items-center gap-3 px-5 py-3 rounded-full text-[14px] font-black transition-all ${selected ? 'bg-brand-blue text-white shadow-lg' : 'bg-gray-50 text-[#8E8E93] hover:bg-gray-100'}`}>
                      <span className="text-lg">{u.avatar}</span>
                      <span>{u.name}</span>
                    </button>
                  );
                })}
              </div>
            </FieldSet>

            <FieldSet label="알림 및 반복">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {REMINDER_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setReminder(opt.value)} className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-all ${reminder === opt.value ? 'bg-brand-blue border-brand-blue text-white' : 'bg-white border-gray-100 text-[#8E8E93]'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatType)} className={inputStyle}>
                  {Object.entries(REPEAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </FieldSet>

            <FieldSet label="첨부 파일">
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFileSelect} />
              <button onClick={() => fileInputRef.current?.click()} disabled={attachments.length >= 10} className="w-full py-8 rounded-[24px] border-2 border-dashed border-gray-100 hover:border-brand-blue/30 hover:bg-brand-blue/5 transition-all text-[#0084CC] flex flex-col items-center gap-2">
                <span className="text-3xl">📁</span>
                <span className="text-[14px] font-black">파일 업로드 ({attachments.length}/10)</span>
              </button>
              {attachments.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-6">
                  {attachments.map((a) => (
                    <div key={a.id} className="relative aspect-square rounded-[18px] overflow-hidden group">
                      {a.file?.type.startsWith('image/') ? <img src={a.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center">📄</div>}
                      <button onClick={() => removeAttachment(a.id)} className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </FieldSet>

            <FieldSet label="기타 링크">
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl">📍</span>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="장소 입력" className={`${inputStyle} pl-14`} />
                </div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl">🔗</span>
                  <input value={refUrl} onChange={(e) => setRefUrl(e.target.value)} placeholder="참고 URL" className={`${inputStyle} pl-14`} />
                </div>
              </div>
            </FieldSet>
          </div>
        </div>
      </div>
    </div>
  );
}
