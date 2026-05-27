/**
 * 글리움 — 일정 리마인더 크론잡 (FCM v1)
 * GET /api/cron/reminders
 *
 * Supabase pg_cron + pg_net에서 5분마다 자동 호출됩니다.
 * Vercel Hobby 플랜 제한 때문에 vercel.json crons는 사용하지 않습니다.
 * 리마인더 시각이 된 일정을 찾아 가족 구성원에게 FCM 알림을 발송합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFCMToMultiple } from '@/lib/fcm';
import { formatTimeTZ } from '@/lib/utils';

// Supabase pg_net은 POST로 호출 → GET과 동일하게 처리
export async function POST(req: NextRequest) { return GET(req); }

export async function GET(req: NextRequest) {
  // Supabase pg_net 호출 인증
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

  // ── 1) 리마인더 대상 일정 조회 (공간 timezone 포함) ─────────
  // ★ expense(지출) 유형 제외 — 가계부 지출 기록에 리마인더 FCM 불필요
  const { data: schedules, error } = await supabaseAdmin
    .from('schedules')
    .select('id, title, start_time, reminder, family_group_id, family_groups(timezone)')
    .eq('status', 'pending')
    .gt('reminder', 0)
    .neq('type', 'expense')          // 지출 유형 제외
    .gte('start_time', now.toISOString());

  if (error || !schedules) {
    return NextResponse.json({ error: '일정 조회 실패' }, { status: 500 });
  }

  // 리마인더 시각 = start_time - reminder분 이 현재 윈도우(5분) 안에 있는 것
  const targets = schedules.filter((s) => {
    const reminderAt = new Date(new Date(s.start_time).getTime() - s.reminder * 60 * 1000);
    return reminderAt >= now && reminderAt <= new Date(windowEnd);
  });

  if (targets.length === 0) {
    return NextResponse.json({ sent: 0, message: '발송할 리마인더 없음' });
  }

  let totalSent = 0;

  for (const schedule of targets) {
    // ── 2) 이미 발송된 리마인더인지 확인 ─────────────────────
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('schedule_id', schedule.id)
      .eq('type', 'reminder')
      .maybeSingle();

    if (existing) continue;

    // ── 3) 공간 멤버 FCM 토큰 조회 (space_members 기반) ──────
    const { data: spaceMembers } = await supabaseAdmin
      .from('space_members')
      .select('user_id')
      .eq('space_id', schedule.family_group_id);

    const memberIds = (spaceMembers ?? []).map((m: { user_id: string }) => m.user_id);
    if (memberIds.length === 0) continue;

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, fcm_token')
      .in('id', memberIds)
      .not('fcm_token', 'is', null);

    if (!profiles || profiles.length === 0) continue;

    const tokens = profiles.map((p: { fcm_token: string }) => p.fcm_token).filter(Boolean);

    // 공간 timezone (없으면 'Asia/Seoul' 기본값) — 서버는 UTC로 실행되므로 반드시 명시
    const spaceTZ: string = (schedule.family_groups as any)?.timezone ?? 'Asia/Seoul';
    const startTime = formatTimeTZ(new Date(schedule.start_time), spaceTZ);
    const title = `⏰ ${schedule.title}`;
    const body  = `${schedule.reminder}분 후 시작 (${startTime})`;
    const url   = `/schedules/${schedule.id}`;

    // ── 4) FCM v1 발송 ────────────────────────────────────
    const sent = await sendFCMToMultiple(tokens, title, body, url);
    totalSent += sent;

    // ── 5) 알림 기록 ──────────────────────────────────────
    const records = profiles.map((p: { id: string }) => ({
      user_id:     p.id,
      schedule_id: schedule.id,
      title,
      body,
      type:        'reminder',
    }));
    await supabaseAdmin.from('notifications').insert(records);
  }

  return NextResponse.json({ sent: totalSent, targets: targets.length });
}
