import { NextRequest, NextResponse } from 'next/server';
import { updateNativeSpaceName } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function errorStatus(message: string) {
  if (message === 'space_admin_required') return 403;
  if (message.endsWith('_required') || message.endsWith('_too_long')) return 400;
  return 500;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let input: { name?: string };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const summary = await updateNativeSpaceName(auth.supabase, auth.user.id, id, input.name ?? '');
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'space_update_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
