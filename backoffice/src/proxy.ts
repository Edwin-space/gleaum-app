/**
 * 백오피스 프록시 미들웨어 (Next.js proxy.ts)
 *
 * 보호 범위:
 * - 모든 페이지 라우트 → 미인증/비관리자 → /login 리다이렉트
 * - 모든 API 라우트  → 미인증/비관리자 → 401/403 JSON 반환
 *
 * 관리자 판별:
 * - ADMIN_EMAILS 환경변수(쉼표 구분)에 포함된 이메일만 허용
 * - ADMIN_EMAILS 미설정 시 모든 관리자 접근 차단 (fail-closed)
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  getConfiguredAdminEmails,
  isAllowedAdminEmail,
} from '@/lib/admin-policy'

// 인증 없이 접근 가능한 경로
const PUBLIC_PREFIXES = ['/_next/', '/favicon', '/_next/static', '/_next/image']
const PUBLIC_EXACT    = ['/login']

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로는 통과
  if (isPublic(pathname)) return NextResponse.next()

  const supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // ── 1. 세션 확인 ──────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url))
    }

    // ── 2. 관리자 권한 확인 ───────────────────────────────────
    const adminEmails = getConfiguredAdminEmails()
    if (adminEmails.size === 0) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Admin access is not configured' },
          { status: 503 }
        )
      }
      const url = new URL('/login', request.url)
      url.searchParams.set('error', 'configuration')
      return NextResponse.redirect(url)
    }

    if (!isAllowedAdminEmail(user.email)) {
      await supabase.auth.signOut()

      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden — 관리자 계정이 아닙니다' },
          { status: 403 }
        )
      }
      const url = new URL('/login', request.url)
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch {
    // 인증 확인 실패 시 안전하게 /login으로 리다이렉트
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
