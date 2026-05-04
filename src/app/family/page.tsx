'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFamily } from '@/hooks/useFamily';
import { joinFamilyByCode } from '@/lib/db';

export default function FamilyPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const { familyGroupId, refresh: refreshUser } = useCurrentUser();
  const { group, members, loading, refresh } = useFamily(familyGroupId);

  const inviteLink = group?.inviteCode
    ? `https://gleaum-app.vercel.app/invite/${group.inviteCode}`
    : '';

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    const result = await joinFamilyByCode(joinCode.trim().toUpperCase());
    setJoining(false);
    if (result.success) {
      await refreshUser();
      await refresh();
      setShowJoinModal(false);
      setJoinCode('');
    } else {
      setJoinError('초대 코드를 찾을 수 없습니다. 다시 확인해주세요.');
    }
  };

  return (
    <div className="min-h-dvh pb-28 lg:max-w-[1440px] lg:mx-auto lg:px-8 lg:pt-10">
      <div className="lg:hidden">
        <AppHeader title="나의 그룹" showLogo={false} showBack />
      </div>

      {/* PC 전용 타이틀 */}
      <div className="hidden lg:flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#1A1B2E]">나의 그룹</h1>
          <p className="text-[15px] text-[#8E8E93] mt-1">가족 구성원을 관리하고 새로운 멤버를 초대하세요</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-6 py-3.5 rounded-[20px] text-[15px] font-bold text-white transition-all active:scale-95 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', boxShadow: '0 8px 24px rgba(0,132,204,0.3)' }}
        >
          <span>➕</span>
          가족 초대하기
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--brand-teal)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <>
          {/* 그룹 히어로 카드 */}
          <div
            className="mx-4 mt-4 lg:mx-0 p-6 lg:p-8 rounded-[28px] lg:rounded-[40px] relative overflow-hidden mb-10"
            style={{
              background: 'var(--brand-gradient)',
              boxShadow: '0 12px 40px rgba(0,132,204,0.30)',
            }}
          >
            <div style={{
              position: 'absolute', top: '-30px', right: '-30px',
              width: '140px', height: '140px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: '-20px', left: '40%',
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
            }} />

            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-14 h-14 rounded-[18px] flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.20)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <p className="text-[20px] font-bold text-white">{group?.name ?? '나의 그룹'}</p>
                <p className="text-[13px] text-white/70">멤버 {members.length}명</p>
              </div>
            </div>

            {group?.inviteCode && (
              <div className="flex items-center justify-between px-4 py-3 rounded-[14px] relative z-10"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
                <div>
                  <p className="text-[10px] text-white/60 mb-0.5">초대 코드</p>
                  <span className="text-[14px] font-mono font-bold text-white">{group.inviteCode}</span>
                </div>
                <button
                  onClick={copyInviteLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95"
                  style={{
                    background: copied ? 'rgba(16,185,129,0.8)' : 'rgba(255,255,255,0.25)',
                    color: 'white',
                  }}
                >
                  {copied ? '✓ 복사됨' : '🔗 복사'}
                </button>
              </div>
            )}
          </div>

          {/* 멤버 목록 */}
          <div className="mx-4 lg:mx-0 mt-4">
            <p className="text-[11px] font-bold tracking-widest uppercase mb-4"
              style={{ color: 'var(--color-ink-muted-80)' }}>
              구성원
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="glass-card flex items-center gap-4 p-5 rounded-[24px] hover:translate-y-[-4px] transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: 'rgba(0,132,204,0.08)' }}>
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-bold" style={{ color: 'var(--color-ink)' }}>
                      {member.name}
                    </p>
                    {member.email && (
                      <p className="text-[12px] truncate max-w-[150px]" style={{ color: 'var(--color-ink-muted-80)' }}>
                        {member.email}
                      </p>
                    )}
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-[11px] font-bold"
                    style={{
                      background: member.role === 'parent' ? 'rgba(0,132,204,0.10)' : 'rgba(16,185,129,0.10)',
                      color:      member.role === 'parent' ? 'var(--brand-blue)' : '#059669',
                    }}
                  >
                    {member.role === 'parent' ? '부모' : '자녀'}
                  </span>
                </div>
              ))}

              {/* 그룹 합류 카드 (PC 그리드에 맞춤) */}
              <button
                onClick={() => setShowJoinModal(true)}
                className="glass-card flex flex-col items-center justify-center p-5 rounded-[24px] min-h-[100px] transition-all active:scale-[0.98]"
                style={{
                  border: '2px dashed rgba(0,132,204,0.20)',
                  color: 'var(--brand-blue)',
                }}
              >
                <span className="text-xl mb-1">🚪</span>
                <span className="text-[14px] font-bold">다른 그룹 합류</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── 초대 모달 ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center lg:items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-[430px] lg:max-w-[500px] glass-card rounded-t-[32px] lg:rounded-[32px] p-6 lg:p-8 pb-10 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#E5E5EA] rounded-full mx-auto mb-6 lg:hidden" />
            <p className="text-[20px] font-bold mb-1" style={{ color: 'var(--color-ink)' }}>초대하기</p>
            <p className="text-[13px] mb-6" style={{ color: 'var(--color-ink-muted-80)' }}>아래 방법으로 초대하세요</p>

            <button
              onClick={copyInviteLink}
              className="w-full flex items-center gap-4 p-4 rounded-[20px] mb-3 transition-all active:scale-[0.98]"
              style={{
                background: copied ? 'rgba(16,185,129,0.06)' : 'rgba(0,132,204,0.06)',
                border: `1.5px solid ${copied ? 'rgba(16,185,129,0.20)' : 'rgba(0,132,204,0.15)'}`,
              }}
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(0,132,204,0.10)' }}>
                {copied ? '✅' : '🔗'}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-[15px] font-semibold" style={{ color: copied ? '#059669' : 'var(--brand-blue)' }}>
                  {copied ? '링크 복사됨!' : '초대 링크 복사'}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'var(--color-ink-muted-80)' }}>{inviteLink}</p>
              </div>
            </button>

            {group?.inviteCode && (
              <div className="glass-card w-full flex items-center gap-4 p-4 rounded-[20px] mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,132,204,0.08)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px]" style={{ color: 'var(--color-ink-muted-80)' }}>초대 코드</p>
                  <p className="text-[18px] font-mono font-bold" style={{ color: 'var(--brand-blue)' }}>
                    {group.inviteCode}
                  </p>
                </div>
              </div>
            )}

            <button onClick={() => setShowInviteModal(false)}
              className="w-full py-3.5 rounded-[20px] text-[15px] font-semibold"
              style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--color-ink-muted-80)' }}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ── 그룹 합류 모달 ── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center lg:items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowJoinModal(false)}>
          <div className="w-full max-w-[430px] lg:max-w-[500px] glass-card rounded-t-[32px] lg:rounded-[32px] p-6 lg:p-8 pb-10 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#E5E5EA] rounded-full mx-auto mb-6 lg:hidden" />
            <p className="text-[20px] font-bold mb-1" style={{ color: 'var(--color-ink)' }}>그룹 합류</p>
            <p className="text-[13px] mb-5" style={{ color: 'var(--color-ink-muted-80)' }}>
              초대받은 코드를 입력하세요
            </p>
            <input
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
              placeholder="GLEAUM-XXXX"
              className="w-full px-4 py-3.5 rounded-[16px] text-[16px] font-mono border-2 outline-none mb-2 transition-all"
              style={{
                borderColor: joinError ? '#EF4444' : joinCode ? 'var(--brand-blue)' : '#E5E5EA',
                background: 'rgba(255,255,255,0.8)',
                letterSpacing: '0.05em',
              }}
            />
            {joinError && (
              <p className="text-[12px] mb-3" style={{ color: '#EF4444' }}>{joinError}</p>
            )}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button onClick={() => { setShowJoinModal(false); setJoinError(''); setJoinCode(''); }}
                className="py-3.5 rounded-[16px] text-[15px] font-semibold"
                style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--color-ink-muted-80)' }}>
                취소
              </button>
              <button onClick={handleJoin} disabled={joining || !joinCode.trim()}
                className="py-3.5 rounded-[16px] text-[15px] font-semibold text-white disabled:opacity-50 transition-all active:scale-95"
                style={{ background: 'var(--brand-gradient)' }}>
                {joining ? '확인 중...' : '합류하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
