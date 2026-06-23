import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { joinNativeSpaceByCode } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

function errorStatus(message: string) {
  if (message === 'invalid_code') return 404;
  if (message === 'expired_code') return 410;
  if (message === 'invite_code_required' || message === 'shared_space_limit_reached') return 400;
  return 500;
}

export async function POST(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let input: { code?: string };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    const summary = await joinNativeSpaceByCode(admin, auth.supabase, auth.user.id, input.code ?? '');
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'space_join_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
