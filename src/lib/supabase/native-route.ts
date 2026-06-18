import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { createClient as createCookieClient } from '@/lib/supabase/server';

export interface NativeRouteAuth {
  supabase: SupabaseClient<any, any, any>;
  user: User;
  mode: 'bearer' | 'cookie';
}

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header?.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim() || null;
}

/**
 * Native 화면은 WebView cookie 없이 access token으로 API를 호출할 수 있어야 한다.
 * 기존 웹/Capacitor WebView 호출은 cookie 세션을 그대로 지원한다.
 */
export async function createNativeRouteAuth(req: NextRequest): Promise<NativeRouteAuth | null> {
  const token = bearerToken(req);

  if (token) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { supabase, user, mode: 'bearer' };
  }

  const supabase = await createCookieClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase: supabase as SupabaseClient<any, any, any>, user, mode: 'cookie' };
}
