import { NextRequest, NextResponse } from 'next/server';
import { getNativeNotifications, markAllNativeNotificationsRead } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const notifications = await getNativeNotifications(auth.supabase, auth.user.id);
    return NextResponse.json(
      { notifications, unreadCount: notifications.filter((item) => !item.read).length },
      { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'notifications_fetch_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await markAllNativeNotificationsRead(auth.supabase, auth.user.id);
    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'notifications_mark_all_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
