"use client";

import { useState, useEffect, Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SAVED_EMAIL_KEY = "gleaum_backoffice_saved_email";

/**
 * useSearchParams를 쓰는 부분을 별도 컴포넌트로 분리 (Suspense 필수)
 * 미들웨어가 ?error=unauthorized 로 리다이렉트한 경우 처리
 */
function SearchParamsHandler({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      onError("관리자 계정이 아닙니다. 접근 권한이 없습니다.");
    } else if (searchParams.get("error") === "configuration") {
      onError("관리자 접근 설정이 완료되지 않았습니다. 운영 환경변수를 확인하세요.");
    }
  }, [searchParams, onError]);

  return null;
}

/**
 * 백오피스 로그인 페이지
 *
 * 보안 처리:
 * Supabase 인증 후 서버의 proxy 및 각 데이터 접근 지점에서 관리자 권한을 검증합니다.
 */
export default function LoginPage() {
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  const router = useRouter();

  // ── 저장된 이메일 불러오기 ─────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberEmail(true);
      }
    } catch {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // ── 1. Supabase 인증 ──────────────────────────────────
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    // ── 2. 아이디 저장 처리 ───────────────────────────────
    try {
      if (rememberEmail) localStorage.setItem(SAVED_EMAIL_KEY, email);
      else               localStorage.removeItem(SAVED_EMAIL_KEY);
    } catch {}

    // ── 3. 대시보드로 이동 ────────────────────────────────
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      {/* useSearchParams는 Suspense로 감싸야 빌드 통과 */}
      <Suspense fallback={null}>
        <SearchParamsHandler onError={setError} />
      </Suspense>
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">✦</span>
            <span className="text-lg font-semibold tracking-tight text-muted-foreground">gleaum</span>
          </div>
          <CardTitle className="text-xl">관리자 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@gleaum.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* 아이디 저장 */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
              />
              <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                아이디 저장
              </Label>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
