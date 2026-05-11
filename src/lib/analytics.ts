/**
 * 글리움 GA4 Analytics 유틸리티
 * Measurement ID: NEXT_PUBLIC_GA_ID (환경변수)
 *
 * ── 이벤트 카테고리 ─────────────────────────────────────────
 * [퍼널]     login / sign_up / onboarding_complete
 * [일정]     schedule_create / schedule_view / schedule_complete / schedule_edit / schedule_delete
 * [가계부]   budget_entry_add / budget_view
 * [Space]   space_create / space_join / space_invite_send
 * [알림]     notification_view / notification_click / fcm_permission_grant
 * [PWA]     pwa_banner_show / pwa_install_accept / pwa_install_dismiss / pwa_installed
 * [UI]      calendar_toggle / quick_action_click / navigation_click
 * ────────────────────────────────────────────────────────────
 */

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
  // 퍼널
  login:                { method: 'google' | 'email' };
  sign_up:              { method: 'google' | 'email' };
  onboarding_complete:  { goal: string; space_intent: string; space_setup?: string };

  // 일정
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

  // 가계부
  budget_entry_add: { category: string; payment_method: string };
  budget_view:      Record<string, never>;

  // Space / 가족
  space_create:      { space_intent: string };
  space_join:        Record<string, never>;
  space_invite_send: Record<string, never>;

  // 알림
  notification_view:          Record<string, never>;
  notification_click:         { notification_type: string };
  fcm_permission_grant:       Record<string, never>;

  // PWA
  pwa_banner_show:    { platform: 'ios' | 'android' };
  pwa_install_accept: { platform: 'ios' | 'android' };
  pwa_install_dismiss:{ platform: 'ios' | 'android' };
  pwa_installed:      { platform: 'ios' | 'android' };

  // UI
  calendar_toggle:    { action: 'open' | 'close' };
  quick_action_click: { action: string };
  navigation_click:   { destination: string };
};

// ── 핵심 이벤트 이름 목록 (GA4 콘솔에서 Key Event 지정 권장) ──
export const KEY_EVENTS: (keyof GleaumEventParams)[] = [
  'login',
  'sign_up',
  'onboarding_complete',
  'schedule_create',
  'space_create',
  'space_join',
  'pwa_installed',
];

// ── GA4 측정 ID ───────────────────────────────────────────────
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

// ── 페이지뷰 수동 전송 (SPA 라우트 전환 시 호출) ──────────────
export function trackPageView(url: string): void {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_ID, {
    page_path: url,
    // debug_mode: process.env.NODE_ENV === 'development',
  });
}

// ── 커스텀 이벤트 트래킹 ─────────────────────────────────────
export function trackEvent<K extends keyof GleaumEventParams>(
  event: K,
  params: GleaumEventParams[K]
): void {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', event, params as Record<string, unknown>);
}
