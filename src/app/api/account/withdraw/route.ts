/**
 * 글리움 — 회원탈퇴 신청 API
 * POST /api/account/withdraw
 *
 * - 탈퇴 신청 후 30일간 복구 가능 (소프트 딜리트)
 * - 30일 경과 후 cron이 PII 완전 삭제
 * - 탈퇴 신청 즉시: FCM 토큰 삭제 (푸시 알림 중단)
 * - Body: { reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export async function POST(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let reason: string | undefined;
  try {
    const body = await req.json();
    reason = typeof body.reason === 'string' ? body.reason.slice(0, 200) : undefined;
  } catch { /* body 없어도 진행 */ }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── 1. 이미 탈퇴 신청 중인지 확인 ──────────────────────────
  const { data: profile } = await admin
    .from('profiles')
    .select('withdrawal_requested_at, is_withdrawn, created_at')
    .eq('id', auth.user.id)
    .single();

  if (!profile) return NextResponse.json({ error: '프로필을 찾을 수 없습니다.' }, { status: 404 });
  if (profile.is_withdrawn) return NextResponse.json({ error: '이미 탈퇴 처리된 계정입니다.' }, { status: 409 });
  if (profile.withdrawal_requested_at) {
    return NextResponse.json({ error: '이미 탈퇴 신청 중입니다.', withdrawalRequestedAt: profile.withdrawal_requested_at }, { status: 409 });
  }

  const now = new Date().toISOString();

  // ── 2. 탈퇴 신청 기록 ──────────────────────────────────────
  await admin
    .from('profiles')
    .update({
      withdrawal_requested_at: now,
      fcm_token: null,           // 즉시 푸시 알림 중단
    })
    .eq('id', auth.user.id);

  // ── 3. withdrawal_archive에 익명 통계 사전 기록 ────────────
  const signupDate = new Date(profile.created_at ?? now);
  await admin.from('withdrawal_archive').insert({
    signup_year_month: `${signupDate.getFullYear()}-${String(signupDate.getMonth() + 1).padStart(2, '0')}`,
    withdrawal_requested_month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    withdrawal_requested_at: now,
    reason: reason ?? null,
  });

  // ── 4. 세션 로그아웃 ─────────────────────────────────────
  await auth.supabase.auth.signOut();

  return NextResponse.json({
    success: true,
    message: '탈퇴가 신청되었습니다. 30일 이내에 복구하실 수 있습니다.',
    withdrawalRequestedAt: now,
    deleteScheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
}
