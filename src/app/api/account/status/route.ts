/**
 * 글리움 — 탈퇴 신청 상태 조회
 * GET /api/account/status
 */

import { NextResponse } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const RECOVERY_DAYS = 30;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from('profiles')
    .select('withdrawal_requested_at, is_withdrawn')
    .eq('id', user.id)
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
