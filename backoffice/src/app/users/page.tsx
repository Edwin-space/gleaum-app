import Link from "next/link";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default async function UsersPage() {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">회원 관리</h1>
          <p className="text-muted-foreground mt-1">가입된 회원 목록 및 상세 정보를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/spaces" className="text-sm font-medium text-primary hover:underline">
            👉 공간(Space) 관리로 이동
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
              placeholder="이름 또는 이메일 검색..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            최근 50명 표시
          </div>
        </div>
        
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">사용자 ID</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">이름(닉네임)</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">가입일</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">온보딩 완료</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {profiles && profiles.length > 0 ? (
                profiles.map((profile) => (
                  <tr key={profile.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle text-xs text-muted-foreground">{profile.id.slice(0, 8)}...</td>
                    <td className="p-4 align-middle font-medium">{profile.display_name || profile.full_name || '이름 없음'}</td>
                    <td className="p-4 align-middle">{new Date(profile.created_at).toLocaleDateString()}</td>
                    <td className="p-4 align-middle">
                      {profile.onboarding_completed ? (
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">완료</span>
                      ) : (
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">미완료</span>
                      )}
                    </td>
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
