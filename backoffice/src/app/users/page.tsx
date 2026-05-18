export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, name, display_name, email, onboarding_completed_at, created_at, family_group_id, fcm_token"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <main className="p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">회원 관리</h1>
          <p className="text-muted-foreground mt-1">
            가입된 회원 목록 및 상세 정보를 관리합니다.
            {profiles && (
              <span className="ml-2 font-semibold text-foreground">
                총 {profiles.length}명
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/spaces">공간(Space) 관리 →</Link>
        </Button>
      </header>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">데이터 로드 실패</p>
          <p className="mt-1 text-xs font-mono">{error.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <code>backoffice/.env.local</code>에{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code>가 올바르게 설정되어 있는지 확인하세요.
          </p>
        </div>
      )}

      <UsersClient profiles={profiles ?? []} />
    </main>
  );
}
