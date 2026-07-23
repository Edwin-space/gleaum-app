/**
 * 글리움 — 탈퇴 신청 상태 조회
 * GET /api/account/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

const RECOVERY_DAYS = 30;

export async function GET(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('withdrawal_requested_at, is_withdrawn')
    .eq('id', auth.user.id)
    .single();

  if (!profile) return NextResponse.json({ withdrawalPending: false });

  if (profile.is_withdrawn) {
    return NextResponse.json({ withdrawalPending: false, isWithdrawn: true });
  }

  if (!profile.withdrawal_requested_at) {
    return NextResponse.json({ withdrawalPending: false });
  }

  const requestedAt = new Date(profile.withdrawal_requested_at);
  const deleteScheduledAt = new Date(requestedAt.getTime() + RECOVERY_DAYS * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil((deleteScheduledAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return NextResponse.json({
    withdrawalPending: true,
    withdrawalRequestedAt: profile.withdrawal_requested_at,
    deleteScheduledAt: deleteScheduledAt.toISOString(),
    daysLeft,
  });
}
