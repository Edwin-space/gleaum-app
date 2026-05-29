/**
 * POST /api/ads/events
 * 광고 노출·클릭 이벤트 수집 (비인증 포함)
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { adId, event, platform } = body ?? {};

  if (!adId || !['impression', 'click'].includes(event)) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }

  const supabase = await createClient();

  // 현재 사용자 ID (없으면 null — 비로그인 허용)
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('ad_events')
    .insert({
      ad_id:    adId,
      event,
      platform: platform ?? 'web',
      user_id:  user?.id ?? null,
    });

  if (error) {
    console.error('[ad_events] 기록 실패:', error);
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
