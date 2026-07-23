import { NextRequest, NextResponse } from 'next/server';
import { deleteNativeSpace, updateNativeSpaceName } from '@/lib/db';
import { authorizeAccountCapability } from '@/lib/supabase/capability-auth';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function errorStatus(message: string) {
  if (message === 'space_admin_required' || message === 'account_capability_required') return 403;
  if (message === 'space_not_found') return 404;
  if (message === 'space_has_other_members' || message === 'family_space_has_dependents') return 409;
  if (message.endsWith('_required') || message.endsWith('_too_long')) return 400;
  if (message === 'personal_space_locked') return 400;
  return 500;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const access = await authorizeAccountCapability(req, 'canManageSpaces');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { auth } = access;

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

export async function DELETE(req: NextRequest, context: RouteContext) {
  const access = await authorizeAccountCapability(req, 'canManageSpaces');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { auth } = access;

  const { id } = await context.params;
  try {
    const summary = await deleteNativeSpace(auth.supabase, auth.user.id, id);
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'space_delete_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
