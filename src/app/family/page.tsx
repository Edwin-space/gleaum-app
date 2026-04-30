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

  const { familyGroupId, refresh: refreshUser } = useCurrentUser();
  const { group, members, loading, refresh } = useFamily(familyGroupId);

  const inviteLink = group?.inviteCode
    ? `https://gleaum-app.vercel.app/invite/${group.inviteCode}`
    : '';

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    const success = await joinFamilyByCode(joinCode.trim().toUpperCase());
    setJoining(false);
    if (success) {
      await refreshUser();
      await refresh();
      setShowJoinModal(false);
      setJoinCode('');
    } else {
      alert('초대 코드를 찾을 수 없습니다. 다시 확인해주세요.');
    }
  };

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader
        title="우리 가족"
        showLogo={false}
        showBack
        showNotification={false}
        rightAction={
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold text-white"
            style={{ background: 'var(--brand-gradient)' }}
          >
            <span>+</span> 초대
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* 가족 그룹 헤더 카드 */}
          <div
            className="mx-4 mt-4 p-5 rounded-3xl"
            style={{ background: 'var(--brand-black)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'var(--brand-gradient)' }}
              >
                👨‍👩‍👧‍👦
              </div>
              <div>
                <p className="text-[18px] font-bold text-white">
                  {group?.name ?? '우리 가족'}
                </p>
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  멤버 {members.length}명
                </p>
              </div>
            </div>

            {/* 초대 코드 */}
            {group?.inviteCode && (
              <div
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <span className="text-[11px] font-mono text-white opacity-70">{group.inviteCode}</span>
                <button
                  onClick={copyInviteLink}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: copied ? 'var(--color-status-done)' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    fontFamily: "'Noto Sans KR',sans-serif",
                  }}
                >
                  {copied ? '복사됨!' : '복사'}
                </button>
              </div>
            )}
          </div>

          {/* 멤버 목록 */}
          <div className="mx-4 mt-4 space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 bg-white p-4 rounded-2xl"
                style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'var(--color-canvas-parchment)' }}
                >
                  {member.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    {member.name}
                  </p>
                  {member.email && (
                    <p className="text-[12px]" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                      {member.email}
                    </p>
                  )}
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: member.role === 'parent' ? 'rgba(0,132,204,0.1)' : 'rgba(46,232,149,0.1)',
                    color: member.role === 'parent' ? 'var(--color-primary)' : 'var(--brand-teal)',
                    fontFamily: "'Noto Sans KR',sans-serif",
                  }}
                >
                  {member.role === 'parent' ? '부모' : '자녀'}
                </span>
              </div>
            ))}
          </div>

          {/* 가족 합류 버튼 */}
          <div className="mx-4 mt-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full py-3 rounded-2xl text-[14px] font-medium border transition-all active:scale-95"
              style={{
                borderColor: 'var(--color-hairline)',
                color: 'var(--color-ink-muted-48)',
                fontFamily: "'Noto Sans KR',sans-serif",
              }}
            >
              다른 가족 그룹에 합류하기
            </button>
          </div>
        </>
      )}

      {/* 초대 모달 */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-[18px] font-bold mb-1" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              가족 초대하기
            </p>
            <p className="text-[13px] mb-6" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              아래 방법으로 가족을 초대하세요
            </p>

            {/* 초대 링크 복사 */}
            <button
              onClick={copyInviteLink}
              className="w-full flex items-center gap-3 p-4 rounded-2xl mb-3 transition-all active:scale-95"
              style={{ background: 'rgba(0,132,204,0.06)', border: '1px solid rgba(0,132,204,0.15)' }}
            >
              <span className="text-2xl">🔗</span>
              <div className="text-left">
                <p className="text-[14px] font-semibold" style={{ color: 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  {copied ? '링크 복사됨! ✓' : '초대 링크 복사'}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  {inviteLink}
                </p>
              </div>
            </button>

            {/* 초대 코드 표시 */}
            {group?.inviteCode && (
              <div
                className="w-full flex items-center gap-3 p-4 rounded-2xl mb-3"
                style={{ background: 'var(--color-canvas-parchment)', border: '1px solid var(--color-hairline)' }}
              >
                <span className="text-2xl">🔑</span>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    초대 코드
                  </p>
                  <p className="text-[16px] font-mono font-bold" style={{ color: 'var(--color-primary)' }}>
                    {group.inviteCode}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full py-3 mt-2 rounded-2xl text-[14px] font-medium"
              style={{ background: 'var(--color-canvas-parchment)', color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 가족 합류 모달 */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowJoinModal(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-[18px] font-bold mb-1" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              가족 그룹 합류
            </p>
            <p className="text-[13px] mb-5" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              초대 코드를 입력하세요
            </p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="GLEAUM-XXXX"
              className="w-full px-4 py-3 rounded-xl text-[15px] font-mono border outline-none mb-3"
              style={{ borderColor: 'var(--color-hairline)', fontFamily: 'monospace' }}
            />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowJoinModal(false)}
                className="py-3 rounded-2xl text-[14px] font-medium"
                style={{ background: 'var(--color-canvas-parchment)', color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                취소
              </button>
              <button onClick={handleJoin} disabled={joining}
                className="py-3 rounded-2xl text-[14px] font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}>
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
