import { NextRequest, NextResponse } from 'next/server';
import { approveFamilyChildLink } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

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
    const result = await approveFamilyChildLink(id, supabase);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('[family/dependents/approve]', error);
    if (message.includes('dependent_not_found_or_forbidden')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (message.includes('child_link_not_pending')) {
      return NextResponse.json({ error: 'child_link_not_pending' }, { status: 409 });
    }
    if (message.includes('verified_guardian_consent_required')) {
      return NextResponse.json({ error: 'verified_guardian_consent_required' }, { status: 409 });
    }
    return NextResponse.json({ error: 'child_link_approval_failed' }, { status: 500 });
  }
}
