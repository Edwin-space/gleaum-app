/**
 * 글리움 — 관리자 인증 헬퍼 (서버 전용)
 *
 * ADMIN_EMAILS 환경변수에 쉼표로 구분된 이메일 목록을 설정합니다.
 * 예: ADMIN_EMAILS=you@gmail.com,partner@gmail.com
 *
 * Vercel: Settings → Environment Variables → ADMIN_EMAILS 추가
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/** 플랫폼 관리자 이메일 목록 (환경변수 파싱) */
export function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return new Set(
    raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
}

/** 현재 로그인 사용자가 관리자인지 확인 */
export async function isAdminUser(): Promise<{ ok: boolean; email?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return { ok: false };

    const email = user.email.toLowerCase();
    const adminEmails = getAdminEmails();

    return { ok: adminEmails.has(email), email };
  } catch {
    return { ok: false };
  }
}

/** API 라우트용 관리자 인증 래퍼 */
export async function withAdminAuth(
  _req: NextRequest,
  handler: (email: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const { ok, email } = await isAdminUser();
  if (!ok || !email) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }
  return handler(email);
}

/** Firebase 서비스 계정으로 Google OAuth 액세스 토큰 발급 */
export async function getGoogleAccessToken(scope: string): Promise<string> {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 미설정');

  const { GoogleAuth } = await import('google-auth-library');
  const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));

  const auth = new GoogleAuth({ credentials, scopes: [scope] });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) throw new Error('액세스 토큰 발급 실패');
  return tokenResponse.token;
}
