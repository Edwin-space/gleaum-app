'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { getNativePlatform, isNativeApp } from '@/lib/native';
import {
  authenticateForAppUnlock,
  getBiometricAvailability,
  getBiometricLockScopes,
  getBiometricRelockInterval,
  hasPinCode,
  isBiometricLockEnabled,
  removePinCode,
  setBiometricLockEnabled,
  setBiometricLockScopes,
  setBiometricRelockInterval,
  setPinCode,
  verifyPinCode,
  type BiometricLockScope,
  type BiometricRelockInterval,
  type NativeBiometricAvailability,
} from '@/lib/native-biometric';

const SCOPE_OPTIONS: Array<{ key: BiometricLockScope; label: string; description: string }> = [
  { key: 'app', label: '앱 시작/복귀', description: '앱을 열거나 다시 돌아올 때 잠금을 확인합니다.' },
  { key: 'budget', label: '가계부', description: '개인 지출과 자금 흐름 화면을 보호합니다.' },
  { key: 'spaceSettings', label: '공간 설정/초대', description: '공간 멤버, 역할, 초대 관리 화면을 보호합니다.' },
  { key: 'accountSettings', label: '계정/보안 설정', description: '마이페이지와 보안 설정 화면을 보호합니다.' },
];

const INTERVAL_OPTIONS: Array<{ key: BiometricRelockInterval; label: string; description: string }> = [
  { key: 'always', label: '항상 확인', description: '보호 구간에 접근할 때마다 인증합니다.' },
  { key: '5m', label: '5분 유지', description: '인증 후 5분 동안 다시 묻지 않습니다.' },
  { key: '15m', label: '15분 유지', description: '짧은 사용 흐름을 끊지 않는 기본형입니다.' },
  { key: '30m', label: '30분 유지', description: '자주 오가는 사용자에게 적합합니다.' },
];

function biometryLabel(availability: NativeBiometricAvailability): string {
  if (!isNativeApp()) return '웹에서는 앱 전용 기능으로 표시됩니다';
  if (!availability.available) return '사용 불가';
  if (availability.biometryType === 'faceId') return 'Face ID 사용 가능';
  if (availability.biometryType === 'touchId') return 'Touch ID 사용 가능';
  if (availability.biometryType === 'fingerprint') return '지문 인증 사용 가능';
  if (availability.biometryType === 'deviceCredential') return '기기 암호 잠금 사용 가능';
  return '생체인증 사용 가능';
}

function unavailableHelp(availability: NativeBiometricAvailability): string {
  if (!isNativeApp()) return '생체인증 앱 잠금은 Android/iOS 앱에서만 사용할 수 있어요.';
  if (availability.available) return '이 기기에서 사용할 수 있어요.';
  if (availability.reason === 'biometry_not_enrolled') return 'Face ID/Touch ID가 등록되어 있지 않지만, 기기 암호가 설정되어 있으면 앱 잠금으로 사용할 수 있어요.';
  if (availability.reason === 'passcode_not_set') return '휴대폰 설정에서 기기 암호를 먼저 등록해야 앱 잠금을 사용할 수 있어요.';
  return '휴대폰 설정에서 지문, Face ID 또는 기기 잠금을 먼저 등록해야 사용할 수 있어요.';
}

function Toggle({ checked, disabled, onClick }: { checked: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 52,
        height: 30,
        border: 'none',
        borderRadius: 999,
        padding: 3,
        background: checked ? '#0084CC' : '#E8E8E4',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'background 0.2s ease, opacity 0.2s ease',
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          display: 'block',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'var(--theme-surface)',
          transform: checked ? 'translateX(22px)' : 'translateX(0)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          transition: 'transform 0.2s ease',
        }}
      />
    </button>
  );
}

function CheckIcon({ active }: { active: boolean }) {
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: active ? '#0084CC' : '#F5F5F3',
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 900,
      }}
    >
      {active ? '✓' : ''}
    </span>
  );
}

export function SecuritySettingsContent({ desktop = false }: { desktop?: boolean }) {
  const native = isNativeApp();
  const platform = getNativePlatform();
  const [availability, setAvailability] = useState<NativeBiometricAvailability>({ available: false, biometryType: 'none' });
  const [enabled, setEnabled] = useState(false);
  const [pinExists, setPinExists] = useState(false);
  const [scopes, setScopes] = useState<BiometricLockScope[]>(['app']);
  const [interval, setIntervalState] = useState<BiometricRelockInterval>('always');
  const [busy, setBusy] = useState(false);

  // PIN 설정 모달 상태
  const [showPinSetup, setShowPinSetup] = useState<'idle' | 'enter' | 'confirm' | 'change-old' | 'change-new' | 'change-confirm'>('idle');
  const [pinInput, setPinInput] = useState('');
  const [pinFirst, setPinFirst] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const platformLabel = useMemo(() => {
    if (!native) return 'Web';
    return platform === 'ios' ? 'iOS 앱' : platform === 'android' ? 'Android 앱' : 'Native 앱';
  }, [native, platform]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [nextAvailability, nextEnabled, nextScopes, nextInterval, nextPinExists] = await Promise.all([
        getBiometricAvailability(),
        isBiometricLockEnabled(),
        getBiometricLockScopes(),
        getBiometricRelockInterval(),
        hasPinCode(),
      ]);
      if (!mounted) return;
      setAvailability(nextAvailability);
      setEnabled(nextEnabled);
      setScopes(nextScopes);
      setIntervalState(nextInterval);
      setPinExists(nextPinExists);
    }
    void load();
    return () => { mounted = false; };
  }, []);

  const toggleEnabled = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (enabled) {
        await setBiometricLockEnabled(false);
        setEnabled(false);
        return;
      }

      const nextAvailability = await getBiometricAvailability();
      setAvailability(nextAvailability);
      if (!nextAvailability.available) {
        alert(unavailableHelp(nextAvailability));
        return;
      }

      const ok = await authenticateForAppUnlock('글리움 보안 설정을 켜기 위해 본인 확인이 필요합니다.');
      if (!ok) {
        alert('인증이 완료되어야 생체인증 잠금을 켤 수 있습니다.');
        return;
      }

      // 생체인식 활성화 후 PIN 설정 (폴백 비상용)
      const alreadyHasPin = await hasPinCode();
      if (!alreadyHasPin) {
        // PIN 설정 모달 표시 (setBiometricLockEnabled는 PIN 설정 완료 후 호출)
        setPinInput('');
        setPinFirst('');
        setPinError('');
        setShowPinSetup('enter');
        return; // PIN 설정 완료 콜백에서 setEnabled(true) 처리
      }

      await setBiometricLockEnabled(true);
      setEnabled(true);
    } finally {
      setBusy(false);
    }
  };

  // PIN 키 입력 핸들러 (설정 화면용)
  const handlePinKey = async (key: string) => {
    if (key === '⌫') { setPinInput(p => p.slice(0, -1)); setPinError(''); return; }
    if (pinInput.length >= 6) return;
    const next = pinInput + key;
    setPinInput(next);
    if (next.length < 6) return;

    // 6자리 완성
    if (showPinSetup === 'enter') {
      setPinFirst(next); setPinInput(''); setShowPinSetup('confirm');
    } else if (showPinSetup === 'confirm') {
      if (next !== pinFirst) {
        setPinError('PIN이 일치하지 않아요. 처음부터 다시 입력해 주세요.');
        setPinInput(''); setPinFirst(''); setShowPinSetup('enter');
        return;
      }
      setPinLoading(true);
      await setPinCode(next);
      await setBiometricLockEnabled(true);
      setPinLoading(false);
      setPinExists(true);
      setEnabled(true);
      setShowPinSetup('idle');
    } else if (showPinSetup === 'change-old') {
      const valid = await verifyPinCode(next);
      if (!valid) {
        setPinError('현재 PIN이 일치하지 않아요.');
        setPinInput(''); return;
      }
      setPinInput(''); setShowPinSetup('change-new');
    } else if (showPinSetup === 'change-new') {
      setPinFirst(next); setPinInput(''); setShowPinSetup('change-confirm');
    } else if (showPinSetup === 'change-confirm') {
      if (next !== pinFirst) {
        setPinError('PIN이 일치하지 않아요.'); setPinInput('');
        setPinFirst(''); setShowPinSetup('change-new'); return;
      }
      setPinLoading(true);
      await setPinCode(next);
      setPinLoading(false);
      setShowPinSetup('idle');
    }
  };

  const handleRemovePin = async () => {
    if (!confirm('PIN을 삭제하면 생체인식 실패 시 잠금을 해제할 수 없어요. 삭제하시겠어요?')) return;
    await removePinCode();
    setPinExists(false);
  };

  const toggleScope = async (scope: BiometricLockScope) => {
    const next = scopes.includes(scope) ? scopes.filter((item) => item !== scope) : [...scopes, scope];
    const normalized: BiometricLockScope[] = next.length > 0 ? next : ['app'];
    setScopes(normalized);
    await setBiometricLockScopes(normalized);
  };

  const updateInterval = async (next: BiometricRelockInterval) => {
    setIntervalState(next);
    await setBiometricRelockInterval(next);
  };

  const pageStyle: CSSProperties = {
    minHeight: '100dvh',
    background: 'var(--theme-bg, #FAFAFD)',
    paddingBottom: desktop ? 0 : 'var(--scroll-bottom, calc(env(safe-area-inset-bottom) + 80px))',
  };

  const mainStyle: CSSProperties = {
    maxWidth: desktop ? 1120 : 760,
    margin: '0 auto',
    padding: desktop ? '32px 32px 72px' : '22px 20px 48px',
    display: 'grid',
    gridTemplateColumns: desktop ? '0.9fr 1.1fr' : '1fr',
    gap: desktop ? 24 : 16,
  };

  const cardStyle: CSSProperties = {
    background: 'var(--theme-surface, rgba(255,255,255,0.88))',
    border: '1px solid var(--theme-border, rgba(255,255,255,0.8))',
    borderRadius: 24,
    boxShadow: 'var(--theme-shadow-card, 0 8px 32px rgba(0,132,204,0.08))',
    padding: desktop ? 24 : 20,
  };

  const mutedText: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--theme-text-subtle, #6E6E66)',
    lineHeight: 1.6,
    margin: 0,
  };

  // ── PIN 숫자 키패드 (설정 화면 인라인) ───────────────────────────────────────
  const PinModal = () => {
    if (showPinSetup === 'idle') return null;
    const titleMap: Record<string, string> = {
      'enter': '비상용 PIN 설정',
      'confirm': 'PIN 한 번 더 입력',
      'change-old': '현재 PIN 입력',
      'change-new': '새 PIN 입력',
      'change-confirm': '새 PIN 한 번 더 입력',
    };
    const descMap: Record<string, string> = {
      'enter': '생체인식 불가 시 사용할 6자리 PIN을 설정해요.',
      'confirm': '앞서 입력한 PIN과 동일하게 입력하세요.',
      'change-old': '현재 설정된 PIN을 입력하세요.',
      'change-new': '새로운 6자리 PIN을 입력하세요.',
      'change-confirm': '새 PIN을 한 번 더 입력하세요.',
    };
    const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={() => { if (!pinLoading) setShowPinSetup('idle'); }}>
        <div style={{ width: '100%', maxWidth: 420, background: 'var(--theme-surface)', borderRadius: '28px 28px 0 0', padding: '24px 24px calc(env(safe-area-inset-bottom) + 24px)', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 36 }}>🔢</span>
            <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 900, color: 'var(--theme-text)' }}>{titleMap[showPinSetup]}</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--theme-text-muted)' }}>{descMap[showPinSetup]}</p>
          </div>
          {/* 점 표시 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '20px 0 8px' }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < pinInput.length ? '#0084CC' : 'rgba(0,0,0,0.12)', transition: 'background 0.15s' }} />
            ))}
          </div>
          {pinError && <p style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', margin: '0 0 8px', fontWeight: 700 }}>{pinError}</p>}
          {/* 키패드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />;
              return (
                <button key={i} onClick={() => handlePinKey(d)} disabled={pinLoading}
                  style={{ height: 58, borderRadius: 14, border: 'none', background: d === '⌫' ? 'transparent' : 'rgba(0,0,0,0.06)', fontSize: d === '⌫' ? 20 : 24, fontWeight: 700, color: 'var(--theme-text)', cursor: 'pointer' }}>
                  {d}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowPinSetup('idle')} disabled={pinLoading}
            style={{ marginTop: 16, width: '100%', height: 48, borderRadius: 14, border: '1px solid var(--theme-border)', background: 'transparent', color: 'var(--theme-text-muted)', fontSize: 14, cursor: 'pointer' }}>
            취소
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      <AppHeader title="보안 설정" showLogo={false} showBack showNotification={false} />
      <PinModal />

      <main style={mainStyle}>
        <section style={{ ...cardStyle, background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)', color: '#FFFFFF', alignSelf: 'start' }}>
          <div style={{ width: 58, height: 58, borderRadius: 20, background: 'rgba(46,232,149,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2EE895" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <p style={{ fontSize: 12, fontWeight: 900, color: '#2EE895', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>{platformLabel}</p>
          <h1 style={{ fontSize: desktop ? 30 : 24, fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 12px' }}>글리움 보안 잠금</h1>
          <p style={{ ...mutedText, color: 'rgba(255,255,255,0.72)' }}>
            일정, 가계부, 공간 초대처럼 민감한 화면에 접근할 때 지문, Face ID 또는 기기 잠금으로 한 번 더 확인합니다.
          </p>
          <div style={{ marginTop: 22, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p style={{ fontSize: 13, fontWeight: 900, margin: '0 0 4px' }}>{biometryLabel(availability)}</p>
            <p style={{ ...mutedText, color: 'rgba(255,255,255,0.62)', fontSize: 12 }}>{unavailableHelp(availability)}</p>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)', margin: '0 0 6px' }}>생체인증 앱 잠금</h2>
                <p style={mutedText}>기기별로 저장되는 설정입니다. 같은 계정이라도 휴대폰마다 따로 관리됩니다.</p>
              </div>
              <Toggle checked={enabled} disabled={busy || !native} onClick={toggleEnabled} />
            </div>
          </div>

          {/* PIN 설정 카드 — 생체인식 활성 시 표시 */}
          {native && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)', margin: '0 0 4px' }}>
                    비상용 PIN
                    {pinExists && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#2EE895', background: 'rgba(46,232,149,0.12)', borderRadius: 6, padding: '2px 7px' }}>설정됨</span>
                    )}
                  </h2>
                  <p style={mutedText}>
                    생체인식이 불가능할 때 사용하는 6자리 숫자 잠금입니다.
                    {!pinExists && enabled && <span style={{ color: '#F59E0B', fontWeight: 700 }}> 생체인식 잠금 사용 시 필수입니다.</span>}
                  </p>
                </div>
                <button
                  onClick={() => { setPinInput(''); setPinError(''); setShowPinSetup(pinExists ? 'change-old' : 'enter'); }}
                  disabled={!enabled}
                  style={{ flexShrink: 0, height: 36, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--theme-border)', background: 'transparent', color: 'var(--theme-text)', fontSize: 13, fontWeight: 700, cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.45 }}>
                  {pinExists ? 'PIN 변경' : 'PIN 설정'}
                </button>
              </div>
              {pinExists && (
                <button onClick={handleRemovePin} style={{ marginTop: 10, fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                  PIN 삭제
                </button>
              )}
            </div>
          )}

          <div style={cardStyle}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)', margin: '0 0 6px' }}>잠금 적용 범위</h2>
            <p style={{ ...mutedText, marginBottom: 14 }}>전체 앱 또는 민감한 구간만 선택해서 보호할 수 있어요.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SCOPE_OPTIONS.map((option) => {
                const active = scopes.includes(option.key);
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => toggleScope(option.key)}
                    disabled={!enabled}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 18,
                      border: active ? '1px solid rgba(0,132,204,0.28)' : '1px solid var(--theme-border, #E8E8E4)',
                      background: active ? 'rgba(0,132,204,0.07)' : 'var(--theme-surface-muted, #F5F5F3)',
                      textAlign: 'left',
                      cursor: enabled ? 'pointer' : 'not-allowed',
                      opacity: enabled ? 1 : 0.58,
                      fontFamily: 'inherit',
                    }}
                  >
                    <CheckIcon active={active} />
                    <span style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: 14, color: 'var(--theme-text, #1A1B2E)', marginBottom: 3 }}>{option.label}</strong>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--theme-text-subtle, #6E6E66)', lineHeight: 1.45 }}>{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--theme-text, #1A1B2E)', margin: '0 0 6px' }}>재인증 주기</h2>
            <p style={{ ...mutedText, marginBottom: 14 }}>한 번 인증한 뒤 다시 확인할 시간을 정합니다.</p>
            <div style={{ display: 'grid', gridTemplateColumns: desktop ? 'repeat(2, 1fr)' : '1fr', gap: 10 }}>
              {INTERVAL_OPTIONS.map((option) => {
                const active = interval === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => updateInterval(option.key)}
                    disabled={!enabled}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 18,
                      border: active ? '1px solid rgba(12,201,181,0.36)' : '1px solid var(--theme-border, #E8E8E4)',
                      background: active ? 'rgba(12,201,181,0.08)' : 'var(--theme-surface-muted, #F5F5F3)',
                      textAlign: 'left',
                      cursor: enabled ? 'pointer' : 'not-allowed',
                      opacity: enabled ? 1 : 0.58,
                      fontFamily: 'inherit',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: 14, color: active ? '#0084CC' : 'var(--theme-text, #1A1B2E)', marginBottom: 4 }}>{option.label}</strong>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-subtle, #6E6E66)', lineHeight: 1.45 }}>{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
