/**
 * GET /api/campaigns/count?segment=all|no_onboarding|space_member&spaceId=...
 * 세그먼트별 실제 발송 대상 유저 수 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const denial = await requireAdminApi();
  if (denial) return denial;

  const supabase = getAdminSupabase();
  const { searchParams } = new URL(req.url);
  const segment = searchParams.get('segment') ?? 'all';
  const spaceId = searchParams.get('spaceId');
  const channel = searchParams.get('channel') ?? 'app_push';

  try {
    if (channel !== 'app_push') {
      return NextResponse.json({ count: 0 });
    }

    if (segment === 'space_member') {
      if (!spaceId) {
        return NextResponse.json({ error: 'spaceId가 필요합니다.', count: 0 }, { status: 400 });
      }

      const { data: members, error: memberError } = await supabase
        .from('space_members')
        .select('user_id')
        .eq('space_id', spaceId);

      if (memberError) {
        return NextResponse.json({ error: memberError.message, count: 0 }, { status: 500 });
      }

      const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id).filter(Boolean)));
      if (userIds.length === 0) return NextResponse.json({ count: 0 });

      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('id', userIds)
        .not('fcm_token', 'is', null);

      if (error) {
        return NextResponse.json({ error: error.message, count: 0 }, { status: 500 });
      }

      return NextResponse.json({ count: count ?? 0 });
    }

    let query = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('fcm_token', 'is', null);

    if (segment === 'no_onboarding') {
      query = query.is('onboarding_completed_at', null);
    }

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
