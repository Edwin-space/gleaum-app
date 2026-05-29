export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  // profiles 테이블에 created_at 컬럼 없음 → updated_at 기준 정렬
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, name, display_name, email, onboarding_completed_at, updated_at, family_group_id, fcm_token"
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  // auth.users에서 실제 가입일 조회 (SUPABASE_SERVICE_ROLE_KEY 필요)
  let createdAtMap = new Map<string, string>();
  try {
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    createdAtMap = new Map((authUsers ?? []).map((u) => [u.id, u.created_at]));
  } catch {
    // service role key 미설정 시 fallback — updated_at 사용
  }

  // profiles + 실제 가입일 병합
  const enriched = (profiles ?? []).map((p) => ({
    ...p,
    created_at: createdAtMap.get(p.id) ?? p.updated_at ?? "",
  }));

  return (
    <main className="p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">회원 관리</h1>
          <p className="text-muted-foreground mt-1">
            가입된 회원 목록 및 상세 정보를 관리합니다.
            {enriched.length > 0 && (
              <span className="ml-2 font-semibold text-foreground">
                총 {enriched.length}명
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

      <UsersClient profiles={enriched} />
    </main>
  );
}
