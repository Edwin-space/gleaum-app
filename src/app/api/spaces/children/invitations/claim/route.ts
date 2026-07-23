import { NextRequest, NextResponse } from 'next/server';
import { claimFamilyChildInvitation } from '@/lib/db';
import { isFamilyChildInviteToken } from '@/lib/family-child';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export async function POST(request: NextRequest) {
  const auth = await createNativeRouteAuth(request);
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { supabase } = auth;

  let token = '';
  try {
    const body = await request.json() as { token?: unknown };
    token = typeof body.token === 'string' ? body.token.trim() : '';
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!isFamilyChildInviteToken(token)) {
    return NextResponse.json({ error: 'invalid_invitation' }, { status: 400 });
  }

  try {
    const result = await claimFamilyChildInvitation(token, supabase);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('[family/invitations/claim]', error);
    if (message.includes('expired_invitation')) {
      return NextResponse.json({ error: 'expired_invitation' }, { status: 410 });
    }
    if (message.includes('invited_email_mismatch')) {
      return NextResponse.json({ error: 'invited_email_mismatch' }, { status: 403 });
    }
    if (message.includes('guardian_account_cannot_claim_child_invitation')) {
      return NextResponse.json({ error: 'guardian_account_cannot_claim_child_invitation' }, { status: 403 });
    }
    if (message.includes('invalid_or_used_invitation')) {
      return NextResponse.json({ error: 'invalid_or_used_invitation' }, { status: 404 });
    }
    if (message.includes('existing_space_member_requires_conversion')) {
      return NextResponse.json({ error: 'existing_space_member_requires_conversion' }, { status: 409 });
    }
    if (message.includes('guardian')) {
      return NextResponse.json({ error: 'guardian_verification_incomplete' }, { status: 409 });
    }
    return NextResponse.json({ error: 'invitation_claim_failed' }, { status: 500 });
  }
}
