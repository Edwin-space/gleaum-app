'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAccountCapability, useAccountSession } from '@/components/AccountSessionProvider';
import type { AccountCapability } from '@/lib/account-capabilities';

interface AccountCapabilityGateProps {
  capability: AccountCapability;
  children: ReactNode;
  title: string;
  description: string;
}

export function AccountCapabilityGate({
  capability,
  children,
  title,
  description,
}: AccountCapabilityGateProps) {
  const { status } = useAccountSession();
  const allowed = useAccountCapability(capability);

  if (status === 'loading') {
    return (
      <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', color: 'var(--theme-text-subtle)' }}>
        권한을 확인하고 있습니다.
      </main>
    );
  }

  if (!allowed) {
    return (
      <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '20px' }}>
        <section style={{ width: '100%', maxWidth: '430px', padding: '24px', borderRadius: '24px', background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', boxShadow: 'var(--theme-shadow-card)', textAlign: 'center' }}>
          <div aria-hidden="true" style={{ width: '48px', height: '48px', margin: '0 auto 16px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(12,201,181,0.10)', color: '#0CC9B5', fontSize: '22px' }}>🔒</div>
          <h1 style={{ margin: '0 0 8px', color: 'var(--theme-text)', fontSize: '20px', fontWeight: 800 }}>{title}</h1>
          <p style={{ margin: '0 0 20px', color: 'var(--theme-text-muted)', fontSize: '14px', lineHeight: 1.6 }}>{description}</p>
          <Link href="/home" style={{ minHeight: '44px', padding: '0 24px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#0084CC', color: 'white', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            홈으로 이동
          </Link>
        </section>
      </main>
    );
  }

  return children;
}
