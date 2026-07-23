'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AtSign,
  Check,
  CheckCircle2,
  KeyRound,
  MailCheck,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { GUARDIAN_EMAIL_OTP_LENGTH } from '@/lib/guardian-consent';
import type { FamilyDependent, FamilyDependentStatus } from '@/types';
import { ChildInviteShareSheet } from './ChildInviteShareSheet';

type Props = {
  desktop: boolean;
  spaceId: string;
};

const STATUS_META: Record<FamilyDependentStatus, { label: string; description: string }> = {
  consent_pending: { label: '보호자 확인 필요', description: `보호자 이메일로 받은 ${GUARDIAN_EMAIL_OTP_LENGTH}자리 코드 확인과 필수 동의를 진행해 주세요.` },
  ready: { label: '초대 준비 완료', description: '자녀에게 보낼 일회성 초대 링크를 만들 수 있습니다.' },
  invited: { label: '초대 전송 가능', description: '기존 링크를 잃어버렸다면 새 링크를 발급할 수 있습니다.' },
  approval_pending: { label: '최종 승인 대기', description: '초대 링크를 사용한 계정이 연결을 요청했습니다. 계정을 확인한 뒤 승인하거나 거절해 주세요.' },
  linked: { label: '연결 완료', description: '가족 공간 멤버로 안전하게 연결되었습니다.' },
  suspended: { label: '이용 중지', description: '자녀 계정 이용이 일시 중지되었습니다.' },
  unlinked: { label: '연결 해제', description: '자녀 계정 연결이 해제되었습니다.' },
};

async function parseError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => ({})) as { error?: string };
  return payload.error ?? 'unknown_error';
}

export function SpaceChildrenManager({ desktop, spaceId }: Props) {
  const router = useRouter();
  const [dependents, setDependents] = useState<FamilyDependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEmailRestriction, setShowEmailRestriction] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [otpChallenge, setOtpChallenge] = useState<{
    dependentId: string;
    displayName: string;
    email: string;
    challengeToken: string;
    expiresAt: string;
  } | null>(null);
  const [inviteSheet, setInviteSheet] = useState<{
    displayName: string;
    inviteUrl: string;
    expiresAt: string;
  } | null>(null);
  const [form, setForm] = useState({
    displayName: '',
    birthDate: '',
    expectedEmail: '',
    relationshipType: 'parent',
  });

  const loadDependents = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/spaces/children?spaceId=${encodeURIComponent(spaceId)}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(await parseError(response));
      const payload = await response.json() as { dependents: FamilyDependent[] };
      setDependents(payload.dependents);
    } catch (error) {
      console.error('[SpaceChildrenManager/load]', error);
      toast.error('자녀 정보를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- route 진입 시 서버 목록 동기화
    void loadDependents();
  }, [loadDependents]);

  const submitDependent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.displayName.trim() || !form.birthDate) return;
    setSaving(true);
    try {
      const response = await fetch('/api/spaces/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, spaceId }),
      });
      if (!response.ok) throw new Error(await parseError(response));
      setForm({ displayName: '', birthDate: '', expectedEmail: '', relationshipType: 'parent' });
      setShowEmailRestriction(false);
      setShowForm(false);
      toast.success('자녀 정보가 등록되었습니다');
      await loadDependents();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const errorMessage = message === 'expected_email_already_registered'
        ? '이미 등록된 자녀 이메일입니다'
        : message === 'guardian_email_cannot_be_child_email'
          ? '보호자 본인 이메일은 자녀 연결 계정으로 지정할 수 없습니다'
          : '자녀 정보를 등록하지 못했습니다';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const startVerification = async (dependent: FamilyDependent) => {
    setBusyId(dependent.id);
    try {
      const response = await fetch(`/api/spaces/children/${dependent.id}/guardian-verification/start`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(await parseError(response));
      const payload = await response.json() as {
        email: string;
        challengeToken: string;
        expiresAt: string;
      };
      setOtpChallenge({
        dependentId: dependent.id,
        displayName: dependent.displayName,
        email: payload.email,
        challengeToken: payload.challengeToken,
        expiresAt: payload.expiresAt,
      });
      setVerificationCode('');
      toast.success(`${payload.email}로 ${GUARDIAN_EMAIL_OTP_LENGTH}자리 확인 코드를 보냈습니다`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      toast.error(message === 'verification_rate_limited'
        ? '1분 후 다시 요청해 주세요'
        : '확인 메일을 보내지 못했습니다');
    } finally {
      setBusyId(null);
    }
  };

  const verifyGuardianCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !otpChallenge
      || verificationCode.length !== GUARDIAN_EMAIL_OTP_LENGTH
      || verifyingCode
    ) return;
    setVerifyingCode(true);
    try {
      const response = await fetch('/api/spaces/children/guardian-verification/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verificationCode,
          challengeToken: otpChallenge.challengeToken,
        }),
      });
      const payload = await response.json() as { nextPath?: string; error?: string };
      if (!response.ok || !payload.nextPath) {
        throw new Error(payload.error ?? 'invalid_verification_code');
      }
      toast.success('보호자 이메일이 확인되었습니다');
      router.push(payload.nextPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      toast.error(message === 'verification_expired'
        ? '확인 코드가 만료되었습니다. 새 코드를 받아 주세요'
        : '확인 코드가 올바르지 않습니다');
    } finally {
      setVerifyingCode(false);
    }
  };

  const createInvite = async (dependent: FamilyDependent) => {
    setBusyId(dependent.id);
    try {
      const response = await fetch(`/api/spaces/children/${dependent.id}/invite`, { method: 'POST' });
      if (!response.ok) throw new Error(await parseError(response));
      const payload = await response.json() as { inviteUrl: string; expiresAt: string };
      setInviteSheet({
        displayName: dependent.displayName,
        inviteUrl: payload.inviteUrl,
        expiresAt: payload.expiresAt,
      });
      await loadDependents();
    } catch (error) {
      console.error('[SpaceChildrenManager/share]', error);
      toast.error('초대 링크를 만들지 못했습니다');
    } finally {
      setBusyId(null);
    }
  };

  const rejectLink = async (dependent: FamilyDependent) => {
    if (!window.confirm(`${dependent.candidateEmail ?? '이 계정'}의 연결 요청을 거절할까요? 새 초대 링크를 다시 보낼 수 있습니다.`)) {
      return;
    }
    setBusyId(dependent.id);
    try {
      const response = await fetch(`/api/spaces/children/${dependent.id}/reject`, { method: 'POST' });
      if (!response.ok) throw new Error(await parseError(response));
      toast.success('연결 요청을 거절했습니다');
      await loadDependents();
    } catch (error) {
      console.error('[SpaceChildrenManager/reject]', error);
      toast.error('연결 요청을 거절하지 못했습니다');
    } finally {
      setBusyId(null);
    }
  };

  const approveLink = async (dependent: FamilyDependent) => {
    setBusyId(dependent.id);
    try {
      const response = await fetch(`/api/spaces/children/${dependent.id}/approve`, { method: 'POST' });
      if (!response.ok) throw new Error(await parseError(response));
      toast.success('자녀 계정 연결을 승인했습니다');
      await loadDependents();
    } catch (error) {
      console.error('[SpaceChildrenManager/approve]', error);
      toast.error('자녀 연결을 승인하지 못했습니다');
    } finally {
      setBusyId(null);
    }
  };

  const pagePadding = desktop
    ? '48px 40px 72px'
    : 'calc(max(var(--app-safe-top), 24px) + 20px) max(16px, var(--app-safe-right)) calc(max(var(--app-safe-bottom), 24px) + 40px) max(16px, var(--app-safe-left))';
  const contentWidth = desktop ? '1120px' : '640px';

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      <div style={{ maxWidth: contentWidth, margin: '0 auto', padding: pagePadding }}>
        <header style={{ display: 'flex', flexDirection: desktop ? 'row' : 'column', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '28px' }}>
          <div>
            <button
              onClick={() => router.push('/space')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', minHeight: '44px', padding: '0 14px', borderRadius: '999px', border: '1px solid var(--theme-border)', background: 'var(--theme-surface)', color: 'var(--theme-text-muted)', fontWeight: 800, cursor: 'pointer', marginBottom: '16px' }}
            >
              <ArrowLeft size={17} /> 가족 공간
            </button>
            <p style={{ margin: '0 0 7px', color: '#0CC9B5', fontSize: '12px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Family Access
            </p>
            <h1 style={{ margin: '0 0 10px', fontSize: desktop ? '34px' : '27px', lineHeight: 1.15, fontWeight: 950, letterSpacing: '-0.04em' }}>
              자녀 계정 연결
            </h1>
            <p style={{ margin: 0, color: 'var(--theme-text-muted)', fontSize: '14px', lineHeight: 1.7, maxWidth: '650px' }}>
              자녀 이메일을 미리 몰라도 등록할 수 있습니다. 보호자 확인, 1회성 초대, 연결 계정 검토와 최종 승인을 모두 거쳐야 공간 접근이 열립니다.
            </p>
          </div>
          <button
            onClick={() => setShowForm((value) => !value)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '48px', padding: '0 20px', borderRadius: '999px', border: 0, background: '#0084CC', color: 'white', fontWeight: 900, cursor: 'pointer', flexShrink: 0 }}
          >
            <Plus size={18} /> {desktop ? '자녀 등록' : '등록'}
          </button>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: desktop ? 'repeat(3, minmax(0, 1fr))' : '1fr', gap: '12px', marginBottom: '24px' }}>
          {[
            { icon: MailCheck, title: '1. 보호자 확인', text: `로그인 이메일로 받은 ${GUARDIAN_EMAIL_OTP_LENGTH}자리 코드 확인 후 필수 항목을 각각 동의합니다.` },
            { icon: Send, title: '2. 안전하게 공유', text: '문자·카카오톡·QR 중 편한 방법으로 72시간 일회성 초대를 전달합니다.' },
            { icon: UserRoundCheck, title: '3. 계정 확인·승인', text: '링크를 사용한 계정을 직접 확인하고 승인하기 전에는 공간 권한이 생기지 않습니다.' },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} style={{ padding: '20px', borderRadius: '24px', background: 'var(--theme-surface-muted)', border: '1px solid var(--theme-border)' }}>
              <Icon size={22} color="#0084CC" />
              <h2 style={{ margin: '13px 0 7px', fontSize: '15px', fontWeight: 900 }}>{title}</h2>
              <p style={{ margin: 0, color: 'var(--theme-text-muted)', fontSize: '13px', lineHeight: 1.6 }}>{text}</p>
            </article>
          ))}
        </section>

        {otpChallenge && (
          <form
            onSubmit={verifyGuardianCode}
            style={{
              padding: desktop ? '26px' : '20px',
              marginBottom: '24px',
              borderRadius: '24px',
              background: 'var(--theme-surface)',
              border: '1.5px solid #0084CC',
              boxShadow: '0 8px 32px rgba(0,132,204,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: '#0084CC', fontSize: '12px', fontWeight: 900 }}>
                  <KeyRound size={16} /> 보호자 이메일 확인
                </div>
                <h2 style={{ margin: '9px 0 6px', fontSize: '19px', fontWeight: 950 }}>
                  {otpChallenge.displayName}님의 확인 코드를 입력해 주세요
                </h2>
                <p style={{ margin: 0, color: 'var(--theme-text-muted)', fontSize: '13px', lineHeight: 1.6, overflowWrap: 'anywhere' }}>
                  {otpChallenge.email}로 발송된 {GUARDIAN_EMAIL_OTP_LENGTH}자리 코드이며 30분 동안 유효합니다.
                </p>
              </div>
              <button
                type="button"
                aria-label="확인 코드 입력 닫기"
                onClick={() => {
                  setOtpChallenge(null);
                  setVerificationCode('');
                }}
                style={{ width: '40px', height: '40px', display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: '999px', border: '1px solid var(--theme-border)', background: 'var(--theme-surface-muted)', color: 'var(--theme-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: desktop ? 'row' : 'column', alignItems: desktop ? 'flex-end' : 'stretch', gap: '12px', marginTop: '20px' }}>
              <Field label="이메일 확인 코드">
                <input
                  required
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={`이메일로 받은 ${GUARDIAN_EMAIL_OTP_LENGTH}자리 확인 코드`}
                  maxLength={GUARDIAN_EMAIL_OTP_LENGTH}
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(
                    event.target.value.replace(/\D/g, '').slice(0, GUARDIAN_EMAIL_OTP_LENGTH),
                  )}
                  placeholder="00000000"
                  style={{
                    ...inputStyle,
                    minWidth: desktop ? '260px' : undefined,
                    textAlign: 'center',
                    fontSize: '22px',
                    fontWeight: 900,
                    letterSpacing: '0.3em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
              </Field>
              <button
                type="submit"
                disabled={verificationCode.length !== GUARDIAN_EMAIL_OTP_LENGTH || verifyingCode}
                style={{
                  ...primaryButtonStyle,
                  minHeight: '50px',
                  opacity: verificationCode.length === GUARDIAN_EMAIL_OTP_LENGTH && !verifyingCode ? 1 : 0.45,
                  cursor: verificationCode.length === GUARDIAN_EMAIL_OTP_LENGTH && !verifyingCode ? 'pointer' : 'not-allowed',
                }}
              >
                <ShieldCheck size={17} /> {verifyingCode ? '확인 중...' : '코드 확인'}
              </button>
              <button
                type="button"
                disabled={busyId === otpChallenge.dependentId}
                onClick={() => {
                  const dependent = dependents.find(({ id }) => id === otpChallenge.dependentId);
                  if (dependent) void startVerification(dependent);
                }}
                style={{ ...secondaryButtonStyle, minHeight: '50px' }}
              >
                <RotateCcw size={16} /> 코드 다시 받기
              </button>
            </div>
          </form>
        )}

        {showForm && (
          <form onSubmit={submitDependent} style={{ padding: desktop ? '26px' : '20px', marginBottom: '24px', borderRadius: '24px', background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', boxShadow: '0 8px 32px rgba(0,132,204,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: desktop ? '1fr 1fr' : '1fr', gap: '16px' }}>
              <Field label="자녀 이름">
                <input required maxLength={40} value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="서비스에서 구분할 이름" style={inputStyle} />
              </Field>
              <Field label="생년월일">
                <input required type="date" max={new Date().toISOString().slice(0, 10)} value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))} style={inputStyle} />
              </Field>
              <Field label="보호자 관계">
                <select value={form.relationshipType} onChange={(event) => setForm((current) => ({ ...current, relationshipType: event.target.value }))} style={inputStyle}>
                  <option value="parent">부모</option>
                  <option value="guardian">법정대리인</option>
                </select>
              </Field>
            </div>
            <div style={{ marginTop: '16px', padding: '16px', borderRadius: '20px', background: 'var(--theme-surface-muted)', border: '1px solid var(--theme-border)' }}>
              <button
                type="button"
                onClick={() => {
                  setShowEmailRestriction((current) => !current);
                  if (showEmailRestriction) {
                    setForm((current) => ({ ...current, expectedEmail: '' }));
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: 0, border: 0, background: 'transparent', color: 'var(--theme-text)', fontSize: '13px', fontWeight: 850, cursor: 'pointer', textAlign: 'left' }}
              >
                <AtSign size={17} color="#0084CC" />
                연결할 계정 이메일을 미리 제한하기
                <span style={{ marginLeft: 'auto', color: 'var(--theme-text-subtle)', fontSize: '11px' }}>선택</span>
              </button>
              {showEmailRestriction && (
                <div style={{ marginTop: '14px' }}>
                  <Field label="연결 허용 이메일">
                    <input type="email" value={form.expectedEmail} onChange={(event) => setForm((current) => ({ ...current, expectedEmail: event.target.value }))} placeholder="child@example.com" style={inputStyle} />
                  </Field>
                  <p style={{ margin: '8px 2px 0', color: 'var(--theme-text-subtle)', fontSize: '12px', lineHeight: 1.55 }}>
                    입력하면 이 이메일로 확인된 계정만 초대를 사용할 수 있습니다. 모르면 비워 두세요.
                  </p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={secondaryButtonStyle}>취소</button>
              <button type="submit" disabled={saving} style={primaryButtonStyle}>{saving ? '등록 중...' : '등록하고 확인 시작'}</button>
            </div>
          </form>
        )}

        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>등록된 자녀</h2>
            <span style={{ color: 'var(--theme-text-subtle)', fontSize: '13px', fontWeight: 800 }}>{dependents.length}명</span>
          </div>

          {loading ? (
            <div style={emptyStyle}>자녀 정보를 불러오는 중입니다.</div>
          ) : dependents.length === 0 ? (
            <div style={emptyStyle}>
              <UsersRound size={30} color="#0084CC" />
              <strong>등록된 자녀가 없습니다</strong>
              <span>먼저 자녀의 이름과 생년월일을 등록해 주세요. 계정은 초대 단계에서 안전하게 연결합니다.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: desktop ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: '14px' }}>
              {dependents.map((dependent) => {
                const meta = STATUS_META[dependent.status];
                const busy = busyId === dependent.id;
                return (
                  <article key={dependent.id} style={{ padding: '22px', borderRadius: '24px', background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 5px', fontSize: '18px', fontWeight: 900 }}>{dependent.displayName}</h3>
                        <p style={{ margin: 0, color: 'var(--theme-text-subtle)', fontSize: '12px', overflowWrap: 'anywhere' }}>
                          {dependent.candidateEmail
                            ? `연결 요청: ${dependent.candidateEmail}`
                            : dependent.expectedEmail
                              ? `허용 계정: ${dependent.expectedEmail}`
                              : '연결 계정은 초대 수락 후 확인'}
                        </p>
                      </div>
                      <span style={{ padding: '7px 10px', borderRadius: '999px', color: dependent.status === 'linked' ? '#0A8F69' : '#0084CC', background: dependent.status === 'linked' ? 'rgba(46,232,149,0.12)' : 'rgba(0,132,204,0.09)', fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap' }}>
                        {meta.label}
                      </span>
                    </div>
                    <p style={{ margin: '16px 0', minHeight: desktop ? '42px' : undefined, color: 'var(--theme-text-muted)', fontSize: '13px', lineHeight: 1.6 }}>{meta.description}</p>
                    {dependent.status === 'approval_pending' && dependent.candidateEmail && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '13px 14px', margin: '0 0 14px', borderRadius: '18px', background: 'var(--theme-surface-muted)', border: '1px solid var(--theme-border)' }}>
                        <UserRoundCheck size={18} color="#0084CC" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ display: 'block', color: 'var(--theme-text)', fontSize: '12px', overflowWrap: 'anywhere' }}>{dependent.candidateEmail}</strong>
                          <span style={{ color: 'var(--theme-text-subtle)', fontSize: '11px' }}>
                            {dependent.candidateProvider === 'google' ? 'Google 로그인' : '이메일 로그인'} · 이메일 확인 완료
                          </span>
                        </div>
                      </div>
                    )}
                    <DependentAction dependent={dependent} busy={busy} onVerify={startVerification} onInvite={createInvite} onApprove={approveLink} onReject={rejectLink} />
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside style={{ display: 'flex', gap: '12px', padding: '18px', marginTop: '22px', borderRadius: '20px', background: 'rgba(0,132,204,0.07)', color: 'var(--theme-text-muted)', fontSize: '12px', lineHeight: 1.65 }}>
          <ShieldCheck size={22} color="#0084CC" style={{ flexShrink: 0 }} />
          <span>현재 위치 수집·공유 동의는 이 절차에 포함되지 않으며 기능도 비활성 상태입니다. 위치 기능은 별도 동의와 본인확인 체계를 갖춘 뒤에만 제공합니다.</span>
        </aside>
      </div>
      {inviteSheet && (
        <ChildInviteShareSheet
          desktop={desktop}
          displayName={inviteSheet.displayName}
          inviteUrl={inviteSheet.inviteUrl}
          expiresAt={inviteSheet.expiresAt}
          onClose={() => setInviteSheet(null)}
        />
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '8px', color: 'var(--theme-text)', fontSize: '13px', fontWeight: 800 }}>
      {label}
      {children}
    </label>
  );
}

function DependentAction({
  dependent,
  busy,
  onVerify,
  onInvite,
  onApprove,
  onReject,
}: {
  dependent: FamilyDependent;
  busy: boolean;
  onVerify: (dependent: FamilyDependent) => void;
  onInvite: (dependent: FamilyDependent) => void;
  onApprove: (dependent: FamilyDependent) => void;
  onReject: (dependent: FamilyDependent) => void;
}) {
  if (dependent.status === 'consent_pending') {
    return <button disabled={busy} onClick={() => onVerify(dependent)} style={primaryButtonStyle}><MailCheck size={17} />{busy ? '발송 중...' : '내 이메일로 확인하기'}</button>;
  }
  if (dependent.status === 'ready' || dependent.status === 'invited') {
    return <button disabled={busy} onClick={() => onInvite(dependent)} style={primaryButtonStyle}><Send size={17} />{busy ? '준비 중...' : '초대 링크 공유'}</button>;
  }
  if (dependent.status === 'approval_pending') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
        <button disabled={busy} onClick={() => onReject(dependent)} style={secondaryButtonStyle}>
          <X size={17} /> 거절
        </button>
        <button disabled={busy} onClick={() => onApprove(dependent)} style={{ ...primaryButtonStyle, background: '#0A8F69' }}>
          <Check size={17} />{busy ? '처리 중...' : '최종 승인'}
        </button>
      </div>
    );
  }
  if (dependent.status === 'linked') {
    return <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px', color: '#0A8F69', fontSize: '13px', fontWeight: 900 }}><CheckCircle2 size={19} /> 연결이 완료되었습니다</div>;
  }
  return null;
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: '50px', padding: '0 15px', boxSizing: 'border-box',
  borderRadius: '16px', border: '1.5px solid var(--theme-border)',
  background: 'var(--theme-surface-muted)', color: 'var(--theme-text)',
  fontSize: '15px', fontWeight: 650, outline: 'none', colorScheme: 'light dark',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  minHeight: '44px', padding: '0 18px', borderRadius: '999px', border: 0,
  background: '#0084CC', color: 'white', fontSize: '13px', fontWeight: 900, cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  minHeight: '44px', padding: '0 18px', borderRadius: '999px',
  border: '1px solid var(--theme-border)', background: 'var(--theme-surface-muted)',
  color: 'var(--theme-text-muted)', fontSize: '13px', fontWeight: 850, cursor: 'pointer',
};

const emptyStyle: React.CSSProperties = {
  minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  gap: '10px', padding: '28px', borderRadius: '24px', border: '1px dashed var(--theme-border)',
  background: 'var(--theme-surface-muted)', color: 'var(--theme-text-muted)', textAlign: 'center', fontSize: '13px',
};
