import 'server-only';

import type { NextRequest } from 'next/server';
import { getAccountSessionContext } from '@/lib/db';
import type { AccountCapability } from '@/lib/account-capabilities';
import { createNativeRouteAuth, type NativeRouteAuth } from '@/lib/supabase/native-route';
import type { AccountSessionContext } from '@/types';

export type CapabilityAuthResult =
  | { ok: true; auth: NativeRouteAuth; context: AccountSessionContext }
  | { ok: false; status: 401 | 403 | 500; error: string };

export async function authorizeAccountCapability(
  req: NextRequest,
  capability: AccountCapability,
): Promise<CapabilityAuthResult> {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return { ok: false, status: 401, error: 'unauthorized' };

  try {
    const context = await getAccountSessionContext(auth.supabase);
    if (!context) return { ok: false, status: 401, error: 'unauthorized' };
    if (!context.capabilities[capability]) {
      return { ok: false, status: 403, error: `capability_${capability}_required` };
    }
    return { ok: true, auth, context };
  } catch (error) {
    console.error('[capability-auth]', capability, error);
    return { ok: false, status: 500, error: 'session_context_failed' };
  }
}
