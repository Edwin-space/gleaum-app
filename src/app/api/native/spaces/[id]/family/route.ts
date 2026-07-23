import { NextRequest, NextResponse } from 'next/server';
import { convertNativeSpaceToFamily } from '@/lib/db';
import { authorizeAccountCapability } from '@/lib/supabase/capability-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await authorizeAccountCapability(req, 'canManageSpaces');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { auth } = access;

  const { id } = await context.params;
  try {
    const summary = await convertNativeSpaceToFamily(auth.supabase, auth.user.id, id);
    return NextResponse.json(summary, {
      headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'space_family_conversion_failed';
    const status = message === 'space_admin_required' || message === 'account_capability_required'
      ? 403
      : message === 'space_not_found'
        ? 404
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
