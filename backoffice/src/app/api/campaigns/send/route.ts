/**
 * POST /api/campaigns/send
 * 세그먼트 조건에 맞는 유저들에게 캠페인 메시지 발송
 *
 * Body: {
 *   segment: 'all' | 'no_onboarding' | 'space_member'
 *   spaceId?: string        // segment === 'space_member' 일 때 필수
 *   channel: 'app_push'     // 현재 구현 채널
 *   title: string
 *   body: string
 *   url?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendFCMBatch } from '@/lib/fcm';

export async function POST(req: NextRequest) {
  const { segment, spaceId, channel, title, body, url } = await req.json() as {
    segment: string;
    spaceId?: string;
    channel: string;
    title: string;
    body: string;
    url?: string;
  };

  if (!title || !body) {
    return NextResponse.json({ error: '제목과 본문은 필수입니다.' }, { status: 400 });
  }

  // ── 1. 대상 FCM 토큰 수집 ──────────────────────────────────
  if (channel !== 'app_push') {
    return NextResponse.json(
      { error: `'${channel}' 채널은 아직 지원되지 않습니다. 현재 앱 푸시만 가능합니다.` },
      { status: 400 }
    );
  }

  let query = supabase
    .from('profiles')
    .select('id, fcm_token')
    .not('fcm_token', 'is', null);

  if (segment === 'no_onboarding') {
    query = query.is('onboarding_completed_at', null);
  } else if (segment === 'space_member') {
    if (!spaceId) {
      return NextResponse.json({ error: 'spaceId가 필요합니다.' }, { status: 400 });
    }
    query = query.eq('family_group_id', spaceId);
  }
  // segment === 'all' → 추가 필터 없음

  const { data: profiles, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: `DB 조회 실패: ${dbError.message}` }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, total: 0, message: '발송 대상 없음' });
  }

  const tokens = profiles
    .map((p: { fcm_token: string | null }) => p.fcm_token)
    .filter((t): t is string => !!t);

  // ── 2. FCM 배치 발송 ──────────────────────────────────────
  const { sent, failed } = await sendFCMBatch(tokens, title, body, url);

  console.log(`[캠페인] 발송 완료 — 세그먼트: ${segment}, 전송: ${sent}, 실패: ${failed}`);

  return NextResponse.json({
    sent,
    failed,
    total: tokens.length,
    message: `총 ${tokens.length}명 중 ${sent}명에게 성공적으로 발송되었습니다.`,
  });
}
