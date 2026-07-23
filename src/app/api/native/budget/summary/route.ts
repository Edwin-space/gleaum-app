import { NextRequest, NextResponse } from 'next/server';
import { getNativeBudgetSummary } from '@/lib/db';
import { authorizeAccountCapability } from '@/lib/supabase/capability-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const access = await authorizeAccountCapability(req, 'canViewHouseholdBudget');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { auth } = access;

  const { searchParams } = new URL(req.url);
  try {
    const summary = await getNativeBudgetSummary(auth.supabase, auth.user.id, {
      month: searchParams.get('month') ?? undefined,
    });
    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Gleaum-Auth-Mode': auth.mode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'budget_summary_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
