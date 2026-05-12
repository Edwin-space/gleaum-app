import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // /login: 이미 로그인됐으면 대시보드로
    if (pathname === '/login') {
      if (user) {
        return NextResponse.redirect(new URL('/', request.url))
      }
      return supabaseResponse
    }

    // 그 외 모든 경로: 미인증이면 /login으로
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
  } catch {
    // 인증 확인 실패 시 안전하게 /login으로 리다이렉트
    const { pathname } = request.nextUrl
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
