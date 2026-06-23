import { NextRequest, NextResponse } from 'next/server';
import { createNativeSpace } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

function errorStatus(message: string) {
  if (message.endsWith('_required') || message.endsWith('_too_long') || message === 'shared_space_limit_reached') return 400;
  return 500;
}

export async function POST(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
