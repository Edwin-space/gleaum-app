import Link from "next/link";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
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
          <h1 className="text-3xl font-bold tracking-tight">공간(Space) 관리</h1>
          <p className="text-muted-foreground mt-1">생성된 공간 현황 및 초대 코드를 관리합니다.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/users">← 회원 관리</Link>
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">공간 목록</CardTitle>
            <CardDescription>최근 생성된 50개를 표시합니다.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="공간명 검색..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>공간 ID</TableHead>
                <TableHead>공간명</TableHead>
                <TableHead>초대 코드</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spaces && spaces.length > 0 ? (
                spaces.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell className="text-xs text-muted-foreground font-mono">{space.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{space.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">
                        {space.invite_code || "-"}
                      </code>
                    </TableCell>
                    <TableCell>{new Date(space.created_at).toLocaleDateString("ko-KR")}</TableCell>
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
