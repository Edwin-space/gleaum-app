'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { updateMyProfile, updateNotificationSettings, getMyPageInsights } from '@/lib/db';
import { profileToast } from '@/lib/toast';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

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

  // ── 탈퇴 관련 state ────────────────────────────────────────
  const [withdrawStep, setWithdrawStep]   = useState<'confirm' | 'reason'>('confirm');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing]     = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState<{
    withdrawalPending: boolean;
    daysLeft?: number;
    deleteScheduledAt?: string;
  } | null>(null);

  // 탈퇴 상태 조회
  const fetchWithdrawalStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/account/status');
      if (res.ok) setWithdrawalStatus(await res.json());
    } catch { /* 무시 */ }
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    const ns = (profile as any).notification_settings;
    if (ns) setNotifSettings({ ...DEFAULT_NOTIF, ...ns });
    setEditName(user?.name ?? '');
    setEditAvatar(user?.avatar ?? '👤');
    fetchWithdrawalStatus();

    if (familyGroupId) {
      getMyPageInsights(familyGroupId).then(setInsights);
    }
  }, [profile?.id, user?.id, familyGroupId, fetchWithdrawalStatus]);

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

  // ── 탈퇴 신청 ──────────────────────────────────────────────
  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const res = await fetch('/api/account/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: withdrawReason || undefined }),
      });
      if (res.ok) {
        setShowDeleteModal(false);
        router.replace('/login?message=withdrawn');
      } else {
        const data = await res.json();
        alert(data.error ?? '탈퇴 처리 중 오류가 발생했습니다.');
      }
    } catch {
      alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setWithdrawing(false);
    }
  };

  // ── 탈퇴 취소(복구) ────────────────────────────────────────
  const handleRestore = async () => {
    try {
      const res = await fetch('/api/account/restore', { method: 'POST' });
      if (res.ok) {
        await fetchWithdrawalStatus();
        alert('탈퇴 신청이 취소되었습니다. 서비스를 계속 이용하실 수 있습니다.');
      } else {
        const data = await res.json();
        alert(data.error ?? '복구 처리 중 오류가 발생했습니다.');
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.');
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

      {/* ── 탈퇴 신청 중 배너 ── */}
      {withdrawalStatus?.withdrawalPending && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, width: 'calc(100% - 32px)', maxWidth: 480,
          background: '#FFF3CD', border: '1.5px solid #F59E0B',
          borderRadius: 20, padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#92400E', margin: 0 }}>
              탈퇴 신청 중 — {withdrawalStatus.daysLeft}일 후 계정이 삭제됩니다
            </p>
            <p style={{ fontSize: 11, color: '#B45309', margin: '2px 0 0', fontWeight: 600 }}>
              {withdrawalStatus.daysLeft}일 이내에 복구하실 수 있습니다
            </p>
          </div>
          <button
            onClick={handleRestore}
            style={{
              padding: '8px 14px', borderRadius: 12, border: 'none',
              background: '#F59E0B', color: 'white', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            탈퇴 취소
          </button>
        </div>
      )}

      {/* ── 공통 모달: 회원탈퇴 ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={() => { setShowDeleteModal(false); setWithdrawStep('confirm'); setWithdrawReason(''); }}
        >
          <div className="w-full max-w-[420px] glass-card rounded-[40px] p-8 animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>

            {/* Step 1: 안내 + 확인 */}
            {withdrawStep === 'confirm' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <span style={{ fontSize: 48 }}>😢</span>
                </div>
                <p className="text-[22px] font-black text-center mb-3 text-[#1A1B2E]">
                  탈퇴 전에 확인해 주세요
                </p>
                <div style={{
                  background: '#FFF8F8', border: '1.5px solid rgba(239,68,68,0.2)',
                  borderRadius: 20, padding: '16px 20px', marginBottom: 20,
                }}>
                  {[
                    '탈퇴 신청 후 30일간 복구가 가능합니다',
                    '30일 경과 시 모든 개인정보가 완전히 삭제됩니다',
                    '일정, 가계부, 공간 데이터가 삭제됩니다',
                    '공간 관리자인 경우 공간은 유지됩니다',
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 3 ? 8 : 0 }}>
                      <span style={{ color: '#EF4444', fontSize: 13, flexShrink: 0 }}>•</span>
                      <p style={{ fontSize: 13, color: '#666', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>{text}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setWithdrawStep('confirm'); }}
                    className="h-14 rounded-[24px] text-[15px] font-black text-[#8E8E93] bg-gray-50"
                  >
                    계속 이용하기
                  </button>
                  <button
                    onClick={() => setWithdrawStep('reason')}
                    className="h-14 rounded-[24px] text-[15px] font-black text-white"
                    style={{ background: '#EF4444' }}
                  >
                    탈퇴 진행
                  </button>
                </div>
              </>
            )}

            {/* Step 2: 탈퇴 사유 + 최종 확인 */}
            {withdrawStep === 'reason' && (
              <>
                <p className="text-[22px] font-black text-center mb-2 text-[#1A1B2E]">
                  탈퇴 사유를 알려주세요
                </p>
                <p style={{ fontSize: 12, color: '#AEAEB2', textAlign: 'center', marginBottom: 20, fontWeight: 600 }}>
                  선택 사항이며, 서비스 개선에 활용됩니다
                </p>
                <textarea
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="탈퇴 사유를 입력해주세요 (선택)"
                  maxLength={200}
                  style={{
                    width: '100%', minHeight: 100, padding: '14px 16px',
                    borderRadius: 20, border: '1.5px solid #E5E5EA',
                    fontSize: 14, fontWeight: 600, color: '#1A1B2E',
                    background: '#F7F7FA', resize: 'none', outline: 'none',
                    boxSizing: 'border-box', marginBottom: 6,
                  }}
                />
                <p style={{ fontSize: 11, color: '#AEAEB2', textAlign: 'right', marginBottom: 20 }}>
                  {withdrawReason.length}/200
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setWithdrawStep('confirm')}
                    className="h-14 rounded-[24px] text-[15px] font-black text-[#8E8E93] bg-gray-50"
                    disabled={withdrawing}
                  >
                    이전
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="h-14 rounded-[24px] text-[15px] font-black text-white"
                    style={{ background: withdrawing ? 'rgba(239,68,68,0.5)' : '#EF4444' }}
                  >
                    {withdrawing ? '처리 중...' : '탈퇴 신청'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
