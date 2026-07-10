export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { SpacesClient } from "./SpacesClient";

interface PageProps {
  searchParams?: Promise<{ page?: string }>;
}

const PAGE_SIZE = 50;

export default async function SpacesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: spaces, error, count } = await supabase
    .from("family_groups")
    .select("id, name, invite_code, created_at, created_by", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? spaces?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">공간(Space) 관리</h1>
          <p className="text-muted-foreground mt-1">
            생성된 공간 현황 및 초대 코드를 관리합니다.
            <span className="ml-2 font-semibold text-foreground">총 {total.toLocaleString("ko-KR")}개</span>
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/users">← 회원 관리</Link>
        </Button>
      </header>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">데이터 로드 실패</p>
          <p className="mt-1 text-xs font-mono">{error.message}</p>
        </div>
      )}

      <SpacesClient spaces={spaces ?? []} page={page} totalPages={totalPages} total={total} />
    </main>
  );
}
