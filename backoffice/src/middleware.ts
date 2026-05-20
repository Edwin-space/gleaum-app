/**
 * 백오피스 서버사이드 인증 미들웨어
 *
 * 보호 범위:
 * - 모든 페이지 라우트 → 미인증/비관리자 → /login 리다이렉트
 * - 모든 API 라우트  → 미인증/비관리자 → 401/403 JSON 반환
 *
 * 관리자 판별:
 * - ADMIN_EMAILS 환경변수(쉼표 구분)에 포함된 이메일만 허용
 * - ADMIN_EMAILS 미설정 시 인증된 모든 Supabase 사용자 허용
 *   (보안상 반드시 설정 권장)
 */

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// 인증 없이 접근 가능한 경로
const PUBLIC_PREFIXES = ["/_next/", "/favicon", "/_next/static", "/_next/image"];
const PUBLIC_EXACT    = ["/login"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/** ADMIN_EMAILS 환경변수를 소문자 Set으로 파싱 */
function adminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 공개 경로는 통과
  if (isPublic(pathname)) return NextResponse.next();

  // 응답 쿠키 전달용 response
  const res = NextResponse.next();

  // ── Supabase 서버 클라이언트 (쿠키 기반) ──────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  ()              => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ── 1. 세션 확인 ──────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", req.url));
  }

  // ── 2. 관리자 권한 확인 ───────────────────────────────────
  const adminEmails = adminEmailSet();
  const userEmail   = (user.email ?? "").toLowerCase();

  if (adminEmails.size > 0 && !adminEmails.has(userEmail)) {
    // 인증은 됐으나 관리자 아님 → 강제 로그아웃 + 거부
    await supabase.auth.signOut();

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden — 관리자 계정이 아닙니다" },
        { status: 403 }
      );
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * _next/static, _next/image, favicon.ico 제외한 모든 경로
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
