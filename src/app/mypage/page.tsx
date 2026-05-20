'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { updateMyProfile, updateNotificationSettings, getMyPageInsights } from '@/lib/db';
import { profileToast } from '@/lib/toast';
import type { NotificationSettings } from '@/types';

import { MobileMyPage } from './MobileMyPage';
import { DesktopMyPage } from './DesktopMyPage';
import { ProfileAvatarEditor } from '@/components/ui/ProfileAvatarEditor';

// ── 기본 알림 설정 ──
const DEFAULT_NOTIF: NotificationSettings = {
  scheduleReminders: true,
  routineReminders: true,
  expenseReminders: true,
  spaceUpdates: true,
};

export default function MyPage() {
  const isDesktop = useIsDesktop();
  const { user, profile, loading, familyGroupId } = useCurrentUser();
  const { signOut, updatePassword } = useAuth();

  const [insights, setInsights] = useState<{ totalExpense: number; upcomingCount: number; memberCount: number; month: number } | null>(null);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIF);
  const [savingNotif, setSavingNotif] = useState(false);

  const [showEditModal, setShowEditModal]   = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
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

  const commonProps = {
    user,
    insights,
    notifSettings,
    handleToggle,
    signOut,
    setShowEditModal,
    setShowAvatarEditor,
    setShowPasswordModal,
    setShowDeleteModal,
  };

  return (
    <>
      {isDesktop ? <DesktopMyPage {...commonProps} /> : <MobileMyPage {...commonProps} />}

      {/* ── 공통 모달: 프로필 수정 ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-[480px] glass-card rounded-[40px] p-8 animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[24px] font-black mb-6 text-[#1A1B2E]">프로필 수정</p>

            {/* 아바타 변경 버튼 */}
            <div className="flex flex-col items-center mb-6">
              <div
                onClick={() => { setShowEditModal(false); setShowAvatarEditor(true); }}
                style={{
                  width: '80px', height: '80px', borderRadius: '28px', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', border: '2.5px solid rgba(0,132,204,0.25)',
                  overflow: 'hidden',
                }}
              >
                {editAvatar.startsWith('http') || editAvatar.startsWith('data:') ? (
                  <img src={editAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '38px' }}>{editAvatar}</span>
                )}
                {/* Edit overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '26px',
                }}>
                  <span style={{ fontSize: '20px' }}>✏️</span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600, marginTop: '6px' }}>
                사진 또는 이모지 변경
              </p>
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

      {/* ── 아바타 에디터 (사진 업로드 + 이모지) ── */}
      {showAvatarEditor && (
        <ProfileAvatarEditor
          currentAvatar={editAvatar}
          onClose={() => setShowAvatarEditor(false)}
          onSaved={(newAvatar) => {
            setEditAvatar(newAvatar);
            // If it's an emoji (not a URL), save immediately without the name modal
            const isUrl = newAvatar.startsWith('http') || newAvatar.startsWith('blob') || newAvatar.startsWith('data:');
            if (!isUrl) {
              // Emoji was already saved inside ProfileAvatarEditor — just refresh
              window.location.reload();
            } else {
              // Photo URL was saved — also refresh
              window.location.reload();
            }
          }}
        />
      )}

      {/* ── 공통 모달: 비밀번호 설정 ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowPasswordModal(false)}>
          <div className="w-full max-w-[480px] glass-card rounded-[40px] p-8 animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
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

      {/* ── 공통 모달: 회원탈퇴 확인 ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-[400px] glass-card rounded-[40px] p-8 animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[24px] font-black text-center mb-2 text-[#1A1B2E]">정말 탈퇴하시겠어요?</p>
            <p className="text-[14px] text-center mb-8 font-bold text-[#8E8E93] leading-relaxed">모든 데이터와 일정이 삭제되며<br/>복구할 수 없습니다.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="h-14 rounded-[24px] text-[15px] font-black text-[#8E8E93] bg-gray-50">취소</button>
              <button className="h-14 rounded-[24px] text-[15px] font-black text-white bg-[#EF4444] shadow-lg shadow-red-200">탈퇴하기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
