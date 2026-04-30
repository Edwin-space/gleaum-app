'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFamily } from '@/hooks/useFamily';
import { useSchedules } from '@/hooks/useSchedules';
import { formatTime, formatDateShort } from '@/lib/utils';
import type { Schedule, ScheduleStatus } from '@/types';

const steps: { key: ScheduleStatus; label: string }[] = [
  { key: 'pending',     label: '대기' },
  { key: 'in_progress', label: '진행중' },
  { key: 'completed',   label: '완료' },
];

export default function ChildrenSchedulePage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [completionModal, setCompletionModal] = useState<Schedule | null>(null);

  const { familyGroupId, loading: userLoading } = useCurrentUser();
  const { members, loading: familyLoading } = useFamily(familyGroupId);
  const { schedules, loading: schedulesLoading, updateStatus } = useSchedules(familyGroupId);

  const loading = userLoading || familyLoading || schedulesLoading;

  const children = members.filter((u) => u.role === 'child');
  const tabs = [{ id: 'all', label: '전체' }, ...children.map((c) => ({ id: c.id, label: c.name }))];

  const childSchedules = schedules.filter((s) => {
    if (s.type !== 'child') return false;
    if (activeTab === 'all') return true;
    return s.participants.includes(activeTab);
  });

  const today = new Date();
  const todaySchedules = childSchedules.filter(
    (s) => s.startTime.toDateString() === today.toDateString()
  );
  const completedCount = todaySchedules.filter((s) => s.status === 'completed').length;
  const missedCount    = todaySchedules.filter((s) => s.status === 'missed').length;
  const completePct    = todaySchedules.length > 0 ? Math.round((completedCount / todaySchedules.length) * 100) : 0;

  const handleStatusUpdate = async (scheduleId: string, status: ScheduleStatus) => {
    await updateStatus(scheduleId, status);
    setCompletionModal(null);
  };

  // 원형 프로그레스 계산
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - completePct / 100);

  return (
    <div className="min-h-dvh pb-28" style={{ background: '#FAFAFD' }}>
      <AppHeader title="자녀 일정" showLogo={false} showBack showNotification={false} />

      {/* 오늘 요약 히어로 카드 */}
      <div
        className="mx-4 mt-4 rounded-[28px] p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
          boxShadow: '0 12px 40px rgba(0,132,204,0.30)',
        }}
      >
        {/* 장식 원 */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '140px', height: '140px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />

        <div className="flex items-center justify-between relative z-10">
          {/* 텍스트 통계 */}
          <div>
            <p className="text-[12px] font-semibold text-white/70 mb-3" style={{  }}>
              오늘 자녀 일정 · {formatDateShort(today)}
            </p>
            <div className="flex gap-5">
              <div>
                <p className="text-[30px] font-bold text-white leading-none">{todaySchedules.length}</p>
                <p className="text-[11px] text-white/70 mt-1" style={{  }}>전체</p>
              </div>
              <div>
                <p className="text-[30px] font-bold text-white leading-none">{completedCount}</p>
                <p className="text-[11px] text-white/70 mt-1" style={{  }}>완료</p>
              </div>
              {missedCount > 0 && (
                <div>
                  <p className="text-[30px] font-bold leading-none" style={{ color: '#FFD166' }}>{missedCount}</p>
                  <p className="text-[11px] text-white/70 mt-1" style={{  }}>미완료</p>
                </div>
              )}
            </div>
          </div>

          {/* 원형 프로그레스 */}
          <div className="relative w-[80px] h-[80px]">
            <svg viewBox="0 0 68 68" className="w-full h-full -rotate-90">
              <circle cx="34" cy="34" r={r} stroke="rgba(255,255,255,0.20)" strokeWidth="6" fill="none"/>
              <circle
                cx="34" cy="34" r={r}
                stroke="white" strokeWidth="6" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={todaySchedules.length === 0 ? circumference : dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[16px] font-bold text-white">{completePct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 자녀 탭 */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95"
            style={{
              background: activeTab === tab.id ? '#0084CC' : 'white',
              color:      activeTab === tab.id ? 'white' : '#8E8E93',
              border:     activeTab === tab.id ? 'none' : '1.5px solid rgba(0,132,204,0.12)',
              boxShadow:  activeTab === tab.id ? '0 4px 16px rgba(0,132,204,0.30)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(0,132,204,0.2)', borderTopColor: '#0084CC' }} />
        </div>
      )}

      {/* 일정 목록 */}
      {!loading && (
        <div className="px-4 space-y-3">
          {childSchedules.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,132,204,0.06)' }}>
                <span className="text-4xl">📭</span>
              </div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1B2E' }}>
                자녀 일정이 없어요
              </p>
              <p style={{ fontSize: '13px', color: '#8E8E93' }}>
                일정 추가에서 자녀 일정을 등록하세요
              </p>
            </div>
          ) : (
            childSchedules.map((schedule) => {
              const currentStepIdx = steps.findIndex((s) => s.key === schedule.status);
              const participantChildren = children.filter((c) => schedule.participants.includes(c.id));
              const isMissed = schedule.status === 'missed';

              return (
                <div
                  key={schedule.id}
                  className="bg-white rounded-[24px] p-4"
                  style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.06)' }}
                >
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-[15px] font-bold truncate" style={{ color: '#1A1B2E' }}>
                        {schedule.title}
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: '#8E8E93' }}>
                        {formatDateShort(schedule.startTime)} · {formatTime(schedule.startTime)}
                        {schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
                      </p>
                    </div>
                    {/* 상태 뱃지 */}
                    <span
                      className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold"
                      style={{
                        background: isMissed ? 'rgba(239,68,68,0.10)'
                          : schedule.status === 'completed' ? 'rgba(16,185,129,0.10)'
                          : schedule.status === 'in_progress' ? 'rgba(0,132,204,0.10)'
                          : 'rgba(156,163,175,0.12)',
                        color: isMissed ? '#EF4444'
                          : schedule.status === 'completed' ? '#059669'
                          : schedule.status === 'in_progress' ? '#0084CC'
                          : '#9CA3AF',
                      }}
                    >
                      {isMissed ? '미완료' : schedule.status === 'completed' ? '완료' : schedule.status === 'in_progress' ? '진행중' : '대기'}
                    </span>
                  </div>

                  {/* 참여 자녀 */}
                  {participantChildren.length > 0 && (
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                      {participantChildren.map((c) => (
                        <span
                          key={c.id}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{
                            background: 'rgba(16,185,129,0.10)',
                            color: '#059669',
                          }}
                        >
                          {c.avatar} {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 진행 스텝퍼 */}
                  {!isMissed && (
                    <div className="flex items-center mb-3">
                      {steps.map((step, i) => {
                        const isActive = schedule.status === step.key;
                        const isPast   = i < currentStepIdx;
                        const dotColor = isPast || isActive
                          ? step.key === 'completed' ? '#10B981'
                            : step.key === 'in_progress' ? '#0084CC'
                            : '#9CA3AF'
                          : '#E5E5EA';

                        return (
                          <div key={step.key} className="flex items-center flex-1">
                            <div className="flex flex-col items-center gap-1">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                                style={{
                                  background: isPast || isActive ? dotColor : '#F0F0F0',
                                  color: isPast || isActive ? 'white' : '#C7C7CC',
                                  boxShadow: isActive ? `0 3px 10px ${dotColor}50` : 'none',
                                }}
                              >
                                {isPast ? '✓' : i + 1}
                              </div>
                              <span className="text-[10px]" style={{
                                color: isActive ? dotColor : '#C7C7CC',
                                fontWeight: isActive ? 700 : 400,
                              }}>
                                {step.label}
                              </span>
                            </div>
                            {i < 2 && (
                              <div className="flex-1 h-0.5 mx-1 mb-5 rounded-full"
                                style={{ background: isPast ? '#10B981' : '#E5E5EA' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 미완료 배너 */}
                  {isMissed && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-[12px] mb-3"
                      style={{ background: 'rgba(239,68,68,0.06)' }}
                    >
                      <span className="text-sm">⚠️</span>
                      <p className="text-[12px] font-semibold" style={{ color: '#EF4444' }}>
                        미완료 처리된 일정입니다
                      </p>
                    </div>
                  )}

                  {/* 버튼 */}
                  <div className="flex gap-2">
                    {schedule.status === 'in_progress' && (
                      <button
                        onClick={() => setCompletionModal(schedule)}
                        className="flex-1 py-2.5 rounded-[14px] text-[13px] font-bold text-white transition-all active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                          boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
                        }}
                      >
                        ✓ 완료 확인
                      </button>
                    )}
                    {(schedule.status === 'pending' || schedule.status === 'missed') && (
                      <button
                        onClick={() => alert(`${schedule.title} 재알림 발송!`)}
                        className="flex-1 py-2.5 rounded-[14px] text-[13px] font-bold transition-all active:scale-95"
                        style={{
                          background: 'rgba(0,132,204,0.08)',
                          color: '#0084CC',
                        }}
                      >
                        🔔 재알림 보내기
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 완료 확인 모달 */}
      {completionModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setCompletionModal(null)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#E5E5EA] rounded-full mx-auto mb-6" />
            <p className="text-[20px] font-bold text-center mb-1" style={{ color: '#1A1B2E' }}>
              일정을 완료했나요?
            </p>
            <p className="text-[14px] text-center mb-6" style={{ color: '#8E8E93' }}>
              {completionModal.title}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleStatusUpdate(completionModal.id, 'missed')}
                className="py-3.5 rounded-[16px] text-[15px] font-bold active:scale-95"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
                ✗ 미완료
              </button>
              <button onClick={() => handleStatusUpdate(completionModal.id, 'completed')}
                className="py-3.5 rounded-[16px] text-[15px] font-bold text-white active:scale-95"
                style={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' }}>
                ✓ 완료
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
