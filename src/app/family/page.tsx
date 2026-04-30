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
    <div className="min-h-dvh pb-28" style={{ background: '#FAFAFD' }}>
      <AppHeader
        title="우리 가족"
        showLogo={false}
        showBack
        showNotification={false}
        rightAction={
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold text-white transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)' }}
          >
            <span>+</span> 초대
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(0,132,204,0.2)', borderTopColor: '#0084CC' }} />
        </div>
      ) : (
        <>
          {/* 가족 그룹 히어로 카드 */}
          <div
            className="mx-4 mt-4 p-5 rounded-[28px] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
              boxShadow: '0 12px 40px rgba(0,132,204,0.30)',
            }}
          >
            {/* 장식 원 */}
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
              <div
                className="w-14 h-14 rounded-[18px] flex items-center justify-center text-3xl"
                style={{ background: 'rgba(255,255,255,0.20)' }}
              >
                👨‍👩‍👧‍👦
              </div>
              <div>
                <p className="text-[20px] font-bold text-white" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
                  {group?.name ?? '우리 가족'}
                </p>
                <p className="text-[13px] text-white/70" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
                  멤버 {members.length}명
                </p>
              </div>
            </div>

            {/* 초대 코드 */}
            {group?.inviteCode && (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-[14px] relative z-10"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              >
                <div>
                  <p className="text-[10px] text-white/60 mb-0.5" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
                    초대 코드
                  </p>
                  <span className="text-[14px] font-mono font-bold text-white">{group.inviteCode}</span>
                </div>
                <button
                  onClick={copyInviteLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95"
                  style={{
                    background: copied ? 'rgba(16,185,129,0.8)' : 'rgba(255,255,255,0.25)',
                    color: 'white',
                    fontFamily: "'Noto Sans KR',sans-serif",
                  }}
                >
                  {copied ? '✓ 복사됨' : '🔗 링크 복사'}
                </button>
              </div>
            )}
          </div>

          {/* 멤버 목록 */}
          <div className="mx-4 mt-4">
            <p className="text-[12px] font-bold tracking-widest uppercase mb-3"
              style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}>
              구성원
            </p>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 bg-white p-4 rounded-[20px]"
                  style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.05)' }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'rgba(0,132,204,0.08)' }}
                  >
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold" style={{ color: '#1A1B2E', fontFamily: "'Noto Sans KR',sans-serif" }}>
                      {member.name}
                    </p>
                    {member.email && (
                      <p className="text-[12px]" style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}>
                        {member.email}
                      </p>
                    )}
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-[11px] font-bold"
                    style={{
                      background: member.role === 'parent' ? 'rgba(0,132,204,0.10)' : 'rgba(16,185,129,0.10)',
                      color:      member.role === 'parent' ? '#0084CC' : '#059669',
                      fontFamily: "'Noto Sans KR',sans-serif",
                    }}
                  >
                    {member.role === 'parent' ? '부모' : '자녀'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 가족 합류 버튼 */}
          <div className="mx-4 mt-4">
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full py-3.5 rounded-[20px] text-[14px] font-semibold transition-all active:scale-[0.98]"
              style={{
                border: '1.5px dashed rgba(0,132,204,0.25)',
                color: '#0084CC',
                fontFamily: "'Noto Sans KR',sans-serif",
                background: 'rgba(0,132,204,0.04)',
              }}
            >
              다른 가족 그룹에 합류하기
            </button>
          </div>
        </>
      )}

      {/* ── 초대 모달 ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#E5E5EA] rounded-full mx-auto mb-6" />
            <p className="text-[20px] font-bold mb-1" style={{ color: '#1A1B2E', fontFamily: "'Noto Sans KR',sans-serif" }}>
              가족 초대하기
            </p>
            <p className="text-[13px] mb-6" style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}>
              아래 방법으로 가족을 초대하세요
            </p>

            {/* 초대 링크 복사 */}
            <button
              onClick={copyInviteLink}
              className="w-full flex items-center gap-4 p-4 rounded-[20px] mb-3 transition-all active:scale-[0.98]"
              style={{
                background: copied ? 'rgba(16,185,129,0.06)' : 'rgba(0,132,204,0.06)',
                border: `1.5px solid ${copied ? 'rgba(16,185,129,0.20)' : 'rgba(0,132,204,0.15)'}`,
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(0,132,204,0.10)' }}
              >
                {copied ? '✅' : '🔗'}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-[15px] font-semibold" style={{ color: copied ? '#059669' : '#0084CC', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  {copied ? '링크 복사됨!' : '초대 링크 복사'}
                </p>
                <p className="text-[11px] truncate" style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  {inviteLink}
                </p>
              </div>
            </button>

            {/* 초대 코드 표시 */}
            {group?.inviteCode && (
              <div
                className="w-full flex items-center gap-4 p-4 rounded-[20px] mb-4"
                style={{ background: '#FAFAFD', border: '1.5px solid rgba(0,132,204,0.10)' }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(0,132,204,0.08)' }}
                >
                  🔑
                </div>
                <div>
                  <p className="text-[13px]" style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    초대 코드
                  </p>
                  <p className="text-[18px] font-mono font-bold" style={{ color: '#0084CC' }}>
                    {group.inviteCode}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full py-3.5 rounded-[20px] text-[15px] font-semibold"
              style={{ background: '#FAFAFD', color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ── 가족 합류 모달 ── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowJoinModal(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#E5E5EA] rounded-full mx-auto mb-6" />
            <p className="text-[20px] font-bold mb-1" style={{ color: '#1A1B2E', fontFamily: "'Noto Sans KR',sans-serif" }}>
              가족 그룹 합류
            </p>
            <p className="text-[13px] mb-5" style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}>
              가족에게 받은 초대 코드를 입력하세요
            </p>
            <input
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
              placeholder="GLEAUM-XXXX"
              className="w-full px-4 py-3.5 rounded-[16px] text-[16px] font-mono border-2 outline-none mb-2 transition-all"
              style={{
                borderColor: joinError ? '#EF4444' : joinCode ? '#0084CC' : '#E5E5EA',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
              }}
            />
            {joinError && (
              <p className="text-[12px] mb-3" style={{ color: '#EF4444', fontFamily: "'Noto Sans KR',sans-serif" }}>
                {joinError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button onClick={() => { setShowJoinModal(false); setJoinError(''); setJoinCode(''); }}
                className="py-3.5 rounded-[16px] text-[15px] font-semibold"
                style={{ background: '#FAFAFD', color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}>
                취소
              </button>
              <button onClick={handleJoin} disabled={joining || !joinCode.trim()}
                className="py-3.5 rounded-[16px] text-[15px] font-semibold text-white disabled:opacity-50 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', fontFamily: "'Noto Sans KR',sans-serif" }}>
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
