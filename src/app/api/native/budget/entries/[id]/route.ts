import { NextRequest, NextResponse } from 'next/server';
import {
  deleteNativeLedgerEntry,
  getNativeLedgerEntryById,
  updateNativeLedgerEntry,
  type NativeCreateLedgerInput,
} from '@/lib/db';
import { authorizeAccountCapability } from '@/lib/supabase/capability-auth';
import type { LedgerStatus } from '@/types';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

type NativeUpdateLedgerInput = Partial<NativeCreateLedgerInput> & { status?: LedgerStatus };

function errorStatus(message: string) {
  if (message === 'ledger_entry_not_found') return 404;
  if (message.endsWith('_required') || message.startsWith('invalid_')) return 400;
  return 500;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const access = await authorizeAccountCapability(req, 'canViewHouseholdBudget');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { auth } = access;
  const { id } = await context.params;
  try {
    const entry = await getNativeLedgerEntryById(auth.supabase, auth.user.id, id);
    return NextResponse.json({ entry }, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ledger_fetch_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const access = await authorizeAccountCapability(req, 'canViewHouseholdBudget');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { auth } = access;

  let input: NativeUpdateLedgerInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const entry = await updateNativeLedgerEntry(auth.supabase, auth.user.id, id, input);
    return NextResponse.json({ entry }, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ledger_update_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const access = await authorizeAccountCapability(req, 'canViewHouseholdBudget');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { auth } = access;
  const { id } = await context.params;
  try {
    await deleteNativeLedgerEntry(auth.supabase, auth.user.id, id);
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store', 'X-Gleaum-Auth-Mode': auth.mode } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ledger_delete_failed';
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
