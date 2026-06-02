/**
 * NativeBiometric — Android 지문/기기 잠금, iOS Face ID/Touch ID 브리지.
 *
 * 설정값은 계정 DB가 아니라 기기 로컬 저장소에만 저장한다.
 * 같은 계정이라도 기기별로 앱 잠금 여부가 달라질 수 있기 때문이다.
 */
import { registerPlugin } from '@capacitor/core';
import { isNativeApp, secureStorage } from '@/lib/native';

const LOCK_ENABLED_KEY = 'gleaum:biometric-lock-enabled';
const PROMPT_SEEN_KEY = 'gleaum:biometric-lock-prompt-seen';
const UNLOCKED_AT_KEY = 'gleaum:biometric-unlocked-at';

export type NativeBiometryType = 'faceId' | 'touchId' | 'fingerprint' | 'deviceCredential' | 'none';

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

