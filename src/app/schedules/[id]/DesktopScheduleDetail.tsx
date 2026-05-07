'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  formatDate, formatTime, formatAmount,
} from '@/lib/utils';
import {
  EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS,
  PAYMENT_METHOD_LABELS, REPEAT_LABELS,
} from '@/types';
import type { Schedule, ScheduleStatus } from '@/types';
import { notifToast } from '@/lib/toast';

interface DesktopScheduleDetailProps {
  schedule: Schedule;
  id: string;
  cfg: any;
  participantUsers: any[];
  steps: { key: ScheduleStatus; label: string }[];
  currentStepIdx: number;
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  showCompletionModal: boolean;
  setShowCompletionModal: (v: boolean) => void;
  handleUpdateStatus: (status: ScheduleStatus) => Promise<void>;
  handleDelete: () => Promise<void>;
}

const typeColorMap: Record<string, string> = {
  shared:   '#0084CC',
  personal: '#0CC9B5',
  child:    '#10B981',
  expense:  '#D97706',
};

const typeLabelMap: Record<string, string> = {
  shared:   '공유 일정',
  personal: '개인 일정',
  child:    '자녀 일정',
  expense:  '정기 지출',
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'white', borderRadius: '24px', padding: '28px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: 800, color: '#8E8E93',
      textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px',
    }}>
      {children}
    </p>
  );
}

export function DesktopScheduleDetail({
  schedule, id, cfg, participantUsers, steps, currentStepIdx,
  showDeleteModal, setShowDeleteModal, showCompletionModal, setShowCompletionModal,
  handleUpdateStatus, handleDelete,
}: DesktopScheduleDetailProps) {
  const router = useRouter();
  const typeColor = typeColorMap[schedule.type] ?? '#0084CC';
  const typeLabel = typeLabelMap[schedule.type] ?? '일정';

  const statusConfig = {
    pending:     { label: '⏳ 대기 중',  bg: 'rgba(255,255,255,0.1)',         border: 'rgba(255,255,255,0.2)',         text: 'rgba(255,255,255,0.75)' },
    in_progress: { label: '▶ 진행 중',  bg: 'rgba(0,132,204,0.2)',            border: 'rgba(0,132,204,0.4)',           text: '#93C5FD' },
    completed:   { label: '✓ 완료',     bg: 'rgba(16,185,129,0.2)',           border: 'rgba(16,185,129,0.4)',          text: '#6EE7B7' },
    missed:      { label: '✕ 미완료',   bg: 'rgba(239,68,68,0.2)',            border: 'rgba(239,68,68,0.4)',           text: '#FCA5A5' },
  };
  const sc = statusConfig[schedule.status] ?? statusConfig.pending;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── 페이지 히어로 ── */}
      <div style={{
        position: 'relative',
        padding: '36px 44px',
        borderRadius: '28px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
        color: 'white',
        marginBottom: '28px',
        boxShadow: '0 14px 44px rgba(26,27,46,0.2)',
      }}>
        {/* glow blobs */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: `${typeColor}30`, filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '25%', width: '140px', height: '140px', background: 'rgba(12,201,181,0.12)', filter: 'blur(45px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* 상단 행: 뒤로가기 + 수정/삭제 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', marginBottom: '28px' }}>
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '13px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', backdropFilter: 'blur(8px)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18L9 12L15 6"/>
              </svg>
              목록으로
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => router.push(`/schedules/${id}/edit`)}
                style={{
                  padding: '10px 22px', borderRadius: '13px',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', backdropFilter: 'blur(8px)',
                }}
              >
                ✏️ 일정 수정
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: '10px 22px', borderRadius: '13px',
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  color: 'rgba(252,165,165,1)', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🗑️ 삭제
              </button>
            </div>
          </div>

          {/* 일정 타이틀 영역 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              {/* 타입 배지 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '999px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <span style={{ fontSize: '14px' }}>{cfg.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{typeLabel}</span>
              </div>
              {/* 상태 배지 */}
              <div style={{ padding: '5px 12px', borderRadius: '999px', background: sc.bg, border: `1px solid ${sc.border}` }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: sc.text }}>{sc.label}</span>
              </div>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.5px', margin: '0 0 18px' }}>
              {schedule.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>
                <span>📅</span> {formatDate(schedule.startTime)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>
                <span>⏰</span> {formatTime(schedule.startTime)}{schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
              </div>
              {schedule.repeat !== 'none' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>
                  <span>🔁</span> {REPEAT_LABELS[schedule.repeat]}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-컬럼 콘텐츠 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'flex-start' }}>

        {/* ── 왼쪽: 상세 정보 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 자녀 일정 스테퍼 */}
          {schedule.type === 'child' && (
            <Card>
              <SectionTitle>진행 상황 리포트</SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px' }}>
                {steps.map((step, i) => {
                  const isActive = schedule.status === step.key;
                  const isPast = i < currentStepIdx;
                  const dotColor = isPast || isActive
                    ? (step.key === 'completed' ? '#10B981' : step.key === 'in_progress' ? '#0084CC' : '#9CA3AF')
                    : '#E5E7EB';
                  return (
                    <React.Fragment key={step.key}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '52px', height: '52px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', fontWeight: 900,
                          background: isPast || isActive ? dotColor : '#F5F5F9',
                          color: isPast || isActive ? 'white' : '#C7C7CC',
                          transform: isActive ? 'scale(1.12)' : 'scale(1)',
                          boxShadow: isActive ? `0 6px 20px ${dotColor}40` : 'none',
                          transition: 'all 0.3s',
                          flexShrink: 0,
                        }}>
                          {isPast ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: isActive ? '#1A1B2E' : '#8E8E93', whiteSpace: 'nowrap' }}>
                          {step.label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div style={{ flex: 1, height: '3px', margin: '0 8px', marginBottom: '34px', borderRadius: '99px', background: '#F0F0F0', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '99px', background: '#10B981', width: isPast ? '100%' : '0%', transition: 'width 1s' }} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </Card>
          )}

          {/* 정기지출 정보 */}
          {schedule.type === 'expense' && (
            <div style={{
              background: 'white', borderRadius: '24px', padding: '28px',
              border: '2px solid rgba(245,158,11,0.15)',
              boxShadow: '0 4px 20px rgba(245,158,11,0.06)',
            }}>
              <SectionTitle>정기 지출 정보</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>지출 금액</p>
                  <p style={{ fontSize: '26px', fontWeight: 900, color: '#1A1B2E', margin: 0 }}>{formatAmount(schedule.amount ?? 0)}</p>
                </div>
                <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(0,132,204,0.04)', border: '1px solid rgba(0,132,204,0.1)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: '#0084CC', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>카테고리</p>
                  <p style={{ fontSize: '17px', fontWeight: 900, color: '#1A1B2E', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {schedule.expenseCategory && (
                      <>{EXPENSE_CATEGORY_ICONS[schedule.expenseCategory]} {EXPENSE_CATEGORY_LABELS[schedule.expenseCategory]}</>
                    )}
                  </p>
                </div>
                <div style={{ padding: '20px', borderRadius: '18px', background: 'rgba(12,201,181,0.04)', border: '1px solid rgba(12,201,181,0.1)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: '#0CC9B5', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>결제 수단</p>
                  <p style={{ fontSize: '17px', fontWeight: 900, color: '#1A1B2E', margin: 0 }}>
                    {schedule.paymentMethod && PAYMENT_METHOD_LABELS[schedule.paymentMethod]}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 메모 */}
          {schedule.memo && (
            <Card>
              <SectionTitle>메모</SectionTitle>
              <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#1A1B2E', fontWeight: 500, whiteSpace: 'pre-wrap', margin: 0 }}>
                {schedule.memo}
              </p>
            </Card>
          )}

          {/* 장소 */}
          {schedule.location && (
            <Card>
              <SectionTitle>장소</SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#1A1B2E', marginBottom: '16px' }}>
                <span>📍</span> {schedule.location.address}
              </div>
              <div style={{
                height: '240px', borderRadius: '18px',
                background: '#F7F7FA', border: '1px solid rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#8E8E93',
              }}>
                <span style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</span>
                <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>지도 API 연동 준비 중</p>
              </div>
            </Card>
          )}

          {/* 메모도 장소도 없는 경우 빈 카드 */}
          {!schedule.memo && !schedule.location && schedule.type !== 'child' && schedule.type !== 'expense' && (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>📋</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#8E8E93', margin: 0 }}>추가 정보가 없습니다</p>
              </div>
            </Card>
          )}
        </div>

        {/* ── 오른쪽: 참여자 + 액션 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 참여자 */}
          <Card>
            <SectionTitle>참여자 ({participantUsers.length}명)</SectionTitle>
            {participantUsers.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, margin: 0 }}>참여자가 없습니다</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {participantUsers.map((u) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '14px',
                      background: '#F5F5F9', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '22px', flexShrink: 0,
                    }}>
                      {u.avatar}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 2px' }}>{u.name}</p>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', margin: 0 }}>Space Member</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 상태 관리 */}
          <Card>
            <SectionTitle>일정 상태 관리</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {schedule.status === 'in_progress' && (
                <button
                  onClick={() => setShowCompletionModal(true)}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white', fontSize: '15px', fontWeight: 800,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
                  }}
                >
                  ✓ 완료 확인하기
                </button>
              )}
              {schedule.status === 'pending' && schedule.type !== 'child' && (
                <button
                  onClick={() => handleUpdateStatus('in_progress')}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0CC9B5, #0084CC)',
                    color: 'white', fontSize: '15px', fontWeight: 800,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(0,132,204,0.3)',
                  }}
                >
                  ▶ 일정 시작하기
                </button>
              )}
              {schedule.type === 'child' && (schedule.status === 'pending' || schedule.status === 'missed') && (
                <button
                  onClick={() => notifToast.sent(schedule.title)}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '16px',
                    background: 'rgba(0,132,204,0.07)', color: '#0084CC',
                    fontSize: '15px', fontWeight: 800,
                    border: '1px solid rgba(0,132,204,0.15)', cursor: 'pointer',
                  }}
                >
                  🔔 재알림 보내기
                </button>
              )}
              {schedule.status === 'in_progress' && schedule.type !== 'child' && (
                <button
                  onClick={() => handleUpdateStatus('pending')}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '16px',
                    background: 'transparent', color: '#8E8E93',
                    fontSize: '14px', fontWeight: 700,
                    border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer',
                  }}
                >
                  ↩ 대기 상태로 되돌리기
                </button>
              )}
              {(schedule.status === 'completed' || schedule.status === 'missed') && (
                <div style={{ padding: '16px', borderRadius: '16px', background: '#F7F7FA', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93', margin: 0 }}>
                    {schedule.status === 'completed' ? '✅ 완료된 일정입니다' : '일정이 종료되었습니다'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Smart Reminder */}
          <div style={{
            padding: '24px', borderRadius: '24px',
            background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
            color: 'white', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'rgba(0,132,204,0.2)', filter: 'blur(25px)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 8px' }}>💡 Space Smart Reminder</p>
              <p style={{ fontSize: '12px', lineHeight: 1.7, color: 'rgba(255,255,255,0.58)', fontWeight: 600, margin: 0 }}>
                이 일정은 시작 {schedule.reminder}분 전에 참여자 모두에게 푸시 알림이 발송됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 삭제 모달 ── */}
      {showDeleteModal && (
        <div
          onClick={() => setShowDeleteModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '400px',
              background: 'white', borderRadius: '32px', padding: '40px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>
                🗑️
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px' }}>일정을 삭제할까요?</h3>
              <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, lineHeight: 1.6, margin: '0 0 28px' }}>
                이 작업은 되돌릴 수 없으며,<br/>공간 멤버들의 목록에서도 삭제됩니다.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  style={{ height: '52px', borderRadius: '16px', background: '#F5F5F9', color: '#8E8E93', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  style={{ height: '52px', borderRadius: '16px', background: '#EF4444', color: 'white', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(239,68,68,0.3)' }}
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 완료 확인 모달 ── */}
      {showCompletionModal && (
        <div
          onClick={() => setShowCompletionModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '400px',
              background: 'white', borderRadius: '32px', padding: '40px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>
                ✅
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px' }}>일정을 완료했나요?</h3>
              <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, lineHeight: 1.6, margin: '0 0 28px' }}>
                {schedule.title}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => handleUpdateStatus('missed')}
                  style={{ height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.07)', color: '#EF4444', fontSize: '14px', fontWeight: 700, border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer' }}
                >
                  미완료
                </button>
                <button
                  onClick={() => handleUpdateStatus('completed')}
                  style={{ height: '52px', borderRadius: '16px', background: '#10B981', color: 'white', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}
                >
                  완료 확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
