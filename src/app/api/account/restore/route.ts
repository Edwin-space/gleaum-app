/**
 * 글리움 — 탈퇴 신청 취소(복구) API
 * POST /api/account/restore
 *
 * - 탈퇴 신청 후 30일 이내에만 가능
 * - 복구 시 withdrawal_requested_at 초기화
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

const RECOVERY_DAYS = 30;

export async function POST(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── 탈퇴 신청 상태 확인 ────────────────────────────────────
  const { data: profile } = await admin
    .from('profiles')
    .select('withdrawal_requested_at, is_withdrawn')
    .eq('id', auth.user.id)
    .single();

  if (!profile) return NextResponse.json({ error: '프로필을 찾을 수 없습니다.' }, { status: 404 });
  if (profile.is_withdrawn) return NextResponse.json({ error: '이미 탈퇴 처리된 계정입니다. 복구가 불가능합니다.' }, { status: 410 });
  if (!profile.withdrawal_requested_at) return NextResponse.json({ error: '탈퇴 신청 이력이 없습니다.' }, { status: 400 });

  // ── 30일 이내 확인 ─────────────────────────────────────────
  const requestedAt = new Date(profile.withdrawal_requested_at);
  const deadline = new Date(requestedAt.getTime() + RECOVERY_DAYS * 24 * 60 * 60 * 1000);
  if (new Date() > deadline) {
    return NextResponse.json({ error: '복구 가능 기간(30일)이 지났습니다.' }, { status: 410 });
  }

  // ── 복구 처리 ──────────────────────────────────────────────
  await admin
    .from('profiles')
    .update({ withdrawal_requested_at: null })
    .eq('id', auth.user.id);

  // withdrawal_archive에서 해당 신청 레코드 삭제 (통계 되돌리기)
  await admin
    .from('withdrawal_archive')
    .delete()
    .eq('withdrawal_requested_at', profile.withdrawal_requested_at)
    .is('withdrawn_at', null);   // 실제 삭제 처리 전인 것만

  return NextResponse.json({ success: true, message: '탈퇴 신청이 취소되었습니다.' });
}
