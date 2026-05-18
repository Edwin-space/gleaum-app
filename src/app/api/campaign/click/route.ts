/**
 * 글리움 — 캠페인 클릭 추적 API
 * GET /api/campaign/click?id=CAMPAIGN_ID&to=ENCODED_URL
 *
 * 1. campaign_clicks 테이블에 유입 기록 저장
 * 2. 원본 랜딩 URL로 리다이렉트
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** user-agent로 플랫폼 추론 */
function detectPlatform(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua))          return 'android';
  return 'web';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('id');
  const to         = searchParams.get('to') || '/home';

  // 리다이렉트 목적지 — 절대 URL이 아니면 앱 내부 경로로 처리
  const destination = to.startsWith('http') ? to : to;

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
        user_agent:  ua.slice(0, 500),   // 너무 긴 UA 잘라내기
        platform,
      });
    } catch (err) {
      // 추적 실패가 유저 경험을 방해하면 안 됨
      console.error('[campaign/click] 기록 실패:', err);
    }
  }

  // ── 리다이렉트 ────────────────────────────────────────────
  return NextResponse.redirect(new URL(destination, req.url), { status: 302 });
}
