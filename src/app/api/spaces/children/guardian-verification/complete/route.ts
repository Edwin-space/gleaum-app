import { NextRequest, NextResponse } from 'next/server';
import { completeGuardianEmailConsent } from '@/lib/db';
import {
  GUARDIAN_POLICY_VERSION,
  REQUIRED_GUARDIAN_CONSENTS,
} from '@/lib/guardian-consent';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export async function POST(request: NextRequest) {
  const auth = await createNativeRouteAuth(request);
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { supabase } = auth;

  let token = '';
  let consentTypes: string[] = [];
  try {
    const body = await request.json() as { token?: unknown; consentTypes?: unknown };
    token = typeof body.token === 'string' ? body.token.trim() : '';
    consentTypes = Array.isArray(body.consentTypes)
      ? body.consentTypes.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const hasAllRequiredConsents = REQUIRED_GUARDIAN_CONSENTS.every((type) =>
    consentTypes.includes(type),
  );
  const hasOnlyRequiredConsents = consentTypes.every((type) =>
    REQUIRED_GUARDIAN_CONSENTS.includes(type as typeof REQUIRED_GUARDIAN_CONSENTS[number]),
  );
  if (!/^gev_[a-f0-9]{64}$/.test(token) || !hasAllRequiredConsents || !hasOnlyRequiredConsents) {
    return NextResponse.json({ error: 'required_consents_missing' }, { status: 400 });
  }

  try {
    const result = await completeGuardianEmailConsent(
      token,
      GUARDIAN_POLICY_VERSION,
      consentTypes,
      supabase,
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('[guardian-verification/complete]', error);
    if (message.includes('verification_expired')) {
      return NextResponse.json({ error: 'verification_expired' }, { status: 410 });
    }
    if (message.includes('email_otp_verification_required')) {
      return NextResponse.json({ error: 'email_otp_verification_required' }, { status: 403 });
    }
    if (message.includes('already_used')) {
      return NextResponse.json({ error: 'verification_already_used' }, { status: 409 });
    }
    if (message.includes('invalid_verification_token')) {
      return NextResponse.json({ error: 'invalid_verification_token' }, { status: 403 });
    }
    return NextResponse.json({ error: 'guardian_consent_failed' }, { status: 500 });
  }
}
