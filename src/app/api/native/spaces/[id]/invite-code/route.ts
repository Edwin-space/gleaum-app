import { NextRequest, NextResponse } from 'next/server';
import { regenerateNativeSpaceInviteCode } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function errorStatus(message: string) {
  if (message === 'space_admin_required') return 403;
  if (message === 'personal_space_locked') return 400;
  return 500;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;

  try {
    const summary = await regenerateNativeSpaceInviteCode(auth.supabase, auth.user.id, id);
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invite_code_regenerate_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
