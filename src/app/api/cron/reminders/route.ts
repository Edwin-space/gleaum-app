/**
 * 글리움 — 일정 리마인더 크론잡
 * GET /api/cron/reminders
 *
 * Vercel Cron에서 5분마다 호출됩니다 (vercel.json 참조).
 * 리마인더 시각이 된 일정을 찾아 해당 가족 구성원에게 FCM 알림을 발송합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';

export async function GET(req: NextRequest) {
  // 서비스롤 클라이언트 — 요청 핸들러 내부에서 초기화 (빌드 타임 실행 방지)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // Vercel Cron 인증 헤더 검증
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey || serverKey === '여기에_서버키_붙여넣기') {
    return NextResponse.json({ error: 'FCM_SERVER_KEY 미설정' }, { status: 500 });
  }

  const now = new Date();

  // ── 1) 리마인더 대상 일정 조회 ────────────────────────────
  // 조건: start_time - reminder분 <= 지금 < start_time - reminder분 + 5분
  // 즉, 지금으로부터 5분 이내에 리마인더를 보내야 하는 일정
  const windowEnd   = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  const windowStart = now.toISOString();

  const { data: schedules, error: sErr } = await supabaseAdmin
    .from('schedules')
    .select('id, title, type, start_time, reminder, family_group_id, created_by')
    .eq('status', 'pending')
    .gt('reminder', 0)   // reminder가 설정된 일정만
    .gte('start_time', windowStart); // 아직 시작 안 한 일정만

  if (sErr || !schedules) {
    console.error('[Cron] 일정 조회 실패:', sErr);
    return NextResponse.json({ error: '일정 조회 실패' }, { status: 500 });
  }

  // reminder 시각 = start_time - reminder분
  const targets = schedules.filter((s) => {
    const reminderAt = new Date(new Date(s.start_time).getTime() - s.reminder * 60 * 1000);
    return reminderAt >= new Date(now.getTime()) && reminderAt <= new Date(windowEnd);
  });

  if (targets.length === 0) {
    return NextResponse.json({ sent: 0, message: '발송할 리마인더 없음' });
  }

  let sentCount = 0;

  for (const schedule of targets) {
    // ── 2) 이미 이 일정의 reminder 알림을 보냈는지 확인 ──
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('schedule_id', schedule.id)
      .eq('type', 'reminder')
      .maybeSingle();

    if (existing) continue; // 이미 발송됨

    // ── 3) 가족 구성원 FCM 토큰 조회 ─────────────────────
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, name, fcm_token')
      .eq('family_group_id', schedule.family_group_id)
      .not('fcm_token', 'is', null);

    if (!profiles || profiles.length === 0) continue;

    const startTime = new Date(schedule.start_time).toLocaleTimeString('ko-KR', {
      hour: '2-digit', minute: '2-digit',
    });
    const title = `⏰ ${schedule.title}`;
    const body  = `${schedule.reminder}분 후 시작 (${startTime})`;

    for (const profile of profiles) {
      if (!profile.fcm_token) continue;

      // ── 4) FCM 발송 ───────────────────────────────────
      try {
        await fetch(FCM_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `key=${serverKey}`,
          },
          body: JSON.stringify({
            to: profile.fcm_token,
            notification: { title, body, icon: '/icon-192.png' },
            data: { url: `/schedules/${schedule.id}` },
          }),
        });
        sentCount++;
      } catch (err) {
        console.error('[Cron] FCM 발송 실패:', profile.id, err);
      }

      // ── 5) notifications 테이블에 기록 ────────────────
      await supabaseAdmin.from('notifications').insert({
        user_id:     profile.id,
        schedule_id: schedule.id,
        title,
        body,
        type:        'reminder',
      });
    }
  }

  return NextResponse.json({ sent: sentCount, targets: targets.length });
}
