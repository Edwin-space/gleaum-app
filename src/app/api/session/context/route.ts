import { NextRequest, NextResponse } from 'next/server';
import { getAccountSessionContext } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const context = await getAccountSessionContext(auth.supabase);
    return NextResponse.json(context, {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Gleaum-Auth-Mode': auth.mode,
      },
    });
  } catch (error) {
    console.error('[session/context]', error);
    return NextResponse.json({ error: 'session_context_failed' }, { status: 500 });
  }
}
