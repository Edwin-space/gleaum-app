/**
 * 글리움 — 공통 토스트 헬퍼
 * sonner 기반으로 브랜드 스타일 통일
 */
import { toast } from 'sonner';

// ── 성공 ──
export const toastSuccess = (message: string, description?: string) =>
  toast.success(message, { description });

// ── 에러 ──
export const toastError = (message: string, description?: string) =>
  toast.error(message, { description });

// ── 일반 정보 ──
export const toastInfo = (message: string, description?: string) =>
  toast.info(message, { description });

// ── 경고 ──
export const toastWarning = (message: string, description?: string) =>
  toast.warning(message, { description });

// ── 로딩 → 결과 패턴 ──
export const toastPromise = <T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string }
) =>
  toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error:   messages.error,
  });

// ── 도메인별 단축 헬퍼 ──
export const scheduleToast = {
  created:  () => toastSuccess('일정이 추가되었습니다 📅'),
  updated:  () => toastSuccess('일정이 수정되었습니다 ✓'),
  deleted:  () => toastSuccess('일정이 삭제되었습니다'),
  error:    (action = '작업') => toastError(`${action} 중 오류가 발생했습니다`, '잠시 후 다시 시도해주세요'),
};

export const profileToast = {
  updated:  () => toastSuccess('프로필이 저장되었습니다 👤'),
  error:    () => toastError('저장 중 오류가 발생했습니다'),
};

export const notifToast = {
  sent:     (title: string) => toastInfo(`재알림을 발송했습니다`, title),
  error:    () => toastError('알림 발송에 실패했습니다'),
};
