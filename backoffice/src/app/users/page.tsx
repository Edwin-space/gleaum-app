export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { UsersClient } from "./UsersClient";

interface PageProps {
  searchParams?: Promise<{ page?: string }>;
}

const PAGE_SIZE = 50;

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: profiles, error, count } = await supabase
    .from("profiles")
    .select(
      "id, name, display_name, email, onboarding_completed_at, updated_at, family_group_id, fcm_token",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(from, to);

  let createdAtMap = new Map<string, string>();
  try {
    const ids = (profiles ?? []).map((profile) => profile.id);
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    createdAtMap = new Map(
      (authUsers ?? [])
        .filter((user) => ids.includes(user.id))
        .map((user) => [user.id, user.created_at])
    );
  } catch {
    // service role key 미설정 시 fallback — updated_at 사용
  }

  const enriched = (profiles ?? []).map((profile) => ({
    ...profile,
    created_at: createdAtMap.get(profile.id) ?? profile.updated_at ?? "",
  }));

  const total = count ?? enriched.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">회원 관리</h1>
          <p className="text-muted-foreground mt-1">
            가입된 회원 목록 및 상세 정보를 관리합니다.
            <span className="ml-2 font-semibold text-foreground">총 {total.toLocaleString("ko-KR")}명</span>
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
            <code>backoffice/.env.local</code>에 <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>가 올바르게 설정되어 있는지 확인하세요.
          </p>
        </div>
      )}

      <UsersClient profiles={enriched} page={page} totalPages={totalPages} total={total} />
    </main>
  );
}
