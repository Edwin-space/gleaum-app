import { NextRequest, NextResponse } from 'next/server';
import { createNativeSpace } from '@/lib/db';
import { authorizeAccountCapability } from '@/lib/supabase/capability-auth';

export const dynamic = 'force-dynamic';

function errorStatus(message: string) {
  if (message.endsWith('_required') || message.endsWith('_too_long') || message === 'shared_space_limit_reached') return 400;
  return 500;
}

export async function POST(req: NextRequest) {
  const access = await authorizeAccountCapability(req, 'canManageSpaces');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { auth } = access;

  let input: { name?: string };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  try {
    const summary = await createNativeSpace(auth.supabase, auth.user.id, input.name ?? '');
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'space_create_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
