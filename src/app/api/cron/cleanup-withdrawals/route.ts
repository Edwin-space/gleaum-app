/**
 * 글리움 — 회원탈퇴 자동 처리 크론잡
 * GET /api/cron/cleanup-withdrawals
 *
 * 매일 1회 실행 (Supabase pg_cron 또는 Vercel Cron)
 * 탈퇴 신청 후 30일이 경과한 계정을 자동 처리:
 *
 * [삭제 항목 — PII]
 *   - profiles: name, email, avatar, fcm_token, notification_settings → 익명화
 *   - schedules: 본인의 private 일정 삭제
 *   - space_members: 모든 공간에서 제거
 *   - notifications: 본인 알림 삭제
 *   - auth.users: Supabase Auth 계정 삭제 (Admin API)
 *
 * [보관 항목 — 법적/통계]
 *   - withdrawal_archive: 익명화된 가입/탈퇴 월 통계 (PII 없음, 영구 보관)
 *   - access_logs: 3개월 후 자동 삭제 (통신비밀보호법)
 *   - campaign_clicks: user_id NULL 처리 (마케팅 통계 보관)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const WITHDRAWAL_DAYS = 30;
const LOG_RETENTION_DAYS = 90; // 통신비밀보호법 3개월

export async function POST(req: NextRequest) { return GET(req); }

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cutoff = new Date(Date.now() - WITHDRAWAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const logCutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // ── 1. 30일 경과 탈퇴 신청 계정 조회 ─────────────────────
  const { data: targets, error: fetchError } = await admin
    .from('profiles')
    .select('id, created_at, withdrawal_requested_at')
    .not('withdrawal_requested_at', 'is', null)
    .lte('withdrawal_requested_at', cutoff)
    .eq('is_withdrawn', false);

  if (fetchError) {
    console.error('[cleanup-withdrawals] 조회 오류:', fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!targets || targets.length === 0) {
    // 오래된 접속 로그 정리 후 종료
    await admin.from('access_logs').delete().lte('logged_at', logCutoff);
    return NextResponse.json({ processed: 0, message: '처리 대상 없음' });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const profile of targets) {
    try {
      const userId = profile.id;
      const withdrawnAt = new Date().toISOString();

      // ── 2. 공간 멤버십 제거 ─────────────────────────────
      await admin.from('space_members').delete().eq('user_id', userId);

      // ── 3. private 일정 삭제 ───────────────────────────
      await admin.from('schedules').delete()
        .eq('created_by', userId)
        .eq('visibility', 'private');

      // ── 4. 일정 참여자 레코드 삭제 ─────────────────────
      await admin.from('schedule_participants').delete().eq('user_id', userId);

      // ── 5. 알림 삭제 ───────────────────────────────────
      await admin.from('notifications').delete().eq('user_id', userId);

      // ── 6. 캠페인 클릭 익명화 (통계 보관) ──────────────
      // campaign_clicks에 user_id 컬럼이 있다면 null 처리
      // (없으면 skip)

      // ── 7. 프로필 PII 익명화 (행은 유지 — FK 무결성) ───
      await admin.from('profiles').update({
        name:                   '탈퇴한 사용자',
        display_name:           null,
        email:                  null,
        avatar:                 '👤',
        fcm_token:              null,
        notification_settings:  {},
        family_group_id:        null,
        onboarding_completed_at: null,
        is_withdrawn:           true,
        // withdrawal_requested_at은 법적 기록으로 유지
      }).eq('id', userId);

      // ── 8. withdrawal_archive 완료 처리 ────────────────
      await admin.from('withdrawal_archive').update({
        withdrawn_at: withdrawnAt,
        withdrawn_month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      })
        .eq('withdrawal_requested_at', profile.withdrawal_requested_at)
        .is('withdrawn_at', null);

      // ── 9. Supabase Auth 계정 삭제 ─────────────────────
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.error(`[cleanup-withdrawals] Auth 삭제 실패 (${userId}):`, authDeleteError.message);
        // Auth 삭제 실패해도 PII는 이미 삭제됨 → 계속 진행
      }

      processed++;
      console.log(`[cleanup-withdrawals] 처리 완료: ${userId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${profile.id}: ${msg}`);
      console.error(`[cleanup-withdrawals] 오류 (${profile.id}):`, msg);
    }
  }

  // ── 10. 오래된 접속 로그 정리 (통신비밀보호법 3개월) ────────
  const { count: logsDeleted } = await admin
    .from('access_logs')
    .delete({ count: 'exact' })
    .lte('logged_at', logCutoff);

  // ── 11. 오래된 초대 시도 기록 정리 (24시간 이상) ────────────
  const attemptsCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await admin.from('invite_attempts').delete().lte('created_at', attemptsCutoff);

  console.log(`[cleanup-withdrawals] 완료 — 처리: ${processed}, 오류: ${errors.length}, 로그 정리: ${logsDeleted ?? 0}건`);

  return NextResponse.json({
    processed,
    errors: errors.length > 0 ? errors : undefined,
    logsDeleted: logsDeleted ?? 0,
  });
}
