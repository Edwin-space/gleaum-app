export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle,
  Smartphone, Monitor, Globe, MousePointerClick,
} from "lucide-react";

/* ── 타입 ─────────────────────────────────────────────────── */
interface SendDetail {
  id: string;
  user_id: string | null;
  token_prefix: string | null;
  success: boolean;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
}
interface ClickRow {
  id: string;
  created_at: string;
  platform: string | null;
  user_agent: string | null;
}

/* ── FCM 에러 코드 설명 ────────────────────────────────────── */
const FCM_ERROR_GUIDE: Record<string, { label: string; action: string; color: string }> = {
  UNREGISTERED: {
    label: "앱 삭제 / 토큰 만료",
    action: "해당 유저의 fcm_token을 DB에서 삭제하세요.",
    color: "text-orange-700 bg-orange-50 border-orange-200",
  },
  INVALID_ARGUMENT: {
    label: "잘못된 토큰 형식",
    action: "토큰 값이 손상되었습니다. fcm_token을 초기화하세요.",
    color: "text-red-700 bg-red-50 border-red-200",
  },
  QUOTA_EXCEEDED: {
    label: "FCM 전송 한도 초과",
    action: "잠시 후 재시도하거나 발송 속도를 조절하세요.",
    color: "text-yellow-700 bg-yellow-50 border-yellow-200",
  },
  SENDER_ID_MISMATCH: {
    label: "Firebase 프로젝트 불일치",
    action: "앱이 등록된 Firebase 프로젝트와 서비스 계정이 다릅니다.",
    color: "text-red-700 bg-red-50 border-red-200",
  },
  INTERNAL: {
    label: "FCM 서버 내부 오류",
    action: "Firebase 서버 문제입니다. 재시도 후에도 지속되면 상태 페이지를 확인하세요.",
    color: "text-gray-700 bg-gray-50 border-gray-200",
  },
  UNAVAILABLE: {
    label: "FCM 서버 일시 불가",
    action: "지수 백오프 후 재시도하세요.",
    color: "text-gray-700 bg-gray-50 border-gray-200",
  },
  ACCESS_TOKEN_ERROR: {
    label: "FCM 인증 토큰 발급 실패",
    action: "FIREBASE_SERVICE_ACCOUNT_BASE64 환경변수를 확인하세요.",
    color: "text-red-700 bg-red-50 border-red-200",
  },
};

function unknownGuide(code: string) {
  return {
    label: code,
    action: "FCM 공식 문서에서 에러 코드를 확인하세요.",
    color: "text-gray-600 bg-gray-50 border-gray-200",
  };
}

/* ── 헬퍼 ─────────────────────────────────────────────────── */
function PlatformIcon({ platform }: { platform: string | null }) {
  if (platform === "ios" || platform === "android")
    return <Smartphone className="h-3.5 w-3.5" />;
  if (platform === "web") return <Monitor className="h-3.5 w-3.5" />;
  return <Globe className="h-3.5 w-3.5" />;
}

function platformLabel(p: string | null) {
  const map: Record<string, string> = { ios: "iOS", android: "Android", web: "웹" };
  return map[p ?? ""] ?? (p ?? "알 수 없음");
}

/* ── 페이지 ───────────────────────────────────────────────── */
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;

  /* ── 캠페인 기본 정보 ── */
  const { data: log, error: logErr } = await supabase
    .from("campaign_logs")
    .select("*")
    .eq("id", id)
    .single();

  if (logErr || !log) notFound();

  /* ── 발송 건별 상세 ── */
  const { data: details } = await supabase
    .from("campaign_send_details")
    .select("id, user_id, token_prefix, success, error_code, error_message, created_at")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  /* ── 클릭 유입 ── */
  const { data: clicks } = await supabase
    .from("campaign_clicks")
    .select("id, created_at, platform, user_agent")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  const sendDetails: SendDetail[] = details ?? [];
  const clickRows:   ClickRow[]   = clicks  ?? [];

  /* ── 에러 코드별 집계 ── */
  const errorMap = new Map<string, number>();
  for (const d of sendDetails) {
    if (!d.success && d.error_code) {
      errorMap.set(d.error_code, (errorMap.get(d.error_code) ?? 0) + 1);
    }
  }
  const errorBreakdown = Array.from(errorMap.entries())
    .sort((a, b) => b[1] - a[1]);

  /* ── 플랫폼별 클릭 집계 ── */
  const platformMap = new Map<string, number>();
  for (const c of clickRows) {
    const p = c.platform ?? "unknown";
    platformMap.set(p, (platformMap.get(p) ?? 0) + 1);
  }

  const ctr = log.sent_count > 0
    ? `${((clickRows.length / log.sent_count) * 100).toFixed(1)}%`
    : "—";

  return (
    <main className="p-8 max-w-5xl">
      {/* ── 헤더 ── */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/campaigns/history">
            <ArrowLeft className="h-4 w-4 mr-1" /> 발송 이력
          </Link>
        </Button>
      </div>

      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight line-clamp-2">{log.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{log.body}</p>
          </div>
          <StatusBadgeLarge status={log.status} />
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-mono">{log.id}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(log.created_at).toLocaleString("ko-KR")} ·{" "}
          {log.channel === "app_push" ? "앱 푸시" : log.channel} ·{" "}
          {segLabel(log.segment)}
        </p>
      </header>

      {/* ── KPI 4개 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="대상" value={log.target_count} color="text-foreground" />
        <KpiCard label="발송 성공" value={log.sent_count} color="text-green-700" />
        <KpiCard label="발송 실패" value={log.failed_count} color={log.failed_count > 0 ? "text-destructive" : "text-muted-foreground"} />
        <KpiCard label={`클릭 유입 (CTR ${ctr})`} value={clickRows.length} color="text-primary" />
      </div>

      <div className="space-y-6">

        {/* ── 에러 원인 분석 ── */}
        {errorBreakdown.length > 0 && (
          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                실패 원인 분석
              </CardTitle>
              <CardDescription>에러 코드별 발생 건수 및 대응 방법</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {errorBreakdown.map(([code, count]) => {
                const guide = FCM_ERROR_GUIDE[code] ?? unknownGuide(code);
                return (
                  <div
                    key={code}
                    className={`rounded-lg border p-3 ${guide.color}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm font-mono">{code}</span>
                      <Badge variant="secondary" className="text-xs">{count}건</Badge>
                    </div>
                    <p className="text-sm font-medium">{guide.label}</p>
                    <p className="text-xs mt-0.5 opacity-80">→ {guide.action}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* ── 클릭 유입 플랫폼 분포 ── */}
        {clickRows.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-primary" />
                클릭 유입 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                {Array.from(platformMap.entries()).map(([platform, count]) => (
                  <div key={platform} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <PlatformIcon platform={platform} />
                    <span className="font-medium">{platformLabel(platform)}</span>
                    <span className="text-muted-foreground">{count}건</span>
                  </div>
                ))}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>유입 시각</TableHead>
                    <TableHead>플랫폼</TableHead>
                    <TableHead>User-Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clickRows.slice(0, 50).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(c.created_at).toLocaleString("ko-KR", {
                          month: "2-digit", day: "2-digit",
                          hour: "2-digit", minute: "2-digit", second: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <PlatformIcon platform={c.platform} />
                          {platformLabel(c.platform)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate" title={c.user_agent ?? ""}>
                        {c.user_agent ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {clickRows.length > 50 && (
                <p className="text-xs text-muted-foreground px-4 py-2 border-t">
                  최근 50건 표시 중 (전체 {clickRows.length}건)
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── 발송 건별 상세 ── */}
        {sendDetails.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">발송 건별 상세</CardTitle>
              <CardDescription>
                성공 {sendDetails.filter(d => d.success).length}건 ·
                실패 {sendDetails.filter(d => !d.success).length}건 · 최대 200건 표시
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>결과</TableHead>
                    <TableHead>유저 ID</TableHead>
                    <TableHead>FCM 토큰 (앞 20자)</TableHead>
                    <TableHead>에러 코드</TableHead>
                    <TableHead>에러 메시지</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sendDetails.slice(0, 200).map((d) => (
                    <TableRow key={d.id} className={!d.success ? "bg-destructive/5" : ""}>
                      <TableCell>
                        {d.success
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <XCircle className="h-4 w-4 text-destructive" />}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {d.user_id ? `${d.user_id.slice(0, 8)}…` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {d.token_prefix ? `${d.token_prefix}…` : "—"}
                      </TableCell>
                      <TableCell>
                        {d.error_code
                          ? <Badge variant="outline" className="text-xs font-mono">{d.error_code}</Badge>
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate" title={d.error_message ?? ""}>
                        {d.error_message ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {sendDetails.length > 200 && (
                <p className="text-xs text-muted-foreground px-4 py-2 border-t">
                  200건까지 표시 (전체 {sendDetails.length}건)
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 상세 데이터 없음 안내 */}
        {sendDetails.length === 0 && (
          <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
            발송 건별 상세 데이터가 없습니다.
            <p className="text-xs mt-1">
              이 캠페인은 상세 기록 기능 추가 이전에 발송되었거나,
              <code className="font-mono mx-1">campaign_send_details</code> 테이블이 생성되지 않았습니다.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

/* ── 서브 컴포넌트 ─────────────────────────────────────────── */
function StatusBadgeLarge({ status }: { status: string }) {
  if (status === "completed")
    return (
      <Badge className="gap-1.5 bg-green-50 text-green-700 border-green-200 hover:bg-green-50 px-3 py-1 text-sm shrink-0">
        <CheckCircle2 className="h-3.5 w-3.5" /> 전송 완료
      </Badge>
    );
  if (status === "partial")
    return (
      <Badge variant="outline" className="gap-1.5 text-yellow-700 border-yellow-300 px-3 py-1 text-sm shrink-0">
        <AlertCircle className="h-3.5 w-3.5" /> 일부 실패
      </Badge>
    );
  return (
    <Badge variant="destructive" className="gap-1.5 px-3 py-1 text-sm shrink-0">
      <XCircle className="h-3.5 w-3.5" /> 실패
    </Badge>
  );
}

function KpiCard({
  label, value, color,
}: {
  label: string; value: number; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-bold tabular-nums ${color}`}>
          {value.toLocaleString("ko-KR")}
        </p>
      </CardContent>
    </Card>
  );
}

function segLabel(seg: string) {
  const map: Record<string, string> = {
    all: "전체 회원",
    no_onboarding: "온보딩 미완료",
    space_member: "Space 멤버",
  };
  return map[seg] ?? seg;
}
