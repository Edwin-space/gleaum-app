import 'server-only';

import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import {
  isAdminPolicyConfigured,
  isAllowedAdminEmail,
} from '@/lib/admin-policy';

type AdminAuthState =
  | { status: 'authorized'; user: User }
  | { status: 'unauthenticated' | 'forbidden' | 'misconfigured' };

async function getAdminAuthState(): Promise<AdminAuthState> {
  if (!isAdminPolicyConfigured()) return { status: 'misconfigured' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return { status: 'misconfigured' };

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    });
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return { status: 'unauthenticated' };
    if (!isAllowedAdminEmail(user.email)) return { status: 'forbidden' };
    return { status: 'authorized', user };
  } catch {
    return { status: 'unauthenticated' };
  }
}

export async function requireAdminApi(): Promise<NextResponse | null> {
  const auth = await getAdminAuthState();
  if (auth.status === 'authorized') return null;

  if (auth.status === 'misconfigured') {
    return NextResponse.json(
      { error: 'Admin access is not configured' },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: auth.status === 'unauthenticated' ? 'Unauthorized' : 'Forbidden' },
    { status: auth.status === 'unauthenticated' ? 401 : 403 },
  );
}

export async function requireAdminPage(): Promise<User> {
  const auth = await getAdminAuthState();
  if (auth.status === 'authorized') return auth.user;

  const error = auth.status === 'misconfigured' ? 'configuration' : 'unauthorized';
  redirect(`/login?error=${error}`);
}
