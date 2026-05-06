'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { updateMyProfile, updateNotificationSettings } from '@/lib/db';
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
const Icon = ({ d, stroke }: { d: string; stroke?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke={stroke ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      className="flex items-center gap-3 px-4 py-3.5 active:bg-[rgba(0,132,204,0.03)] transition-colors cursor-pointer"
      onClick={isToggle ? onToggle : onClick}
    >
      <div
        className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
        style={{ background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(0,132,204,0.08)' }}
      >
        {icon}
      </div>
      <span
        className="flex-1 text-[15px] font-medium"
        style={{ color: danger ? '#EF4444' : 'var(--color-ink)' }}
      >
        {label}
      </span>
      {isToggle ? (
        <div
          className="w-11 h-6 rounded-full relative transition-all duration-200"
          style={{ background: toggled ? 'var(--brand-blue)' : '#E5E5EA' }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
            style={{ left: toggled ? '22px' : '2px' }}
          />
        </div>
      ) : value ? (
        <span className="text-[13px] font-medium" style={{ color: 'var(--color-ink-muted-80)' }}>
          {value}
        </span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="px-4 pt-5 pb-2 text-[11px] font-bold tracking-widest uppercase"
      style={{ color: 'var(--color-ink-muted-80)' }}>
      {title}
    </p>
  );
}

// ── AVATAR 선택 옵션 ──
const AVATAR_OPTIONS = ['👤', '😊', '🦁', '🐼', '🐸', '🐯', '🦊', '🐺', '🦄', '🐨', '🐻', '🐶', '🐱', '🐰', '🐹'];

export default function MyPage() {
  const { user, profile, loading } = useCurrentUser();
  const { signOut } = useAuth();

  // 알림 설정 상태
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIF);
  const [savingNotif, setSavingNotif] = useState(false);

  // 프로필 수정 모달
  const [showEditModal, setShowEditModal]   = useState(false);
  const [editName, setEditName]             = useState('');
  const [editAvatar, setEditAvatar]         = useState('👤');
  const [savingProfile, setSavingProfile]   = useState(false);

  // 회원탈퇴 확인 모달
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 비밀번호 설정 모달
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const { updatePassword, linkProvider } = useAuth();


  // profile 로드 후 알림 설정 + 프로필 편집 기본값 세팅
  useEffect(() => {
    if (!profile) return;
    const ns = (profile as { notification_settings?: Partial<NotificationSettings> }).notification_settings;
    if (ns) setNotifSettings({ ...DEFAULT_NOTIF, ...ns });
    setEditName(user?.displayName ?? user?.name ?? '');
    setEditAvatar(user?.avatar ?? '👤');
  }, [profile, user]);

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
      // 페이지 새로고침으로 반영
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
    setPasswordError('');
    try {
      await updatePassword(newPassword);
      profileToast.updated();
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {

      setPasswordError('비밀번호 설정에 실패했습니다.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLinkProvider = async (provider: 'apple' | 'naver') => {
    toastInfo(`${provider === 'apple' ? 'Apple' : 'Naver'} 연동 기능은 준비 중입니다.`);
    // 추후 활성화: await linkProvider(provider);
  };


  const handleDeleteAccount = async () => {

    await signOut();
    // 실제 탈퇴 처리는 서버 액션 필요 (현재는 로그아웃 처리)
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(0,132,204,0.2)', borderTopColor: 'var(--brand-blue)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-28">
      <AppHeader title="마이페이지" showLogo={false} showNotification={false} />

      {/* 프로필 히어로 카드 */}
      <div
        className="mx-4 mt-4 mb-4 rounded-[28px] p-6 relative overflow-hidden"
        style={{
          background: 'var(--brand-gradient)',
          boxShadow: '0 12px 40px rgba(0,132,204,0.30)',
        }}
      >
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30px', left: '60px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />

        <div className="flex items-center gap-4 relative z-10">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[36px] flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.20)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            {user?.avatar ?? '👤'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-bold text-white truncate">{user?.name ?? '사용자'}</p>
            <p className="text-[13px] text-white/70 truncate mt-0.5">{user?.email ?? ''}</p>
            <span
              className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold"
              style={{ background: 'rgba(255,255,255,0.20)', color: 'white' }}
            >
              {user?.role === 'parent' ? '부모' : '자녀'}
            </span>
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold active:scale-95 transition-transform"
            style={{ background: 'rgba(255,255,255,0.20)', color: 'white' }}
          >
            수정
          </button>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="glass-card mx-4 mt-3 rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]">
        <SectionHeader title={`알림 설정${savingNotif ? ' (저장 중...)' : ''}`} />
        <SettingRow
          icon={<Icon d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" />}
          label="일정 리마인더"
          isToggle toggled={notifSettings.scheduleReminders}
          onToggle={() => handleToggle('scheduleReminders')}
        />
        <SettingRow
          icon={<Icon d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M12 14c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" />}
          label="루틴 알림"
          isToggle toggled={notifSettings.routineReminders}
          onToggle={() => handleToggle('routineReminders')}
        />
        <SettingRow
          icon={<Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" />}
          label="미완료 재알림"
          isToggle toggled={notifSettings.spaceUpdates}
          onToggle={() => handleToggle('spaceUpdates')}
        />
        <SettingRow
          icon={<Icon d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M1 10h22" />}
          label="정기지출 결제 알림"
          isToggle toggled={notifSettings.expenseReminders}
          onToggle={() => handleToggle('expenseReminders')}
        />
      </div>

      {/* 계정 보안 */}
      <div className="glass-card mx-4 mt-3 rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]">
        <SectionHeader title="계정 보안" />
        <SettingRow 
          icon={<Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />} 
          label="비밀번호 설정" 
          value="이메일 로그인용"
          onClick={() => setShowPasswordModal(true)} 
        />
      </div>

      {/* 연동 서비스 */}
      <div className="glass-card mx-4 mt-3 rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]">
        <SectionHeader title="소셜 계정 연동" />
        <SettingRow 
          icon={<Icon d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />} 
          label="Apple로 로그인" 
          isToggle 
          toggled={false} 
          onToggle={() => handleLinkProvider('apple')} 
        />
        <SettingRow 
          icon={<Icon d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />} 
          label="Naver로 로그인" 
          isToggle 
          toggled={false} 
          onToggle={() => handleLinkProvider('naver')} 
        />
      </div>

      {/* 외부 연동 */}
      <div className="glass-card mx-4 mt-3 rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]">
        <SectionHeader title="외부 캘린더 연동" />
        <SettingRow icon={<Icon d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" />} label="구글 캘린더" value="연동됨" href="/settings/calendar" />
      </div>


      {/* 앱 정보 */}
      <div className="glass-card mx-4 mt-3 rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]">
        <SectionHeader title="앱 정보" />
        <SettingRow icon={<Icon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />} label="개인정보 처리방침" />
        <SettingRow icon={<Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />} label="이용약관" />
        <SettingRow icon={<Icon d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z M12 16v-4 M12 8h.01" />} label="버전 정보" value="v1.0.0" />
      </div>

      {/* 계정 */}
      <div className="glass-card mx-4 mt-3 rounded-[20px] overflow-hidden divide-y divide-[rgba(239,68,68,0.06)]">
        <SectionHeader title="계정" />
        <SettingRow
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
          label="로그아웃"
          danger
          onClick={signOut}
        />
      </div>

      <button
        onClick={() => setShowDeleteModal(true)}
        className="block mx-auto mt-4 mb-2 text-[12px] underline transition-colors active:opacity-70"
        style={{ color: '#C7C7CC' }}
      >
        회원탈퇴
      </button>

      <div className="flex justify-center py-4 opacity-20">
        <GleaumAppIcon size={28} />
      </div>

      <BottomNav />

      {/* ── 프로필 수정 바텀시트 ── */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#E5E5EA] rounded-full mx-auto mb-6" />
            <p className="text-[20px] font-bold mb-5" style={{ color: '#1A1B2E' }}>프로필 수정</p>

            {/* 아바타 선택 */}
            <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: '#8E8E93' }}>아바타</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  onClick={() => setEditAvatar(av)}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[22px] transition-all active:scale-90"
                  style={{
                    background: editAvatar === av ? 'rgba(0,132,204,0.12)' : '#F5F5F7',
                    border: editAvatar === av ? '2px solid #0084CC' : '2px solid transparent',
                  }}
                >
                  {av}
                </button>
              ))}
            </div>

            {/* 이름 입력 */}
            <p className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: '#8E8E93' }}>표시 이름</p>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3.5 rounded-[16px] text-[15px] bg-[#F5F5F7] border-2 outline-none transition-all mb-5"
              style={{ borderColor: editName ? '#0084CC' : 'transparent' }}
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="h-[52px] rounded-[16px] text-[15px] font-bold"
                style={{ border: '2px solid rgba(0,132,204,0.15)', color: '#8E8E93' }}
              >
                취소
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || !editName.trim()}
                className="h-[52px] rounded-[16px] text-[15px] font-bold text-white disabled:opacity-60 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)' }}
              >
                {savingProfile ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 비밀번호 설정 모달 ── */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-12 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#E5E5EA] rounded-full mx-auto mb-6" />
            <p className="text-[20px] font-bold mb-1" style={{ color: '#1A1B2E' }}>비밀번호 설정</p>
            <p className="text-[13px] text-[#8E8E93] mb-6">이제 이메일과 비밀번호로도 로그인할 수 있습니다.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[11px] font-bold tracking-widest uppercase mb-2 block" style={{ color: '#8E8E93' }}>새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6자 이상 입력"
                  className="w-full px-4 py-3.5 rounded-[16px] text-[15px] bg-[#F5F5F7] border-2 outline-none transition-all"
                  style={{ borderColor: newPassword ? 'var(--brand-blue)' : 'transparent' }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-widest uppercase mb-2 block" style={{ color: '#8E8E93' }}>비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="다시 한번 입력"
                  className="w-full px-4 py-3.5 rounded-[16px] text-[15px] bg-[#F5F5F7] border-2 outline-none transition-all"
                  style={{ borderColor: confirmPassword === newPassword && confirmPassword ? 'var(--brand-blue)' : 'transparent' }}
                />
              </div>
            </div>

            {passwordError && <p className="text-[13px] text-red-500 font-bold mb-4 ml-1">{passwordError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="h-[52px] rounded-[16px] text-[15px] font-bold"
                style={{ border: '2px solid rgba(0,132,204,0.15)', color: '#8E8E93' }}
              >
                취소
              </button>
              <button
                onClick={handleSavePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="h-[52px] rounded-[16px] text-[15px] font-bold text-white disabled:opacity-60 active:scale-95 transition-all"
                style={{ background: 'var(--brand-gradient)' }}
              >
                {savingPassword ? '설정 중...' : '설정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 회원탈퇴 확인 모달 ── */}
      {showDeleteModal && (

        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#E5E5EA] rounded-full mx-auto mb-6" />
            <p className="text-[20px] font-bold text-center mb-2" style={{ color: '#1A1B2E' }}>
              정말 탈퇴하시겠어요?
            </p>
            <p className="text-[14px] text-center mb-6 leading-relaxed" style={{ color: '#8E8E93' }}>
              모든 데이터와 일정이 삭제되며<br/>복구할 수 없습니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="h-[52px] rounded-[16px] text-[15px] font-semibold"
                style={{ background: '#F5F5F7', color: '#8E8E93' }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                className="h-[52px] rounded-[16px] text-[15px] font-bold text-white active:scale-95 transition-all"
                style={{ background: '#EF4444', boxShadow: '0 4px 16px rgba(239,68,68,0.30)' }}
              >
                탈퇴
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
