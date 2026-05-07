'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { joinSpaceByCode } from '@/lib/db';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';

export function DesktopFamily() {
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);

  const { spaceId, refresh: refreshUser } = useCurrentUser();
  const { space: group, members, loading, refresh } = useSpace(spaceId);

  const inviteLink = group?.inviteCode ? `https://gleaum.com/invite/${group.inviteCode}` : '';

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true); setJoinError('');
    const result = await joinSpaceByCode(joinCode.trim().toUpperCase());
    setJoining(false);
    if (result.success) {
      await refreshUser(); await refresh();
      setJoinCode(''); setJoinSuccess(true);
      setTimeout(() => setJoinSuccess(false), 3000);
    } else {
      setJoinError('유효하지 않은 공간 코드입니다.');
    }
  };

  return (
    <div style={{ display:'flex', minHeight:'100dvh', background:'#F5F5F9' }}>
      <DesktopSidebar />

      <main style={{ flex:1, padding:'48px 40px', overflowY:'auto' }}>
        {/* 페이지 타이틀 */}
        <div style={{ marginBottom:'32px' }}>
          <h1 style={{ fontSize:'28px', fontWeight:900, color:'#1A1B2E', letterSpacing:'-0.5px', margin:0 }}>공간 관리</h1>
          <p style={{ fontSize:'14px', color:'#8E8E93', fontWeight:600, marginTop:'6px' }}>멤버를 초대하고 공간을 관리하세요</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'24px', maxWidth:'1100px' }}>
          {/* 왼쪽: 멤버 리스트 */}
          <div>
            {/* Space Hero 카드 */}
            <div style={{ position:'relative', padding:'32px', borderRadius:'32px', overflow:'hidden', color:'white', background:'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)', marginBottom:'24px', boxShadow:'0 12px 40px rgba(26,27,46,0.25)' }}>
              <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'200px', height:'200px', background:'rgba(0,132,204,0.2)', filter:'blur(60px)', borderRadius:'50%' }} />
              <div style={{ position:'absolute', bottom:'-20px', left:'-20px', width:'150px', height:'150px', background:'rgba(12,201,181,0.1)', filter:'blur(50px)', borderRadius:'50%' }} />
              <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:'24px' }}>
                <div style={{ width:'72px', height:'72px', borderRadius:'24px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px' }}>🏠</div>
                <div style={{ flex:1 }}>
                  <h2 style={{ fontSize:'24px', fontWeight:900, margin:'0 0 6px', letterSpacing:'-0.3px' }}>{group?.name ?? '나의 공간'}</h2>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#0CC9B5' }} />
                    <span style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{members.length}명이 함께하는 중</span>
                  </div>
                </div>
                {group?.inviteCode && (
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'11px', fontWeight:900, color:'rgba(255,255,255,0.4)', letterSpacing:'0.15em', marginBottom:'6px' }}>INVITE CODE</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ fontSize:'22px', fontFamily:'monospace', fontWeight:900, letterSpacing:'0.1em', color:'#0CC9B5' }}>{group.inviteCode}</span>
                      <button onClick={copyInviteLink} style={{ padding:'10px 20px', borderRadius:'14px', background:'white', color:'#1A1B2E', fontSize:'13px', fontWeight:900, border:'none', cursor:'pointer', transition:'all 0.2s' }}>
                        {copied ? '복사됨 ✓' : '코드 복사'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 멤버 목록 */}
            <div style={{ background:'white', borderRadius:'24px', padding:'24px', boxShadow:'0 2px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
                <h3 style={{ fontSize:'18px', fontWeight:900, color:'#1A1B2E', margin:0 }}>공간 멤버</h3>
                <span style={{ fontSize:'13px', fontWeight:700, color:'#8E8E93' }}>{members.length}명</span>
              </div>

              {loading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'3px solid rgba(0,132,204,0.2)', borderTopColor:'#0084CC', animation:'spin 0.8s linear infinite' }} />
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {members.map((member) => (
                    <div key={member.id} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 20px', borderRadius:'20px', background:'#F9F9FB', border:'1px solid rgba(0,0,0,0.03)' }}>
                      <div style={{ width:'52px', height:'52px', borderRadius:'18px', background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>{member.avatar}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:'16px', fontWeight:800, color:'#1A1B2E', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member.name}</p>
                        <p style={{ fontSize:'12px', color:'#8E8E93', fontWeight:600, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{member.email || '연결됨'}</p>
                      </div>
                      <span style={{ padding:'5px 12px', borderRadius:'999px', fontSize:'11px', fontWeight:900, letterSpacing:'0.05em', background: member.role==='parent'?'rgba(0,132,204,0.1)':'rgba(12,201,181,0.1)', color: member.role==='parent'?'#0084CC':'#0CC9B5' }}>
                        {member.role==='parent'?'Admin':'Member'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 초대 / 합류 패널 */}
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            {/* 초대 카드 */}
            <div style={{ background:'white', borderRadius:'24px', padding:'28px', boxShadow:'0 2px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'20px', background:'rgba(0,132,204,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', marginBottom:'16px' }}>🔗</div>
              <h3 style={{ fontSize:'18px', fontWeight:900, color:'#1A1B2E', margin:'0 0 8px' }}>멤버 초대하기</h3>
              <p style={{ fontSize:'13px', color:'#8E8E93', fontWeight:600, margin:'0 0 20px', lineHeight:1.6 }}>초대 링크를 공유하여 소중한 사람들을 이 공간으로 초대하세요.</p>
              {inviteLink && (
                <div style={{ padding:'14px 16px', borderRadius:'14px', background:'#F5F5F9', marginBottom:'16px', fontFamily:'monospace', fontSize:'12px', color:'#8E8E93', fontWeight:600, wordBreak:'break-all' }}>
                  {inviteLink}
                </div>
              )}
              <button onClick={copyInviteLink} style={{ width:'100%', padding:'14px', borderRadius:'16px', background:'linear-gradient(135deg, #0084CC, #0CC9B5)', color:'white', fontSize:'15px', fontWeight:900, border:'none', cursor:'pointer', transition:'all 0.2s' }}>
                {copied ? '링크 복사 완료 ✓' : '초대 링크 복사'}
              </button>
            </div>

            {/* 합류 카드 */}
            <div style={{ background:'white', borderRadius:'24px', padding:'28px', boxShadow:'0 2px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'20px', background:'rgba(12,201,181,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', marginBottom:'16px' }}>🗝️</div>
              <h3 style={{ fontSize:'18px', fontWeight:900, color:'#1A1B2E', margin:'0 0 8px' }}>다른 공간 합류</h3>
              <p style={{ fontSize:'13px', color:'#8E8E93', fontWeight:600, margin:'0 0 20px', lineHeight:1.6 }}>공유받은 초대 코드를 입력하여 공간에 참여하세요.</p>
              <input
                value={joinCode}
                onChange={e=>{setJoinCode(e.target.value);setJoinError('');}}
                placeholder="초대 코드 입력"
                style={{ width:'100%', padding:'14px 16px', borderRadius:'14px', background:'#F5F5F9', border:`1.5px solid ${joinError?'#EF4444':joinCode?'#0CC9B5':'transparent'}`, fontSize:'16px', fontFamily:'monospace', fontWeight:900, textAlign:'center', textTransform:'uppercase', outline:'none', boxSizing:'border-box', marginBottom:'8px', color:'#1A1B2E' }}
              />
              {joinError && <p style={{ fontSize:'12px', color:'#EF4444', fontWeight:700, textAlign:'center', marginBottom:'8px' }}>{joinError}</p>}
              {joinSuccess && <p style={{ fontSize:'12px', color:'#0CC9B5', fontWeight:700, textAlign:'center', marginBottom:'8px' }}>✓ 공간에 합류했습니다!</p>}
              <button onClick={handleJoin} disabled={joining||!joinCode.trim()} style={{ width:'100%', padding:'14px', borderRadius:'16px', background: joinCode.trim()?'#1A1B2E':'#E5E5EA', color: joinCode.trim()?'white':'#8E8E93', fontSize:'15px', fontWeight:900, border:'none', cursor: joinCode.trim()?'pointer':'default', transition:'all 0.2s', opacity: joining?0.7:1 }}>
                {joining ? '확인 중...' : '참여 완료'}
              </button>
            </div>

            {/* 안내 카드 */}
            <div style={{ padding:'20px', borderRadius:'20px', background:'rgba(0,132,204,0.04)', border:'1px solid rgba(0,132,204,0.1)' }}>
              <p style={{ fontSize:'12px', color:'#8E8E93', fontWeight:600, lineHeight:1.7, margin:0 }}>
                공간 관리자는 멤버를 관리하고 공간의 이름을 수정할 수 있습니다. 더 많은 공간 기능이 곧 업데이트됩니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
