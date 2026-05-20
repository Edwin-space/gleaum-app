/**
 * 글리움 — 캠페인 클릭 추적 API
 * GET /api/campaign/click?id=CAMPAIGN_ID&to=ENCODED_URL
 *
 * 1. campaign_clicks 테이블에 유입 기록 저장
 * 2. 안전한 URL 목적지로만 리다이렉트 (오픈 리다이렉트 방지)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** 허용된 리다이렉트 호스트 목록 */
const ALLOWED_HOSTS = new Set([
  'gleaum.com',
  'www.gleaum.com',
]);

/** user-agent로 플랫폼 추론 */
function detectPlatform(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua))          return 'android';
  return 'web';
}

/**
 * 오픈 리다이렉트 방지: 허용된 도메인 또는 상대 경로만 허용
 * - 절대 URL → gleaum.com 도메인만 허용, 그 외 /home 으로 대체
 * - 상대 경로(/) → 그대로 허용
 * - 기타 → /home 으로 대체
 */
function sanitizeRedirectTarget(to: string): string {
  // 상대 경로는 그대로 허용
  if (to.startsWith('/')) {
    // path traversal 방지: //example.com 차단
    if (to.startsWith('//')) return '/home';
    return to;
  }

  // 절대 URL: 허용된 호스트만 통과
  try {
    const url = new URL(to);
    if (ALLOWED_HOSTS.has(url.hostname)) return to;
  } catch {
    // 파싱 불가 → 기본값
  }

  return '/home';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('id');
  const toRaw      = searchParams.get('to') || '/home';

  // ── 리다이렉트 목적지 검증 ────────────────────────────────
  const destination = sanitizeRedirectTarget(decodeURIComponent(toRaw));

  // ── 클릭 기록 (비동기, 실패해도 리다이렉트는 수행) ─────────
  if (campaignId) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const ua       = req.headers.get('user-agent') || '';
      const platform = detectPlatform(ua);

      await supabase.from('campaign_clicks').insert({
        campaign_id: campaignId,
        user_agent:  ua.slice(0, 500),
        platform,
      });
    } catch (err) {
      console.error('[campaign/click] 기록 실패:', err);
    }
  }

  // ── 리다이렉트 ────────────────────────────────────────────
  const redirectUrl = destination.startsWith('http')
    ? destination
    : new URL(destination, req.url).toString();

  return NextResponse.redirect(redirectUrl, { status: 302 });
}
