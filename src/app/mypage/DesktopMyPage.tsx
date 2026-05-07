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

// ── 설정 행 컴포넌트 (Desktop) ──
interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value?: string;
  isToggle?: boolean;
  toggled?: boolean;
  onToggle?: () => void;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
}

function SettingRow({ icon, label, description, value, isToggle, toggled, onToggle, danger, href, onClick }: SettingRowProps) {
  const content = (
    <div
      className="flex items-center gap-6 px-8 py-6 hover:bg-gray-50/50 transition-colors cursor-pointer"
      onClick={isToggle ? onToggle : onClick}
    >
      <div
        className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(0,132,204,0.08)' }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-[17px] font-bold" style={{ color: danger ? '#EF4444' : '#1A1B2E' }}>
          {label}
        </h4>
        {description && <p className="text-[13px] text-[#8E8E93] mt-0.5">{description}</p>}
      </div>
      {isToggle ? (
        <div
          className="w-14 h-8 rounded-full relative transition-all duration-300"
          style={{ background: toggled ? 'var(--brand-blue)' : '#E5E5EA' }}
        >
          <div
            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300"
            style={{ left: toggled ? '24px' : '4px' }}
          />
        </div>
      ) : value ? (
        <span className="text-[15px] font-bold text-[#8E8E93] bg-gray-100 px-4 py-1.5 rounded-full">
          {value}
        </span>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="#C7C7CC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

interface DesktopMyPageProps {
  user: any;
  insights: any;
  notifSettings: NotificationSettings;
  handleToggle: (key: keyof NotificationSettings) => void;
  signOut: () => void;
  setShowEditModal: (v: boolean) => void;
  setShowPasswordModal: (v: boolean) => void;
  setShowDeleteModal: (v: boolean) => void;
}

export function DesktopMyPage({
  user,
  insights,
  notifSettings,
  handleToggle,
  signOut,
  setShowEditModal,
  setShowPasswordModal,
  setShowDeleteModal
}: DesktopMyPageProps) {
  return (
    <div className="max-w-[1440px] mx-auto px-10 pt-12 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-[36px] font-black text-[#1A1B2E] tracking-tight">설정 및 프로필</h1>
        <div className="flex items-center gap-2 opacity-50">
          <GleaumAppIcon size={24} />
          <span className="text-[14px] font-black uppercase tracking-widest text-[#1A1B2E]">Gleaum Premium</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10 items-start">
        {/* ── 좌측 프로필 카드 ── */}
        <div className="col-span-4 space-y-6">
          <div className="rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)' }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-blue/20 blur-[40px] rounded-full" />
            <div className="relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-28 h-28 rounded-[40px] bg-white/10 backdrop-blur-md flex items-center justify-center text-[56px] border border-white/20 shadow-inner">
                    {user?.avatar ?? '👤'}
                  </div>
                  <button onClick={() => setShowEditModal(true)} className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white text-[#1A1B2E] flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={16} />
                  </button>
                </div>
                <h2 className="text-[28px] font-black">{user?.name ?? '사용자'}</h2>
                <p className="text-[15px] text-white/50 font-medium mt-1">{user?.email}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-10">
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-[24px] text-center">
                  <p className="text-[10px] uppercase font-black text-white/40 mb-1">멤버</p>
                  <p className="text-[20px] font-black">{insights?.memberCount ?? 0}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-[24px] text-center">
                  <p className="text-[10px] uppercase font-black text-white/40 mb-1">지출</p>
                  <p className="text-[20px] font-black">{(insights?.totalExpense ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-[24px] text-center">
                  <p className="text-[10px] uppercase font-black text-white/40 mb-1">일정</p>
                  <p className="text-[20px] font-black">{insights?.upcomingCount ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[40px] border-white/60">
            <h3 className="text-[15px] font-black text-[#1A1B2E] mb-4">💡 프리미엄 혜택</h3>
            <p className="text-[14px] text-[#8E8E93] leading-relaxed font-medium">
              글리움 프리미엄을 사용 중입니다. 무제한 공간 생성과 고화질 파일 첨부 기능을 이용할 수 있습니다.
            </p>
          </div>
        </div>

        {/* ── 우측 설정 리스트 ── */}
        <div className="col-span-8 space-y-8">
          <div className="glass-card rounded-[40px] overflow-hidden border-white/60 divide-y divide-gray-50">
            <div className="px-8 py-6 bg-gray-50/30">
              <h3 className="text-[13px] font-black text-[#8E8E93] uppercase tracking-widest">계정 및 보안</h3>
            </div>
            <SettingRow icon={<Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0084CC" />} label="비밀번호 재설정" description="이메일 로그인을 위한 보안 비밀번호를 설정하거나 변경합니다." onClick={() => setShowPasswordModal(true)} />
            <SettingRow icon={<Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#0084CC" />} label="공간(Space) 관리" description="가족, 연인, 친구와의 공간을 관리하고 새로운 멤버를 초대합니다." href="/family" />
          </div>

          <div className="glass-card rounded-[40px] overflow-hidden border-white/60 divide-y divide-gray-50">
            <div className="px-8 py-6 bg-gray-50/30">
              <h3 className="text-[13px] font-black text-[#8E8E93] uppercase tracking-widest">서비스 연동 및 알림</h3>
            </div>
            <SettingRow icon={<Icon d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" stroke="#0CC9B5" />} label="구글 캘린더 동기화" value="동기화 중" href="/settings/calendar" />
            <SettingRow icon={<Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" stroke="#1A1B2E" />} label="푸시 알림 리마인더" description="일정 시작 전 및 결제일 도래 시 알림을 받습니다." isToggle toggled={notifSettings.scheduleReminders} onToggle={() => handleToggle('scheduleReminders')} />
            <SettingRow icon={<Icon d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" stroke="#1A1B2E" />} label="가계부 스마트 리포트" description="매월 말 지출 내역 요약 리포트를 푸시로 전송합니다." isToggle toggled={notifSettings.expenseReminders} onToggle={() => handleToggle('expenseReminders')} />
          </div>

          <div className="flex items-center justify-between px-4">
            <button onClick={() => setShowDeleteModal(true)} className="text-[14px] font-bold text-[#8E8E93] hover:text-red-500 transition-colors">회원탈퇴</button>
            <button onClick={signOut} className="px-8 py-4 rounded-[20px] bg-red-50 text-red-600 text-[15px] font-black hover:bg-red-100 transition-colors">로그아웃</button>
          </div>
        </div>
      </div>
    </div>
  );
}
