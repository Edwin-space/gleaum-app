import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireAdminPage } from '@/lib/admin-auth';

let adminClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are not configured');
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return adminClient;
}

export async function getAdminPageSupabase(): Promise<SupabaseClient> {
  await requireAdminPage();
  return getAdminSupabase();
}
