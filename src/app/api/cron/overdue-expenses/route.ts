/**
 * 글리움 — 고정지출 연체 알림 크론잡
 * GET/POST /api/cron/overdue-expenses
 *
 * Supabase pg_cron에서 매일 00:00 UTC (= 09:00 KST)에 호출됩니다.
 * 고정지출(repeat != 'none') 중 결제 예정일이 지났지만 아직 pending 상태인 항목에 대해
 * D+0, D+3, D+7 시점에 사용자에게 FCM 알림을 발송하고 notifications 테이블에 기록합니다.
 *
 * 중복 알림 방지: 같은 schedule_id × user_id로 오늘 이미 발송된 경우 스킵합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFCMToMultiple } from '@/lib/fcm';
import { isNotificationEnabled } from '@/lib/notification-settings';

export async function POST(req: NextRequest) { return GET(req); }

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // 오늘 자정 UTC (= 오늘 09:00 KST, 크론 실행 시각)
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // 알림 대상: 최대 D+7까지 (오늘 포함 8일 범위)
  const windowStart = new Date(todayUTC.getTime() - 7 * MS_PER_DAY);

  // ── 대상 조회: 고정지출 중 pending + 결제 예정일이 windowStart ~ todayUTC(inclusive) ──
  const { data: candidates, error } = await supabase
    .from('schedules')
    .select('id, title, created_by, start_time')
    .eq('type', 'expense')
    .eq('status', 'pending')
    .neq('repeat', 'none')
    .gte('start_time', windowStart.toISOString())
    .lte('start_time', new Date(todayUTC.getTime() + MS_PER_DAY - 1).toISOString()); // 오늘 23:59:59 포함

  if (error) {
    console.error('[overdue-expenses] 조회 오류:', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!candidates?.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let notified = 0;
  const NOTIFY_DAYS = new Set([0, 3, 7]);

  for (const expense of candidates) {
    // ── 연체 일수 계산 ──
    const payDate = new Date(expense.start_time as string);
    const payDateUTC = new Date(Date.UTC(
      payDate.getUTCFullYear(),
      payDate.getUTCMonth(),
      payDate.getUTCDate()
    ));
    const daysOverdue = Math.round((todayUTC.getTime() - payDateUTC.getTime()) / MS_PER_DAY);

    // D+0, D+3, D+7 아니면 스킵
    if (!NOTIFY_DAYS.has(daysOverdue)) continue;

    // ── 오늘 이미 알림 발송 여부 확인 (중복 방지) ──
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('schedule_id', expense.id)
      .eq('user_id', expense.created_by)
      .gte('created_at', todayUTC.toISOString())
      .limit(1);

    if (existing?.length) continue;

    // ── 알림 메시지 ──
    const title = daysOverdue === 0
      ? `💳 오늘 결제일: ${expense.title}`
      : `⚠️ 미결제 알림: ${expense.title}`;
    const body = daysOverdue === 0
      ? '오늘이 결제 예정일입니다. 결제 후 완료 처리해 주세요.'
      : daysOverdue === 3
        ? '결제 예정일로부터 3일이 지났습니다. 확인해 주세요.'
        : '결제 예정일로부터 7일이 지났습니다. 빠른 확인이 필요합니다 🔴';
    const url = '/budget';

    // ── FCM 발송 ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, fcm_token, notification_settings')
      .eq('id', expense.created_by)
      .single();

    if (!profile || !isNotificationEnabled(profile.notification_settings, 'expenseReminders')) continue;

    if (profile.fcm_token) {
      await sendFCMToMultiple([profile.fcm_token], title, body, url);
    }

    // ── notifications 기록 ──
    await supabase.from('notifications').insert({
      user_id:     expense.created_by,
      schedule_id: expense.id,
      title,
      body,
      type:        'system',
      created_at:  now.toISOString(),
    });

    notified++;
  }

  return NextResponse.json({
    ok: true,
    processed_at: now.toISOString(),
    candidates: candidates.length,
    notified,
  });
}
