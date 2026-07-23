import { NextRequest, NextResponse } from 'next/server';
import { createFamilyChildInvitation } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';
import { getPublicAppUrl } from '@/lib/guardian-consent';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await createNativeRouteAuth(request);
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { supabase } = auth;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'dependent_id_required' }, { status: 400 });

  try {
    const invitation = await createFamilyChildInvitation(id, supabase);
    const inviteUrl = new URL(`/invite/child/${invitation.token}`, getPublicAppUrl()).toString();
    return NextResponse.json({
      token: invitation.token,
      inviteUrl,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('[family/dependents/invite]', error);
    if (message.includes('guardian_verification_required')) {
      return NextResponse.json({ error: 'guardian_verification_required' }, { status: 409 });
    }
    if (message.includes('verified_guardian_consent_required')) {
      return NextResponse.json({ error: 'verified_guardian_consent_required' }, { status: 409 });
    }
    if (message.includes('dependent_already_linked')) {
      return NextResponse.json({ error: 'dependent_already_linked' }, { status: 409 });
    }
    if (message.includes('forbidden')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'invitation_create_failed' }, { status: 500 });
  }
}
