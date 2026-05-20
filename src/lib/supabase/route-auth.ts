/**
 * API Route Handler 용 인증 헬퍼
 *
 * 사용법:
 *   const user = await getAuthUser();
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

/**
 * 현재 요청의 Supabase 세션에서 인증된 사용자를 반환합니다.
 * 미인증 상태이면 null을 반환합니다.
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {}, // Route Handler에서는 읽기 전용
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Authorization 헤더에서 Bearer 토큰을 추출해 CRON_SECRET와 비교합니다.
 * 서버-to-서버 (pg_cron, cron job) 호출에 사용합니다.
 */
export function isCronRequest(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * 내부 API 공유 시크릿 검증 (INTERNAL_API_SECRET)
 * 백오피스 → 메인 앱 서버간 호출에 사용합니다.
 */
export function isInternalRequest(authHeader: string | null): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
