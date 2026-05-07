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

export function DesktopScheduleDetail({
  schedule, id, cfg, participantUsers, steps, currentStepIdx,
  showDeleteModal, setShowDeleteModal, showCompletionModal, setShowCompletionModal,
  handleUpdateStatus, handleDelete
}: DesktopScheduleDetailProps) {
  const router = useRouter();

  return (
    <div className="max-w-[1200px] mx-auto px-10 pt-12 pb-32 animate-fade-in">
      
      {/* ── 상단 네비게이션 ── */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[15px] font-bold text-[#8E8E93] hover:text-[#1A1B2E] transition-colors group">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="group-hover:-translate-x-1 transition-transform">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          목록으로 돌아가기
        </button>
        <div className="flex gap-4">
          <button onClick={() => router.push(`/schedules/${id}/edit`)} className="px-8 h-12 rounded-[16px] font-bold bg-white border border-gray-100 hover:bg-gray-50 transition-colors">일정 수정</button>
          <button onClick={() => setShowDeleteModal(true)} className="px-8 h-12 rounded-[16px] font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">삭제</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10 items-start">
        
        {/* ── 좌측: 메인 정보 (Hero + 상세) ── */}
        <div className="col-span-8 space-y-8">
          
          <div className="rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl" style={{ background: cfg.gradient }}>
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 blur-[60px] rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
                  {cfg.icon}
                </div>
                <span className="text-[14px] font-black uppercase tracking-widest opacity-80">
                  {schedule.type === 'shared' ? '공유 일정' : schedule.type === 'personal' ? '개인 일정' : schedule.type === 'child' ? '자녀 일정' : '정기 지출'}
                </span>
              </div>
              <h1 className="text-[42px] font-black leading-tight mb-8 tracking-tight">{schedule.title}</h1>
              <div className="flex flex-wrap gap-8 text-[16px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="opacity-60">📅</span> {formatDate(schedule.startTime)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="opacity-60">⏰</span> {formatTime(schedule.startTime)}{schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
                </div>
                {schedule.repeat !== 'none' && (
                  <div className="flex items-center gap-2">
                    <span className="opacity-60">🔁</span> {REPEAT_LABELS[schedule.repeat]}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-12 rounded-[40px] space-y-12">
            
            {/* 자녀일정 상태 (PC 버전) */}
            {schedule.type === 'child' && (
              <div className="space-y-6">
                <h3 className="text-[14px] font-black text-[#8E8E93] uppercase tracking-widest">진행 상황 리포트</h3>
                <div className="flex items-center justify-between px-10">
                  {steps.map((step, i) => {
                    const isActive = schedule.status === step.key;
                    const isPast = i < currentStepIdx;
                    const dotColor = isPast || isActive ? (step.key === 'completed' ? '#10B981' : step.key === 'in_progress' ? '#0084CC' : '#9CA3AF') : '#E5E5EA';
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-3 relative">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-black transition-all ${isActive ? 'scale-110 shadow-xl' : ''}`}
                            style={{ background: isPast || isActive ? dotColor : '#F0F0F0', color: isPast || isActive ? 'white' : '#C7C7CC' }}>
                            {isPast ? '✓' : i + 1}
                          </div>
                          <span className={`text-[14px] font-black ${isActive ? 'text-[#1A1B2E]' : 'text-[#8E8E93]'}`}>{step.label}</span>
                        </div>
                        {i < 2 && <div className="flex-1 h-1 mx-4 -mt-8 rounded-full bg-gray-100"><div className="h-full rounded-full transition-all duration-1000" style={{ width: isPast ? '100%' : '0%', background: '#10B981' }} /></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 정기지출 정보 (PC 버전) */}
            {schedule.type === 'expense' && (
              <div className="grid grid-cols-3 gap-8">
                <div className="p-6 rounded-[28px] bg-amber-50/30 border border-amber-100">
                  <p className="text-[12px] font-black text-amber-600 uppercase mb-2">지출 금액</p>
                  <p className="text-[28px] font-black text-[#1A1B2E]">{formatAmount(schedule.amount ?? 0)}</p>
                </div>
                <div className="p-6 rounded-[28px] bg-blue-50/30 border border-blue-100">
                  <p className="text-[12px] font-black text-blue-600 uppercase mb-2">카테고리</p>
                  <p className="text-[18px] font-black text-[#1A1B2E] flex items-center gap-2">
                    {schedule.expenseCategory && (
                      <>{EXPENSE_CATEGORY_ICONS[schedule.expenseCategory]} {EXPENSE_CATEGORY_LABELS[schedule.expenseCategory]}</>
                    )}
                  </p>
                </div>
                <div className="p-6 rounded-[28px] bg-teal-50/30 border border-teal-100">
                  <p className="text-[12px] font-black text-teal-600 uppercase mb-2">결제 수단</p>
                  <p className="text-[18px] font-black text-[#1A1B2E]">
                    {schedule.paymentMethod && PAYMENT_METHOD_LABELS[schedule.paymentMethod]}
                  </p>
                </div>
              </div>
            )}

            {schedule.memo && (
              <div className="space-y-4">
                <h3 className="text-[14px] font-black text-[#8E8E93] uppercase tracking-widest">상세 메모</h3>
                <p className="text-[17px] leading-relaxed text-[#1A1B2E] font-medium whitespace-pre-wrap">{schedule.memo}</p>
              </div>
            )}

            {schedule.location && (
              <div className="space-y-4">
                <h3 className="text-[14px] font-black text-[#8E8E93] uppercase tracking-widest">장소 정보</h3>
                <div className="flex items-center gap-2 text-[17px] font-bold text-[#1A1B2E]">
                  <span>📍</span> {schedule.location.address}
                </div>
                <div className="h-[300px] rounded-[32px] bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-[#8E8E93]">
                  <span className="text-5xl mb-4">🗺️</span>
                  <p className="font-bold">지도 API 연동 준비 중</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 우측: 사이드바 (참여자 + 액션) ── */}
        <div className="col-span-4 space-y-8">
          
          <div className="glass-card p-10 rounded-[40px] space-y-10">
            <div className="space-y-6">
              <h3 className="text-[14px] font-black text-[#8E8E93] uppercase tracking-widest">참여자 ({participantUsers.length})</h3>
              <div className="space-y-4">
                {participantUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-[16px] bg-gray-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {u.avatar}
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-[#1A1B2E]">{u.name}</p>
                      <p className="text-[12px] font-bold text-[#8E8E93]">Space Member</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-gray-50 space-y-4">
              <h3 className="text-[14px] font-black text-[#8E8E93] uppercase tracking-widest mb-6">일정 상태 관리</h3>
              
              {schedule.status === 'in_progress' && (
                <button onClick={() => setShowCompletionModal(true)} className="w-full h-16 rounded-[20px] bg-emerald-500 text-white font-black text-[16px] shadow-xl shadow-emerald-100 hover:-translate-y-0.5 transition-all active:scale-95">✓ 완료 확인하기</button>
              )}
              {schedule.status === 'pending' && schedule.type !== 'child' && (
                <button onClick={() => handleUpdateStatus('in_progress')} className="w-full h-16 rounded-[20px] bg-brand-gradient text-white font-black text-[16px] shadow-xl shadow-blue-100 hover:-translate-y-0.5 transition-all active:scale-95">▶ 일정 시작하기</button>
              )}
              {schedule.type === 'child' && (schedule.status === 'pending' || schedule.status === 'missed') && (
                <button onClick={() => notifToast.sent(schedule.title)} className="w-full h-16 rounded-[20px] bg-brand-blue/10 text-brand-blue font-black text-[16px] hover:bg-brand-blue/20 transition-all">🔔 재알림 보내기</button>
              )}
              {schedule.status === 'in_progress' && schedule.type !== 'child' && (
                <button onClick={() => handleUpdateStatus('pending')} className="w-full h-14 rounded-[20px] text-[#8E8E93] font-bold hover:bg-gray-50 transition-all">↩ 대기 상태로 되돌리기</button>
              )}
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-gradient-to-br from-[#1A1B2E] to-[#2D2E4A] text-white">
            <h4 className="text-[15px] font-black mb-4">Space Smart Reminder</h4>
            <p className="text-[13px] leading-relaxed text-white/60 font-medium">
              이 일정은 시작 {schedule.reminder}분 전에 참여자 모두에게 푸시 알림이 발송됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* PC 전용 중앙 정렬 모달 (Delete) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-[400px] glass-card rounded-[40px] p-10 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-4xl mx-auto mb-6">🗑️</div>
              <h3 className="text-[22px] font-black mb-2">일정을 삭제할까요?</h3>
              <p className="text-[15px] text-[#8E8E93] font-medium leading-relaxed mb-10">이 작업은 되돌릴 수 없으며,<br/>공간 멤버들의 목록에서도 삭제됩니다.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowDeleteModal(false)} className="h-14 rounded-[20px] font-bold bg-gray-50 text-[#8E8E93]">취소</button>
                <button onClick={handleDelete} className="h-14 rounded-[20px] font-bold bg-red-500 text-white shadow-xl shadow-red-100">삭제하기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PC 전용 중앙 정렬 모달 (Completion) */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowCompletionModal(false)}>
          <div className="w-full max-w-[400px] glass-card rounded-[40px] p-10 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
              <h3 className="text-[22px] font-black mb-2">일정을 완료했나요?</h3>
              <p className="text-[15px] text-[#8E8E93] font-medium leading-relaxed mb-10">{schedule.title}</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleUpdateStatus('missed')} className="h-14 rounded-[20px] font-bold bg-red-50 text-red-500">미완료</button>
                <button onClick={() => handleUpdateStatus('completed')} className="h-14 rounded-[20px] font-bold bg-emerald-500 text-white shadow-xl shadow-emerald-100">완료 확인</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
