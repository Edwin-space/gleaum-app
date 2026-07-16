import { NextResponse } from 'next/server';
import { getAccountSessionContext } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const context = await getAccountSessionContext(supabase);
    return NextResponse.json(context, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[session/context]', error);
    return NextResponse.json({ error: 'session_context_failed' }, { status: 500 });
  }
}
