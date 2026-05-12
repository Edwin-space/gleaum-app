# 03. 현재 상태 및 다음 작업 (Current Status)

> 마지막 업데이트: 2026-05-12
> 이 문서는 다음 AI 에이전트가 작업을 이어받기 위한 핵심 인수인계 문서입니다.

---

## ✅ 완료된 작업

### 인프라 / 배포
- [x] `backoffice/` Next.js 15 서브프로젝트 생성
- [x] shadcn/ui 설치 (Nova 프리셋, Tailwind v4 호환)
- [x] Vercel 독립 프로젝트 생성 — 프로젝트명: `gleaum-backoffice`
- [x] Vercel 환경변수 3개 입력 완료
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://tyvjdsescukaeorcuaga.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (설정 완료)
  - `SUPABASE_SERVICE_ROLE_KEY` = (설정 완료)
- [x] Production 배포 성공 (Status: Ready)
- [x] 배포 URL: `https://gleaum-backoffice.vercel.app`

### 구현된 페이지 (shadcn/ui 컴포넌트 사용)
- [x] `/` — 대시보드 (KPI 카드 4종, 차트 플레이스홀더)
- [x] `/users` — 회원 관리 (Supabase `profiles` 테이블 연동, Table/Badge 컴포넌트)
- [x] `/spaces` — 공간 관리 (Supabase `family_groups` 테이블 연동)
- [x] `/campaigns` — CRM 캠페인 빌더 (5채널 탭, 실시간 메시지 미리보기)
- [x] `/ads` — 광고 매니저 (RadioGroup 전략 선택, 앱 목업 시뮬레이터)
- [x] `/settings` — 시스템 설정 (API 키 관리 폼)

### 공통 컴포넌트
- [x] `Sidebar.tsx` — 5메뉴 공통 사이드바 (경로 기반 Active)
- [x] `backoffice/src/components/ui/` — shadcn/ui 11종 컴포넌트 설치

---

## 🔴 미완료 — 다음 AI가 즉시 처리해야 할 작업

### 1순위: 백오피스 관리자 인증 시스템 (가장 중요)

**현재 상태**: URL만 알면 누구나 접근 가능. 인증 없음.

**필요한 작업**:
1. `backoffice/src/app/login/page.tsx` — 로그인 페이지 (이메일/비밀번호)
2. `backoffice/src/middleware.ts` — 라우트 보호 미들웨어
3. Supabase Auth에 관리자 계정 생성

**관리자 계정 정보**:
- **이메일**: `devianne.tsyoo@gmail.com`
- **임시 비밀번호**: AI가 생성하여 에드윈에게 알려줄 것

**Supabase 관리자 계정 생성 방법** (SQL 불필요):
```
Supabase 대시보드 → Authentication → Users →
"Add user" 버튼 → "Create new user" 선택 →
Email: devianne.tsyoo@gmail.com
Password: [임시 비밀번호 생성]
"Auto Confirm User" 체크 → Create User 클릭
```

**구현 방법** (@supabase/ssr 사용):

`backoffice/src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // /login 페이지는 인증 없이 접근 가능
  if (request.nextUrl.pathname === '/login') {
    if (user) return NextResponse.redirect(new URL('/', request.url))
    return supabaseResponse
  }
  
  // 나머지 모든 경로는 로그인 필요
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

`backoffice/src/app/login/page.tsx` — shadcn/ui Card, Input, Button, Label 사용:
```typescript
"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Gleaum Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**패키지 확인**:
```bash
# @supabase/ssr이 이미 설치되어 있는지 확인
cat backoffice/package.json | grep supabase
# 없으면 설치
cd backoffice && npm install @supabase/ssr
```

---

### 2순위: 커스텀 도메인 설정 (admin.gleaum.com)

**현재**: `gleaum-backoffice.vercel.app`으로만 접근 가능
**목표**: `admin.gleaum.com`

**설정 위치**: DNS는 Cloudflare에서 관리 중

**Cloudflare DNS에 추가할 레코드**:
```
Type: CNAME
Name: admin
Target: cname.vercel-dns.com
Proxy: DNS only (주황 구름 끄기 — 회색으로)
TTL: Auto
```

**Vercel에 도메인 추가**:
```
Vercel → gleaum-backoffice 프로젝트 → Settings → Domains
→ "admin.gleaum.com" 입력 → Add
→ Vercel이 CNAME 레코드를 안내 → Cloudflare에 입력
```

---

### 3순위: Supabase Auth URL 설정

Supabase에 백오피스 URL을 허용 목록에 추가해야 합니다:
```
Supabase → Authentication → URL Configuration →
Site URL: https://gleaum-backoffice.vercel.app
Additional redirect URLs에 추가:
  https://gleaum-backoffice.vercel.app/**
  https://admin.gleaum.com/**  (도메인 설정 후)
```

---

## ⚠️ 이전 세션에서 발생한 부작용 (확인 필요)

이전 AI 세션에서 브라우저 자동화가 오작동하여 아래 사항이 발생했습니다:

1. **Supabase Storage에 `avatars` 버킷 생성됨** — 의도치 않게 생성. 필요 없으면 삭제 가능.
2. **메인 앱(`www.gleaum.com`)에 테스트 계정이 로그인 및 온보딩 완료** — `devianne.tsyoo@gmail.com`으로 실제 앱에 접속하여 온보딩 진행됨. `profiles` 테이블에 해당 계정의 데이터가 생성됨.
3. **Supabase SQL 에디터에 여러 SQL 스니펫이 생성됨** — 실행된 내용 확인 후 불필요하면 삭제.

---

## 📋 전체 백오피스 Phase 계획

| Phase | 작업 | 상태 |
|-------|------|------|
| Phase 1 | 프로젝트 스캐폴딩 + 기본 UI | ✅ 완료 |
| Phase 2 | shadcn/ui 컴포넌트로 리팩토링 | ✅ 완료 |
| Phase 3 | Vercel 배포 + 환경변수 설정 | ✅ 완료 |
| **Phase 4** | **관리자 인증 (로그인 페이지 + 미들웨어)** | 🔴 **미완료 — 다음 작업** |
| Phase 5 | 실데이터 연동 (KPI, 상세 페이지) | ❌ 미착수 |
| Phase 6 | CRM 실제 발송 API | ❌ 미착수 |
| Phase 7 | 광고 매니저 DB 저장 | ❌ 미착수 |
