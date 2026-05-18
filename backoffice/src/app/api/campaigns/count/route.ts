/**
 * GET /api/campaigns/count?segment=all|no_onboarding|space_member&spaceId=...
 * 세그먼트별 실제 발송 대상 유저 수 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const segment = searchParams.get('segment') ?? 'all';
  const spaceId = searchParams.get('spaceId');
  const channel = searchParams.get('channel') ?? 'app_push';

  try {
    // 앱 푸시는 fcm_token 보유 여부로 필터
    const needsFcm = channel === 'app_push';

    let query = supabase.from('profiles').select('id', { count: 'exact', head: true });

    if (needsFcm) {
      query = query.not('fcm_token', 'is', null);
    }

    if (segment === 'no_onboarding') {
      query = query.is('onboarding_completed_at', null);
    } else if (segment === 'space_member' && spaceId) {
      // family_group_id 기준 필터
      query = query.eq('family_group_id', spaceId);
    }
    // segment === 'all' → 추가 필터 없음

    const { count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message, count: 0 }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (err) {
    console.error('[campaigns/count]', err);
    return NextResponse.json({ error: '서버 오류', count: 0 }, { status: 500 });
  }
}
