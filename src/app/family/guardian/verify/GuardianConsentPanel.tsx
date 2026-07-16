'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, MailCheck, ShieldCheck } from 'lucide-react';

type ConsentType = 'service_registration' | 'personal_data_processing' | 'family_data_sharing';

const CONSENTS: Array<{ type: ConsentType; title: string; description: string; href: string }> = [
  {
    type: 'service_registration',
    title: '자녀의 글리움 가입 및 이용에 동의',
    description: '자녀 계정 생성과 연령에 맞춘 제한형 서비스 이용에 동의합니다.',
    href: '/legal/terms',
  },
  {
    type: 'personal_data_processing',
    title: '자녀 개인정보 수집·이용에 동의',
    description: '이름, 생년월일, 로그인 이메일과 서비스 이용에 필요한 정보를 처리합니다.',
    href: '/legal/privacy',
  },
  {
    type: 'family_data_sharing',
    title: '가족 공간 내 정보 공유에 동의',
    description: '승인 후 가족 공간 일정과 루틴 등 허용된 정보가 구성원 사이에 공유됩니다.',
    href: '/legal/privacy#children',
  },
];

export function GuardianConsentPanel({ token, desktop }: { token: string; desktop: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ConsentType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ spaceId: string } | null>(null);
  const [error, setError] = useState('');
  const allSelected = CONSENTS.every(({ type }) => selected.includes(type));

  const toggle = (type: ConsentType) => {
    setSelected((current) => current.includes(type)
      ? current.filter((value) => value !== type)
      : [...current, type]);
  };

  const complete = async () => {
    if (!allSelected || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/spaces/children/guardian-verification/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, consentTypes: selected }),
      });
      const payload = await response.json() as { spaceId?: string; error?: string };
      if (!response.ok || !payload.spaceId) throw new Error(payload.error ?? 'guardian_consent_failed');
      setResult({ spaceId: payload.spaceId });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      setError(message === 'verification_expired'
        ? '확인 링크가 만료되었습니다. 자녀 관리 화면에서 다시 발송해 주세요.'
        : '확인을 완료하지 못했습니다. 링크가 이미 사용되었는지 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!/^gev_[a-f0-9]{64}$/.test(token)) {
    return <StateCard title="유효하지 않은 확인 링크입니다" description="자녀 관리 화면에서 보호자 확인 메일을 다시 요청해 주세요." />;
  }

  if (result) {
    return (
      <StateCard
        title="보호자 확인이 완료되었습니다"
        description="이제 자녀에게 일회성 초대 링크를 직접 공유할 수 있습니다."
        action={<button onClick={() => router.replace(`/space/children?sid=${encodeURIComponent(result.spaceId)}`)} style={primaryButtonStyle}><CheckCircle2 size={18} /> 자녀 관리로 돌아가기</button>}
      />
    );
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--theme-bg)', color: 'var(--theme-text)', padding: desktop ? '64px 32px' : '28px 16px' }}>
      <div style={{ maxWidth: desktop ? '760px' : '600px', margin: '0 auto' }}>
        <div style={{ width: '56px', height: '56px', display: 'grid', placeItems: 'center', borderRadius: '20px', background: 'rgba(12,201,181,0.12)', marginBottom: '18px' }}>
          <MailCheck size={27} color="#0A8F69" />
        </div>
        <p style={{ margin: '0 0 8px', color: '#0CC9B5', fontSize: '12px', fontWeight: 900, letterSpacing: '0.12em' }}>GUARDIAN CONSENT</p>
        <h1 style={{ margin: '0 0 12px', fontSize: desktop ? '34px' : '27px', fontWeight: 950, letterSpacing: '-0.04em' }}>보호자 확인 및 동의</h1>
        <p style={{ margin: '0 0 26px', color: 'var(--theme-text-muted)', fontSize: '14px', lineHeight: 1.7 }}>
          메일 링크를 연 계정이 자녀를 등록한 보호자 계정인지 확인했습니다. 필수 항목은 묶어서 동의하지 않고 각각 확인받습니다.
        </p>

        <div style={{ display: 'grid', gap: '12px' }}>
          {CONSENTS.map((consent) => {
            const checked = selected.includes(consent.type);
            return (
              <div key={consent.type} style={{ padding: '20px', borderRadius: '24px', border: `1.5px solid ${checked ? '#0084CC' : 'var(--theme-border)'}`, background: checked ? 'rgba(0,132,204,0.06)' : 'var(--theme-surface)' }}>
                <label style={{ display: 'flex', gap: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(consent.type)} style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: '#0084CC', flexShrink: 0 }} />
                  <span>
                    <strong style={{ display: 'block', marginBottom: '6px', fontSize: '15px' }}>{consent.title} <span style={{ color: '#D94C4C' }}>(필수)</span></strong>
                    <span style={{ display: 'block', color: 'var(--theme-text-muted)', fontSize: '13px', lineHeight: 1.6 }}>{consent.description}</span>
                  </span>
                </label>
                <a href={consent.href} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', margin: '12px 0 0 33px', color: '#0084CC', fontSize: '12px', fontWeight: 850, textDecoration: 'none' }}>
                  상세 내용 보기 <ExternalLink size={13} />
                </a>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '11px', padding: '17px', margin: '18px 0', borderRadius: '20px', background: 'var(--theme-surface-muted)', color: 'var(--theme-text-muted)', fontSize: '12px', lineHeight: 1.65 }}>
          <ShieldCheck size={21} color="#0084CC" style={{ flexShrink: 0 }} />
          <span>이 동의에는 자녀 위치 수집·공유 및 마케팅 수신이 포함되지 않습니다. 두 항목은 현재 기본 비활성 상태입니다.</span>
        </div>

        {error && <p role="alert" style={{ color: '#D94C4C', fontSize: '13px', fontWeight: 750, margin: '0 0 12px' }}>{error}</p>}
        <button disabled={!allSelected || submitting} onClick={complete} style={{ ...primaryButtonStyle, width: '100%', minHeight: '52px', opacity: allSelected && !submitting ? 1 : 0.45, cursor: allSelected && !submitting ? 'pointer' : 'not-allowed' }}>
          {submitting ? '동의 기록 중...' : '모든 필수 항목 확인 및 동의'}
        </button>
      </div>
    </main>
  );
}

function StateCard({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '24px', background: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div style={{ maxWidth: '460px', padding: '30px', borderRadius: '24px', border: '1px solid var(--theme-border)', background: 'var(--theme-surface)', textAlign: 'center' }}>
        <CheckCircle2 size={34} color="#0A8F69" />
        <h1 style={{ margin: '16px 0 9px', fontSize: '22px' }}>{title}</h1>
        <p style={{ margin: '0 0 20px', color: 'var(--theme-text-muted)', fontSize: '14px', lineHeight: 1.7 }}>{description}</p>
        {action}
      </div>
    </main>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  minHeight: '46px', padding: '0 20px', border: 0, borderRadius: '999px',
  background: '#0084CC', color: 'white', fontSize: '14px', fontWeight: 900,
};
