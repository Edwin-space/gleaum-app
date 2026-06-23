import { NextRequest, NextResponse } from 'next/server';
import { markNativeNotificationRead } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'notification_id_required' }, { status: 400 });

  try {
    await markNativeNotificationRead(auth.supabase, auth.user.id, id);
    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'notification_mark_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
