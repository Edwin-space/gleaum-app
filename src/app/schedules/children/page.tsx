'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatusBadge } from '@/components/ui/Badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFamily } from '@/hooks/useFamily';
import { useSchedules } from '@/hooks/useSchedules';
import { formatTime, formatDateShort } from '@/lib/utils';
import type { Schedule, ScheduleStatus } from '@/types';

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

  const steps: { key: ScheduleStatus; label: string }[] = [
    { key: 'pending',     label: '대기' },
    { key: 'in_progress', label: '진행중' },
    { key: 'completed',   label: '완료' },
  ];

  const handleStatusUpdate = async (scheduleId: string, status: ScheduleStatus) => {
    await updateStatus(scheduleId, status);
    setCompletionModal(null);
  };

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader title="자녀 일정" showLogo={false} showBack showNotification={false} />

      {/* 오늘 요약 카드 */}
      <div className="mx-4 my-4 p-4 rounded-2xl text-white" style={{ background: 'var(--brand-gradient)' }}>
        <p className="text-[12px] font-semibold opacity-75 mb-2" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
          오늘 자녀 일정 현황 · {formatDateShort(today)}
        </p>
        <div className="flex gap-4">
          <div>
            <p className="text-[28px] font-bold">{todaySchedules.length}</p>
            <p className="text-[11px] opacity-75" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>전체</p>
          </div>
          <div>
            <p className="text-[28px] font-bold">{completedCount}</p>
            <p className="text-[11px] opacity-75" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>완료</p>
          </div>
          {missedCount > 0 && (
            <div>
              <p className="text-[28px] font-bold">{missedCount}</p>
              <p className="text-[11px] opacity-75" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>미완료</p>
            </div>
          )}
        </div>
      </div>

      {/* 자녀 탭 */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'var(--color-schedule-child)' : 'white',
              color:      activeTab === tab.id ? 'var(--brand-black)' : 'var(--color-ink-muted-48)',
              border:     activeTab === tab.id ? 'none' : '1px solid var(--color-hairline)',
              fontFamily: "'Noto Sans KR',sans-serif",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      )}

      {/* 일정 목록 */}
      {!loading && (
        <div className="px-4 space-y-3">
          {childSchedules.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <span className="text-4xl">📭</span>
              <p style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>
                자녀 일정이 없습니다
              </p>
            </div>
          ) : (
            childSchedules.map((schedule) => {
              const currentStepIdx = steps.findIndex((s) => s.key === schedule.status);
              const participantChildren = children.filter((c) => schedule.participants.includes(c.id));

              return (
                <div key={schedule.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[15px] font-semibold" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                        {schedule.title}
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                        {formatDateShort(schedule.startTime)} · {formatTime(schedule.startTime)}
                        {schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
                      </p>
                    </div>
                    <StatusBadge status={schedule.status} />
                  </div>

                  {/* 참여 자녀 */}
                  {participantChildren.length > 0 && (
                    <div className="flex gap-1 mb-3">
                      {participantChildren.map((c) => (
                        <span
                          key={c.id}
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{
                            background: 'rgba(46,232,149,0.12)',
                            color: 'var(--brand-teal)',
                            fontFamily: "'Noto Sans KR',sans-serif",
                          }}
                        >
                          {c.avatar} {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 진행 스텝퍼 */}
                  <div className="flex items-center mb-3">
                    {steps.map((step, i) => {
                      const isActive = schedule.status === step.key;
                      const isPast   = i < currentStepIdx;
                      const color = isActive || isPast
                        ? (step.key === 'completed' ? 'var(--color-status-done)'
                          : step.key === 'in_progress' ? 'var(--color-status-progress)'
                          : 'var(--color-status-pending)')
                        : 'var(--color-hairline)';
                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{
                                background: isActive || isPast ? color : 'var(--color-hairline)',
                                color: isActive || isPast ? (step.key === 'completed' ? 'var(--brand-black)' : 'white') : 'var(--color-body-muted)',
                              }}
                            >
                              {isPast ? '✓' : i + 1}
                            </div>
                            <span className="text-[10px]" style={{
                              fontFamily: "'Noto Sans KR',sans-serif",
                              color: isActive ? color : 'var(--color-body-muted)',
                              fontWeight: isActive ? 700 : 400,
                            }}>
                              {step.label}
                            </span>
                          </div>
                          {i < 2 && (
                            <div className="flex-1 h-px mx-1 mb-4" style={{ background: isPast ? 'var(--color-schedule-child)' : 'var(--color-hairline)' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-2">
                    {schedule.status === 'in_progress' && (
                      <button
                        onClick={() => setCompletionModal(schedule)}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95"
                        style={{ background: 'var(--color-schedule-child)', color: 'var(--brand-black)', fontFamily: "'Noto Sans KR',sans-serif" }}
                      >
                        ✓ 완료 확인
                      </button>
                    )}
                    {(schedule.status === 'pending' || schedule.status === 'missed') && (
                      <button
                        onClick={() => alert(`${schedule.title} 재알림 발송!`)}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95"
                        style={{ background: 'rgba(0,132,204,0.08)', color: 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}
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
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setCompletionModal(null)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-[18px] font-bold text-center mb-1" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              일정을 완료했나요?
            </p>
            <p className="text-[14px] text-center mb-6" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              {completionModal.title}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStatusUpdate(completionModal.id, 'missed')}
                className="py-3.5 rounded-2xl text-[15px] font-semibold active:scale-95"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontFamily: "'Noto Sans KR',sans-serif" }}
              >
                ✗ 미완료
              </button>
              <button
                onClick={() => handleStatusUpdate(completionModal.id, 'completed')}
                className="py-3.5 rounded-2xl text-[15px] font-semibold active:scale-95"
                style={{ background: 'var(--color-schedule-child)', color: 'var(--brand-black)', fontFamily: "'Noto Sans KR',sans-serif" }}
              >
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
