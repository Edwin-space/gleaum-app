'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  REPEAT_LABELS,
  REMINDER_OPTIONS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_ICONS,
  PAYMENT_METHOD_LABELS,
} from '@/types';
import type { User, ScheduleType, RepeatType, ExpenseCategory, PaymentMethod , SpaceMember } from '@/types';

interface DesktopEditScheduleProps {
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
  members: SpaceMember[];
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
  handleSave: () => void;
}

const typeConfig: Record<ScheduleType, { icon: string; color: string; bg: string; label: string; desc: string }> = {
  shared:   { icon: '👨‍👩‍👧‍👦', color: '#0084CC', bg: 'rgba(0,132,204,0.08)',   label: '공유 일정', desc: '멤버 모두와 공유' },
  personal: { icon: '👤',       color: '#0CC9B5', bg: 'rgba(12,201,181,0.08)', label: '개인 일정', desc: '나만 보는 일정' },
  child:    { icon: '🧒',       color: '#10B981', bg: 'rgba(16,185,129,0.08)', label: '자녀 일정', desc: '자녀 스케줄 관리' },
  expense:  { icon: '💰',       color: '#D97706', bg: 'rgba(245,158,11,0.08)', label: '정기 지출', desc: '결제일 관리' },
};

function fieldInput(focused: boolean, hasValue: boolean, accentColor = '#0CC9B5'): React.CSSProperties {
  return {
    width: '100%',
    height: '52px',
    padding: '0 18px',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: 600,
    background: focused ? 'white' : '#F7F7FA',
    border: `1.5px solid ${focused ? accentColor : hasValue ? 'rgba(0,132,204,0.2)' : 'transparent'}`,
    outline: 'none',
    color: 'var(--theme-text)',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    boxShadow: focused ? `0 0 0 3px ${accentColor}18` : 'none',
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
      {children}
    </p>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--theme-surface)', borderRadius: '24px', padding: '28px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function DesktopEditSchedule({
  saving, type, setType, title, setTitle, date, setDate, startTime, setStart, endTime, setEnd,
  participants, toggleParticipant, members, address, setAddress, refUrl, setRefUrl,
  reminder, setReminder, repeat, setRepeat, memo, setMemo, amount, setAmount,
  category, setCategory, paymentMethod, setPaymentMethod, handleSave,
}: DesktopEditScheduleProps) {
  const router = useRouter();
  const scheduleTypes: ScheduleType[] = ['shared', 'personal', 'child', 'expense'];
  const selectedType = typeConfig[type];

  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── 페이지 히어로 ── */}
      <div style={{
        position: 'relative',
        padding: '32px 44px',
        borderRadius: '28px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
        color: 'white',
        marginBottom: '28px',
        boxShadow: '0 14px 44px rgba(26,27,46,0.2)',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: `${selectedType.bg.replace('0.08', '0.3')}`, filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none', transition: 'background 0.4s' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '25%', width: '140px', height: '140px', background: 'rgba(12,201,181,0.12)', filter: 'blur(45px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.back()}
              style={{
                width: '40px', height: '40px', borderRadius: '13px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, backdropFilter: 'blur(8px)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18L9 12L15 6"/>
              </svg>
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.4px', margin: 0 }}>일정 수정</h1>
                {/* 현재 선택 유형 배지 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ fontSize: '14px' }}>{selectedType.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{selectedType.label}</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: 0 }}>
                일정 내용을 수정하고 저장하세요
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: '12px 24px', height: '48px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
                fontSize: '14px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer', backdropFilter: 'blur(8px)',
              }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px 32px', height: '48px', borderRadius: '14px',
                background: saving ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #0CC9B5, #0084CC)',
                color: 'white', fontSize: '14px', fontWeight: 800,
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 8px 20px rgba(0,132,204,0.4)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 메인 2-컬럼 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'flex-start' }}>

        {/* ── 왼쪽: 핵심 정보 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 일정 유형 선택 */}
          <Card>
            <FieldLabel>일정 유형</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {scheduleTypes.map(t => {
                const cfg = typeConfig[t];
                const selected = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: '10px',
                      padding: '20px 12px', borderRadius: '20px',
                      background: selected ? cfg.bg : '#FAFAFA',
                      border: `2px solid ${selected ? cfg.color + '40' : 'transparent'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: selected ? `0 4px 16px ${cfg.color}20` : 'none',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>{cfg.icon}</span>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: selected ? cfg.color : '#6E6E66', margin: '0 0 2px' }}>{cfg.label}</p>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>{cfg.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 기본 정보 */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* 제목 */}
              <div>
                <FieldLabel>제목 *</FieldLabel>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="어떤 일정인가요?"
                  style={{
                    ...fieldInput(focusedField === 'title', !!title),
                    height: '56px',
                    fontSize: '17px',
                    fontWeight: 700,
                  }}
                />
              </div>

              {/* 날짜 + 시간 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <FieldLabel>날짜</FieldLabel>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    onFocus={() => setFocusedField('date')}
                    onBlur={() => setFocusedField(null)}
                    style={fieldInput(focusedField === 'date', !!date)}
                  />
                </div>
                <div>
                  <FieldLabel>시작 시간</FieldLabel>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStart(e.target.value)}
                    onFocus={() => setFocusedField('start')}
                    onBlur={() => setFocusedField(null)}
                    style={fieldInput(focusedField === 'start', !!startTime)}
                  />
                </div>
                <div>
                  <FieldLabel>종료 시간</FieldLabel>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEnd(e.target.value)}
                    onFocus={() => setFocusedField('end')}
                    onBlur={() => setFocusedField(null)}
                    style={fieldInput(focusedField === 'end', !!endTime)}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* 정기지출 섹션 */}
          {type === 'expense' && (
            <div style={{
              background: 'var(--theme-surface)', borderRadius: '24px', padding: '28px',
              border: '2px solid rgba(245,158,11,0.2)',
              boxShadow: '0 4px 20px rgba(245,158,11,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💰</div>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#D97706', margin: 0 }}>정기지출 정보</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 금액 */}
                <div>
                  <FieldLabel>지출 금액</FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      onFocus={() => setFocusedField('amount')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="0"
                      style={{ ...fieldInput(focusedField === 'amount', !!amount, '#D97706'), paddingRight: '50px' }}
                    />
                    <span style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: 800, color: '#D97706' }}>원</span>
                  </div>
                </div>

                {/* 카테고리 */}
                <div>
                  <FieldLabel>카테고리</FieldLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        style={{
                          padding: '10px 8px', borderRadius: '12px',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          background: category === cat ? 'rgba(245,158,11,0.1)' : '#FAFAFA',
                          border: `1.5px solid ${category === cat ? 'rgba(245,158,11,0.35)' : 'transparent'}`,
                          color: category === cat ? '#D97706' : '#8E8E93',
                          fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{EXPENSE_CATEGORY_ICONS[cat]}</span>
                        <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{EXPENSE_CATEGORY_LABELS[cat]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 결제수단 */}
                <div>
                  <FieldLabel>결제 수단</FieldLabel>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(m => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        style={{
                          padding: '9px 16px', borderRadius: '12px',
                          background: paymentMethod === m ? 'rgba(245,158,11,0.1)' : '#FAFAFA',
                          border: `1.5px solid ${paymentMethod === m ? 'rgba(245,158,11,0.4)' : 'transparent'}`,
                          color: paymentMethod === m ? '#D97706' : '#8E8E93',
                          fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {PAYMENT_METHOD_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 메모 */}
          <Card>
            <FieldLabel>메모</FieldLabel>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              onFocus={() => setFocusedField('memo')}
              onBlur={() => setFocusedField(null)}
              placeholder="일정에 대한 추가 정보를 자유롭게 입력하세요"
              rows={5}
              style={{
                width: '100%', padding: '16px 18px', borderRadius: '14px',
                fontSize: '15px', fontWeight: 600, background: '#F7F7FA',
                border: `1.5px solid ${focusedField === 'memo' ? '#0CC9B5' : memo ? 'rgba(0,132,204,0.2)' : 'transparent'}`,
                outline: 'none', color: 'var(--theme-text)', boxSizing: 'border-box',
                resize: 'none', lineHeight: 1.6, transition: 'all 0.2s',
                boxShadow: focusedField === 'memo' ? '0 0 0 3px rgba(12,201,181,0.12)' : 'none',
              }}
            />
          </Card>
        </div>

        {/* ── 오른쪽: 부가 정보 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 참여자 */}
          <Card>
            <FieldLabel>참여자</FieldLabel>
            {members.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', fontWeight: 600 }}>멤버를 불러오는 중...</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {members.map(u => {
                  const selected = participants.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleParticipant(u.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '9px 16px', borderRadius: '999px',
                        background: selected ? '#1A1B2E' : '#F5F5F9',
                        color: selected ? 'white' : '#6E6E66',
                        fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selected ? '0 4px 12px rgba(26,27,46,0.2)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{u.user?.avatar}</span>
                      <span>{u.user?.name}</span>
                      {selected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 알림 + 반복 */}
          <Card>
            <div style={{ marginBottom: '20px' }}>
              <FieldLabel>알림 시간</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {REMINDER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setReminder(opt.value)}
                    style={{
                      padding: '8px 14px', borderRadius: '12px',
                      background: reminder === opt.value ? '#0084CC' : '#F5F5F9',
                      color: reminder === opt.value ? 'white' : '#6E6E66',
                      fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: reminder === opt.value ? '0 4px 12px rgba(0,132,204,0.3)' : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>반복 설정</FieldLabel>
              <select
                value={repeat}
                onChange={e => setRepeat(e.target.value as RepeatType)}
                style={{
                  ...fieldInput(false, repeat !== 'none'),
                  cursor: 'pointer',
                  appearance: 'auto' as any,
                }}
              >
                {(Object.entries(REPEAT_LABELS) as [RepeatType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* 장소 + 링크 */}
          <Card>
            <FieldLabel>장소 및 링크</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>📍</span>
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="장소 입력"
                  style={{ ...fieldInput(focusedField === 'address', !!address), paddingLeft: '44px' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>🔗</span>
                <input
                  value={refUrl}
                  onChange={e => setRefUrl(e.target.value)}
                  onFocus={() => setFocusedField('url')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="참고 URL"
                  style={{ ...fieldInput(focusedField === 'url', !!refUrl), paddingLeft: '44px' }}
                />
              </div>
            </div>
          </Card>

          {/* 하단 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '16px', borderRadius: '18px',
              background: saving ? '#EBEBF0' : 'linear-gradient(135deg, #0CC9B5, #0084CC)',
              color: saving ? '#8E8E93' : 'white', fontSize: '15px', fontWeight: 800,
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 8px 24px rgba(0,132,204,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {saving ? '저장 중...' : '✓ 수정 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}
