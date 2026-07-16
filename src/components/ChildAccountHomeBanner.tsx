'use client';

import { useAccountSession } from '@/components/AccountSessionProvider';
import { isManagedMinorAccountMode } from '@/lib/account-capabilities';

export function ChildAccountHomeBanner() {
  const { context } = useAccountSession();
  const mode = context?.accountMode ?? 'unknown';
  if (!isManagedMinorAccountMode(mode)) return null;

  const pendingConsent = mode === 'pending_guardian_consent' || mode === 'teen_consent_pending';

  return (
    <section
      aria-label="계정 사용 안내"
      style={{
        padding: '20px 24px',
        borderRadius: '24px',
        background: 'var(--theme-surface)',
        border: '1px solid var(--theme-border)',
        boxShadow: 'var(--theme-shadow-card)',
      }}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: '24px',
        padding: '2px 10px',
        borderRadius: '9999px',
        background: 'rgba(46, 232, 149, 0.14)',
        color: 'var(--theme-text)',
        fontSize: '11px',
        fontWeight: 700,
      }}>
        {pendingConsent ? '동의 확인 필요' : '보호자 관리 계정'}
      </span>
      <h2 style={{
        margin: '12px 0 0',
        color: 'var(--theme-text)',
        fontSize: '18px',
        fontWeight: 800,
        letterSpacing: '-0.01em',
      }}>
        {pendingConsent ? '동의 상태를 확인하고 있어요' : '일정과 루틴에 집중하는 홈이에요'}
      </h2>
      <p style={{
        margin: '8px 0 0',
        color: 'var(--theme-text-muted)',
        fontSize: '13px',
        fontWeight: 600,
        lineHeight: 1.6,
      }}>
        가계부·공간 관리·멤버 초대·광고는 나이와 동의 상태에 맞게 제한됩니다.
      </p>
    </section>
  );
}
