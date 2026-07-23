export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminPageSupabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Bell, BellOff, ArrowLeft, User, Calendar, CreditCard } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const supabase = await getAdminPageSupabase();
  const { id } = await params;

  /* ── 프로필 조회 ── */
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !profile) notFound();

  /* ── 실제 가입일 조회 (auth.users.created_at) ── */
  let createdAt: string = profile.updated_at ?? "";
  try {
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(id);
    if (authUser?.created_at) createdAt = authUser.created_at;
  } catch {
    // service role key 미설정 시 updated_at fallback
  }

  /* ── 공간(Space) 조회 ── */
  const { data: spaceMembers } = await supabase
    .from("space_members")
    .select("space_id, role, joined_at, family_groups(id, name, invite_code)")
    .eq("user_id", id);

  /* ── 최근 일정 조회 (5개) ── */
  const { data: schedules } = await supabase
    .from("schedules")
    .select("id, title, start_at, is_all_day, space_id")
    .eq("created_by", id)
    .order("start_at", { ascending: false })
    .limit(5);

  /* ── 최근 알림 (5개) ── */
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, message, read_at, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const displayName = profile.display_name || profile.name || "이름 없음";
  const hasFcm      = !!profile.fcm_token;
  const doneOnboard = !!profile.onboarding_completed_at;

  return (
    <main className="p-8 max-w-5xl">
      {/* ── 헤더 ── */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/users"><ArrowLeft className="h-4 w-4 mr-1" /> 목록</Link>
        </Button>
      </div>

      {/* ── 기본 정보 ── */}
      <div className="mb-8 flex items-start gap-6">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {displayName.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {displayName}
            {doneOnboard ? <Badge>온보딩 완료</Badge> : <Badge variant="secondary">온보딩 미완료</Badge>}
            {hasFcm
              ? <Badge variant="outline" className="gap-1 text-green-700 border-green-300"><Bell className="h-3 w-3" /> FCM 활성</Badge>
              : <Badge variant="outline" className="gap-1 text-muted-foreground"><BellOff className="h-3 w-3" /> FCM 없음</Badge>}
          </h1>
          {profile.email && (
            <p className="text-muted-foreground mt-1">{profile.email}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1 font-mono">{profile.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── 계정 정보 ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">계정 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="이름"       value={profile.name}         />
            <InfoRow label="닉네임"     value={profile.display_name} />
            <InfoRow label="이메일"     value={profile.email}        />
            <InfoRow label="가입일"     value={createdAt ? new Date(createdAt).toLocaleString("ko-KR") : "—"} />
            <InfoRow
              label="온보딩 완료"
              value={profile.onboarding_completed_at
                ? new Date(profile.onboarding_completed_at).toLocaleString("ko-KR")
                : "미완료"}
            />
            <InfoRow label="FCM 토큰"   value={hasFcm ? `${profile.fcm_token!.slice(0, 20)}…` : "없음"} />
          </CardContent>
        </Card>

        {/* ── 공간 목록 ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">소속 공간</CardTitle>
          </CardHeader>
          <CardContent>
            {spaceMembers && spaceMembers.length > 0 ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {spaceMembers.map((sm: any) => (
                  <div key={sm.space_id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{sm.family_groups?.name ?? sm.space_id}</p>
                      {sm.family_groups?.invite_code && (
                        <p className="text-xs text-muted-foreground font-mono">
                          초대코드: {sm.family_groups.invite_code}
                        </p>
                      )}
                    </div>
                    <Badge variant={sm.role === "admin" ? "default" : "secondary"}>
                      {sm.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">소속 공간 없음</p>
            )}
          </CardContent>
        </Card>

        {/* ── 최근 일정 ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">최근 등록 일정</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {schedules && schedules.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>날짜</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{s.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.start_at
                          ? new Date(s.start_at).toLocaleDateString("ko-KR")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="px-4 py-6 text-sm text-muted-foreground">등록된 일정 없음</p>
            )}
          </CardContent>
        </Card>

        {/* ── 최근 알림 ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <CreditCard className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">최근 알림 수신 내역</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications && notifications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>내용</TableHead>
                    <TableHead>읽음</TableHead>
                    <TableHead>시각</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="text-xs max-w-[160px] truncate">{n.message}</TableCell>
                      <TableCell>
                        {n.read_at
                          ? <Badge variant="secondary" className="text-xs">읽음</Badge>
                          : <Badge className="text-xs">미읽음</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString("ko-KR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="px-4 py-6 text-sm text-muted-foreground">알림 내역 없음</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium truncate max-w-[240px]">{value ?? "—"}</span>
    </div>
  );
}
