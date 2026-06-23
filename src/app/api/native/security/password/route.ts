import { NextRequest, NextResponse } from 'next/server';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

function normalizePassword(input: unknown) {
  return typeof input === 'string' ? input.trim() : '';
}

export async function PATCH(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let input: { password?: unknown };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const password = normalizePassword(input.password);
  if (password.length < 6) {
    return NextResponse.json({ error: 'password_too_short' }, { status: 400 });
  }
  if (password.length > 72) {
    return NextResponse.json({ error: 'password_too_long' }, { status: 400 });
  }

  const { error } = await auth.supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json({ error: error.message || 'password_update_failed' }, { status: 400 });
  }

  return NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } },
  );
}
