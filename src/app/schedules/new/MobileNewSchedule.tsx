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
import type { User, ScheduleType, RepeatType, ExpenseCategory, PaymentMethod, SpaceMember, ScheduleVisibility } from '@/types';

interface MobileNewScheduleProps {
  saving: boolean;
  userLoading?: boolean;
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
  expenseVisibility: ScheduleVisibility;
  setExpenseVisibility: (v: ScheduleVisibility) => void;
  attachments: any[];
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  removeAttachment: (id: string) => void;
  handleSave: () => void;
}

const typeConfig: Record<ScheduleType, { icon: string; activeColor: string; activeBg: string; label: string; desc: string }> = {
  shared:   { icon: '🏠',  activeColor: '#0084CC', activeBg: '#EBF5FF', label: '공유', desc: '공간 공유' },
  personal: { icon: '👤',  activeColor: '#0891B2', activeBg: '#E0F7FA', label: '개인', desc: '나만 보기' },
  child:    { icon: '🧒',  activeColor: '#059669', activeBg: '#ECFDF5', label: '자녀', desc: '자녀 관리' },
  expense:  { icon: '💰',  activeColor: '#D97706', activeBg: '#FFFBEB', label: '지출', desc: '정기 지출' },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px',
      fontWeight: 800,
      color: '#8E8E93',
      letterSpacing: '0.07em',
      marginBottom: '12px',
      textTransform: 'uppercase',
    }}>
      {children}
    </p>
  );
}

export function MobileNewSchedule({
  saving, userLoading = false,
  type, setType, title, setTitle, date, setDate, startTime, setStart, endTime, setEnd,
  participants, toggleParticipant, members, address, setAddress, refUrl, setRefUrl,
  reminder, setReminder, repeat, setRepeat, memo, setMemo, amount, setAmount,
  category, setCategory, paymentMethod, setPaymentMethod,
  expenseVisibility, setExpenseVisibility,
  attachments, handleFileSelect, fileInputRef, removeAttachment, handleSave
}: MobileNewScheduleProps) {
  const router = useRouter();
  const scheduleTypes: ScheduleType[] = ['shared', 'personal', 'child', 'expense'];

  const cardBase: React.CSSProperties = {
    background: 'white',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: '12px',
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    height: '52px',
    padding: '0 16px',
    borderRadius: '14px',
    fontSize: '15px',
    background: '#F7F7FA',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1A1B2E',
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  };

  const activeCfg = typeConfig[type];

  return (
    <div
      className="min-h-dvh"
      style={{
        background: '#FAFAFD',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)',
      }}
    >
      {/* ── 스티키 헤더 ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px 14px',
        paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
        background: 'rgba(250,250,253,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(0,132,204,0.07)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#0084CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1B2E', letterSpacing: '-0.03em' }}>
          새 일정
        </p>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '9px 20px',
            borderRadius: '100px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 800,
            color: 'white',
            background: saving
              ? 'rgba(0,132,204,0.5)'
              : 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
            boxShadow: saving ? 'none' : '0 4px 16px rgba(0,132,204,0.35)',
            opacity: saving ? 0.7 : 1,
            letterSpacing: '-0.01em',
            minWidth: '64px',
            transition: 'all 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>

      {/* ── 콘텐츠 ── */}
      <div style={{ padding: '16px 16px 0' }}>

        {/* 일정 유형 선택 카드 */}
        <div style={cardBase}>
          <SectionLabel>일정 유형</SectionLabel>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}>
            {scheduleTypes.map((t) => {
              const cfg = typeConfig[t];
              const selected = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    height: '84px',
                    borderRadius: '18px',
                    background: selected ? cfg.activeBg : '#FAFAFA',
                    border: selected ? `2px solid ${cfg.activeColor}40` : '1.5px solid #EBEBF0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px 4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '28px', lineHeight: 1 }}>{cfg.icon}</span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: selected ? cfg.activeColor : '#6E6E66',
                    letterSpacing: '-0.01em',
                  }}>
                    {cfg.label}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: selected ? `${cfg.activeColor}99` : '#B0B0B0',
                  }}>
                    {cfg.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 제목 입력 카드 */}
        <div style={cardBase}>
          <SectionLabel>제목 *</SectionLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일정 제목을 입력하세요"
            style={{
              ...inputBase,
              height: '56px',
              fontSize: '17px',
              border: `1.5px solid ${title ? activeCfg.activeColor + '80' : '#EBEBF0'}`,
            }}
          />
        </div>

        {/* 날짜 & 시간 카드 */}
        <div style={cardBase}>
          <SectionLabel>날짜 & 시간</SectionLabel>
          {/* 날짜 — 전체 너비 */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              ...inputBase,
              height: '52px',
              border: `1.5px solid ${date ? activeCfg.activeColor + '80' : '#EBEBF0'}`,
              marginBottom: '10px',
            }}
          />
          {/* 시작~종료 시간 — flex row (overflow 방지) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStart(e.target.value)}
              style={{
                ...inputBase,
                flex: 1,
                minWidth: 0,
                height: '52px',
                border: `1.5px solid ${startTime ? activeCfg.activeColor + '80' : '#EBEBF0'}`,
              }}
            />
            <span style={{ fontSize: '13px', color: '#C7C7CC', fontWeight: 600, flexShrink: 0 }}>~</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEnd(e.target.value)}
              style={{
                ...inputBase,
                flex: 1,
                minWidth: 0,
                height: '52px',
                border: `1.5px solid ${endTime ? activeCfg.activeColor + '80' : '#EBEBF0'}`,
              }}
            />
          </div>
        </div>

        {/* 정기지출 섹션 (조건부) */}
        {type === 'expense' && (
          <div style={{
            ...cardBase,
            background: 'rgba(255,252,248,1)',
            border: '1.5px solid rgba(217,119,6,0.18)',
          }}>
            <p style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#D97706',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              💰 정기지출 정보
            </p>

            {/* 공유/개인 토글 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {([
                { val: 'space'   as ScheduleVisibility, label: '🏠 공간 공유', desc: '멤버 모두 확인' },
                { val: 'private' as ScheduleVisibility, label: '🔒 내 지출',   desc: '나만 확인' },
              ]).map(({ val, label, desc }) => (
                <button
                  key={val}
                  onClick={() => setExpenseVisibility(val)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: '14px',
                    border: `2px solid ${expenseVisibility === val ? 'rgba(217,119,6,0.40)' : 'rgba(217,119,6,0.15)'}`,
                    background: expenseVisibility === val ? 'rgba(217,119,6,0.10)' : 'white',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 800, color: expenseVisibility === val ? '#D97706' : '#8E8E93' }}>{label}</span>
                  <span style={{ fontSize: '10px', color: '#B0B0B0', fontWeight: 600 }}>{desc}</span>
                </button>
              ))}
            </div>

            {/* 금액 입력 */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                style={{
                  ...inputBase,
                  border: `1.5px solid ${amount ? 'rgba(217,119,6,0.60)' : 'rgba(217,119,6,0.25)'}`,
                  paddingRight: '44px',
                }}
              />
              <span style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '14px',
                fontWeight: 700,
                color: '#D97706',
              }}>
                원
              </span>
            </div>

            {/* 카테고리 그리드 */}
            <SectionLabel>카테고리</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              marginBottom: '16px',
            }}>
              {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '12px',
                    border: `2px solid ${category === cat ? 'rgba(217,119,6,0.35)' : 'rgba(217,119,6,0.12)'}`,
                    cursor: 'pointer',
                    background: category === cat ? 'rgba(217,119,6,0.10)' : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{EXPENSE_CATEGORY_ICONS[cat]}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: category === cat ? '#D97706' : '#8E8E93',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}>
                    {EXPENSE_CATEGORY_LABELS[cat]}
                  </span>
                </button>
              ))}
            </div>

            {/* 결제 수단 필 */}
            <SectionLabel>결제 수단</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '100px',
                    border: `2px solid ${paymentMethod === m ? 'rgba(217,119,6,0.40)' : 'rgba(217,119,6,0.15)'}`,
                    cursor: 'pointer',
                    background: paymentMethod === m ? 'rgba(217,119,6,0.10)' : 'white',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: paymentMethod === m ? '#D97706' : '#8E8E93',
                  }}
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 참여자 카드 */}
        <div style={cardBase}>
          <SectionLabel>참여자</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {members.map((u) => {
              const selected = participants.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggleParticipant(u.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    borderRadius: '100px',
                    border: `1.5px solid ${selected ? 'transparent' : '#EBEBF0'}`,
                    cursor: 'pointer',
                    background: selected ? '#1A1B2E' : 'white',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: selected ? 'white' : '#6E6E66',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{u.user?.avatar}</span>
                  <span>{u.user?.name}</span>
                  {selected && (
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 장소 + URL 카드 */}
        <div style={cardBase}>
          <SectionLabel>장소 & 참고 URL</SectionLabel>

          {/* 주소 입력 */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              lineHeight: 1,
              pointerEvents: 'none',
            }}>
              📍
            </span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="장소를 입력하세요"
              style={{
                ...inputBase,
                border: `1.5px solid ${address ? '#0084CC80' : '#EBEBF0'}`,
                paddingLeft: '42px',
              }}
            />
          </div>

          {/* URL 입력 */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              lineHeight: 1,
              pointerEvents: 'none',
            }}>
              🔗
            </span>
            <input
              value={refUrl}
              onChange={(e) => setRefUrl(e.target.value)}
              placeholder="참고 웹사이트 (선택)"
              style={{
                ...inputBase,
                border: `1.5px solid ${refUrl ? '#0084CC80' : '#EBEBF0'}`,
                paddingLeft: '42px',
              }}
            />
          </div>
        </div>

        {/* 알림 + 반복 카드 */}
        <div style={cardBase}>
          <SectionLabel>알림 설정</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
            {REMINDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setReminder(opt.value)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '100px',
                  border: `1.5px solid ${reminder === opt.value ? 'transparent' : '#EBEBF0'}`,
                  cursor: 'pointer',
                  background: reminder === opt.value ? '#0084CC' : '#F7F7FA',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: reminder === opt.value ? 'white' : '#6E6E66',
                  transition: 'all 0.15s ease',
                  boxShadow: reminder === opt.value ? '0 3px 12px rgba(0,132,204,0.30)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <SectionLabel>반복 설정</SectionLabel>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as RepeatType)}
            style={{
              ...inputBase,
              border: '1.5px solid #EBEBF0',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%238E8E93' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              paddingRight: '40px',
              cursor: 'pointer',
            }}
          >
            {Object.entries(REPEAT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* 첨부파일 카드 */}
        <div style={cardBase}>
          <SectionLabel>사진 및 파일 첨부</SectionLabel>

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
            style={{
              width: '100%',
              padding: '18px 0',
              borderRadius: '16px',
              border: '1.5px dashed rgba(0,132,204,0.28)',
              cursor: attachments.length >= 10 ? 'not-allowed' : 'pointer',
              background: 'rgba(0,132,204,0.03)',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0084CC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: attachments.length >= 10 ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: '18px' }}>📁</span>
            사진 / 파일 선택하기 ({attachments.length}/10)
          </button>

          {attachments.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingTop: '12px',
              paddingBottom: '4px',
            }}>
              {attachments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {a.file?.type.startsWith('image/') ? (
                    <img
                      src={a.url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#F7F7FA',
                      fontSize: '28px',
                    }}>
                      📄
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(a.id)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 메모 카드 */}
        <div style={cardBase}>
          <SectionLabel>메모</SectionLabel>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요"
            rows={4}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '14px',
              fontSize: '15px',
              background: '#F7F7FA',
              border: `1.5px solid ${memo ? '#0084CC80' : '#EBEBF0'}`,
              outline: 'none',
              boxSizing: 'border-box',
              color: '#1A1B2E',
              fontWeight: 500,
              fontFamily: 'inherit',
              lineHeight: 1.6,
              resize: 'none',
            }}
          />
        </div>

        {/* 하단 버튼 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          paddingTop: '8px',
          paddingBottom: '32px',
        }}>
          <button
            onClick={() => router.back()}
            style={{
              height: '56px',
              borderRadius: '20px',
              border: '1.5px solid #E0E0E5',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 700,
              color: '#6E6E66',
              background: 'white',
              letterSpacing: '-0.01em',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || userLoading}
            style={{
              height: '56px',
              borderRadius: '20px',
              border: 'none',
              cursor: (saving || userLoading) ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 800,
              color: 'white',
              background: (saving || userLoading)
                ? 'rgba(0,132,204,0.5)'
                : 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
              boxShadow: (saving || userLoading) ? 'none' : '0 6px 20px rgba(0,132,204,0.35)',
              opacity: (saving || userLoading) ? 0.6 : 1,
              letterSpacing: '-0.01em',
              transition: 'all 0.2s ease',
            }}
          >
            {saving ? '저장 중...' : userLoading ? '초기화 중...' : '일정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
