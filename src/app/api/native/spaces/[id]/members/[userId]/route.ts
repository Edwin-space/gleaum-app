import { NextRequest, NextResponse } from 'next/server';
import {
  removeNativeSpaceMember,
  updateNativeSpaceMemberFamilyRole,
  updateNativeSpaceMemberRole,
} from '@/lib/db';
import { authorizeAccountCapability } from '@/lib/supabase/capability-auth';
import type { FamilyMemberRole, SpaceRole } from '@/types';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string; userId: string }> };

function errorStatus(message: string) {
  if (message === 'space_admin_required') return 403;
  if (
    message === 'personal_space_locked' ||
    message === 'cannot_remove_self' ||
    message === 'invalid_role' ||
    message === 'invalid_family_role' ||
    message === 'family_space_required'
  ) return 400;
  return 500;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const access = await authorizeAccountCapability(req, 'canManageSpaces');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { auth } = access;

  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return NextResponse.json({ error: 'invalid_member_update' }, { status: 400 });
  }
  const memberUpdate = input as { role?: unknown; familyRole?: unknown };
  const { id, userId } = await context.params;
  const hasRole = typeof memberUpdate.role === 'string';
  const hasFamilyRole = typeof memberUpdate.familyRole === 'string';
  if (hasRole === hasFamilyRole) {
    return NextResponse.json(
      { error: 'exactly_one_member_attribute_required' },
      { status: 400 },
    );
  }

  try {
    if (hasFamilyRole) {
      const summary = await updateNativeSpaceMemberFamilyRole(
        auth.supabase,
        auth.user.id,
        id,
        userId,
        memberUpdate.familyRole as FamilyMemberRole,
      );
      return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
    }
    const summary = await updateNativeSpaceMemberRole(
      auth.supabase,
      auth.user.id,
      id,
      userId,
      memberUpdate.role as SpaceRole,
    );
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'member_role_update_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const access = await authorizeAccountCapability(req, 'canManageSpaces');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { auth } = access;
  const { id, userId } = await context.params;

  try {
    const summary = await removeNativeSpaceMember(auth.supabase, auth.user.id, id, userId);
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'member_remove_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
