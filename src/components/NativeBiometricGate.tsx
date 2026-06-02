'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  authenticateForAppUnlock,
  getBiometricAvailability,
  hasSeenBiometricPrompt,
  isBiometricLockEnabled,
  markBiometricPromptSeen,
  setBiometricLockEnabled,
} from '@/lib/native-biometric';
import { getNativePlatform, isNativeApp } from '@/lib/native';

const EXCLUDED_PATH_PREFIXES = ['/login', '/onboarding', '/auth/callback', '/invite', '/legal', '/download'];

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATH_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function NativeBiometricGate() {
  const [locked, setLocked] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [message, setMessage] = useState('');
  const authenticatingRef = useRef(false);

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
    } else {
      setLocked(true);
      setMessage('인증이 완료되지 않았어요. 다시 시도해 주세요.');
    }
  }, []);

  useEffect(() => {
    if (!isNativeApp() || typeof window === 'undefined') return;
    if (isExcludedPath(window.location.pathname)) return;

    let mounted = true;

    async function prepare() {
      const [enabled, seen, availability] = await Promise.all([
        isBiometricLockEnabled(),
        hasSeenBiometricPrompt(),
        getBiometricAvailability(),
      ]);
      if (!mounted) return;

      if (enabled && availability.available) {
        setLocked(true);
        void unlock();
        return;
      }

      if (!seen && availability.available) {
        setPromptOpen(true);
      }
    }

    void prepare();

    return () => {
      mounted = false;
    };
  }, [unlock]);

  useEffect(() => {
    if (!isNativeApp()) return;

    let removeListener: (() => void) | undefined;

    async function listenAppState() {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('appStateChange', async ({ isActive }) => {
        if (typeof window !== 'undefined' && isExcludedPath(window.location.pathname)) return;
        const enabled = await isBiometricLockEnabled();
        if (!enabled) return;
        if (!isActive) {
          setLocked(true);
          return;
        }
        const availability = await getBiometricAvailability();
        if (availability.available) void unlock();
      });
      removeListener = () => {
        void handle.remove();
      };
    }

    void listenAppState();

    return () => {
      removeListener?.();
    };
  }, [unlock]);

  const enableFromPrompt = async () => {
    setAuthenticating(true);
    const ok = await authenticateForAppUnlock('앞으로 글리움 앱을 열 때 생체인증으로 보호합니다.');
    setAuthenticating(false);
    if (ok) {
      await setBiometricLockEnabled(true);
      setPromptOpen(false);
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
  const title = platform === 'ios' ? 'Face ID로 글리움을 보호할까요?' : '지문으로 글리움을 보호할까요?';
  const lockTitle = platform === 'ios' ? 'Face ID 인증이 필요해요' : '지문 인증이 필요해요';

  return (
    <>
      {promptOpen && (
        <div style={overlayStyle}>
          <div style={sheetStyle}>
            <div style={iconStyle}>🔐</div>
            <h2 style={titleStyle}>{title}</h2>
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

      {locked && (
        <div style={{ ...overlayStyle, background: '#0F1A2E' }}>
          <div style={{ ...sheetStyle, background: 'rgba(255,255,255,0.96)' }}>
            <div style={iconStyle}>🛡️</div>
            <h2 style={titleStyle}>{lockTitle}</h2>
            <p style={descStyle}>글리움의 개인 일정과 자금 정보를 보호하고 있어요.</p>
            {message && <p style={errorStyle}>{message}</p>}
            <button onClick={unlock} disabled={authenticating} style={primaryButtonStyle}>
              {authenticating ? '인증 중...' : '잠금 해제'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: 'rgba(15,26,46,0.45)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
};

const sheetStyle: CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  borderRadius: '28px',
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(255,255,255,0.8)',
  boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
  padding: '28px',
  textAlign: 'center',
};

const iconStyle: CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '22px',
  margin: '0 auto 18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '30px',
  background: 'linear-gradient(135deg, rgba(46,232,149,0.16), rgba(0,132,204,0.14))',
};

const titleStyle: CSSProperties = {
  fontSize: '22px',
  fontWeight: 900,
  color: '#1A1B2E',
  margin: '0 0 10px',
  letterSpacing: '-0.4px',
};

const descStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#6E6E66',
  lineHeight: 1.65,
  margin: '0 0 22px',
};

const errorStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#EF4444',
  margin: '0 0 14px',
};

const primaryButtonStyle: CSSProperties = {
  width: '100%',
  height: '52px',
  border: 'none',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, #0084CC, #0CC9B5)',
  color: 'white',
  fontSize: '16px',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0,132,204,0.28)',
};

const ghostButtonStyle: CSSProperties = {
  width: '100%',
  height: '48px',
  marginTop: '8px',
  border: 'none',
  borderRadius: '999px',
  background: 'transparent',
  color: '#8E8E93',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
};

