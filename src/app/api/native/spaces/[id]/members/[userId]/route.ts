import { NextRequest, NextResponse } from 'next/server';
import { removeNativeSpaceMember, updateNativeSpaceMemberRole } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';
import type { SpaceRole } from '@/types';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string; userId: string }> };

function errorStatus(message: string) {
  if (message === 'space_admin_required') return 403;
  if (message === 'personal_space_locked' || message === 'cannot_remove_self' || message === 'invalid_role') return 400;
  return 500;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let input: { role?: SpaceRole };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { id, userId } = await context.params;
  try {
    const summary = await updateNativeSpaceMemberRole(auth.supabase, auth.user.id, id, userId, input.role ?? 'viewer');
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'member_role_update_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, userId } = await context.params;

  try {
    const summary = await removeNativeSpaceMember(auth.supabase, auth.user.id, id, userId);
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'member_remove_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
