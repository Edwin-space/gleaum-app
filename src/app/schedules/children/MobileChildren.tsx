'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { useSchedules } from '@/hooks/useSchedules';
import { formatTime, formatDateShort } from '@/lib/utils';
import type { Schedule, ScheduleStatus } from '@/types';

/** 가족 구성원의 FCM 토큰을 조회하여 재알림 발송 */
async function sendReNotify(schedule: Schedule, memberNames: string) {
  try {
    const res = await fetch('/api/notifications/renotify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleId: schedule.id,
        title: `🔔 재알림: ${schedule.title}`,
        body: `${memberNames ? memberNames + ' · ' : ''}놓친 일정을 확인해주세요`,
        url: `/schedules/${schedule.id}`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const steps: { key: ScheduleStatus; label: string }[] = [
  { key: 'pending',     label: '대기' },
  { key: 'in_progress', label: '진행중' },
  { key: 'completed',   label: '완료' },
];

export function MobileChildren() {
  const [activeTab, setActiveTab]           = useState<string>('all');
  const [completionModal, setCompletionModal] = useState<Schedule | null>(null);
  const [reNotifyingId, setReNotifyingId]   = useState<string | null>(null);

  const { spaceId }                                       = useCurrentUser();
  const { members, loading: spaceLoading }                = useSpace(spaceId);
  const { schedules, loading: schedulesLoading, updateStatus } = useSchedules(spaceId);

  const loading = spaceLoading || schedulesLoading;

  const children = members.filter((u) => u.role === 'editor');
  const tabs = [
    { id: 'all', label: '전체' },
    ...children.map((c) => ({ id: c.id, label: c.user?.name })),
  ];

  const childSchedules = schedules.filter((s) => {
    if (s.type !== 'child') return false;
    if (activeTab === 'all') return true;
    return s.participants.includes(activeTab);
  });

  const today           = new Date();
  const todaySchedules  = childSchedules.filter(
    (s) => s.startTime.toDateString() === today.toDateString()
  );
  const completedCount  = todaySchedules.filter((s) => s.status === 'completed').length;
  const missedCount     = todaySchedules.filter((s) => s.status === 'missed').length;
  const completePct     = todaySchedules.length > 0
    ? Math.round((completedCount / todaySchedules.length) * 100)
    : 0;

  const handleStatusUpdate = async (scheduleId: string, status: ScheduleStatus) => {
    await updateStatus(scheduleId, status);
    setCompletionModal(null);
  };

  // 원형 프로그레스 계산
  const r            = 30;
  const circumference = 2 * Math.PI * r;
  const dashOffset   = circumference * (1 - completePct / 100);

  return (
    <div
      className="min-h-dvh"
      style={{
        background: '#FAFAFD',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)',
      }}
    >
      <AppHeader title="자녀 일정" showLogo={false} showBack showNotification={false} />

      {/* ── 오늘 요약 히어로 카드 ── */}
      <div style={{
        margin: '16px',
        borderRadius: '28px',
        padding: '22px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
        boxShadow: '0 12px 40px rgba(0,132,204,0.30)',
      }}>
        {/* 장식 원 1 */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none',
        }} />
        {/* 장식 원 2 */}
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '-20px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
        }}>
          {/* 텍스트 통계 */}
          <div>
            <p style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.70)',
              marginBottom: '14px',
            }}>
              오늘 자녀 일정 · {formatDateShort(today)}
            </p>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: '32px', fontWeight: 800, color: 'white', lineHeight: 1 }}>
                  {todaySchedules.length}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '5px', fontWeight: 500 }}>
                  전체
                </p>
              </div>
              <div>
                <p style={{ fontSize: '32px', fontWeight: 800, color: 'white', lineHeight: 1 }}>
                  {completedCount}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '5px', fontWeight: 500 }}>
                  완료
                </p>
              </div>
              {missedCount > 0 && (
                <div>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: '#FFD166', lineHeight: 1 }}>
                    {missedCount}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '5px', fontWeight: 500 }}>
                    미완료
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 원형 프로그레스 SVG */}
          <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
            <svg
              viewBox="0 0 68 68"
              style={{
                width: '100%',
                height: '100%',
                transform: 'rotate(-90deg)',
              }}
            >
              <circle
                cx="34" cy="34" r={r}
                stroke="rgba(255,255,255,0.20)"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="34" cy="34" r={r}
                stroke="white"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={todaySchedules.length === 0 ? circumference : dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                {completePct}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 자녀 탭 바 ── */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '4px 16px 12px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink: 0,
              padding: '9px 20px',
              borderRadius: '100px',
              border: activeTab === tab.id ? 'none' : '1.5px solid rgba(0,132,204,0.14)',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#0084CC' : 'white',
              color: activeTab === tab.id ? 'white' : '#8E8E93',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: activeTab === tab.id ? '0 4px 16px rgba(0,132,204,0.30)' : 'none',
              transition: 'all 0.15s ease',
              letterSpacing: '-0.01em',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 로딩 ── */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '48px 0',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '3px solid rgba(0,132,204,0.15)',
            borderTopColor: '#0084CC',
            animation: 'spin 0.75s linear infinite',
          }} />
        </div>
      )}

      {/* ── 일정 목록 ── */}
      {!loading && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {childSchedules.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '64px 0',
              gap: '16px',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(0,132,204,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
              }}>
                📭
              </div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#1A1B2E' }}>
                자녀 일정이 없어요
              </p>
              <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 500 }}>
                일정 추가에서 자녀 일정을 등록하세요
              </p>
            </div>
          ) : (
            childSchedules.map((schedule) => {
              const currentStepIdx      = steps.findIndex((s) => s.key === schedule.status);
              const participantChildren = children.filter((c) => schedule.participants.includes(c.id));
              const isMissed            = schedule.status === 'missed';

              const statusColor = isMissed ? '#EF4444'
                : schedule.status === 'completed' ? '#059669'
                : schedule.status === 'in_progress' ? '#0084CC'
                : '#9CA3AF';

              const statusBg = isMissed ? 'rgba(239,68,68,0.10)'
                : schedule.status === 'completed' ? 'rgba(16,185,129,0.10)'
                : schedule.status === 'in_progress' ? 'rgba(0,132,204,0.10)'
                : 'rgba(156,163,175,0.12)';

              const statusLabel = isMissed ? '미완료'
                : schedule.status === 'completed' ? '완료'
                : schedule.status === 'in_progress' ? '진행중'
                : '대기';

              return (
                <div
                  key={schedule.id}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '18px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.04)',
                  }}
                >
                  {/* 카드 헤더 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                      <p style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: '#1A1B2E',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        letterSpacing: '-0.02em',
                        marginBottom: '4px',
                      }}>
                        {schedule.title}
                      </p>
                      <p style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 500 }}>
                        {formatDateShort(schedule.startTime)} · {formatTime(schedule.startTime)}
                        {schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
                      </p>
                    </div>
                    {/* 상태 뱃지 */}
                    <span style={{
                      flexShrink: 0,
                      padding: '5px 12px',
                      borderRadius: '100px',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: statusBg,
                      color: statusColor,
                      letterSpacing: '-0.01em',
                    }}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* 참여 자녀 칩 */}
                  {participantChildren.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginBottom: '14px',
                    }}>
                      {participantChildren.map((c) => (
                        <span
                          key={c.id}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '100px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: 'rgba(16,185,129,0.10)',
                            color: '#059669',
                          }}
                        >
                          {c.user?.avatar} {c.user?.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 진행 스텝퍼 */}
                  {!isMissed && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '14px',
                    }}>
                      {steps.map((step, i) => {
                        const isActive = schedule.status === step.key;
                        const isPast   = i < currentStepIdx;
                        const dotColor = isPast || isActive
                          ? step.key === 'completed' ? '#10B981'
                            : step.key === 'in_progress' ? '#0084CC'
                            : '#9CA3AF'
                          : '#E5E5EA';

                        return (
                          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: isPast || isActive ? dotColor : '#F0F0F0',
                                color: isPast || isActive ? 'white' : '#C7C7CC',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                boxShadow: isActive ? `0 3px 10px ${dotColor}50` : 'none',
                                transition: 'all 0.2s ease',
                              }}>
                                {isPast ? '✓' : i + 1}
                              </div>
                              <span style={{
                                fontSize: '10px',
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
                                margin: '0 4px',
                                marginBottom: '18px',
                                borderRadius: '999px',
                                background: isPast ? '#10B981' : '#E5E5EA',
                                transition: 'background 0.3s ease',
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 미완료 배너 */}
                  {isMissed && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(239,68,68,0.06)',
                      marginBottom: '14px',
                    }}>
                      <span style={{ fontSize: '14px' }}>⚠️</span>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>
                        미완료 처리된 일정입니다
                      </p>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {schedule.status === 'in_progress' && (
                      <button
                        onClick={() => setCompletionModal(schedule)}
                        style={{
                          flex: 1,
                          padding: '12px 0',
                          borderRadius: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: 'white',
                          background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                          boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        ✓ 완료 확인
                      </button>
                    )}
                    {(schedule.status === 'pending' || schedule.status === 'missed') && (
                      <button
                        disabled={reNotifyingId === schedule.id}
                        onClick={async () => {
                          setReNotifyingId(schedule.id);
                          const memberNames = participantChildren.map((c) => c.user?.name).join(', ');
                          const ok = await sendReNotify(schedule, memberNames);
                          setReNotifyingId(null);
                          alert(ok
                            ? `✅ ${schedule.title} 재알림 발송 완료!`
                            : '❌ 재알림 발송에 실패했습니다.');
                        }}
                        style={{
                          flex: 1,
                          padding: '12px 0',
                          borderRadius: '14px',
                          border: 'none',
                          cursor: reNotifyingId === schedule.id ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0084CC',
                          background: 'rgba(0,132,204,0.08)',
                          opacity: reNotifyingId === schedule.id ? 0.6 : 1,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {reNotifyingId === schedule.id ? '발송 중...' : '🔔 재알림 보내기'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── 완료 확인 모달 (바텀시트) ── */}
      {completionModal && (
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
          onClick={() => setCompletionModal(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: 'white',
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
              background: '#E5E5EA',
              borderRadius: '999px',
              margin: '0 auto 24px',
            }} />

            <p style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#1A1B2E',
              textAlign: 'center',
              marginBottom: '6px',
              letterSpacing: '-0.03em',
            }}>
              일정을 완료했나요?
            </p>
            <p style={{
              fontSize: '14px',
              color: '#8E8E93',
              textAlign: 'center',
              marginBottom: '24px',
              fontWeight: 500,
            }}>
              {completionModal.title}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => handleStatusUpdate(completionModal.id, 'missed')}
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
                onClick={() => handleStatusUpdate(completionModal.id, 'completed')}
                style={{
                  padding: '15px 0',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'white',
                  background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
                }}
              >
                ✓ 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
