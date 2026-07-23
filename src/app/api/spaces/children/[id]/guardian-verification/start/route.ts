import { NextRequest, NextResponse } from 'next/server';
import {
  createGuardianEmailVerification,
  revokeGuardianEmailVerification,
} from '@/lib/db';
import { getGuardianEmailOtpRedirectUrl } from '@/lib/guardian-consent';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await createNativeRouteAuth(request);
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { supabase, user } = auth;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'dependent_id_required' }, { status: 400 });
  if (!user.email || !user.email_confirmed_at) {
    return NextResponse.json({ error: 'verified_guardian_email_required' }, { status: 409 });
  }

  let verification: { token: string; expiresAt: string } | null = null;
  try {
    verification = await createGuardianEmailVerification(id, supabase);

    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        shouldCreateUser: false,
        // Supabase Auth의 고정 Magic Link/OTP 템플릿 안에서 보호자용 본문을
        // 선택하는 표시값이다. 실제 권한 검증은 DB challenge에 계속 묶인다.
        emailRedirectTo: getGuardianEmailOtpRedirectUrl(),
      },
    });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      email: user.email,
      challengeToken: verification.token,
      expiresAt: verification.expiresAt,
    });
  } catch (error) {
    if (verification) {
      try {
        await revokeGuardianEmailVerification(verification.token, supabase);
      } catch (revokeError) {
        console.error('[guardian-verification/revoke]', revokeError);
      }
    }

    const message = error instanceof Error ? error.message : '';
    console.error('[guardian-verification/start]', error);
    if (message.includes('verification_rate_limited')) {
      return NextResponse.json({ error: 'verification_rate_limited' }, { status: 429 });
    }
    if (message.includes('dependent_not_found_or_forbidden')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (message.includes('dependent_already_linked')) {
      return NextResponse.json({ error: 'dependent_already_linked' }, { status: 409 });
    }
    return NextResponse.json({ error: 'verification_email_send_failed' }, { status: 502 });
  }
}
