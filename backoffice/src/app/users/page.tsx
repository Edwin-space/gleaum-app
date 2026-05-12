import Link from "next/link";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">회원 관리</h1>
          <p className="text-muted-foreground mt-1">가입된 회원 목록 및 상세 정보를 관리합니다.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/spaces">공간(Space) 관리 →</Link>
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">회원 목록</CardTitle>
            <CardDescription>최근 가입한 50명을 표시합니다.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="이름 또는 이메일 검색..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사용자 ID</TableHead>
                <TableHead>이름(닉네임)</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>온보딩 완료</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles && profiles.length > 0 ? (
                profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="text-xs text-muted-foreground font-mono">{profile.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{profile.display_name || profile.full_name || "이름 없음"}</TableCell>
                    <TableCell>{new Date(profile.created_at).toLocaleDateString("ko-KR")}</TableCell>
                    <TableCell>
                      {profile.onboarding_completed ? (
                        <Badge>완료</Badge>
                      ) : (
                        <Badge variant="secondary">미완료</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">상세 보기</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    DB 연동 후 데이터가 표시됩니다.
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
