/**
 * 글리움 통합 Analytics 유틸리티
 *
 * ▸ 네이티브 앱 (iOS / Android):
 *     @capacitor-firebase/analytics → Firebase Analytics SDK → GA4 연동
 * ▸ 웹 브라우저:
 *     window.gtag → GA4 Measurement Protocol
 *
 * ── GA4 추천 이벤트(Recommended Events) 매핑 ────────────────────
 *
 *  GA4 표준 이름          글리움 사용 이름          비고
 *  ─────────────────────────────────────────────────────────────
 *  login                 login                    ✅ 동일
 *  sign_up               sign_up                  ✅ 동일
 *  tutorial_begin        tutorial_begin           ✅ 온보딩 시작 시
 *  tutorial_complete     tutorial_complete        ✅ 온보딩 완료 시
 *  join_group            join_group               ✅ 공간 참여 시
 *  share                 share                    ✅ 초대 링크 공유 시
 *  screen_view           (trackScreen 함수로 처리)
 *
 * ── 글리움 커스텀 이벤트 ─────────────────────────────────────────
 *  [일정]     schedule_create / schedule_view / schedule_complete
 *             schedule_edit / schedule_delete
 *  [가계부]   budget_entry_add / budget_view
 *  [Space]   space_create
 *  [알림]     notification_view / notification_click / fcm_permission_grant
 *  [PWA]     pwa_banner_show / pwa_install_accept / pwa_install_dismiss / pwa_installed
 *  [UI]      calendar_toggle / device_calendar_sync / quick_action_click / navigation_click
 *
 * ── GA4 Key Events (주요 이벤트 / 구 전환) ──────────────────────
 *  GA4 콘솔 → 이벤트 탭에서 직접 '주요 이벤트로 표시' 클릭 필요:
 *  sign_up, tutorial_complete, schedule_create, space_create, join_group, pwa_installed
 * ────────────────────────────────────────────────────────────────
 */

import { isNativeApp } from '@/lib/native';

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config?: Record<string, any>
    ) => void;
    dataLayer: unknown[];
  }
}

// ── 이벤트 파라미터 타입 정의 ──────────────────────────────────

export type GleaumEventParams = {
  // ── GA4 추천 이벤트 (Recommended Events) ──────────────────────
  login:              { method: 'google' | 'email' };
  sign_up:            { method: 'google' | 'email' };
  /** 온보딩 첫 화면 진입 시 */
  tutorial_begin:     { method: 'google' | 'email' };
  /** 온보딩 완료 시 (GA4 표준 + 글리움 파라미터 확장) */
  tutorial_complete:  { goal: string; space_intent: string; space_setup?: string };
  /** 공간 참여 시 (GA4 표준: group_id 파라미터) */
  join_group:         { group_id: string };
  /** 초대 링크 공유 시 (GA4 표준: method, content_type, item_id) */
  share:              { method: 'copy_link' | 'kakao' | 'other'; content_type: 'space_invite'; item_id: string };

  // ── 글리움 커스텀 이벤트 — 일정 ─────────────────────────────
  schedule_create: {
    schedule_type: 'shared' | 'personal' | 'child' | 'expense';
    has_participants: boolean;
    has_reminder: boolean;
    has_repeat: boolean;
    has_expense: boolean;
  };
  schedule_view:     { schedule_type: string; status: string };
  schedule_complete: { schedule_type: string };
  schedule_edit:     { schedule_type: string };
  schedule_delete:   { schedule_type: string };

  // ── 글리움 커스텀 이벤트 — 가계부 ──────────────────────────
  budget_entry_add: { category: string; payment_method: string };
  budget_view:      Record<string, never>;

  // ── 글리움 커스텀 이벤트 — Space ────────────────────────────
  space_create: { space_intent: string };

  // ── 글리움 커스텀 이벤트 — 알림 ─────────────────────────────
  notification_view:    Record<string, never>;
  notification_click:   { notification_type: string };
  fcm_permission_grant: Record<string, never>;

  // ── 글리움 커스텀 이벤트 — PWA ──────────────────────────────
  pwa_banner_show:    { platform: 'ios' | 'android' };
  pwa_install_accept: { platform: 'ios' | 'android' };
  pwa_install_dismiss:{ platform: 'ios' | 'android' };
  pwa_installed:      { platform: 'ios' | 'android' };

  // ── 글리움 커스텀 이벤트 — UI ────────────────────────────────
  calendar_toggle:    { action: 'open' | 'close' };
  device_calendar_sync: { created: number; updated: number; deleted: number };
  device_calendar_import: { imported: number; skipped_duplicates: number };
  quick_action_click: { action: string };
  navigation_click:   { destination: string };
};

/**
 * GA4 Key Events (주요 이벤트) 목록
 *
 * GA4 콘솔 → 관리 → 이벤트 탭에서 해당 이벤트 행의
 * '주요 이벤트로 표시' 토글을 활성화해야 실제로 적용됩니다.
 */
export const KEY_EVENTS: (keyof GleaumEventParams)[] = [
  'sign_up',           // 신규 가입 (가장 중요한 전환)
  'tutorial_complete', // 온보딩 완료 (활성화 지표)
  'schedule_create',   // 핵심 기능 최초 사용
  'space_create',      // 공간 개설 (리텐션 예측 지표)
  'join_group',        // 공간 참여 (바이럴 전파 지표)
  'pwa_installed',     // 앱 설치 전환
];

// ── GA4 Measurement ID ────────────────────────────────────────
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

// ─────────────────────────────────────────────────────────────
//  내부 헬퍼
// ─────────────────────────────────────────────────────────────

/** params 객체를 Firebase Analytics용 파라미터 배열로 변환 */
function toFirebaseParams(
  params: Record<string, unknown>
): Array<{ key: string; value: string }> {
  return Object.entries(params).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

// ─────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────

/**
 * 화면(스크린) 추적
 * 네이티브: FirebaseAnalytics.setCurrentScreen → screen_view 이벤트 자동 생성
 * 웹: gtag screen_view 이벤트 수동 전송
 */
export async function trackScreen(screenName: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isNativeApp()) {
    try {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.setCurrentScreen({ screenName });
    } catch (err) {
      console.warn('[Analytics] trackScreen 실패:', err);
    }
    return;
  }

  if (GA_ID && window.gtag) {
    window.gtag('event', 'screen_view', {
      firebase_screen: screenName,
      firebase_screen_class: screenName,
    });
  }
}

/**
 * 페이지뷰 수동 전송 (웹 SPA 라우트 전환 시 호출)
 * 네이티브에서는 trackScreen 을 사용하세요.
 */
export function trackPageView(url: string): void {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_ID, { page_path: url });
}

/**
 * 커스텀 이벤트 트래킹 — 네이티브 / 웹 통합
 */
export async function trackEvent<K extends keyof GleaumEventParams>(
  event: K,
  params: GleaumEventParams[K]
): Promise<void> {
  if (typeof window === 'undefined') return;

  const paramObj = params as Record<string, unknown>;

  // ── 네이티브 앱: Firebase Analytics SDK ──────────────────────
  if (isNativeApp()) {
    try {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.logEvent({
        name: event,
        params: toFirebaseParams(paramObj),
      });
    } catch (err) {
      console.warn('[Analytics] logEvent 실패:', event, err);
    }
    return;
  }

  // ── 웹 브라우저: GA4 gtag ─────────────────────────────────────
  if (GA_ID && window.gtag) {
    window.gtag('event', event, paramObj);
  }
}

/**
 * Firebase Analytics 사용자 ID 설정 (로그인 후 호출)
 */
export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isNativeApp()) {
    try {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.setUserId({ userId: userId ?? '' });
    } catch (err) {
      console.warn('[Analytics] setUserId 실패:', err);
    }
    return;
  }

  if (GA_ID && window.gtag) {
    window.gtag('set', 'user_id', { user_id: userId ?? undefined });
  }
}

/**
 * Firebase Analytics 사용자 속성 설정
 * 예: setUserProperty('subscription_type', 'premium')
 */
export async function setUserProperty(name: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isNativeApp()) {
    try {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.setUserProperty({ key: name, value });
    } catch (err) {
      console.warn('[Analytics] setUserProperty 실패:', err);
    }
    return;
  }

  if (GA_ID && window.gtag) {
    window.gtag('set', 'user_properties', { [name]: value });
  }
}
