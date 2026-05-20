"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * 백오피스 로그인 페이지
 *
 * 보안 처리:
 * 1. Supabase 인증 성공 후 클라이언트 측 관리자 이메일 사전 검증 (UX용)
 * 2. 서버사이드 최종 검증은 middleware.ts 에서 처리
 */
export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const router       = useRouter();
  const searchParams = useSearchParams();

  // 미들웨어가 ?error=unauthorized 로 리다이렉트한 경우 처리
  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      setError("관리자 계정이 아닙니다. 접근 권한이 없습니다.");
    }
  }, [searchParams]);

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

    // ── 2. 클라이언트 측 관리자 이메일 사전 검증 (UX 개선용) ─
    //       서버사이드 최종 검증은 middleware.ts 에서 수행
    const adminEmailsRaw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
    const adminEmails    = adminEmailsRaw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length > 0 && !adminEmails.includes(email.trim().toLowerCase())) {
      await supabase.auth.signOut();
      setError("관리자 계정이 아닙니다. 접근 권한이 없습니다.");
      setLoading(false);
      return;
    }

    // ── 3. 대시보드로 이동 ────────────────────────────────
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
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
