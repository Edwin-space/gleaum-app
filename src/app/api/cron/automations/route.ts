/**
 * 글리움 — 자동화 정책 기반 상태 전환 크론잡
 * GET /api/cron/automations
 *
 * Supabase pg_cron에서 5분마다 호출됩니다.
 * automation_policy에 따라 일정 상태를 자동 전환하고 알림을 발송합니다.
 *
 * 지원 정책:
 * - time_window:          시작 시각 도달 → in_progress, 종료 시각 경과 → completed
 * - completion_required:  시작 시각 도달 → in_progress, 종료 시각 경과(미완료) → missed + 알림
 * - payment_due:          시작일(결제 예정일) 도달 → in_progress, 경과(미완료) → missed + 알림
 * - reminder_only:        상태 변경 없음 (리마인더 크론에서 처리)
 * - confirmation_required: 향후 구현 예정
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFCMToMultiple } from '@/lib/fcm';
import { isNotificationEnabled } from '@/lib/notification-settings';

// Supabase pg_net은 POST로 호출 → GET과 동일하게 처리
export async function POST(req: NextRequest) { return GET(req); }

export async function GET(req: NextRequest) {
  // Cron 인증
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const results = {
    time_window: { started: 0, ended: 0 },
    completion_required: { started: 0, missed: 0 },
    payment_due: { started: 0, overdue: 0 },
  };

  // ────────────────────────────────────────────────────────────
  // 1) time_window: pending → in_progress (시작 시각 도달)
  // ────────────────────────────────────────────────────────────
  {
    const { data: toStart } = await supabaseAdmin
      .from('schedules')
      .select('id')
      .eq('automation_policy', 'time_window')
      .eq('status', 'pending')
      .lte('start_time', now.toISOString());

    if (toStart && toStart.length > 0) {
      const ids = toStart.map((s) => s.id);
      await supabaseAdmin
        .from('schedules')
        .update({ status: 'in_progress' })
        .in('id', ids);
      results.time_window.started = ids.length;
    }
  }

  // time_window: in_progress → completed (종료 시각 경과)
  {
    const { data: toEnd } = await supabaseAdmin
      .from('schedules')
      .select('id')
      .eq('automation_policy', 'time_window')
      .eq('status', 'in_progress')
      .not('end_time', 'is', null)
      .lte('end_time', now.toISOString());

    if (toEnd && toEnd.length > 0) {
      const ids = toEnd.map((s) => s.id);
      await supabaseAdmin
        .from('schedules')
        .update({ status: 'completed' })
        .in('id', ids);
      results.time_window.ended = ids.length;
    }
  }

  // ────────────────────────────────────────────────────────────
  // 2) completion_required: pending → in_progress (시작 시각 도달)
  // ────────────────────────────────────────────────────────────
  {
    const { data: toStart } = await supabaseAdmin
      .from('schedules')
      .select('id')
      .eq('automation_policy', 'completion_required')
      .eq('status', 'pending')
      .lte('start_time', now.toISOString());

    if (toStart && toStart.length > 0) {
      const ids = toStart.map((s) => s.id);
      await supabaseAdmin
        .from('schedules')
        .update({ status: 'in_progress' })
        .in('id', ids);
      results.completion_required.started = ids.length;
    }
  }

  // completion_required: in_progress → missed (종료 시각 경과 & 아직 미완료)
  {
    const { data: toMiss } = await supabaseAdmin
      .from('schedules')
      .select('id, title, family_group_id, created_by')
      .eq('automation_policy', 'completion_required')
      .eq('status', 'in_progress')
      .not('end_time', 'is', null)
      .lte('end_time', now.toISOString());

    if (toMiss && toMiss.length > 0) {
      const ids = toMiss.map((s) => s.id);
      await supabaseAdmin
        .from('schedules')
        .update({ status: 'missed' })
        .in('id', ids);
      results.completion_required.missed = ids.length;

      // 미완료 알림 발송 — 관찰자(부모/생성자) + 담당자에게
      for (const schedule of toMiss) {
        await sendMissedNotification(supabaseAdmin, schedule, now);
      }
    }
  }

  // ────────────────────────────────────────────────────────────
  // 3) payment_due: pending → in_progress (결제 예정일 도달)
  // ★ repeat = 'none'(일회성 지출) 제외 — 정기지출만 상태 전환
  // ────────────────────────────────────────────────────────────
  {
    const { data: toStart } = await supabaseAdmin
      .from('schedules')
      .select('id')
      .eq('automation_policy', 'payment_due')
      .eq('status', 'pending')
      .not('repeat', 'eq', 'none')   // 일회성 지출 제외
      .lte('start_time', now.toISOString());

    if (toStart && toStart.length > 0) {
      const ids = toStart.map((s) => s.id);
      await supabaseAdmin
        .from('schedules')
        .update({ status: 'in_progress' })
        .in('id', ids);
      results.payment_due.started = ids.length;
    }
  }

  // payment_due: in_progress → missed (기한 경과 & 미납)
  // ★ repeat = 'none'(일회성 지출 기록)은 제외:
  //   일반 지출 등록 시 automation_policy 가 잘못 payment_due 로 설정된 레거시 레코드 보호.
  //   정기지출(repeat != 'none')만 기한 초과 알림 발송.
  {
    const { data: toOverdue } = await supabaseAdmin
      .from('schedules')
      .select('id, title, family_group_id, created_by, repeat')
      .eq('automation_policy', 'payment_due')
      .eq('status', 'in_progress')
      .not('repeat', 'eq', 'none')   // 일회성 지출 제외 — repeat 있는 정기지출만
      .not('end_time', 'is', null)
      .lte('end_time', now.toISOString());

    if (toOverdue && toOverdue.length > 0) {
      const ids = toOverdue.map((s) => s.id);
      await supabaseAdmin
        .from('schedules')
        .update({ status: 'missed' })
        .in('id', ids);
      results.payment_due.overdue = ids.length;

      for (const schedule of toOverdue) {
        await sendOverdueNotification(supabaseAdmin, schedule, now);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    processed_at: now.toISOString(),
    results,
  });
}

// ── 알림 발송 헬퍼 ─────────────────────────────────────────

interface ScheduleRef {
  id: string;
  title: string;
  family_group_id: string;
  created_by: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any;

/** 미완료(missed) 알림: 담당자 + 관찰자(생성자/부모)에게 FCM + DB 기록 */
async function sendMissedNotification(
  supabase: SupabaseAdmin,
  schedule: ScheduleRef,
  now: Date
) {
  // 참여자 + 생성자 모두에게 알림
  const { data: participants } = await supabase
    .from('schedule_participants')
    .select('user_id')
    .eq('schedule_id', schedule.id);

  const targetUserIds = new Set<string>();
  targetUserIds.add(schedule.created_by); // 관찰자(생성자)
  participants?.forEach((p: { user_id: string }) => targetUserIds.add(p.user_id));

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, fcm_token, notification_settings')
    .in('id', Array.from(targetUserIds))
    .not('fcm_token', 'is', null);

  const enabledProfiles = (profiles ?? []).filter((profile: { notification_settings?: unknown }) =>
    isNotificationEnabled(profile.notification_settings, 'routineReminders'),
  );
  if (enabledProfiles.length === 0) return;

  const title = `❌ ${schedule.title}`;
  const body = '기한이 지났지만 완료되지 않았습니다.';
  const url = `/schedules/${schedule.id}`;

  const tokens = enabledProfiles.map((p: { fcm_token: string }) => p.fcm_token).filter(Boolean);
  await sendFCMToMultiple(tokens, title, body, url);

  // DB 알림 기록
  const records = enabledProfiles.map((p: { id: string }) => ({
    user_id: p.id,
    schedule_id: schedule.id,
    title,
    body,
    type: 'completion' as const,
    created_at: now.toISOString(),
  }));
  await supabase.from('notifications').insert(records);
}

/** 미납(overdue) 알림: 결제 담당자 + Space 멤버에게 */
async function sendOverdueNotification(
  supabase: SupabaseAdmin,
  schedule: ScheduleRef,
  now: Date
) {
  // 공간 멤버 전체에게 알림 (space_members 기반)
  const { data: spaceMembers } = await supabase
    .from('space_members')
    .select('user_id')
    .eq('space_id', schedule.family_group_id);

  const memberIds = (spaceMembers ?? []).map((m: { user_id: string }) => m.user_id);
  if (!memberIds.length) return;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, fcm_token, notification_settings')
    .in('id', memberIds)
    .not('fcm_token', 'is', null);

  const enabledProfiles = (profiles ?? []).filter((profile: { notification_settings?: unknown }) =>
    isNotificationEnabled(profile.notification_settings, 'expenseReminders'),
  );
  if (enabledProfiles.length === 0) return;

  const title = `💳 ${schedule.title}`;
  const body = '결제 기한이 지났습니다. 확인해주세요.';
  const url = `/schedules/${schedule.id}`;

  const tokens = enabledProfiles.map((p: { fcm_token: string }) => p.fcm_token).filter(Boolean);
  await sendFCMToMultiple(tokens, title, body, url);

  const records = enabledProfiles.map((p: { id: string }) => ({
    user_id: p.id,
    schedule_id: schedule.id,
    title,
    body,
    type: 'system' as const,
    created_at: now.toISOString(),
  }));
  await supabase.from('notifications').insert(records);
}
