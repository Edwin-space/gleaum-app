/**
 * NativeBiometric — Android 지문/기기 잠금, iOS Face ID/Touch ID 브리지.
 *
 * 설정값은 계정 DB가 아니라 기기 로컬 저장소에만 저장한다.
 * 같은 계정이라도 기기별로 앱 잠금 여부가 달라질 수 있기 때문이다.
 */
import { registerPlugin } from '@capacitor/core';
import { isNativeApp, secureStorage } from '@/lib/native';

const LOCK_ENABLED_KEY    = 'gleaum:biometric-lock-enabled';
const PROMPT_SEEN_KEY     = 'gleaum:biometric-lock-prompt-seen';
const UNLOCKED_AT_KEY     = 'gleaum:biometric-unlocked-at';
const LOCK_SCOPES_KEY     = 'gleaum:biometric-lock-scopes';
const RELOCK_INTERVAL_KEY = 'gleaum:biometric-relock-interval';
const PIN_HASH_KEY        = 'gleaum:pin-hash';  // 생체인식 폴백 PIN 해시

export type NativeBiometryType = 'faceId' | 'touchId' | 'fingerprint' | 'deviceCredential' | 'none';
export type BiometricLockScope = 'app' | 'budget' | 'spaceSettings' | 'accountSettings';
export type BiometricRelockInterval = 'always' | '5m' | '15m' | '30m';

export const DEFAULT_BIOMETRIC_LOCK_SCOPES: BiometricLockScope[] = ['app'];
export const DEFAULT_BIOMETRIC_RELOCK_INTERVAL: BiometricRelockInterval = 'always';

export interface NativeBiometricAvailability {
  available: boolean;
  biometryType: NativeBiometryType;
  reason?: string;
}

export interface NativeBiometricPlugin {
  isAvailable(): Promise<NativeBiometricAvailability>;
  authenticate(options?: { reason?: string; title?: string; subtitle?: string }): Promise<{ success: boolean }>;
}

export const NativeBiometric = registerPlugin<NativeBiometricPlugin>('NativeBiometric', {
  web: () => ({
    async isAvailable() {
      return { available: false, biometryType: 'none', reason: 'web' };
    },
    async authenticate() {
      return { success: false };
    },
  }),
});

export async function getBiometricAvailability(): Promise<NativeBiometricAvailability> {
  if (!isNativeApp()) return { available: false, biometryType: 'none', reason: 'web' };
  try {
    return await NativeBiometric.isAvailable();
  } catch (error) {
    return {
      available: false,
      biometryType: 'none',
      reason: error instanceof Error ? error.message : 'unknown',
    };
  }
}

export async function authenticateForAppUnlock(reason = '글리움 앱 잠금을 해제합니다.'): Promise<boolean> {
  if (!isNativeApp()) return true;
  try {
    const result = await NativeBiometric.authenticate({
      title: '글리움 잠금 해제',
      subtitle: '일정과 자금 정보를 보호하고 있어요.',
      reason,
    });
    if (result.success) await markBiometricUnlockedNow();
    return result.success;
  } catch {
    return false;
  }
}

export async function isBiometricLockEnabled(): Promise<boolean> {
  return (await secureStorage.get(LOCK_ENABLED_KEY)) === 'true';
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  await secureStorage.set(LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
  await secureStorage.set(PROMPT_SEEN_KEY, 'true');
  if (enabled) await markBiometricUnlockedNow();
}

export async function hasSeenBiometricPrompt(): Promise<boolean> {
  return (await secureStorage.get(PROMPT_SEEN_KEY)) === 'true';
}

export async function markBiometricPromptSeen(): Promise<void> {
  await secureStorage.set(PROMPT_SEEN_KEY, 'true');
}

export async function markBiometricUnlockedNow(): Promise<void> {
  await secureStorage.set(UNLOCKED_AT_KEY, String(Date.now()));
}

export async function getBiometricUnlockedAt(): Promise<number> {
  const value = await secureStorage.get(UNLOCKED_AT_KEY);
  const parsed = value ? Number(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getBiometricLockScopes(): Promise<BiometricLockScope[]> {
  const raw = await secureStorage.get(LOCK_SCOPES_KEY);
  if (!raw) return DEFAULT_BIOMETRIC_LOCK_SCOPES;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_BIOMETRIC_LOCK_SCOPES;
    const validScopes: BiometricLockScope[] = ['app', 'budget', 'spaceSettings', 'accountSettings'];
    const scopes = parsed.filter((scope): scope is BiometricLockScope => validScopes.includes(scope as BiometricLockScope));
    return scopes.length > 0 ? scopes : DEFAULT_BIOMETRIC_LOCK_SCOPES;
  } catch {
    return DEFAULT_BIOMETRIC_LOCK_SCOPES;
  }
}

export async function setBiometricLockScopes(scopes: BiometricLockScope[]): Promise<void> {
  const uniqueScopes = Array.from(new Set(scopes));
  await secureStorage.set(LOCK_SCOPES_KEY, JSON.stringify(uniqueScopes.length > 0 ? uniqueScopes : DEFAULT_BIOMETRIC_LOCK_SCOPES));
}

export async function getBiometricRelockInterval(): Promise<BiometricRelockInterval> {
  const value = await secureStorage.get(RELOCK_INTERVAL_KEY);
  if (value === 'always' || value === '5m' || value === '15m' || value === '30m') return value;
  return DEFAULT_BIOMETRIC_RELOCK_INTERVAL;
}

export async function setBiometricRelockInterval(interval: BiometricRelockInterval): Promise<void> {
  await secureStorage.set(RELOCK_INTERVAL_KEY, interval);
}

export async function shouldRequireBiometricUnlock(): Promise<boolean> {
  const interval = await getBiometricRelockInterval();
  if (interval === 'always') return true;

  const unlockedAt = await getBiometricUnlockedAt();
  if (!unlockedAt) return true;

  const minutes = interval === '5m' ? 5 : interval === '15m' ? 15 : 30;
  return Date.now() - unlockedAt >= minutes * 60 * 1000;
}

// ── PIN 폴백 (생체인식 불가 시 사용) ──────────────────────────────────────────

/** PIN → SHA-256 해시 (Web Crypto API) */
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`gleaum-pin-v1:${pin}`);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** PIN 설정 (해시 저장) */
export async function setPinCode(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await secureStorage.set(PIN_HASH_KEY, hash);
}

/** PIN 검증 */
export async function verifyPinCode(pin: string): Promise<boolean> {
  const stored = await secureStorage.get(PIN_HASH_KEY);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}

/** PIN 설정 여부 */
export async function hasPinCode(): Promise<boolean> {
  const stored = await secureStorage.get(PIN_HASH_KEY);
  return !!stored && stored.length > 0;
}

/** PIN 삭제 */
export async function removePinCode(): Promise<void> {
  await secureStorage.set(PIN_HASH_KEY, '');
}
