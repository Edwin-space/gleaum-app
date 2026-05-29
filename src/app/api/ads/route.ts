/**
 * GET /api/ads?slot=home-feed-inline
 * 공개 API — 슬롯에 활성 광고 1개 조회
 * 광고 없으면 204 반환 → 클라이언트가 AdSense 폴백 렌더
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { ActiveAd } from '@/types/ads';

export async function GET(req: NextRequest) {
  const slotId = req.nextUrl.searchParams.get('slot');
  if (!slotId) {
    return NextResponse.json({ error: 'slot 파라미터 필요' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('get_active_ad', { p_slot_id: slotId });

  if (error) {
    console.error('[ads] DB 오류:', error);
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 });
  }

  const ad: ActiveAd | null = data?.[0] ?? null;
  if (!ad) {
    // 광고 없음 → 클라이언트가 AdSense 폴백으로 처리
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(ad, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
