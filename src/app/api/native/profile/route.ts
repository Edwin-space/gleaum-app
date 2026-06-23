import { NextRequest, NextResponse } from 'next/server';
import {
  getNativeProfileSummary,
  updateNativeProfile,
  type NativeProfileUpdateInput,
} from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

function errorStatus(message: string) {
  if (message === 'profile_not_found') return 404;
  if (message.endsWith('_required') || message.endsWith('_too_long') || message.startsWith('invalid_')) return 400;
  return 500;
}

export async function GET(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await getNativeProfileSummary(auth.supabase, auth.user.id);
    return NextResponse.json({ profile }, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'profile_fetch_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let input: NativeProfileUpdateInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  try {
    const profile = await updateNativeProfile(auth.supabase, auth.user.id, input);
    return NextResponse.json({ profile }, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'profile_update_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
