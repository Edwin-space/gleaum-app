'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFamily } from '@/hooks/useFamily';
import { joinFamilyByCode } from '@/lib/db';
import { AppHeader } from '@/components/layout/AppHeader';

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
    ? `https://gleaum.com/invite/${group.inviteCode}`
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
      setJoinError('유효하지 않은 공간 코드입니다. 다시 확인해 주세요.');
    }
  };

  return (
    <div className="min-h-dvh pb-32 bg-[#FAFAFD] font-sans">
      <AppHeader title="공간 관리" showBack showNotification={false} showLogo={false} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-brand-blue border-t-transparent animate-spin" />
          <p className="text-[14px] font-bold text-gray-400 font-sans">공간 정보를 불러오는 중...</p>
        </div>
      ) : (
        <div className="max-w-[600px] mx-auto">
          {/* ── [HERO] Space Identity ── */}
          <div className="px-6 mt-6 mb-10 animate-fade-in">
            <div className="relative p-8 rounded-[48px] overflow-hidden text-white shadow-2xl" style={{ background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)' }}>
              {/* 장식용 프리미엄 메쉬 */}
              <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-brand-blue/20 blur-[80px] rounded-full" />
              <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-brand-teal/10 blur-[60px] rounded-full" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[36px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-6 shadow-inner">
                   <span className="text-[44px]">🏠</span>
                </div>
                <h2 className="text-[28px] font-black mb-2 tracking-tight">{group?.name ?? '나의 공간'}</h2>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-8">
                   <div className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
                   <span className="text-[13px] font-bold text-white/80">{members.length}명의 멤버가 함께하는 중</span>
                </div>

                {group?.inviteCode && (
                  <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">SPACE INVITE CODE</p>
                    <div className="flex items-center justify-between gap-4">
                       <span className="text-[24px] font-mono font-black tracking-widest text-brand-teal">{group.inviteCode}</span>
                       <button onClick={copyInviteLink} className="h-12 px-6 rounded-2xl bg-white text-[#1A1B2E] text-[14px] font-black active:scale-95 transition-all shadow-lg">
                          {copied ? '복사됨 ✓' : '코드 복사'}
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── [SECTION] 멤버 리스트 ── */}
          <div className="px-6 mb-10">
            <div className="flex items-center justify-between mb-6 px-2">
               <h3 className="text-[18px] font-black text-[#1A1B2E]">공간 멤버</h3>
               <button onClick={() => setShowInviteModal(true)} className="text-[13px] font-black text-brand-blue flex items-center gap-1.5">
                  <span className="text-lg">＋</span> 멤버 초대하기
               </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {members.map((member, idx) => (
                <div key={member.id} className="glass-card p-5 rounded-[36px] border border-white shadow-sm flex items-center gap-5 animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center text-[32px] border-2 border-white shadow-inner">
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-black text-[#1A1B2E] mb-1 truncate">{member.name}</p>
                    <div className="flex items-center gap-2">
                       <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${member.role === 'parent' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-teal/10 text-brand-teal'}`}>
                          {member.role === 'parent' ? 'Admin' : 'Member'}
                       </span>
                       <span className="text-[12px] text-[#8E8E93] font-bold truncate">{member.email || '연결됨'}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </div>
                </div>
              ))}
              
              <button onClick={() => setShowJoinModal(true)} className="w-full p-6 rounded-[36px] border-2 border-dashed border-gray-200 flex items-center justify-center gap-3 text-[#8E8E93] font-black hover:border-brand-blue hover:text-brand-blue hover:bg-brand-blue/5 transition-all active:scale-98">
                 <span className="text-2xl">🗝️</span> 새로운 공간 합류하기
              </button>
            </div>
          </div>

          <div className="px-10 text-center opacity-30 pb-20">
             <p className="text-[11px] font-bold leading-relaxed">공간 관리자는 멤버를 관리하고 공간의 이름을 수정할 수 있습니다.<br/>더 많은 공간 기능이 곧 업데이트됩니다.</p>
          </div>
        </div>
      )}

      {/* ── 초대 모달 ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-fade-in" onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-[400px] glass-card rounded-[48px] p-8 animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-[32px] bg-brand-blue/10 flex items-center justify-center text-[40px] mb-6 mx-auto">🔗</div>
            <h3 className="text-[22px] font-black text-[#1A1B2E] text-center mb-2">멤버 초대하기</h3>
            <p className="text-[14px] text-[#8E8E93] font-bold text-center mb-8 leading-relaxed">초대 링크를 공유하여 소중한 사람들을<br/>이 공간으로 초대하세요.</p>
            
            <button onClick={copyInviteLink} className="w-full h-16 rounded-[28px] bg-[#1A1B2E] text-white text-[16px] font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl mb-4">
               {copied ? '링크 복사 완료 ✓' : '초대 링크 복사하기'}
            </button>
            <button onClick={() => setShowInviteModal(false)} className="w-full h-16 rounded-[28px] bg-gray-100 text-[#8E8E93] text-[15px] font-black active:scale-95 transition-all">
               닫기
            </button>
          </div>
        </div>
      )}

      {/* ── 합류 모달 ── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-fade-in" onClick={() => setShowJoinModal(false)}>
          <div className="w-full max-w-[400px] glass-card rounded-[48px] p-8 animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-[32px] bg-brand-teal/10 flex items-center justify-center text-[40px] mb-6 mx-auto">🗝️</div>
            <h3 className="text-[22px] font-black text-[#1A1B2E] text-center mb-2">공간 참여하기</h3>
            <p className="text-[14px] text-[#8E8E93] font-bold text-center mb-8 leading-relaxed">공유받은 8자리 참여 코드를<br/>아래에 입력해 주세요.</p>
            
            <input
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
              placeholder="참여 코드 입력"
              className="w-full h-16 px-6 rounded-[28px] text-[20px] font-mono font-black text-center bg-gray-50 border-2 outline-none mb-2 transition-all uppercase"
              style={{ borderColor: joinError ? '#EF4444' : joinCode ? 'var(--brand-teal)' : 'transparent' }}
            />
            {joinError && <p className="text-[12px] font-bold text-red-500 text-center mb-6">{joinError}</p>}
            
            <div className="grid grid-cols-1 gap-3 mt-6">
               <button onClick={handleJoin} disabled={joining || !joinCode.trim()} className="w-full h-16 rounded-[28px] bg-brand-gradient text-white text-[16px] font-black active:scale-95 transition-all shadow-xl disabled:opacity-50">
                  {joining ? '공간 확인 중...' : '참여 완료'}
               </button>
               <button onClick={() => setShowJoinModal(false)} className="w-full h-16 rounded-[28px] bg-gray-100 text-[#8E8E93] text-[15px] font-black active:scale-95 transition-all">
                  취소
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
