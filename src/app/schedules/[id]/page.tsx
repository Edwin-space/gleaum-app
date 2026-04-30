'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { StatusBadge, TypeBadge } from '@/components/ui/Badge';
import { getScheduleById, updateScheduleStatus, deleteSchedule } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFamily } from '@/hooks/useFamily';
import {
  formatDate, formatTime, formatAmount,
  getScheduleTypeColor,
} from '@/lib/utils';
import {
  EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_ICONS,
  PAYMENT_METHOD_LABELS, REPEAT_LABELS,
} from '@/types';
import type { Schedule, ScheduleStatus } from '@/types';

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { familyGroupId } = useCurrentUser();
  const { members } = useFamily(familyGroupId);

  const [schedule, setSchedule] = useState<Schedule | null | undefined>(undefined); // undefined = loading
  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // 일정 로드
  useEffect(() => {
    if (!id) return;
    getScheduleById(id).then((s) => setSchedule(s ?? null));
  }, [id]);

  const handleUpdateStatus = async (status: ScheduleStatus) => {
    if (!schedule) return;
    await updateScheduleStatus(schedule.id, status);
    setSchedule({ ...schedule, status });
    setShowCompletionModal(false);
  };

  const handleDelete = async () => {
    if (!schedule) return;
    await deleteSchedule(schedule.id);
    router.back();
  };

  const sendReNotify = () => {
    alert(`📣 ${schedule?.title} 재알림을 발송했습니다.`);
  };

  // 로딩 상태
  if (schedule === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // 존재하지 않는 일정
  if (!schedule) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">📭</span>
        <p style={{ fontFamily: "'Noto Sans KR',sans-serif", color: 'var(--color-ink-muted-48)' }}>
          일정을 찾을 수 없습니다
        </p>
        <button onClick={() => router.back()} style={{ color: 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}>
          돌아가기
        </button>
      </div>
    );
  }

  const typeColor = getScheduleTypeColor(schedule.type);
  const participantUsers = members.filter((u) => schedule.participants.includes(u.id));

  const steps: { key: ScheduleStatus; label: string }[] = [
    { key: 'pending',     label: '대기중' },
    { key: 'in_progress', label: '진행중' },
    { key: 'completed',   label: '완료'   },
  ];
  const currentStepIdx = steps.findIndex((s) => s.key === schedule.status);

  return (
    <div className="min-h-dvh pb-10" style={{ background: 'var(--color-canvas-parchment)' }}>
      <AppHeader
        showBack
        showLogo={false}
        showNotification={false}
        title="일정 상세"
        rightAction={
          <button
            className="text-[14px] font-medium"
            style={{ color: 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}
          >
            수정
          </button>
        }
      />

      {/* 유형 컬러 히어로 바 */}
      <div className="h-1.5 w-full" style={{ background: typeColor }} />

      <div className="px-4 pt-5 space-y-4">

        {/* 제목 + 배지 */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <TypeBadge type={schedule.type} />
            {schedule.type === 'child' && <StatusBadge status={schedule.status} />}
          </div>
          <h1
            className="text-[22px] font-bold leading-tight mb-2"
            style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}
          >
            {schedule.title}
          </h1>
          <div className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
            <span>📅</span>
            <span>{formatDate(schedule.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-[14px] mt-1" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
            <span>⏰</span>
            <span>
              {formatTime(schedule.startTime)}
              {schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
            </span>
          </div>
          {schedule.repeat !== 'none' && (
            <div className="flex items-center gap-2 text-[14px] mt-1" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              <span>🔁</span>
              <span>{REPEAT_LABELS[schedule.repeat]}</span>
            </div>
          )}
        </div>

        {/* 자녀일정 상태 스텝퍼 */}
        {schedule.type === 'child' && (
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <p className="text-[13px] font-semibold mb-4" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              진행 상황
            </p>
            <div className="flex items-center">
              {steps.map((step, i) => {
                const isActive = schedule.status === step.key;
                const isPast   = i < currentStepIdx;
                const stepColor = isPast || isActive
                  ? (step.key === 'completed' ? 'var(--color-status-done)'
                    : step.key === 'in_progress' ? 'var(--color-status-progress)'
                    : 'var(--color-status-pending)')
                  : 'var(--color-hairline)';

                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                        style={{
                          background: isPast || isActive ? stepColor : 'var(--color-hairline)',
                          color: isPast || isActive ? (step.key === 'completed' ? 'var(--brand-black)' : 'white') : 'var(--color-body-muted)',
                        }}
                      >
                        {isPast ? '✓' : i + 1}
                      </div>
                      <span
                        className="text-[11px]"
                        style={{
                          fontFamily: "'Noto Sans KR',sans-serif",
                          color: isActive ? stepColor : 'var(--color-body-muted)',
                          fontWeight: isActive ? 700 : 400,
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        className="flex-1 h-0.5 mx-1 mb-5"
                        style={{ background: isPast ? 'var(--color-schedule-child)' : 'var(--color-hairline)' }}
                      />
                    )}
                  </div>
                );
              })}
              {schedule.status === 'missed' && (
                <div className="flex flex-col items-center gap-1.5 ml-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                    style={{ background: 'var(--color-status-missed)', color: 'white' }}>
                    !
                  </div>
                  <span className="text-[11px]" style={{ fontFamily: "'Noto Sans KR',sans-serif", color: 'var(--color-status-missed)', fontWeight: 700 }}>
                    미완료
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 정기지출 정보 */}
        {schedule.type === 'expense' && schedule.amount !== undefined && (
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              💰 정기지출 정보
            </p>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>금액</span>
              <span className="text-[20px] font-bold" style={{ color: 'var(--color-ink)' }}>
                {formatAmount(schedule.amount)}
              </span>
            </div>
            {schedule.expenseCategory && (
              <div className="flex items-center justify-between py-2 border-t" style={{ borderColor: 'var(--color-hairline)' }}>
                <span style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>카테고리</span>
                <span className="flex items-center gap-1.5 text-[14px] font-medium" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  <span>{EXPENSE_CATEGORY_ICONS[schedule.expenseCategory]}</span>
                  {EXPENSE_CATEGORY_LABELS[schedule.expenseCategory]}
                </span>
              </div>
            )}
            {schedule.paymentMethod && (
              <div className="flex items-center justify-between py-2 border-t" style={{ borderColor: 'var(--color-hairline)' }}>
                <span style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>결제 수단</span>
                <span className="text-[14px] font-medium" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  {PAYMENT_METHOD_LABELS[schedule.paymentMethod]}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 참여자 */}
        {participantUsers.length > 0 && (
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              참여자
            </p>
            <div className="flex flex-wrap gap-2">
              {participantUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'var(--color-canvas-parchment)', border: '1px solid var(--color-hairline)' }}
                >
                  <span>{u.avatar}</span>
                  <span className="text-[13px] font-medium" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    {u.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 장소 */}
        {schedule.location && (
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              📍 장소
            </p>
            <p className="text-[14px]" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              {schedule.location.address}
            </p>
            <div
              className="mt-3 h-36 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-canvas-parchment)', border: '1px solid var(--color-hairline)' }}
            >
              <div className="text-center">
                <span className="text-4xl">🗺️</span>
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  지도 표시 영역
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 메모 */}
        {schedule.memo && (
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <p className="text-[13px] font-semibold mb-2" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              📝 메모
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              {schedule.memo}
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-2 pb-6">
          {schedule.type === 'child' && schedule.status === 'in_progress' && (
            <button
              onClick={() => setShowCompletionModal(true)}
              className="w-full py-4 rounded-2xl text-[15px] font-semibold active:scale-[0.98] transition-transform"
              style={{ background: 'var(--color-schedule-child)', color: 'var(--brand-black)', fontFamily: "'Noto Sans KR',sans-serif" }}
            >
              ✓ 완료 확인하기
            </button>
          )}
          {schedule.type === 'child' && (schedule.status === 'pending' || schedule.status === 'missed') && (
            <button
              onClick={sendReNotify}
              className="w-full py-4 rounded-2xl text-[15px] font-semibold active:scale-[0.98] transition-transform"
              style={{ background: 'rgba(0,132,204,0.08)', color: 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}
            >
              🔔 재알림 보내기
            </button>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3.5 rounded-2xl text-[14px] font-medium active:scale-[0.98] transition-transform"
            style={{ background: 'rgba(239,68,68,0.06)', color: '#EF4444', fontFamily: "'Noto Sans KR',sans-serif" }}
          >
            일정 삭제
          </button>
        </div>
      </div>

      {/* 완료 확인 모달 */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowCompletionModal(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-[18px] font-bold text-center mb-1" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              일정을 완료했나요?
            </p>
            <p className="text-[14px] text-center mb-6" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              {schedule.title}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleUpdateStatus('missed')}
                className="py-3.5 rounded-2xl text-[15px] font-semibold active:scale-95"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontFamily: "'Noto Sans KR',sans-serif" }}>
                ✗ 미완료
              </button>
              <button onClick={() => handleUpdateStatus('completed')}
                className="py-3.5 rounded-2xl text-[15px] font-semibold active:scale-95"
                style={{ background: 'var(--color-schedule-child)', color: 'var(--brand-black)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                ✓ 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-[18px] font-bold text-center mb-1" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              일정을 삭제할까요?
            </p>
            <p className="text-[14px] text-center mb-6" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              삭제된 일정은 복구할 수 없습니다
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="py-3.5 rounded-2xl text-[15px] font-semibold active:scale-95"
                style={{ background: 'var(--color-canvas-parchment)', color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                취소
              </button>
              <button onClick={handleDelete}
                className="py-3.5 rounded-2xl text-[15px] font-semibold text-white active:scale-95"
                style={{ background: '#EF4444', fontFamily: "'Noto Sans KR',sans-serif" }}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
