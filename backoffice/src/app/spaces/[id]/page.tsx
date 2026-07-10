export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft, Calendar, CreditCard, Users, KeyRound, Clock, MessageSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface PageProps {
  params: Promise<{ id: string }>;
}


function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
}

function roleLabel(role: string) {
  if (role === "admin") return "공간 지기";
  if (role === "editor") return "공간 운영자";
  return "공간 멤버";
}

function roleVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "admin") return "default";
  if (role === "editor") return "secondary";
  return "outline";
}

async function safeCount(query: PromiseLike<{ count: number | null }>) {
  try {
    const result = await query;
    return result.count ?? 0;
  } catch {
    return 0;
  }
}

export default async function SpaceDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: space, error } = await supabase
    .from("family_groups")
    .select("id, name, invite_code, invite_code_expires_at, created_at, created_by, cover_url, settings, timezone")
    .eq("id", id)
    .single();

  if (error || !space) notFound();

  const [membersRes, schedulesRes, ledgerRes, postsCount] = await Promise.all([
    supabase
      .from("space_members")
      .select("id, user_id, role, joined_at, nickname, profiles(id, email, name, display_name, fcm_token, onboarding_completed_at)")
      .eq("space_id", id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("schedules")
      .select("id, title, type, status, start_time, amount, created_by")
      .eq("family_group_id", id)
      .order("start_time", { ascending: false })
      .limit(8),
    supabase
      .from("ledger_entries")
      .select("id, kind, scope, title, amount, status, occurred_at, owner_id")
      .eq("space_id", id)
      .order("occurred_at", { ascending: false })
      .limit(8),
    safeCount(
      supabase
        .from("space_posts")
        .select("id", { count: "exact", head: true })
        .eq("space_id", id)
    ),
  ]);

  const members = (membersRes.data ?? []) as any[];
  const schedules = schedulesRes.data ?? [];
  const ledgerEntries = ledgerRes.data ?? [];
  const memberCount = members.length;
  const fcmEnabledCount = members.filter((m) => !!m.profiles?.fcm_token).length;
  const scheduleCount = await safeCount(
    supabase.from("schedules").select("id", { count: "exact", head: true }).eq("family_group_id", id)
  );
  const ledgerCount = await safeCount(
    supabase.from("ledger_entries").select("id", { count: "exact", head: true }).eq("space_id", id)
  );
  const owner = members.find((m) => m.user_id === space.created_by)?.profiles;

  return (
    <main className="p-8 max-w-6xl space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/spaces"><ArrowLeft className="h-4 w-4 mr-1" /> 공간 목록</Link>
        </Button>
      </div>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{space.name}</h1>
            <Badge variant="outline">{space.timezone ?? "Asia/Seoul"}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground font-mono">{space.id}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            생성일 {formatDate(space.created_at)} · 생성자 {owner?.display_name || owner?.name || owner?.email || space.created_by || "-"}
          </p>
        </div>
        <Card className="w-full lg:w-[360px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" /> 초대 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">초대 코드</span>
              <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{space.invite_code ?? "없음"}</code>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">만료</span>
              <span className="text-right">{space.invite_code_expires_at ? formatDate(space.invite_code_expires_at) : "무기한"}</span>
            </div>
          </CardContent>
        </Card>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard icon={<Users className="h-4 w-4" />} label="멤버" value={`${memberCount}명`} sub={`FCM ${fcmEnabledCount}명`} />
        <MetricCard icon={<Calendar className="h-4 w-4" />} label="일정" value={`${scheduleCount}건`} sub="공간 연결 기준" />
        <MetricCard icon={<CreditCard className="h-4 w-4" />} label="원장" value={`${ledgerCount}건`} sub="수입/지출 통합" />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="최근 활동" value={formatDate(space.created_at).split(" ")[0]} sub="상세 활동 로그 확장 예정" />
        <MetricCard icon={<MessageSquare className="h-4 w-4" />} label="게시글" value={`${postsCount}건`} sub="커뮤니티" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">공간 멤버</CardTitle>
            <CardDescription>역할과 FCM 상태를 함께 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>FCM</TableHead>
                  <TableHead>참여일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length > 0 ? members.map((member) => {
                  const profile = member.profiles;
                  const displayName = member.nickname || profile?.display_name || profile?.name || "이름 없음";
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Link href={`/users/${member.user_id}`} className="font-medium hover:underline">{displayName}</Link>
                        <p className="text-xs text-muted-foreground">{profile?.email ?? member.user_id}</p>
                      </TableCell>
                      <TableCell><Badge variant={roleVariant(member.role)}>{roleLabel(member.role)}</Badge></TableCell>
                      <TableCell>{profile?.fcm_token ? <Badge variant="outline">활성</Badge> : <Badge variant="secondary">없음</Badge>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(member.joined_at)}</TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">등록된 멤버가 없습니다.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 공간 일정</CardTitle>
            <CardDescription>이 공간에 연결된 최신 일정입니다.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>시각</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length > 0 ? schedules.map((schedule: any) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.title}</TableCell>
                    <TableCell><Badge variant="outline">{schedule.type}</Badge></TableCell>
                    <TableCell className="text-sm">{schedule.status ?? "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(schedule.start_time)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">등록된 일정이 없습니다.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 원장 항목</CardTitle>
          <CardDescription>공간/개인 반영을 포함한 수입·지출 통합 원장 기준입니다.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>항목</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>범위</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>발생일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerEntries.length > 0 ? ledgerEntries.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.title}</TableCell>
                  <TableCell><Badge variant={entry.kind === "income" ? "default" : "secondary"}>{entry.kind === "income" ? "수입" : "지출"}</Badge></TableCell>
                  <TableCell className="text-sm">{entry.scope === "personal" ? "개인 반영" : "공간"}</TableCell>
                  <TableCell className="text-right font-mono">{Number(entry.amount ?? 0).toLocaleString("ko-KR")}원</TableCell>
                  <TableCell className="text-sm">{entry.status}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(entry.occurred_at)}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">등록된 원장 항목이 없습니다.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center justify-between text-muted-foreground">
          <span className="text-sm font-medium">{label}</span>
          {icon}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
