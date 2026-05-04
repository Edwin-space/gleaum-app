/**
 * 글리움 — 재알림 발송 API (FCM v1)
 * POST /api/notifications/renotify
 *
 * Body: { scheduleId: string, title: string, body: string, url?: string }
 *
 * 해당 일정 참여자의 FCM 토큰을 DB에서 조회하여 알림을 발송합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFCMToMultiple } from '@/lib/fcm';

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { scheduleId, title, body, url } = await req.json() as {
    scheduleId: string;
    title: string;
    body: string;
    url?: string;
  };

  if (!scheduleId || !title) {
    return NextResponse.json({ error: '파라미터 누락' }, { status: 400 });
  }

  // ── 1) 일정 참여자 조회 ────────────────────────────────────
  const { data: participants } = await supabaseAdmin
    .from('schedule_participants')
    .select('user_id')
    .eq('schedule_id', scheduleId);

  let targetIds: string[] = (participants ?? []).map((p: { user_id: string }) => p.user_id);

  // 참여자 없으면 가족 전체
  if (targetIds.length === 0) {
    const { data: schedule } = await supabaseAdmin
      .from('schedules')
      .select('family_group_id')
      .eq('id', scheduleId)
      .single();

    if (schedule) {
      const { data: members } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('family_group_id', schedule.family_group_id);
      targetIds = (members ?? []).map((m: { id: string }) => m.id);
    }
  }

  if (targetIds.length === 0) {
    return NextResponse.json({ error: '발송 대상 없음' }, { status: 404 });
  }

  // ── 2) FCM 토큰 조회 ──────────────────────────────────────
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, fcm_token')
    .in('id', targetIds)
    .not('fcm_token', 'is', null);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ error: 'FCM 토큰 없음 (알림 미허용)' }, { status: 404 });
  }

  const tokens = profiles.map((p: { fcm_token: string }) => p.fcm_token).filter(Boolean);

  // ── 3) FCM v1 발송 ────────────────────────────────────────
  const sent = await sendFCMToMultiple(tokens, title, body ?? '', url ?? `/schedules/${scheduleId}`);

  // ── 4) 알림 기록 ──────────────────────────────────────────
  const records = profiles.map((p: { id: string }) => ({
    user_id:     p.id,
    schedule_id: scheduleId,
    title,
    body:        body ?? '',
    type:        're_notify',
  }));
  await supabaseAdmin.from('notifications').insert(records);

  return NextResponse.json({ success: true, sent, total: tokens.length });
}
