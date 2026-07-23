import { NextResponse } from 'next/server';
import { confirmGuardianEmailVerification } from '@/lib/db';
import { GUARDIAN_EMAIL_OTP_LENGTH } from '@/lib/guardian-consent';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let code = '';
  let challengeToken = '';
  try {
    const body = await request.json() as { code?: unknown; challengeToken?: unknown };
    code = typeof body.code === 'string' ? body.code.replace(/\s/g, '') : '';
    challengeToken = typeof body.challengeToken === 'string' ? body.challengeToken.trim() : '';
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const hasValidCodeFormat = (
    code.length === GUARDIAN_EMAIL_OTP_LENGTH
    && /^\d+$/.test(code)
  );
  if (!hasValidCodeFormat || !/^gev_[a-f0-9]{64}$/.test(challengeToken)) {
    return NextResponse.json({ error: 'invalid_verification_code' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: currentUser.email,
      token: code,
      type: 'email',
    });
    if (error || !data.user || data.user.id !== currentUser.id) {
      throw error ?? new Error('guardian_account_mismatch');
    }

    await confirmGuardianEmailVerification(challengeToken, supabase);

    return NextResponse.json({
      success: true,
      nextPath: `/family/guardian/verify?token=${encodeURIComponent(challengeToken)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('[guardian-verification/verify-otp]', error);
    if (
      message.includes('expired')
      || message.includes('invalid_verification_token')
      || message.includes('verification_expired')
    ) {
      return NextResponse.json({ error: 'verification_expired' }, { status: 410 });
    }
    if (message.includes('guardian_account_mismatch')) {
      return NextResponse.json({ error: 'guardian_account_mismatch' }, { status: 403 });
    }
    return NextResponse.json({ error: 'invalid_verification_code' }, { status: 400 });
  }
}
