"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";

export interface SpaceRow {
  id: string;
  name: string;
  invite_code: string | null;
  created_at: string;
  created_by: string | null;
}

interface Props {
  spaces: SpaceRow[];
}

export function SpacesClient({ spaces }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return spaces;
    return spaces.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.invite_code ?? "").toLowerCase().includes(q) ||
        s.id.toLowerCase().startsWith(q)
    );
  }, [spaces, query]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">공간 목록</CardTitle>
          <CardDescription>
            {query
              ? `"${query}" 검색 결과 ${filtered.length}개 (전체 ${spaces.length}개)`
              : `최근 생성된 ${spaces.length}개`}
          </CardDescription>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="공간명 · 초대코드 · ID 검색"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
            {filtered.length > 0 ? (
              filtered.map((space) => (
                <TableRow key={space.id}>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {space.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="font-medium">{space.name}</TableCell>
                  <TableCell>
                    {space.invite_code ? (
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">
                        {space.invite_code}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-xs">없음</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(space.created_at).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">상세 보기</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  {query ? `"${query}"에 해당하는 공간이 없습니다.` : "생성된 공간이 없습니다."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
