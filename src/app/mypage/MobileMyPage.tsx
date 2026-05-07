'use client';

import React from 'react';
import Link from 'next/link';
import { GleaumAppIcon } from '@/components/ui/GleaumLogo';
import type { NotificationSettings } from '@/types';

// ── 아이콘 헬퍼 ──
const Icon = ({ d, stroke, size = 18 }: { d: string; stroke?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={stroke ?? 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ── 설정 행 컴포넌트 ──
interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  isToggle?: boolean;
  toggled?: boolean;
  onToggle?: () => void;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
}

function SettingRow({ icon, label, value, isToggle, toggled, onToggle, danger, href, onClick }: SettingRowProps) {
  const content = (
    <div
      className="flex items-center gap-4 px-5 py-4 active:bg-[rgba(0,132,204,0.03)] transition-colors cursor-pointer"
      onClick={isToggle ? onToggle : onClick}
    >
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(0,132,204,0.08)' }}
      >
        {icon}
      </div>
      <span
        className="flex-1 text-[16px] font-bold"
        style={{ color: danger ? '#EF4444' : '#1A1B2E' }}
      >
        {label}
      </span>
      {isToggle ? (
        <div
          className="w-12 h-7 rounded-full relative transition-all duration-300"
          style={{ background: toggled ? 'var(--brand-blue)' : '#E5E5EA' }}
        >
          <div
            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300"
            style={{ left: toggled ? '24px' : '4px' }}
          />
        </div>
      ) : value ? (
        <span className="text-[14px] font-bold text-[#8E8E93]">
          {value}
        </span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="px-5 pt-6 pb-2 text-[12px] font-black tracking-widest uppercase text-[#8E8E93]">
      {title}
    </p>
  );
}

interface MobileMyPageProps {
  user: any;
  insights: any;
  notifSettings: NotificationSettings;
  handleToggle: (key: keyof NotificationSettings) => void;
  signOut: () => void;
  setShowEditModal: (v: boolean) => void;
  setShowPasswordModal: (v: boolean) => void;
  setShowDeleteModal: (v: boolean) => void;
}

export function MobileMyPage({
  user,
  insights,
  notifSettings,
  handleToggle,
  signOut,
  setShowEditModal,
  setShowPasswordModal,
  setShowDeleteModal
}: MobileMyPageProps) {
  return (
    <div className="min-h-dvh pb-32">
      {/* ── [HERO] 프리미엄 대시보드 ── */}
      <div className="mb-8">
        <div
          className="relative overflow-hidden text-white shadow-2xl animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
            borderRadius: '0 0 48px 48px',
            paddingTop: 'calc(env(safe-area-inset-top) + 48px)',
            paddingBottom: '32px', paddingLeft: '32px', paddingRight: '32px',
          }}
        >
          {/* Glow blobs */}
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-brand-blue/20 blur-[80px] rounded-full" />
          <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-brand-teal/10 blur-[60px] rounded-full" />

          <div className="relative z-10">
            <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '20px' }}>
              마이페이지
            </p>
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-[32px] bg-white/10 backdrop-blur-md flex items-center justify-center text-[40px] border border-white/20 shadow-inner">
                {user?.avatar ?? '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[26px] font-black truncate">{user?.name ?? '사용자'}</h2>
                  <button onClick={() => setShowEditModal(true)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={14} />
                  </button>
                </div>
                <p className="text-[14px] text-white/50 font-bold truncate mt-1">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-[28px] text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">공간 멤버</p>
                <p className="text-[18px] font-black">{insights?.memberCount ?? 0}<span className="text-[12px] font-bold opacity-60 ml-0.5">명</span></p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-[28px] text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">이번달 지출</p>
                <p className="text-[18px] font-black">{(insights?.totalExpense ?? 0).toLocaleString()}<span className="text-[12px] font-bold opacity-60 ml-0.5">원</span></p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-[28px] text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">예정 일정</p>
                <p className="text-[18px] font-black">{insights?.upcomingCount ?? 0}<span className="text-[12px] font-bold opacity-60 ml-0.5">개</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 지능형 인사이트 카드 ── */}
      <div className="px-6 mb-10 animate-fade-in-up">
        <div className="glass-card p-6 rounded-[32px] border border-white/60 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-2xl flex-shrink-0">💡</div>
          <div>
            <h3 className="text-[15px] font-black text-[#1A1B2E] mb-1">오늘의 한 줄 리포트</h3>
            <p className="text-[13px] text-[#8E8E93] leading-relaxed font-bold">
              {insights && insights.upcomingCount > 0
                ? `이번 주에는 ${insights.upcomingCount}개의 소중한 공간 일정이 기다리고 있어요. 미리 준비해볼까요?`
                : "공간이 한산한 편이네요. 멤버들과 여유로운 시간을 계획해 보는 건 어떨까요?"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 설정 리스트 ── */}
      <div className="px-6 space-y-8 animate-fade-in-up">
        <div className="glass-card rounded-[40px] overflow-hidden divide-y divide-gray-50">
          <SectionHeader title="계정 및 보안" />
          <SettingRow icon={<Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0084CC" />} label="비밀번호 설정" onClick={() => setShowPasswordModal(true)} />
          <SettingRow icon={<Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#0084CC" />} label="공간 관리 및 초대" href="/family" />
        </div>

        <div className="glass-card rounded-[40px] overflow-hidden divide-y divide-gray-50">
          <SectionHeader title="서비스 연동" />
          <SettingRow icon={<Icon d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" stroke="#0CC9B5" />} label="구글 캘린더" value="연동됨" href="/settings/calendar" />
          <SettingRow icon={<Icon d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" stroke="#0CC9B5" />} label="Apple 로그인" isToggle toggled={false} onToggle={() => {}} />
        </div>

        <div className="glass-card rounded-[40px] overflow-hidden divide-y divide-gray-50">
          <SectionHeader title="알림 설정" />
          <SettingRow icon={<Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" stroke="#1A1B2E" />} label="일정 리마인더" isToggle toggled={notifSettings.scheduleReminders} onToggle={() => handleToggle('scheduleReminders')} />
          <SettingRow icon={<Icon d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" stroke="#1A1B2E" />} label="가계부 결제 알림" isToggle toggled={notifSettings.expenseReminders} onToggle={() => handleToggle('expenseReminders')} />
        </div>

        <div className="glass-card rounded-[40px] overflow-hidden">
          <SettingRow icon={<Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" stroke="#EF4444" />} label="로그아웃" danger onClick={signOut} />
        </div>
      </div>

      <div className="text-center py-12 opacity-30 flex flex-col items-center">
        <GleaumAppIcon size={32} />
        <p className="text-[12px] font-black mt-2 uppercase tracking-widest">Premium Dashboard</p>
        <button onClick={() => setShowDeleteModal(true)} className="mt-4 text-[11px] underline font-bold">회원탈퇴</button>
      </div>
    </div>
  );
}
