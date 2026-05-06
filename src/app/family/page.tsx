'use client';

import { useState } from 'react';
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
    ? `https://gleaum.the-ifs.com/invite/${group.inviteCode}`
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
    <div className="min-h-dvh pb-28 lg:max-w-[1440px] lg:mx-auto lg:px-8 lg:pt-10 relative">
      
      {/* ── [MOBILE] 프리미엄 헤더 ── */}
      <div className="lg:hidden px-6 pt-8 pb-4 flex items-center justify-between animate-fade-in">
        <h1 className="text-[28px] font-black text-[#1A1B2E]">우리 가족</h1>
        <button onClick={() => setShowInviteModal(true)} className="w-12 h-12 rounded-2xl bg-[#1A1B2E] flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
        </button>
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
          <div className="w-8 h-8 rounded-full border-3 border-brand-blue border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* ── 그룹 히어로 카드 (Gleaum Premium) ── */}
          <div className="px-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div
              className="p-8 rounded-[40px] relative overflow-hidden text-white shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
              }}
            >
              {/* 장식용 메쉬 볼 */}
              <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-brand-blue/20 blur-[60px] rounded-full" />
              <div className="absolute bottom-[-20px] left-[20%] w-32 h-32 bg-brand-teal/10 blur-[40px] rounded-full" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-[28px] bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h2 className="text-[24px] font-black mb-1">{group?.name ?? '나의 그룹'}</h2>
                <p className="text-[14px] text-white/50 font-bold mb-6">총 {members.length}명의 소중한 인연</p>

                {group?.inviteCode && (
                  <div className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-left">
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Invite Code</p>
                      <span className="text-[17px] font-mono font-bold tracking-wider">{group.inviteCode}</span>
                    </div>
                    <button
                      onClick={copyInviteLink}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95"
                      style={{ background: copied ? 'rgba(46,232,149,0.8)' : 'rgba(255,255,255,0.15)', color: 'white' }}
                    >
                      {copied ? '✓ 복사됨' : '복사하기'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 멤버 그리드 (Live Tiles) ── */}
          <div className="px-6 lg:px-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-[18px] font-black text-[#1A1B2E]">구성원 목록</h3>
              <div className="h-[1px] flex-1 bg-gray-100" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((member, idx) => (
                <div
                  key={member.id}
                  className="group glass-card flex flex-col items-center text-center p-6 rounded-[32px] border border-white/60 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                >
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-brand-blue/10 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-gray-50 border-2 border-white shadow-inner relative z-10">
                      {member.avatar}
                    </div>
                  </div>
                  <p className="text-[16px] font-bold text-[#1A1B2E] mb-1">{member.name}</p>
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{
                      background: member.role === 'parent' ? 'rgba(0,132,204,0.08)' : 'rgba(46,232,149,0.08)',
                      color:      member.role === 'parent' ? '#0084CC' : '#2EE895',
                    }}
                  >
                    {member.role === 'parent' ? 'Parent' : 'Child'}
                  </span>
                </div>
              ))}

              {/* 합류 카드 */}
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex flex-col items-center justify-center p-6 rounded-[32px] border-2 border-dashed border-gray-200 bg-gray-50/50 text-[#8E8E93] hover:border-brand-blue hover:text-brand-blue hover:bg-brand-blue/5 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <span className="text-[13px] font-bold">다른 그룹 합류</span>
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
