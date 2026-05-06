'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';

import { GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { updateMyProfile, updateNotificationSettings, getMyPageInsights } from '@/lib/db';
import { profileToast, toastInfo } from '@/lib/toast';
import type { NotificationSettings } from '@/types';

// ── 기본 알림 설정 ──
const DEFAULT_NOTIF: NotificationSettings = {
  scheduleReminders: true,
  routineReminders: true,
  expenseReminders: true,
  spaceUpdates: true,
};

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

const AVATAR_OPTIONS = ['👤', '😊', '🦁', '🐼', '🐸', '🐯', '🦊', '🐺', '🦄', '🐨', '🐻', '🐶', '🐱', '🐰', '🐹'];

export default function MyPage() {
  const { user, profile, loading, familyGroupId } = useCurrentUser();
  const { signOut, updatePassword } = useAuth();

  const [insights, setInsights] = useState<{ totalExpense: number; upcomingCount: number; memberCount: number; month: number } | null>(null);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIF);
  const [savingNotif, setSavingNotif] = useState(false);

  const [showEditModal, setShowEditModal]   = useState(false);
  const [editName, setEditName]             = useState('');
  const [editAvatar, setEditAvatar]         = useState('👤');
  const [savingProfile, setSavingProfile]   = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    const ns = (profile as any).notification_settings;
    if (ns) setNotifSettings({ ...DEFAULT_NOTIF, ...ns });
    setEditName(user?.name ?? '');
    setEditAvatar(user?.avatar ?? '👤');

    if (familyGroupId) {
      getMyPageInsights(familyGroupId).then(setInsights);
    }
    
    // [강제 조치] 혹시 모를 스크롤 락 및 터치 차단 해제
    document.body.classList.remove('antigravity-scroll-lock');
    document.body.style.overflow = '';
  }, [profile?.id, user?.id, familyGroupId]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    setSavingNotif(true);
    await updateNotificationSettings(updated);
    setSavingNotif(false);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSavingProfile(true);
    try {
      await updateMyProfile({ name: editName.trim(), display_name: editName.trim(), avatar: editAvatar });
      setShowEditModal(false);
      window.location.reload();
    } catch {
      profileToast.error();
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      profileToast.updated();
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('비밀번호 설정에 실패했습니다.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-brand-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-32 lg:max-w-[1440px] lg:mx-auto">
      <AppHeader title="마이페이지" showLogo={false} showNotification={false} />

      {/* ── [HERO] 프리미엄 대시보드 ── */}
      <div className="px-6 mt-6 mb-8">
        <div className="relative p-8 rounded-[48px] overflow-hidden text-white shadow-2xl animate-fade-in" style={{ background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)' }}>
          {/* 장식용 메쉬 */}
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-brand-blue/20 blur-[80px] rounded-full" />
          <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-brand-teal/10 blur-[60px] rounded-full" />

          <div className="relative z-10">
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

            {/* 3열 요약 위젯 */}
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
      <div className="px-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
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

      {/* ── 섹션 1: 계정 보안 ── */}
      <div className="px-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="glass-card rounded-[40px] overflow-hidden shadow-sm border border-white/60 divide-y divide-gray-50">
          <SectionHeader title="계정 및 보안" />
          <SettingRow 
            icon={<Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0084CC" />} 
            label="비밀번호 설정" 
            value="이메일 로그인 전용"
            onClick={() => setShowPasswordModal(true)} 
          />
          <SettingRow 
            icon={<Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#0084CC" />} 
            label="공간 관리 및 초대" 
            href="/family" 
          />

        </div>
      </div>

      {/* ── 섹션 2: 서비스 연동 ── */}
      <div className="px-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="glass-card rounded-[40px] overflow-hidden shadow-sm border border-white/60 divide-y divide-gray-50">
          <SectionHeader title="서비스 연동" />
          <SettingRow 
            icon={<Icon d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" stroke="#0CC9B5" />} 
            label="구글 캘린더" 
            value="연동됨" 
            href="/settings/calendar" 
          />
          <SettingRow 
            icon={<Icon d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" stroke="#0CC9B5" />} 
            label="Apple 로그인 연동" 
            isToggle 
            toggled={false} 
            onToggle={() => toastInfo('Apple 연동 기능은 준비 중입니다.')} 
          />
          <SettingRow 
            icon={<Icon d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" stroke="#0CC9B5" />} 
            label="Naver 로그인 연동" 
            isToggle 
            toggled={false} 
            onToggle={() => toastInfo('Naver 연동 기능은 준비 중입니다.')} 
          />
        </div>
      </div>

      {/* ── 섹션 3: 알림 설정 ── */}
      <div className="px-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="glass-card rounded-[40px] overflow-hidden shadow-sm border border-white/60 divide-y divide-gray-50">
          <SectionHeader title="알림 설정" />
          <SettingRow icon={<Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" stroke="#1A1B2E" />} label="일정 리마인더" isToggle toggled={notifSettings.scheduleReminders} onToggle={() => handleToggle('scheduleReminders')} />
          <SettingRow icon={<Icon d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" stroke="#1A1B2E" />} label="가계부 결제 알림" isToggle toggled={notifSettings.expenseReminders} onToggle={() => handleToggle('expenseReminders')} />
        </div>
      </div>

      {/* ── 섹션 4: 계정 ── */}
      <div className="px-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <div className="glass-card rounded-[40px] overflow-hidden shadow-sm border border-white/60">
          <SettingRow 
            icon={<Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" stroke="#EF4444" />} 
            label="로그아웃" 
            danger 
            onClick={signOut} 
          />
        </div>
      </div>

      <div className="text-center pb-10 flex flex-col items-center opacity-30">
        <GleaumAppIcon size={32} />
        <p className="text-[12px] font-black mt-2 uppercase tracking-[0.2em]">Premium Dashboard</p>
        <button onClick={() => setShowDeleteModal(true)} className="mt-4 text-[11px] underline font-bold text-[#8E8E93]">회원탈퇴</button>
      </div>

      {/* ── 프로필 수정 모달 ── */}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center lg:items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-[430px] glass-card rounded-[40px] p-8 animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[24px] font-black mb-6 text-[#1A1B2E]">프로필 수정</p>
            <div className="flex flex-wrap gap-3 mb-8">
              {AVATAR_OPTIONS.map((av) => (
                <button key={av} onClick={() => setEditAvatar(av)} className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px] transition-all active:scale-90"
                  style={{ background: editAvatar === av ? 'rgba(0,132,204,0.12)' : '#F5F5F7', border: editAvatar === av ? '2.5px solid var(--brand-blue)' : '2.5px solid transparent' }}>{av}</button>
              ))}
            </div>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="이름을 입력하세요" className="w-full h-14 px-6 rounded-[24px] text-[16px] font-bold bg-[#F5F5F7] border-2 outline-none transition-all mb-8"
              style={{ borderColor: editName ? 'var(--brand-blue)' : 'transparent' }} />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowEditModal(false)} className="h-14 rounded-[24px] text-[15px] font-black text-[#8E8E93] bg-gray-50">취소</button>
              <button onClick={handleSaveProfile} disabled={savingProfile || !editName.trim()} className="h-14 rounded-[24px] text-[15px] font-black text-white bg-brand-gradient active:scale-95 transition-all">{savingProfile ? '저장 중...' : '저장 완료'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 비밀번호 설정 모달 ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center lg:items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowPasswordModal(false)}>
          <div className="w-full max-w-[430px] glass-card rounded-[40px] p-8 animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[24px] font-black mb-2 text-[#1A1B2E]">비밀번호 설정</p>
            <p className="text-[13px] text-[#8E8E93] mb-8 font-bold">이제 이메일과 비밀번호로도 로그인할 수 있습니다.</p>
            <div className="space-y-4 mb-8">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="새 비밀번호 (6자 이상)" className="w-full h-14 px-6 rounded-[24px] text-[16px] font-bold bg-[#F5F5F7] border-2 outline-none transition-all" style={{ borderColor: newPassword ? 'var(--brand-blue)' : 'transparent' }} />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="비밀번호 확인" className="w-full h-14 px-6 rounded-[24px] text-[16px] font-bold bg-[#F5F5F7] border-2 outline-none transition-all" style={{ borderColor: confirmPassword === newPassword && confirmPassword ? 'var(--brand-blue)' : 'transparent' }} />
            </div>
            {passwordError && <p className="text-[13px] text-red-500 font-bold mb-6">{passwordError}</p>}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowPasswordModal(false)} className="h-14 rounded-[24px] text-[15px] font-black text-[#8E8E93] bg-gray-50">취소</button>
              <button onClick={handleSavePassword} disabled={savingPassword || !newPassword || !confirmPassword} className="h-14 rounded-[24px] text-[15px] font-black text-white bg-brand-gradient active:scale-95 transition-all">{savingPassword ? '설정 중...' : '설정 완료'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 회원탈퇴 확인 모달 ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center lg:items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-[430px] glass-card rounded-[40px] p-8 animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[24px] font-black text-center mb-2 text-[#1A1B2E]">정말 탈퇴하시겠어요?</p>
            <p className="text-[14px] text-center mb-8 font-bold text-[#8E8E93] leading-relaxed">모든 데이터와 일정이 삭제되며<br/>복구할 수 없습니다.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="h-14 rounded-[24px] text-[15px] font-black text-[#8E8E93] bg-gray-50">취소</button>
              <button className="h-14 rounded-[24px] text-[15px] font-black text-white bg-[#EF4444] shadow-lg shadow-red-200">탈퇴하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
