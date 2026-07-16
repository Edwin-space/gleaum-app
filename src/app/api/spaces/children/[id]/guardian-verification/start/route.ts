import { NextResponse } from 'next/server';
import {
  createGuardianEmailVerification,
  revokeGuardianEmailVerification,
} from '@/lib/db';
import { getPublicAppUrl } from '@/lib/guardian-consent';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'dependent_id_required' }, { status: 400 });
  if (!user.email || !user.email_confirmed_at) {
    return NextResponse.json({ error: 'verified_guardian_email_required' }, { status: 409 });
  }

  let verification: { token: string; expiresAt: string } | null = null;
  try {
    verification = await createGuardianEmailVerification(id, supabase);
    const nextPath = `/family/guardian/verify?token=${encodeURIComponent(verification.token)}`;
    const callbackUrl = new URL('/auth/callback', getPublicAppUrl());
    callbackUrl.searchParams.set('next', nextPath);

    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: callbackUrl.toString(),
      },
    });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      email: user.email,
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
