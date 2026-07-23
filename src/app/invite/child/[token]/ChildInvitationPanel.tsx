'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, KeyRound, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isFamilyChildInviteToken } from '@/lib/family-child';

export function ChildInvitationPanel({ token, desktop }: { token: string; desktop: boolean }) {
  const { user, loading, signInWithGoogle } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const validToken = isFamilyChildInviteToken(token);

  const claim = async () => {
    if (!user || claiming) return;
    setClaiming(true);
    setError('');
    try {
      const response = await fetch('/api/spaces/children/invitations/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'invitation_claim_failed');
      setCompleted(true);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      const errors: Record<string, string> = {
        invited_email_mismatch: '초대에 지정된 이메일과 현재 로그인 이메일이 다릅니다.',
        guardian_account_cannot_claim_child_invitation: '보호자 계정으로는 자녀 초대를 수락할 수 없습니다. 자녀가 사용할 계정으로 로그인해 주세요.',
        expired_invitation: '초대 링크가 만료되었습니다. 보호자에게 새 링크를 요청해 주세요.',
        invalid_or_used_invitation: '이미 사용되었거나 유효하지 않은 초대 링크입니다.',
        existing_space_member_requires_conversion: '이미 공간 멤버인 계정은 자녀 계정으로 자동 전환할 수 없습니다.',
      };
      setError(errors[message] ?? '연결 요청을 완료하지 못했습니다. 보호자에게 확인해 주세요.');
    } finally {
      setClaiming(false);
    }
  };

  if (!validToken) {
    return <InvitationState title="유효하지 않은 초대 링크입니다" description="보호자에게 새 초대 링크를 요청해 주세요." />;
  }

  if (completed) {
    return (
      <InvitationState
        title="보호자 승인을 기다리고 있어요"
        description="가입 정보가 보호자에게 전달되었습니다. 보호자가 마지막으로 승인하면 가족 공간을 사용할 수 있습니다."
      />
    );
  }

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'grid',
      placeItems: 'center',
      padding: desktop
        ? '64px 32px'
        : 'calc(max(var(--app-safe-top), 24px) + 24px) max(16px, var(--app-safe-right)) calc(max(var(--app-safe-bottom), 24px) + 24px) max(16px, var(--app-safe-left))',
      background: 'var(--theme-bg)',
      color: 'var(--theme-text)',
    }}>
      <section style={{ width: '100%', maxWidth: desktop ? '720px' : '540px', padding: desktop ? '40px' : '26px 22px', borderRadius: '28px', border: '1px solid var(--theme-border)', background: 'var(--theme-surface)', boxShadow: '0 8px 32px rgba(0,132,204,0.08)' }}>
        <div style={{ width: '58px', height: '58px', display: 'grid', placeItems: 'center', borderRadius: '20px', background: 'rgba(0,132,204,0.09)', marginBottom: '18px' }}>
          <UserRoundCheck size={29} color="#0084CC" />
        </div>
        <p style={{ margin: '0 0 8px', color: '#0CC9B5', fontSize: '12px', fontWeight: 900, letterSpacing: '0.12em' }}>FAMILY INVITATION</p>
        <h1 style={{ margin: '0 0 12px', fontSize: desktop ? '32px' : '26px', fontWeight: 950, letterSpacing: '-0.04em' }}>가족 공간 초대가 도착했어요</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--theme-text-muted)', fontSize: '14px', lineHeight: 1.75 }}>
          본인이 사용할 Google 또는 이메일 계정으로 로그인해 연결을 요청하세요. 보호자가 계정을 확인하고 최종 승인하기 전에는 가족 공간 정보에 접근할 수 없습니다.
        </p>

        <div style={{ display: 'grid', gap: '10px', marginBottom: '22px' }}>
          <Info icon={<KeyRound size={18} />} text="이 링크는 72시간 동안 한 번만 사용할 수 있습니다." />
          <Info icon={<ShieldCheck size={18} />} text="위치정보 수집·공유 권한은 자동으로 켜지지 않습니다." />
        </div>

        {loading ? (
          <button disabled style={{ ...primaryButtonStyle, opacity: 0.5 }}>로그인 상태 확인 중...</button>
        ) : user ? (
          <>
            <div style={{ padding: '14px 16px', marginBottom: '12px', borderRadius: '18px', background: 'var(--theme-surface-muted)', color: 'var(--theme-text-muted)', fontSize: '13px', overflowWrap: 'anywhere' }}>
              현재 로그인: <strong style={{ color: 'var(--theme-text)' }}>{user.email}</strong>
            </div>
            <button disabled={claiming} onClick={claim} style={primaryButtonStyle}>
              {claiming ? '연결 요청 중...' : '이 계정으로 연결 요청'}
            </button>
          </>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            <button onClick={() => signInWithGoogle(`/invite/child/${token}`)} style={primaryButtonStyle}>
              Google 계정으로 계속
            </button>
            <Link
              href={`/login?view=email&next=${encodeURIComponent(`/invite/child/${token}`)}`}
              style={{ ...secondaryButtonStyle, textDecoration: 'none' }}
            >
              이메일 계정으로 계속
            </Link>
          </div>
        )}

        {error && <p role="alert" style={{ margin: '13px 0 0', color: '#D94C4C', fontSize: '13px', fontWeight: 750, lineHeight: 1.6 }}>{error}</p>}
      </section>
    </main>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 14px', borderRadius: '17px', background: 'var(--theme-surface-muted)', color: 'var(--theme-text-muted)', fontSize: '12px', lineHeight: 1.55 }}>
      <span style={{ color: '#0084CC', flexShrink: 0 }}>{icon}</span>{text}
    </div>
  );
}

function InvitationState({ title, description }: { title: string; description: string }) {
  return (
    <main style={{
      minHeight: '100dvh',
      display: 'grid',
      placeItems: 'center',
      padding: 'calc(max(var(--app-safe-top), 24px) + 24px) max(24px, var(--app-safe-right)) calc(max(var(--app-safe-bottom), 24px) + 24px) max(24px, var(--app-safe-left))',
      background: 'var(--theme-bg)',
      color: 'var(--theme-text)',
    }}>
      <div style={{ width: '100%', maxWidth: '480px', padding: '30px', borderRadius: '26px', background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', textAlign: 'center' }}>
        <CheckCircle2 size={36} color="#0A8F69" />
        <h1 style={{ margin: '16px 0 9px', fontSize: '22px' }}>{title}</h1>
        <p style={{ margin: 0, color: 'var(--theme-text-muted)', fontSize: '14px', lineHeight: 1.7 }}>{description}</p>
      </div>
    </main>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  width: '100%', minHeight: '52px', border: 0, borderRadius: '999px',
  background: '#0084CC', color: 'white', fontSize: '15px', fontWeight: 900, cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  width: '100%', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid var(--theme-border)', borderRadius: '999px',
  background: 'var(--theme-surface-muted)', color: 'var(--theme-text)',
  fontSize: '15px', fontWeight: 850, cursor: 'pointer',
};
