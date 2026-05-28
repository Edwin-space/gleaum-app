'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { joinSpaceByCode } from '@/lib/db';

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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── 페이지 히어로 ── */}
      <div style={{
        position: 'relative',
        padding: '40px 44px',
        borderRadius: '32px',
        overflow: 'hidden',
        color: 'white',
        background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
        marginBottom: '32px',
        boxShadow: '0 16px 48px rgba(26,27,46,0.25)',
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '220px', height: '220px', background: 'rgba(0,132,204,0.18)', filter: 'blur(70px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '-20px', width: '180px', height: '180px', background: 'rgba(12,201,181,0.12)', filter: 'blur(55px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '28px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '38px', flexShrink: 0,
          }}>🏠</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
                {group?.name ?? '나의 공간'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(12,201,181,0.2)', border: '1px solid rgba(12,201,181,0.3)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0CC9B5' }} />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0CC9B5', letterSpacing: '0.04em' }}>활성</span>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, margin: 0 }}>
              {members.length}명이 함께하는 중 · 멤버를 초대하고 공간을 관리하세요
            </p>
          </div>

          {group?.inviteCode && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 8px' }}>INVITE CODE</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.12em', color: '#0CC9B5' }}>{group.inviteCode}</span>
                <button onClick={copyInviteLink} style={{
                  padding: '10px 18px', borderRadius: '14px',
                  background: copied ? 'rgba(12,201,181,0.25)' : 'rgba(255,255,255,0.12)',
                  color: 'white', fontSize: '13px', fontWeight: 800,
                  border: '1px solid rgba(255,255,255,0.18)',
                  cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.2s',
                }}>
                  {copied ? '✓ 복사됨' : '코드 복사'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 컨텐츠 그리드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>

        {/* 왼쪽: 멤버 리스트 */}
        <div style={{
          background: 'white', borderRadius: '28px', padding: '32px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 4px' }}>공간 멤버</h3>
              <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, margin: 0 }}>함께하는 소중한 사람들</p>
            </div>
            <div style={{
              padding: '8px 16px', borderRadius: '999px',
              background: 'rgba(0,132,204,0.08)', color: '#0084CC',
              fontSize: '13px', fontWeight: 800,
            }}>{members.length}명</div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(0,132,204,0.15)', borderTopColor: '#0084CC', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : members.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>👥</div>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 8px' }}>아직 멤버가 없어요</p>
              <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600 }}>초대 링크로 소중한 사람들을 초대해 보세요</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map((member) => (
                <div key={member.id} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '18px 20px', borderRadius: '20px',
                  background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.03)',
                  transition: 'background 0.15s',
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '18px',
                    background: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '28px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.07)', flexShrink: 0,
                  }}>{member.user?.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.user?.name}</p>
                    <p style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.user?.email || '연결됨'}</p>
                  </div>
                  <span style={{
                    padding: '6px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 800,
                    background: member.role === 'admin' ? 'rgba(0,132,204,0.1)' : 'rgba(12,201,181,0.1)',
                    color: member.role === 'admin' ? '#0084CC' : '#0CC9B5',
                  }}>
                    {member.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 오른쪽: 액션 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 초대 카드 */}
          <div style={{ background: 'white', borderRadius: '28px', padding: '28px', boxShadow: '0 2px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'rgba(0,132,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '16px' }}>🔗</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px' }}>멤버 초대하기</h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, margin: '0 0 20px', lineHeight: 1.65 }}>
              초대 링크를 공유하여 소중한 사람들을 이 공간으로 초대하세요.
            </p>
            {inviteLink && (
              <div style={{
                padding: '12px 14px', borderRadius: '12px', background: '#F7F7FA',
                marginBottom: '14px', fontFamily: 'monospace', fontSize: '11px',
                color: '#8E8E93', fontWeight: 600, wordBreak: 'break-all',
                border: '1px solid rgba(0,0,0,0.05)',
              }}>
                {inviteLink}
              </div>
            )}
            <button onClick={copyInviteLink} style={{
              width: '100%', padding: '14px', borderRadius: '16px',
              background: copied ? '#F0FDF9' : 'linear-gradient(135deg, #0084CC, #0CC9B5)',
              color: copied ? '#0CC9B5' : 'white',
              fontSize: '14px', fontWeight: 800, border: copied ? '1px solid #0CC9B5' : 'none',
              cursor: 'pointer', transition: 'all 0.25s',
              boxShadow: copied ? 'none' : '0 8px 24px rgba(0,132,204,0.25)',
            }}>
              {copied ? '✓ 링크 복사 완료' : '초대 링크 복사'}
            </button>
          </div>

          {/* 합류 카드 */}
          <div style={{ background: 'white', borderRadius: '28px', padding: '28px', boxShadow: '0 2px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'rgba(12,201,181,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '16px' }}>🗝️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#1A1B2E', margin: '0 0 8px' }}>다른 공간 합류</h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, margin: '0 0 20px', lineHeight: 1.65 }}>
              공유받은 초대 코드를 입력하여 공간에 참여하세요.
            </p>
            <input
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
              placeholder="초대 코드 입력 (예: ABC123)"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '14px',
                background: '#F7F7FA',
                border: `1.5px solid ${joinError ? '#EF4444' : joinCode ? '#0CC9B5' : 'transparent'}`,
                fontSize: '15px', fontFamily: 'monospace', fontWeight: 800,
                textAlign: 'center', textTransform: 'uppercase', outline: 'none',
                boxSizing: 'border-box', marginBottom: '8px', color: '#1A1B2E',
                letterSpacing: '0.1em', transition: 'border-color 0.2s',
              }}
            />
            {joinError && <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>{joinError}</p>}
            {joinSuccess && <p style={{ fontSize: '12px', color: '#0CC9B5', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>✓ 공간에 합류했습니다!</p>}
            <button onClick={handleJoin} disabled={joining || !joinCode.trim()} style={{
              width: '100%', padding: '14px', borderRadius: '16px',
              background: joinCode.trim() ? '#1A1B2E' : '#F0F0F5',
              color: joinCode.trim() ? 'white' : '#AEAEA8',
              fontSize: '14px', fontWeight: 800, border: 'none',
              cursor: joinCode.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s', opacity: joining ? 0.7 : 1,
            }}>
              {joining ? '확인 중...' : '공간 참여하기'}
            </button>
          </div>

          {/* 안내 */}
          <div style={{ padding: '18px 20px', borderRadius: '20px', background: 'rgba(0,132,204,0.04)', border: '1px solid rgba(0,132,204,0.08)' }}>
            <p style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600, lineHeight: 1.75, margin: 0 }}>
              💡 공간 지기는 멤버를 관리하고 공간의 이름을 수정할 수 있습니다. 더 많은 공간 기능이 곧 업데이트됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
