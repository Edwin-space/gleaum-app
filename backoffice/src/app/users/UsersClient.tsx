"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Bell, BellOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";

export interface ProfileRow {
  id: string;
  name: string | null;
  display_name: string | null;
  email: string | null;
  onboarding_completed_at: string | null;
  created_at: string;   // auth.users.created_at (서버에서 병합)
  updated_at: string | null;
  family_group_id: string | null;
  fcm_token: string | null;
}

interface Props {
  profiles: ProfileRow[];
  page: number;
  totalPages: number;
  total: number;
}

export function UsersClient({ profiles, page, totalPages, total }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => {
      const name = (p.display_name || p.name || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      return name.includes(q) || email.includes(q) || p.id.toLowerCase().startsWith(q);
    });
  }, [profiles, query]);

  const fcmCount = profiles.filter((p) => !!p.fcm_token).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">회원 목록</CardTitle>
          <CardDescription>
            페이지 {page}/{totalPages} · 현재 페이지 FCM 토큰 보유 {fcmCount}/{profiles.length}명
          </CardDescription>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 h-9"
            placeholder="이름, 이메일, ID 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자 ID</TableHead>
              <TableHead>이름 / 이메일</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead>온보딩</TableHead>
              <TableHead>공간</TableHead>
              <TableHead>FCM</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((profile) => {
                const displayName = profile.display_name || profile.name || "이름 없음";
                const hasSpace    = !!profile.family_group_id;
                const doneOnboard = !!profile.onboarding_completed_at;
                const hasFcm      = !!profile.fcm_token;

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
                      {doneOnboard
                        ? <Badge>완료</Badge>
                        : <Badge variant="secondary">미완료</Badge>}
                    </TableCell>
                    <TableCell>
                      {hasSpace
                        ? <Badge variant="outline">있음</Badge>
                        : <Badge variant="secondary">없음</Badge>}
                    </TableCell>
                    <TableCell>
                      {hasFcm
                        ? <Bell className="h-4 w-4 text-green-600" />
                        : <BellOff className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/users/${profile.id}`}>상세 보기</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  {query ? `"${query}"에 해당하는 회원이 없습니다.` : "가입된 회원이 없습니다."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-xs text-muted-foreground border-t">
            <span>
              {query
                ? `${filtered.length}명 검색됨 (현재 페이지 ${profiles.length}명)`
                : `전체 ${total.toLocaleString("ko-KR")}명 중 현재 페이지 ${profiles.length}명 표시`}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild aria-disabled={page <= 1}>
                <Link href={page <= 1 ? "/users?page=1" : `/users?page=${page - 1}`}>이전</Link>
              </Button>
              <span className="font-mono">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" asChild aria-disabled={page >= totalPages}>
                <Link href={page >= totalPages ? `/users?page=${totalPages}` : `/users?page=${page + 1}`}>다음</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
