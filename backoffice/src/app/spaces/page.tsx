import Link from "next/link";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default async function SpacesPage() {
  const { data: spaces } = await supabase
    .from("family_groups")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">공간(Space) 관리</h1>
          <p className="text-muted-foreground mt-1">생성된 공간 현황 및 초대 코드를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/users" className="text-sm font-medium text-primary hover:underline">
            👈 회원 관리로 이동
          </Link>
        </div>
      </header>

      {/* Data Table Area */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="공간명 검색..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            최근 50개 표시
          </div>
        </div>
        
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">공간 ID</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">공간명(Space Name)</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">초대 코드</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">생성일</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {spaces && spaces.length > 0 ? (
                spaces.map((space) => (
                  <tr key={space.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle text-xs text-muted-foreground">{space.id.slice(0, 8)}...</td>
                    <td className="p-4 align-middle font-medium">{space.name}</td>
                    <td className="p-4 align-middle">
                      <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{space.invite_code || '-'}</code>
                    </td>
                    <td className="p-4 align-middle">{new Date(space.created_at).toLocaleDateString()}</td>
                    <td className="p-4 align-middle text-right">
                      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    DB 연동 후 데이터가 표시됩니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
