export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function UsersPage() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, display_name, email, onboarding_completed_at, created_at, family_group_id")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">회원 관리</h1>
          <p className="text-muted-foreground mt-1">
            가입된 회원 목록 및 상세 정보를 관리합니다.
            {profiles && <span className="ml-2 font-semibold text-foreground">총 {profiles.length}명</span>}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/spaces">공간(Space) 관리 →</Link>
        </Button>
      </header>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          데이터 로드 실패: {error.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">회원 목록</CardTitle>
          <CardDescription>최근 가입한 순서로 표시합니다.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용자 ID</TableHead>
                <TableHead>이름 / 닉네임</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>온보딩</TableHead>
                <TableHead>공간 보유</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles && profiles.length > 0 ? (
                profiles.map((profile) => {
                  const displayName = profile.display_name || profile.name || "이름 없음";
                  const hasSpace    = !!profile.family_group_id;
                  const doneOnboard = !!profile.onboarding_completed_at;

                  return (
                    <TableRow key={profile.id}>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {profile.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{displayName}</div>
                        {profile.email && (
                          <div className="text-xs text-muted-foreground">{profile.email}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(profile.created_at).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        {doneOnboard ? (
                          <Badge>완료</Badge>
                        ) : (
                          <Badge variant="secondary">미완료</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasSpace ? (
                          <Badge variant="outline">있음</Badge>
                        ) : (
                          <Badge variant="secondary">없음</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">상세 보기</Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    {error ? "데이터를 불러올 수 없습니다." : "가입된 회원이 없습니다."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
