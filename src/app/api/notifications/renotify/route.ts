/**
 * 글리움 — 재알림 발송 API
 * POST /api/notifications/renotify
 *
 * Body: { scheduleId: string, title: string, body: string, url?: string }
 *
 * 해당 일정 참여자(자녀)의 FCM 토큰을 DB에서 조회하여 알림을 발송합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey || serverKey === '여기에_서버키_붙여넣기') {
    return NextResponse.json({ error: 'FCM_SERVER_KEY 미설정' }, { status: 500 });
  }

  const { scheduleId, title, body, url } = await req.json() as {
    scheduleId: string;
    title: string;
    body: string;
    url?: string;
  };

  if (!scheduleId || !title) {
    return NextResponse.json({ error: '파라미터 누락' }, { status: 400 });
  }

  // ── 1) 일정 참여자 FCM 토큰 조회 ─────────────────────────
  const { data: participants } = await supabaseAdmin
    .from('schedule_participants')
    .select('user_id')
    .eq('schedule_id', scheduleId);

  // 참여자가 없으면 일정 생성자 + 가족 전체에 발송
  let targetIds: string[] = (participants ?? []).map((p: { user_id: string }) => p.user_id);

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
    return NextResponse.json({ error: 'FCM 토큰 없음 (알림 미허용 상태)' }, { status: 404 });
  }

  let sentCount = 0;

  for (const profile of profiles) {
    if (!profile.fcm_token) continue;

    // ── 3) FCM 발송 ────────────────────────────────────────
    try {
      const res = await fetch(FCM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `key=${serverKey}`,
        },
        body: JSON.stringify({
          to: profile.fcm_token,
          notification: { title, body, icon: '/icon-192.png' },
          data: { url: url ?? `/schedules/${scheduleId}` },
        }),
      });

      const result = await res.json();
      if (result.success > 0) sentCount++;
    } catch (err) {
      console.error('[ReNotify] FCM 발송 실패:', profile.id, err);
    }

    // ── 4) 알림 기록 ────────────────────────────────────────
    await supabaseAdmin.from('notifications').insert({
      user_id:     profile.id,
      schedule_id: scheduleId,
      title,
      body,
      type:        're_notify',
    });
  }

  return NextResponse.json({ success: true, sent: sentCount, total: profiles.length });
}
