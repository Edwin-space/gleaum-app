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
import type { Schedule, ScheduleStatus, User } from '@/types';

interface MobileScheduleDetailProps {
  schedule: Schedule;
  id: string;
  cfg: { icon: string; gradient: string };
  participantUsers: User[];
  steps: { key: ScheduleStatus; label: string }[];
  currentStepIdx: number;
  canEdit: boolean;
  renotifying: boolean;
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  showCompletionModal: boolean;
  setShowCompletionModal: (v: boolean) => void;
  handleUpdateStatus: (status: ScheduleStatus) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleRenotify: () => Promise<void>;
}

export function MobileScheduleDetail({
  schedule, id, cfg, participantUsers, steps, currentStepIdx, canEdit, renotifying,
  showDeleteModal, setShowDeleteModal, showCompletionModal, setShowCompletionModal,
  handleUpdateStatus, handleDelete, handleRenotify,
}: MobileScheduleDetailProps) {
  const router = useRouter();

  return (
    <div
      className="min-h-dvh"
      style={{ background: 'var(--theme-bg)', paddingBottom: 'var(--scroll-bottom, calc(env(safe-area-inset-bottom) + 80px))' }}
    >
      {/* ── 히어로 헤더 ── */}
      <div
        style={{
          background: cfg.gradient,
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        }}
      >
        {/* 장식 글로우 블롭 */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '-20px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }} />

        {/* 상단 바 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          paddingBottom: '8px',
          position: 'relative',
          zIndex: 10,
        }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.20)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <span style={{ fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
            일정 상세
          </span>

          {canEdit ? <button
            onClick={() => router.push(`/schedules/${id}/edit`)}
            style={{
              padding: '7px 16px',
              borderRadius: '100px',
              background: 'rgba(255,255,255,0.20)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            수정
          </button> : <div style={{ width: '36px' }} aria-hidden="true" />}
        </div>

        {/* 히어로 본문 */}
        <div style={{ padding: '8px 20px 32px', position: 'relative', zIndex: 10 }}>
          {/* 유형 뱃지 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              {cfg.icon}
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'rgba(255,255,255,0.80)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {schedule.type === 'shared' ? '공유 일정'
                : schedule.type === 'personal' ? '개인 일정'
                : schedule.type === 'child' ? '자녀 일정'
                : '정기 지출'}
            </span>
          </div>

          {/* 제목 */}
          <h1 style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.25,
            letterSpacing: '-0.03em',
            marginBottom: '12px',
          }}>
            {schedule.title}
          </h1>

          {/* 날짜/시간 행 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              📅 {formatDate(schedule.startTime)}
            </span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              ⏰ {formatTime(schedule.startTime)}
              {schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
            </span>
          </div>

          {schedule.repeat !== 'none' && (
            <span style={{
              display: 'inline-block',
              marginTop: '8px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.70)',
            }}>
              🔁 {REPEAT_LABELS[schedule.repeat]}
            </span>
          )}
        </div>
      </div>

      {/* ── 콘텐츠 카드 영역 ── */}
      <div style={{ padding: '16px 16px 0' }}>

        {/* 자녀 일정 상태 스텝퍼 */}
        {schedule.type === 'child' && (
          <div style={{
            background: 'var(--theme-surface)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)',
            marginBottom: '12px',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--theme-text-subtle)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              진행 상황
            </p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {steps.map((step, i) => {
                const isActive = schedule.status === step.key;
                const isPast = i < currentStepIdx;
                const dotColor = isPast || isActive
                  ? (step.key === 'completed' ? '#10B981'
                    : step.key === 'in_progress' ? '#0084CC'
                    : '#9CA3AF')
                  : '#E5E5EA';

                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isPast || isActive ? dotColor : '#F0F0F0',
                        color: isPast || isActive ? 'white' : '#C7C7CC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        boxShadow: isActive ? `0 4px 14px ${dotColor}60` : 'none',
                        transition: 'all 0.2s ease',
                      }}>
                        {isPast ? '✓' : i + 1}
                      </div>
                      <span style={{
                        fontSize: '11px',
                        color: isActive ? dotColor : '#C7C7CC',
                        fontWeight: isActive ? 700 : 400,
                      }}>
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div style={{
                        flex: 1,
                        height: '2px',
                        margin: '0 6px',
                        marginBottom: '20px',
                        borderRadius: '999px',
                        background: isPast ? '#10B981' : '#E5E5EA',
                        transition: 'background 0.3s ease',
                      }} />
                    )}
                  </div>
                );
              })}
              {schedule.status === 'missed' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#EF4444',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}>
                    !
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444' }}>미완료</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 정기지출 정보 */}
        {schedule.type === 'expense' && schedule.amount !== undefined && (
          <div style={{
            background: 'var(--theme-surface)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)',
            marginBottom: '12px',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--theme-text-subtle)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              정기지출 정보
            </p>

            {/* 금액 행 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <span style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', fontWeight: 500 }}>금액</span>
              <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--theme-text)', letterSpacing: '-0.03em' }}>
                {formatAmount(schedule.amount)}
              </span>
            </div>

            {schedule.expenseCategory && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '14px',
                paddingBottom: '14px',
                borderTop: '1px solid rgba(0,0,0,0.05)',
              }}>
                <span style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', fontWeight: 500 }}>카테고리</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: 'var(--theme-text)' }}>
                  <span>{EXPENSE_CATEGORY_ICONS[schedule.expenseCategory]}</span>
                  {EXPENSE_CATEGORY_LABELS[schedule.expenseCategory]}
                </span>
              </div>
            )}

            {schedule.paymentMethod && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '14px',
                borderTop: '1px solid rgba(0,0,0,0.05)',
              }}>
                <span style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', fontWeight: 500 }}>결제 수단</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--theme-text)' }}>
                  {PAYMENT_METHOD_LABELS[schedule.paymentMethod]}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 참여자 카드 */}
        {participantUsers.length > 0 && (
          <div style={{
            background: 'var(--theme-surface)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)',
            marginBottom: '12px',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--theme-text-subtle)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}>
              참여자
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {participantUsers.map((u) => (
                <div key={u.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: '100px',
                  background: 'rgba(0,132,204,0.07)',
                  border: '1px solid rgba(0,132,204,0.12)',
                }}>
                  <span style={{ fontSize: '16px' }}>{u.avatar}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text)' }}>{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 장소 카드 */}
        {schedule.location && (
          <div style={{
            background: 'var(--theme-surface)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)',
            marginBottom: '12px',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--theme-text-subtle)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>
              📍 장소
            </p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--theme-text)', marginBottom: '14px' }}>
              {schedule.location.address}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(schedule.location.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
              minHeight: '96px',
              borderRadius: '16px',
              background: 'var(--theme-surface-muted)',
              border: '1.5px solid var(--theme-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: '28px' }}>🗺️</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0084CC' }}>지도에서 위치 열기</span>
            </a>
          </div>
        )}

        {/* 메모 카드 */}
        {schedule.memo && (
          <div style={{
            background: 'var(--theme-surface)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)',
            marginBottom: '12px',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--theme-text-subtle)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>
              📝 메모
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--theme-text)' }}>{schedule.memo}</p>
          </div>
        )}

        {/* ── 액션 버튼 ── */}
        {canEdit && <div style={{ paddingTop: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {schedule.status === 'in_progress' && (
            <button
              onClick={() => setShowCompletionModal(true)}
              style={{
                width: '100%',
                padding: '17px 0',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 800,
                color: 'white',
                background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
                letterSpacing: '-0.01em',
              }}
            >
              ✓ 완료 확인하기
            </button>
          )}

          {schedule.status === 'pending' && schedule.type !== 'child' && (
            <button
              onClick={() => handleUpdateStatus('in_progress')}
              style={{
                width: '100%',
                padding: '17px 0',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 800,
                color: 'white',
                background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                boxShadow: '0 8px 24px rgba(0,132,204,0.30)',
                letterSpacing: '-0.01em',
              }}
            >
              ▶ 시작하기
            </button>
          )}

          {schedule.type === 'child' && (schedule.status === 'pending' || schedule.status === 'missed') && (
            <button
              onClick={() => void handleRenotify()}
              disabled={renotifying}
              style={{
                width: '100%',
                padding: '17px 0',
                borderRadius: '20px',
                border: 'none',
                cursor: renotifying ? 'not-allowed' : 'pointer',
                opacity: renotifying ? 0.6 : 1,
                fontSize: '15px',
                fontWeight: 700,
                color: '#0084CC',
                background: 'rgba(0,132,204,0.08)',
                letterSpacing: '-0.01em',
              }}
            >
              {renotifying ? '발송 중...' : '🔔 재알림 보내기'}
            </button>
          )}

          {schedule.status === 'in_progress' && schedule.type !== 'child' && (
            <button
              onClick={() => handleUpdateStatus('pending')}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--theme-text-subtle)',
                background: 'rgba(0,0,0,0.04)',
                letterSpacing: '-0.01em',
              }}
            >
              ↩ 대기 상태로
            </button>
          )}

          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              width: '100%',
              padding: '15px 0',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              color: '#EF4444',
              background: 'rgba(239,68,68,0.07)',
              letterSpacing: '-0.01em',
            }}
          >
            일정 삭제
          </button>
        </div>}
      </div>

      {/* ── 완료 확인 모달 (바텀시트) ── */}
      {showCompletionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.50)',
          }}
          onClick={() => setShowCompletionModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: 'var(--theme-surface)',
              borderRadius: '32px 32px 0 0',
              padding: '24px 24px 40px',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 드래그 핸들 */}
            <div style={{
              width: '40px',
              height: '4px',
              background: 'var(--theme-surface-muted)',
              borderRadius: '999px',
              margin: '0 auto 24px',
            }} />
            <p style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--theme-text)',
              textAlign: 'center',
              marginBottom: '6px',
              letterSpacing: '-0.03em',
            }}>
              일정을 완료했나요?
            </p>
            <p style={{
              fontSize: '14px',
              color: 'var(--theme-text-subtle)',
              textAlign: 'center',
              marginBottom: '24px',
              fontWeight: 500,
            }}>
              {schedule.title}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => handleUpdateStatus('missed')}
                style={{
                  padding: '15px 0',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#EF4444',
                  background: 'rgba(239,68,68,0.08)',
                }}
              >
                ✗ 미완료
              </button>
              <button
                onClick={() => handleUpdateStatus('completed')}
                style={{
                  padding: '15px 0',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'white',
                  background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
                }}
              >
                ✓ 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 (바텀시트) ── */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.50)',
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: 'var(--theme-surface)',
              borderRadius: '32px 32px 0 0',
              padding: '24px 24px 40px',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 드래그 핸들 */}
            <div style={{
              width: '40px',
              height: '4px',
              background: 'var(--theme-surface-muted)',
              borderRadius: '999px',
              margin: '0 auto 24px',
            }} />
            <p style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--theme-text)',
              textAlign: 'center',
              marginBottom: '6px',
              letterSpacing: '-0.03em',
            }}>
              일정을 삭제할까요?
            </p>
            <p style={{
              fontSize: '14px',
              color: 'var(--theme-text-subtle)',
              textAlign: 'center',
              marginBottom: '24px',
              fontWeight: 500,
            }}>
              삭제된 일정은 복구할 수 없습니다
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '15px 0',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--theme-text-subtle)',
                  background: 'var(--theme-bg)',
                }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '15px 0',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'white',
                  background: '#EF4444',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.30)',
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
