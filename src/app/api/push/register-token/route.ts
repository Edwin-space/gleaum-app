import { NextRequest, NextResponse } from 'next/server';
import { registerNativePushToken } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export async function POST(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await req.json().catch(() => null) as {
    token?: string;
    platform?: string;
  } | null;
  const platform = payload?.platform;
  if (platform !== 'ios' && platform !== 'android' && platform !== 'web') {
    return NextResponse.json({ error: 'invalid_push_platform' }, { status: 400 });
  }

  try {
    await registerNativePushToken(auth.supabase, auth.user.id, payload?.token ?? '', platform);
    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'push_token_register_failed';
    const status = message.endsWith('_required') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
