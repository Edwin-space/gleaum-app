import { NextRequest, NextResponse } from 'next/server';
import { createNativeLedgerEntry, type NativeCreateLedgerInput } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let input: NativeCreateLedgerInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  try {
    const entry = await createNativeLedgerEntry(auth.supabase, auth.user.id, input);
    return NextResponse.json({ entry }, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
        'X-Gleaum-Auth-Mode': auth.mode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ledger_create_failed';
    const status = message.endsWith('_required') || message.startsWith('invalid_') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
