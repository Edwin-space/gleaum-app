/**
 * 글리움 — Firebase Crashlytics 유틸리티
 *
 * 네이티브(iOS/Android): @capacitor-firebase/crashlytics → Firebase SDK 직접 연동
 * 웹: 로컬 console.error fallback (Crashlytics는 네이티브 전용)
 *
 * 사용법:
 *   import { recordError, setUserId, log } from '@/lib/crashlytics';
 *   recordError(new Error('결제 실패'), 'BudgetPage');
 */

import { isNativeApp } from '@/lib/native';

/** Crashlytics 모듈 lazy import (네이티브 전용) */
async function getCrashlytics() {
  if (!isNativeApp()) return null;
  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    return FirebaseCrashlytics;
  } catch {
    return null;
  }
}

/**
 * 에러 기록 — 크래시가 아닌 처리된 예외도 Crashlytics에 전송
 * @param error      기록할 Error 객체
 * @param context    어느 컴포넌트/함수에서 발생했는지 (예: 'BudgetPage', 'useSchedules')
 */
export async function recordError(error: unknown, context?: string): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = context ? `[${context}] ${err.message}` : err.message;

  // 항상 console.error 로그 (개발 모드 + 서버 로그)
  console.error('[Crashlytics]', message, err);

  const crashlytics = await getCrashlytics();
  if (!crashlytics) return;

  try {
    // 커스텀 키로 컨텍스트 추가
    if (context) {
      await crashlytics.setCustomKey({ key: 'error_context', value: context, type: 'string' });
    }
    // stacktrace는 StackFrame[] 타입 — 메시지만 전달 (스택은 console에서 확인)
    await crashlytics.recordException({ message });
  } catch (e) {
    console.warn('[Crashlytics] recordError 실패:', e);
  }
}

/**
 * 사용자 ID 설정 — 로그인 후 호출하여 크래시와 사용자를 연결
 * @param userId  Supabase User ID (UUID)
 */
export async function setUserId(userId: string): Promise<void> {
  const crashlytics = await getCrashlytics();
  if (!crashlytics) return;
  try {
    await crashlytics.setUserId({ userId });
  } catch (e) {
    console.warn('[Crashlytics] setUserId 실패:', e);
  }
}

/**
 * 커스텀 키-값 설정 — 크래시 보고서에 추가 정보 첨부
 * @example setCustomKey('screen', 'budget_page')
 */
export async function setCustomKey(key: string, value: string | number | boolean): Promise<void> {
  const crashlytics = await getCrashlytics();
  if (!crashlytics) return;
  try {
    const type = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'double' : 'string';
    await crashlytics.setCustomKey({ key, value, type });
  } catch (e) {
    console.warn('[Crashlytics] setCustomKey 실패:', e);
  }
}

/**
 * 로그 메시지 추가 — 크래시 발생 시 직전 로그들이 보고서에 포함됨
 * @example log('결제 모달 열림')
 */
export async function log(message: string): Promise<void> {
  const crashlytics = await getCrashlytics();
  if (!crashlytics) return;
  try {
    await crashlytics.log({ message });
  } catch {
    // silent
  }
}

/**
 * Crashlytics 수집 활성/비활성 토글
 * GDPR 등 개인정보 동의 여부에 따라 사용
 */
export async function setCrashlyticsEnabled(enabled: boolean): Promise<void> {
  const crashlytics = await getCrashlytics();
  if (!crashlytics) return;
  try {
    await crashlytics.setEnabled({ enabled });
  } catch (e) {
    console.warn('[Crashlytics] setEnabled 실패:', e);
  }
}
