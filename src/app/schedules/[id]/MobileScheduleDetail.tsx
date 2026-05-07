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

interface MobileScheduleDetailProps {
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

export function MobileScheduleDetail({
  schedule, id, cfg, participantUsers, steps, currentStepIdx,
  showDeleteModal, setShowDeleteModal, showCompletionModal, setShowCompletionModal,
  handleUpdateStatus, handleDelete
}: MobileScheduleDetailProps) {
  const router = useRouter();

  return (
    <div className="min-h-dvh pb-10" style={{ background: '#FAFAFD' }}>
      {/* ── 히어로 헤더 ── */}
      <div className="relative overflow-hidden" style={{ background: cfg.gradient, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
        <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.20)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </button>
          <span className="text-[15px] font-bold text-white">일정 상세</span>
          <button onClick={() => router.push(`/schedules/${id}/edit`)} className="px-3 py-1.5 rounded-full text-[13px] font-semibold active:scale-95 transition-transform" style={{ background: 'rgba(255,255,255,0.20)', color: 'white' }}>수정</button>
        </div>
        <div className="px-5 pt-2 pb-6 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
              <span className="text-lg">{cfg.icon}</span>
            </div>
            <span className="text-[12px] font-bold text-white/80 uppercase tracking-wide">
              {schedule.type === 'shared' ? '공유 일정' : schedule.type === 'personal' ? '개인 일정' : schedule.type === 'child' ? '자녀 일정' : '정기 지출'}
            </span>
          </div>
          <h1 className="text-[24px] font-bold text-white leading-tight">{schedule.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-white/80 text-[13px]">
            <span>📅 {formatDate(schedule.startTime)}</span>
            <span>⏰ {formatTime(schedule.startTime)}{schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}</span>
          </div>
          {schedule.repeat !== 'none' && <span className="inline-block mt-1.5 text-[12px] text-white/70">🔁 {REPEAT_LABELS[schedule.repeat]}</span>}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* 자녀일정 상태 스텝퍼 */}
        {schedule.type === 'child' && (
          <div className="bg-white rounded-[24px] p-5" style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.06)' }}>
            <p className="text-[12px] font-bold tracking-widest uppercase mb-4" style={{ color: '#8E8E93' }}>진행 상황</p>
            <div className="flex items-center">
              {steps.map((step, i) => {
                const isActive = schedule.status === step.key;
                const isPast = i < currentStepIdx;
                const dotColor = isPast || isActive ? (step.key === 'completed' ? '#10B981' : step.key === 'in_progress' ? '#0084CC' : '#9CA3AF') : '#E5E5EA';
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold transition-all" style={{ background: isPast || isActive ? dotColor : '#F0F0F0', color: isPast || isActive ? 'white' : '#C7C7CC', boxShadow: isActive ? `0 4px 14px ${dotColor}60` : 'none' }}>{isPast ? '✓' : i + 1}</div>
                      <span className="text-[11px]" style={{ color: isActive ? dotColor : '#C7C7CC', fontWeight: isActive ? 700 : 400 }}>{step.label}</span>
                    </div>
                    {i < 2 && <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full" style={{ background: isPast ? '#10B981' : '#E5E5EA' }} />}
                  </div>
                );
              })}
              {schedule.status === 'missed' && <div className="flex flex-col items-center gap-1.5 ml-3"><div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold" style={{ background: '#EF4444', color: 'white' }}>!</div><span className="text-[11px] font-bold" style={{ color: '#EF4444' }}>미완료</span></div>}
            </div>
          </div>
        )}

        {/* 정기지출 정보 */}
        {schedule.type === 'expense' && schedule.amount !== undefined && (
          <div className="bg-white rounded-[24px] p-5" style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.06)' }}>
            <p className="text-[12px] font-bold tracking-widest uppercase mb-3" style={{ color: '#8E8E93' }}>정기지출 정보</p>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: '14px', color: '#8E8E93' }}>금액</span>
              <span className="text-[24px] font-bold" style={{ color: '#1A1B2E' }}>{formatAmount(schedule.amount)}</span>
            </div>
            {schedule.expenseCategory && (
              <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: 'rgba(0,132,204,0.06)' }}>
                <span style={{ fontSize: '14px', color: '#8E8E93' }}>카테고리</span>
                <span className="flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: '#1A1B2E' }}><span>{EXPENSE_CATEGORY_ICONS[schedule.expenseCategory]}</span>{EXPENSE_CATEGORY_LABELS[schedule.expenseCategory]}</span>
              </div>
            )}
            {schedule.paymentMethod && (
              <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: 'rgba(0,132,204,0.06)' }}>
                <span style={{ fontSize: '14px', color: '#8E8E93' }}>결제 수단</span>
                <span className="text-[14px] font-semibold" style={{ color: '#1A1B2E' }}>{PAYMENT_METHOD_LABELS[schedule.paymentMethod]}</span>
              </div>
            )}
          </div>
        )}

        {/* 참여자 */}
        {participantUsers.length > 0 && (
          <div className="bg-white rounded-[24px] p-5" style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.06)' }}>
            <p className="text-[12px] font-bold tracking-widest uppercase mb-3" style={{ color: '#8E8E93' }}>참여자</p>
            <div className="flex flex-wrap gap-2">
              {participantUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: 'rgba(0,132,204,0.06)', border: '1px solid rgba(0,132,204,0.10)' }}>
                  <span>{u.avatar}</span>
                  <span className="text-[13px] font-semibold" style={{ color: '#1A1B2E' }}>{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 장소 */}
        {schedule.location && (
          <div className="bg-white rounded-[24px] p-5" style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.06)' }}>
            <p className="text-[12px] font-bold tracking-widest uppercase mb-2" style={{ color: '#8E8E93' }}>📍 장소</p>
            <p className="text-[14px] font-medium" style={{ color: '#1A1B2E' }}>{schedule.location.address}</p>
            <div className="mt-3 h-36 rounded-[16px] flex items-center justify-center" style={{ background: 'rgba(0,132,204,0.04)', border: '1.5px dashed rgba(0,132,204,0.15)' }}>
              <div className="text-center"><span className="text-4xl">🗺️</span><p className="text-[11px] mt-1" style={{ color: '#8E8E93' }}>지도 표시 영역</p></div>
            </div>
          </div>
        )}

        {/* 메모 */}
        {schedule.memo && (
          <div className="bg-white rounded-[24px] p-5" style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.06)' }}>
            <p className="text-[12px] font-bold tracking-widest uppercase mb-2" style={{ color: '#8E8E93' }}>📝 메모</p>
            <p className="text-[14px] leading-relaxed" style={{ color: '#1A1B2E' }}>{schedule.memo}</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-2.5 pb-8 pt-1">
          {schedule.status === 'in_progress' && (
            <button onClick={() => setShowCompletionModal(true)} className="w-full py-4 rounded-[20px] text-[15px] font-bold text-white active:scale-[0.98] transition-transform" style={{ background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>✓ 완료 확인하기</button>
          )}
          {schedule.status === 'pending' && schedule.type !== 'child' && (
            <button onClick={() => handleUpdateStatus('in_progress')} className="w-full py-4 rounded-[20px] text-[15px] font-bold text-white active:scale-[0.98] transition-transform" style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', boxShadow: '0 8px 24px rgba(0,132,204,0.30)' }}>▶ 시작하기</button>
          )}
          {schedule.type === 'child' && (schedule.status === 'pending' || schedule.status === 'missed') && (
            <button onClick={() => notifToast.sent(schedule.title)} className="w-full py-4 rounded-[20px] text-[15px] font-bold active:scale-[0.98] transition-transform" style={{ background: 'rgba(0,132,204,0.08)', color: '#0084CC' }}>🔔 재알림 보내기</button>
          )}
          {schedule.status === 'in_progress' && schedule.type !== 'child' && (
            <button onClick={() => handleUpdateStatus('pending')} className="w-full py-3 rounded-[20px] text-[13px] font-semibold active:scale-[0.98] transition-transform" style={{ background: 'rgba(0,0,0,0.04)', color: '#8E8E93' }}>↩ 대기 상태로</button>
          )}
          <button onClick={() => setShowDeleteModal(true)} className="w-full py-3.5 rounded-[20px] text-[14px] font-semibold active:scale-[0.98] transition-transform" style={{ background: 'rgba(239,68,68,0.06)', color: '#EF4444' }}>일정 삭제</button>
        </div>
      </div>

      {/* 모달 로직 생략 (page.tsx에서 처리 가능하나 UI는 필요) */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCompletionModal(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#E5E5EA] rounded-full mx-auto mb-6" />
            <p className="text-[20px] font-bold text-center mb-1" style={{ color: '#1A1B2E' }}>일정을 완료했나요?</p>
            <p className="text-[14px] text-center mb-6" style={{ color: '#8E8E93' }}>{schedule.title}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleUpdateStatus('missed')} className="py-3.5 rounded-[16px] text-[15px] font-bold active:scale-95" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>✗ 미완료</button>
              <button onClick={() => handleUpdateStatus('completed')} className="py-3.5 rounded-[16px] text-[15px] font-bold text-white active:scale-95" style={{ background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)', boxShadow: '0 4px 16px rgba(16,185,129,0.30)' }}>✓ 완료</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#E5E5EA] rounded-full mx-auto mb-6" />
            <p className="text-[20px] font-bold text-center mb-1" style={{ color: '#1A1B2E' }}>일정을 삭제할까요?</p>
            <p className="text-[14px] text-center mb-6" style={{ color: '#8E8E93' }}>삭제된 일정은 복구할 수 없습니다</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="py-3.5 rounded-[16px] text-[15px] font-semibold" style={{ background: '#FAFAFD', color: '#8E8E93' }}>취소</button>
              <button onClick={handleDelete} className="py-3.5 rounded-[16px] text-[15px] font-bold text-white active:scale-95" style={{ background: '#EF4444', boxShadow: '0 4px 16px rgba(239,68,68,0.30)' }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
