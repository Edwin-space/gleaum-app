'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import {
  authenticateForAppUnlock,
  getBiometricAvailability,
  getBiometricLockScopes,
  hasPinCode,
  hasSeenBiometricPrompt,
  isBiometricLockEnabled,
  markBiometricPromptSeen,
  markBiometricUnlockedNow,
  setBiometricLockEnabled,
  setPinCode,
  shouldRequireBiometricUnlock,
  verifyPinCode,
} from '@/lib/native-biometric';
import { getNativePlatform, isNativeApp } from '@/lib/native';

const EXCLUDED_PATH_PREFIXES = ['/login', '/onboarding', '/auth/callback', '/invite', '/legal', '/download'];
const MAX_BIO_ATTEMPTS = 3; // 이 횟수 실패 시 PIN 화면으로 전환

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATH_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

async function shouldProtectPath(pathname: string): Promise<boolean> {
  if (isExcludedPath(pathname)) return false;
  const scopes = await getBiometricLockScopes();
  if (scopes.includes('app')) return true;
  if (scopes.includes('budget') && pathname.startsWith('/budget')) return true;
  if (scopes.includes('spaceSettings') && pathname.startsWith('/space/settings')) return true;
  if (scopes.includes('accountSettings') && (pathname.startsWith('/mypage') || pathname.startsWith('/settings/security'))) return true;
  return false;
}

// ── PIN 숫자 키패드 컴포넌트 ─────────────────────────────────────────────────
function PinPad({
  pin, onPress, onDelete, onConfirm, error, loading,
}: {
  pin: string;
  onPress: (d: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  error: string;
  loading: boolean;
}) {
  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div>
      {/* 점 표시 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '20px 0 8px' }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: i < pin.length ? '#0084CC' : 'rgba(0,0,0,0.15)',
            transition: 'background 0.15s',
          }} />
        ))}
      </div>
      {error && <p style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', margin: '0 0 12px', fontWeight: 700 }}>{error}</p>}

      {/* 키패드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '16px 0 0' }}>
        {digits.map((d, i) => {
          if (d === '') return <div key={i} />;
          const isDelete = d === '⌫';
          return (
            <button
              key={i}
              onClick={() => isDelete ? onDelete() : onPress(d)}
              disabled={loading || (d !== '⌫' && pin.length >= 6)}
              style={{
                height: 60, borderRadius: 16, border: 'none',
                background: isDelete ? 'transparent' : 'rgba(0,0,0,0.06)',
                fontSize: isDelete ? 22 : 26,
                fontWeight: 700, color: '#1A1B2E', cursor: 'pointer',
                transition: 'background 0.1s',
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* 확인 버튼 */}
      {pin.length === 6 && (
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{ ...primaryButtonStyle, marginTop: 16 }}
        >
          {loading ? '확인 중...' : '잠금 해제'}
        </button>
      )}
    </div>
  );
}

// ── PIN 설정 컴포넌트 (생체인식 활성화 시 필수) ──────────────────────────────
function PinSetup({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePress = (d: string) => setPin(p => p.length < 6 ? p + d : p);
  const handleDelete = () => setPin(p => p.slice(0, -1));

  const handleConfirm = async () => {
    if (step === 'enter') {
      setFirstPin(pin);
      setPin('');
      setStep('confirm');
    } else {
      if (pin !== firstPin) {
        setError('PIN이 일치하지 않아요. 다시 입력해 주세요.');
        setPin('');
        setStep('enter');
        setFirstPin('');
        return;
      }
      setLoading(true);
      await setPinCode(pin);
      setLoading(false);
      onComplete();
    }
  };

  return (
    <div style={sheetStyle}>
      <div style={iconStyle}>🔢</div>
      <h2 style={titleStyle}>
        {step === 'enter' ? '비상용 PIN 설정' : 'PIN 한 번 더 입력'}
      </h2>
      <p style={descStyle}>
        {step === 'enter'
          ? '생체인식이 불가능할 때 사용할 6자리 PIN을 설정해요.'
          : '앞서 입력한 PIN과 동일하게 입력해 주세요.'}
      </p>
      <PinPad
        pin={pin}
        onPress={handlePress}
        onDelete={handleDelete}
        onConfirm={handleConfirm}
        error={error}
        loading={loading}
      />
      <button onClick={onSkip} style={{ ...ghostButtonStyle, marginTop: 12 }}>
        나중에 설정하기
      </button>
    </div>
  );
}

export function NativeBiometricGate() {
  const pathname = usePathname();
  const [locked, setLocked] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [bioAttempts, setBioAttempts] = useState(0);
  const [message, setMessage] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const authenticatingRef = useRef(false);

  // ── 생체인식 잠금 해제 ────────────────────────────────────────────────────
  const unlock = useCallback(async () => {
    if (authenticatingRef.current) return;
    authenticatingRef.current = true;
    setAuthenticating(true);
    setMessage('');
    const ok = await authenticateForAppUnlock();
    setAuthenticating(false);
    authenticatingRef.current = false;

    if (ok) {
      setLocked(false);
      setMessage('');
      setBioAttempts(0);
      setShowPinEntry(false);
    } else {
      const attempts = bioAttempts + 1;
      setBioAttempts(attempts);
      setLocked(true);
      if (attempts >= MAX_BIO_ATTEMPTS) {
        // 3회 실패 → PIN 화면으로 자동 전환
        setShowPinEntry(true);
        setMessage('');
      } else {
        const pinAvailable = await hasPinCode();
        setMessage(
          pinAvailable
            ? `인증 실패 (${attempts}/${MAX_BIO_ATTEMPTS}). PIN으로도 해제할 수 있어요.`
            : '인증이 완료되지 않았어요. 다시 시도해 주세요.'
        );
      }
    }
  }, [bioAttempts]);

  // ── PIN 잠금 해제 ─────────────────────────────────────────────────────────
  const unlockWithPin = useCallback(async () => {
    setAuthenticating(true);
    setPinError('');
    const ok = await verifyPinCode(pinInput);
    setAuthenticating(false);
    if (ok) {
      await markBiometricUnlockedNow();
      setLocked(false);
      setShowPinEntry(false);
      setPinInput('');
      setBioAttempts(0);
    } else {
      setPinError('PIN이 올바르지 않아요. 다시 확인해 주세요.');
      setPinInput('');
    }
  }, [pinInput]);

  // ── 경로 변경 시 잠금 체크 ────────────────────────────────────────────────
  useEffect(() => {
    if (!isNativeApp() || typeof window === 'undefined') return;
    let mounted = true;

    async function prepare() {
      const [enabled, seen, availability, protectCurrentPath, requireUnlock] = await Promise.all([
        isBiometricLockEnabled(),
        hasSeenBiometricPrompt(),
        getBiometricAvailability(),
        shouldProtectPath(pathname),
        shouldRequireBiometricUnlock(),
      ]);
      if (!mounted) return;

      // 잠금 활성화 + 보호 경로 + 재잠금 필요
      if (enabled && protectCurrentPath) {
        if (availability.available) {
          if (requireUnlock) {
            setLocked(true);
            void unlock();
          } else {
            setLocked(false);
          }
        } else {
          // 생체인식 불가 → PIN이 있으면 PIN 화면, 없으면 일단 통과
          if (requireUnlock) {
            const pinExists = await hasPinCode();
            if (pinExists) {
              setLocked(true);
              setShowPinEntry(true);
            } else {
              // PIN도 없으면 잠금 해제 (폴백 없이는 잠글 수 없음)
              setLocked(false);
            }
          } else {
            setLocked(false);
          }
        }
        return;
      }

      // 첫 생체인식 설정 권유
      if (!seen && availability.available) {
        setPromptOpen(true);
      }
    }

    void prepare();
    return () => { mounted = false; };
  }, [pathname, unlock]);

  // ── 앱 포그라운드/백그라운드 전환 시 재잠금 ─────────────────────────────
  useEffect(() => {
    if (!isNativeApp()) return;
    let removeListener: (() => void) | undefined;

    async function listenAppState() {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('appStateChange', async ({ isActive }) => {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
        const [enabled, availability, protectCurrentPath] = await Promise.all([
          isBiometricLockEnabled(),
          getBiometricAvailability(),
          shouldProtectPath(currentPath),
        ]);
        if (!enabled || !protectCurrentPath) return;

        if (!isActive) {
          setLocked(true);
          return;
        }

        if (await shouldRequireBiometricUnlock()) {
          if (availability.available) {
            setShowPinEntry(false);
            void unlock();
          } else {
            const pinExists = await hasPinCode();
            setShowPinEntry(pinExists);
          }
        } else {
          setLocked(false);
        }
      });
      removeListener = () => { void handle.remove(); };
    }

    void listenAppState();
    return () => { removeListener?.(); };
  }, [pathname, unlock]);

  // ── 생체인식 활성화 (프롬프트) ───────────────────────────────────────────
  const enableFromPrompt = async () => {
    setAuthenticating(true);
    const ok = await authenticateForAppUnlock('앞으로 글리움 앱을 열 때 생체인증으로 보호합니다.');
    setAuthenticating(false);
    if (ok) {
      await setBiometricLockEnabled(true);
      setPromptOpen(false);
      setPinSetupOpen(true); // PIN 설정 유도
    } else {
      setMessage('인증이 완료되어야 앱 잠금을 켤 수 있어요.');
    }
  };

  const skipPrompt = async () => {
    await markBiometricPromptSeen();
    setPromptOpen(false);
  };

  if (!isNativeApp()) return null;

  const platform = getNativePlatform();
  const lockTitle = platform === 'ios' ? 'Face ID 인증이 필요해요' : '지문 인증이 필요해요';
  const bioTitle  = platform === 'ios' ? 'Face ID로 글리움을 보호할까요?' : '지문으로 글리움을 보호할까요?';

  return (
    <>
      {/* ── 생체인식 설정 권유 ── */}
      {promptOpen && (
        <div style={overlayStyle}>
          <div style={sheetStyle}>
            <div style={iconStyle}>🔐</div>
            <h2 style={titleStyle}>{bioTitle}</h2>
            <p style={descStyle}>
              일정, 공간, 가계부처럼 개인적인 정보를 앱을 열 때마다 한 번 더 보호할 수 있어요.
            </p>
            {message && <p style={errorStyle}>{message}</p>}
            <button onClick={enableFromPrompt} disabled={authenticating} style={primaryButtonStyle}>
              {authenticating ? '확인 중...' : '생체인증 켜기'}
            </button>
            <button onClick={skipPrompt} disabled={authenticating} style={ghostButtonStyle}>
              나중에 하기
            </button>
          </div>
        </div>
      )}

      {/* ── PIN 설정 (생체인식 활성 후 권유) ── */}
      {pinSetupOpen && (
        <div style={overlayStyle}>
          <PinSetup
            onComplete={() => setPinSetupOpen(false)}
            onSkip={() => setPinSetupOpen(false)}
          />
        </div>
      )}

      {/* ── 잠금 화면 ── */}
      {locked && (
        <div style={{ ...overlayStyle, background: '#0F1A2E' }}>
          <div style={{ ...sheetStyle, background: 'rgba(255,255,255,0.96)' }}>
            <div style={iconStyle}>{showPinEntry ? '🔢' : '🛡️'}</div>
            <h2 style={titleStyle}>
              {showPinEntry ? 'PIN으로 잠금 해제' : lockTitle}
            </h2>
            <p style={descStyle}>
              {showPinEntry
                ? '설정한 6자리 PIN을 입력해 주세요.'
                : '글리움의 개인 일정과 자금 정보를 보호하고 있어요.'}
            </p>

            {showPinEntry ? (
              // PIN 입력 UI
              <PinPad
                pin={pinInput}
                onPress={d => setPinInput(p => p.length < 6 ? p + d : p)}
                onDelete={() => setPinInput(p => p.slice(0, -1))}
                onConfirm={unlockWithPin}
                error={pinError}
                loading={authenticating}
              />
            ) : (
              // 생체인식 UI
              <>
                {message && <p style={errorStyle}>{message}</p>}
                <button onClick={unlock} disabled={authenticating} style={primaryButtonStyle}>
                  {authenticating ? '인증 중...' : '잠금 해제'}
                </button>
              </>
            )}

            {/* 생체인식 ↔ PIN 전환 버튼 */}
            <button
              onClick={async () => {
                const pinExists = await hasPinCode();
                if (!showPinEntry && pinExists) {
                  setShowPinEntry(true);
                  setMessage('');
                } else {
                  setShowPinEntry(false);
                  setPinInput('');
                  setPinError('');
                  void unlock();
                }
              }}
              style={ghostButtonStyle}
            >
              {showPinEntry ? '생체인식으로 해제' : 'PIN으로 잠금 해제'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── 스타일 ──────────────────────────────────────────────────────────────────

const overlayStyle: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 10000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '24px',
  background: 'rgba(15,26,46,0.45)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
};

const sheetStyle: CSSProperties = {
  width: '100%', maxWidth: '420px',
  borderRadius: '28px',
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(255,255,255,0.8)',
  boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
  padding: '28px',
  textAlign: 'center',
};

const iconStyle: CSSProperties = {
  width: '64px', height: '64px', borderRadius: '22px',
  margin: '0 auto 18px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '30px',
  background: 'linear-gradient(135deg, rgba(46,232,149,0.16), rgba(0,132,204,0.14))',
};

const titleStyle: CSSProperties = {
  fontSize: '22px', fontWeight: 900, color: '#1A1B2E',
  margin: '0 0 10px', letterSpacing: '-0.4px',
};

const descStyle: CSSProperties = {
  fontSize: '14px', fontWeight: 600, color: '#6E6E66',
  lineHeight: 1.65, margin: '0 0 4px',
};

const errorStyle: CSSProperties = {
  fontSize: '13px', fontWeight: 700, color: '#EF4444',
  margin: '0 0 14px',
};

const primaryButtonStyle: CSSProperties = {
  width: '100%', height: '52px', border: 'none',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, #0084CC, #0CC9B5)',
  color: 'white', fontSize: '16px', fontWeight: 900, cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0,132,204,0.28)',
};

const ghostButtonStyle: CSSProperties = {
  width: '100%', height: '48px', marginTop: '8px',
  border: 'none', borderRadius: '999px',
  background: 'transparent', color: '#8E8E93',
  fontSize: '14px', fontWeight: 800, cursor: 'pointer',
};
