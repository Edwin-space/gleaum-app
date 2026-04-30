'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatusBadge } from '@/components/ui/Badge';
import { sampleSchedules, sampleUsers } from '@/lib/sampleData';
import { formatTime, formatDateShort } from '@/lib/utils';
import type { Schedule, ScheduleStatus } from '@/types';

export default function ChildrenSchedulePage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [schedules, setSchedules] = useState(sampleSchedules);
  const [completionModal, setCompletionModal] = useState<Schedule | null>(null);

  const children = sampleUsers.filter((u) => u.role === 'child');
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
  const progressCount  = todaySchedules.filter((s) => s.status === 'in_progress').length;

  // 상태 업데이트
  const updateStatus = (id: string, status: ScheduleStatus) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    setCompletionModal(null);
  };

  // 재알림 발송
  const sendReNotify = (schedule: Schedule) => {
    alert(`📣 ${schedule.title} 재알림을 발송했습니다.`);
  };

  const getChild = (participantIds: string[]) =>
    sampleUsers.find((u) => participantIds.includes(u.id) && u.role === 'child');

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader title="자녀 일정" showLogo={false} showBack />

      {/* 오늘 요약 */}
      <div className="mx-4 my-3 px-4 py-3.5 rounded-2xl flex items-center justify-between"
        style={{ background: 'var(--brand-gradient)', boxShadow: '0 2px 8px rgba(46,232,149,0.25)' }}>
        <div>
          <p className="text-[12px] text-white/70 mb-0.5" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
            오늘 자녀 일정
          </p>
          <p className="text-[22px] font-bold text-white">
            총 {todaySchedules.length}건
          </p>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-[20px] font-bold text-white">{completedCount}</p>
            <p className="text-[10px] text-white/70" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>완료</p>
          </div>
          <div>
            <p className="text-[20px] font-bold text-white">{progressCount}</p>
            <p className="text-[10px] text-white/70" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>진행중</p>
          </div>
          <div>
            <p className="text-[20px] font-bold text-white">{missedCount}</p>
            <p className="text-[10px] text-white/70" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>미완료</p>
          </div>
        </div>
      </div>

      {/* 자녀 탭 */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
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

      {/* 일정 카드 */}
      <div className="px-4 space-y-3">
        {childSchedules.length > 0 ? childSchedules.map((schedule) => {
          const child = getChild(schedule.participants);
          const now = new Date();
          const isOngoing = schedule.startTime <= now && schedule.endTime && schedule.endTime >= now;
          const progress = isOngoing && schedule.endTime
            ? Math.min(
                ((now.getTime() - schedule.startTime.getTime()) /
                 (schedule.endTime.getTime() - schedule.startTime.getTime())) * 100,
                100
              )
            : 0;

          return (
            <div
              key={schedule.id}
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}
            >
              {/* 진행 바 */}
              {schedule.status === 'in_progress' && (
                <div className="h-1" style={{ background: 'var(--color-hairline)' }}>
                  <div
                    className="h-full transition-all"
                    style={{ width: `${progress}%`, background: 'var(--color-schedule-child)' }}
                  />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    {/* 자녀 이름 */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{child?.avatar}</span>
                      <span className="text-[12px] font-medium" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                        {child?.name}
                      </span>
                    </div>
                    <p className="text-[16px] font-bold" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                      {schedule.title}
                    </p>
                    <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                      {formatDateShort(schedule.startTime)} · {formatTime(schedule.startTime)}
                      {schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
                    </p>
                    {schedule.location && (
                      <p className="text-[12px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-ink-muted-48)' }}>
                        📍 {schedule.location.address}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={schedule.status} />
                </div>

                {/* 상태 스텝퍼 */}
                <div className="flex items-center gap-0 mb-3 mt-3">
                  {(['pending', 'in_progress', 'completed'] as ScheduleStatus[]).map((st, i) => {
                    const labels: Record<string, string> = { pending: '대기중', in_progress: '진행중', completed: '완료' };
                    const stepColors: Record<string, string> = {
                      pending:     'var(--color-status-pending)',
                      in_progress: 'var(--color-status-progress)',
                      completed:   'var(--color-status-done)',
                    };
                    const isActive  = schedule.status === st;
                    const isPast    = (
                      (st === 'pending' && ['in_progress', 'completed'].includes(schedule.status)) ||
                      (st === 'in_progress' && schedule.status === 'completed')
                    );

                    return (
                      <div key={st} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{
                              background: isActive || isPast ? stepColors[st] : 'var(--color-hairline)',
                              color: isActive || isPast ? (st === 'completed' ? 'var(--brand-black)' : 'white') : 'var(--color-ink-muted-48)',
                            }}
                          >
                            {isPast ? '✓' : i + 1}
                          </div>
                          <span className="text-[10px]" style={{
                            color: isActive ? stepColors[st] : 'var(--color-body-muted)',
                            fontFamily: "'Noto Sans KR',sans-serif",
                            fontWeight: isActive ? 700 : 400,
                          }}>
                            {labels[st]}
                          </span>
                        </div>
                        {i < 2 && (
                          <div className="flex-1 h-px mx-1 mb-4" style={{
                            background: isPast ? 'var(--color-schedule-child)' : 'var(--color-hairline)',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  {(schedule.status === 'pending' || schedule.status === 'missed') && (
                    <button
                      onClick={() => sendReNotify(schedule)}
                      className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95"
                      style={{
                        background: 'rgba(0,132,204,0.08)',
                        color: 'var(--color-primary)',
                        fontFamily: "'Noto Sans KR',sans-serif",
                      }}
                    >
                      🔔 재알림 보내기
                    </button>
                  )}
                  {schedule.status === 'in_progress' && (
                    <button
                      onClick={() => setCompletionModal(schedule)}
                      className="flex-1 py-2 rounded-xl text-[12px] font-semibold text-white transition-all active:scale-95"
                      style={{ background: 'var(--color-schedule-child)', fontFamily: "'Noto Sans KR',sans-serif" }}
                    >
                      ✓ 완료 확인
                    </button>
                  )}
                  {schedule.status === 'missed' && (
                    <button
                      onClick={() => updateStatus(schedule.id, 'in_progress')}
                      className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95"
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        color: '#EF4444',
                        fontFamily: "'Noto Sans KR',sans-serif",
                      }}
                    >
                      다시 시작
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-5xl">🌟</span>
            <p style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>
              자녀 일정이 없습니다
            </p>
          </div>
        )}
      </div>

      {/* 완료 확인 모달 */}
      {completionModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setCompletionModal(null)}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-[18px] font-bold text-center mb-1" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              일정을 완료했나요?
            </p>
            <p className="text-[14px] text-center mb-6" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              {completionModal.title}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateStatus(completionModal.id, 'missed')}
                className="py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontFamily: "'Noto Sans KR',sans-serif" }}
              >
                ✗ 미완료
              </button>
              <button
                onClick={() => updateStatus(completionModal.id, 'completed')}
                className="py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all active:scale-95"
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
