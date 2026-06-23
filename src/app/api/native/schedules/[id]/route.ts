import { NextRequest, NextResponse } from 'next/server';
import {
  deleteNativeSchedule,
  getNativeScheduleById,
  updateNativeSchedule,
  type NativeUpdateScheduleInput,
} from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function errorStatus(message: string) {
  if (message === 'schedule_not_found') return 404;
  if (message === 'space_editor_required') return 403;
  if (message.endsWith('_required') || message.startsWith('invalid_')) return 400;
  return 500;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  try {
    const schedule = await getNativeScheduleById(auth.supabase, auth.user.id, id);
    if (!schedule) return NextResponse.json({ error: 'schedule_not_found' }, { status: 404 });
    return NextResponse.json({ schedule }, {
      headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'schedule_fetch_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let input: NativeUpdateScheduleInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const schedule = await updateNativeSchedule(auth.supabase, auth.user.id, id, input);
    return NextResponse.json({ schedule }, {
      headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'schedule_update_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  try {
    await deleteNativeSchedule(auth.supabase, auth.user.id, id);
    return NextResponse.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'schedule_delete_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
