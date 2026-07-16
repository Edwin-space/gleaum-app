export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAdminPageSupabase } from "@/lib/supabase";
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
  ArrowLeft, Send, MousePointerClick, Users,
  CheckCircle2, AlertCircle, XCircle, TrendingUp, ChevronRight,
} from "lucide-react";

/* ── 타입 ─────────────────────────────────────────────────── */
interface CampaignLog {
  id: string;
  created_at: string;
  channel: string;
  segment: string;
  title: string;
  body: string;
  url: string | null;
  target_count: number;
  sent_count: number;
  failed_count: number;
  status: "completed" | "partial" | "failed";
  click_count: number;
}

/* ── 헬퍼 ─────────────────────────────────────────────────── */
function channelLabel(ch: string) {
  const map: Record<string, string> = {
    app_push: "앱 푸시",
    web_push: "웹 푸시",
    sms: "SMS",
    email: "이메일",
  };
  return map[ch] ?? ch;
}

function segmentLabel(seg: string) {
  const map: Record<string, string> = {
    all: "전체",
    no_onboarding: "온보딩 미완료",
    space_member: "Space 멤버",
  };
  return map[seg] ?? seg;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed")
    return (
      <Badge className="gap-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
        <CheckCircle2 className="h-3 w-3" /> 전송 완료
      </Badge>
    );
  if (status === "partial")
    return (
      <Badge variant="outline" className="gap-1 text-yellow-700 border-yellow-300">
        <AlertCircle className="h-3 w-3" /> 일부 실패
      </Badge>
    );
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" /> 실패
    </Badge>
  );
}

function ctr(sent: number, clicks: number) {
  if (sent === 0) return "—";
  return `${((clicks / sent) * 100).toFixed(1)}%`;
}

/* ── 페이지 ───────────────────────────────────────────────── */
export default async function CampaignHistoryPage() {
  const supabase = await getAdminPageSupabase();
  // campaign_logs + 클릭 집계를 한 번에 조회
  const { data: logs, error } = await supabase
    .from("campaign_logs")
    .select(`
      id, created_at, channel, segment, title, body, url,
      target_count, sent_count, failed_count, status,
      campaign_clicks(count)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // 집계 정리
  const campaigns: CampaignLog[] = (logs ?? []).map((row) => ({
    ...row,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    click_count: (row.campaign_clicks as any)?.[0]?.count ?? 0,
  }));

  // ── 요약 통계 ──────────────────────────────────────────────
  const totalSent   = campaigns.reduce((s, c) => s + c.sent_count, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.click_count, 0);
  const totalFailed = campaigns.reduce((s, c) => s + c.failed_count, 0);
  const avgCtr      = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : "0.0";

  return (
    <main className="p-8">
      {/* ── 헤더 ── */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/campaigns"><ArrowLeft className="h-4 w-4 mr-1" /> 캠페인 생성기</Link>
        </Button>
      </div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">캠페인 발송 이력</h1>
        <p className="text-muted-foreground mt-1">
          발송 기록 및 유입 전환율을 확인합니다.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <p className="font-semibold">데이터 로드 실패</p>
          <p className="mt-1 text-xs font-mono">{error.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Supabase에 <code>campaign_logs</code> 테이블이 생성되어 있는지 확인하세요.
            (<code>supabase/migrations/002_campaign_tracking.sql</code> 실행 필요)
          </p>
        </div>
      )}

      {/* ── 요약 KPI ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={<Send className="h-4 w-4 text-primary" />}
          label="총 발송 캠페인"
          value={`${campaigns.length}회`}
        />
        <KpiCard
          icon={<Users className="h-4 w-4 text-blue-500" />}
          label="누적 발송 성공"
          value={totalSent.toLocaleString("ko-KR")}
          sub="명"
        />
        <KpiCard
          icon={<MousePointerClick className="h-4 w-4 text-green-600" />}
          label="누적 클릭 유입"
          value={totalClicks.toLocaleString("ko-KR")}
          sub="건"
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4 text-orange-500" />}
          label="평균 클릭률 (CTR)"
          value={`${avgCtr}%`}
          highlight={parseFloat(avgCtr) > 10}
        />
      </div>

      {/* ── 발송 이력 테이블 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">발송 이력</CardTitle>
          <CardDescription>
            최근 100건 표시 · 클릭 = 알림 탭 후 앱/웹 유입 건수
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>발송 일시</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>채널</TableHead>
                <TableHead>세그먼트</TableHead>
                <TableHead className="text-right">대상</TableHead>
                <TableHead className="text-right">성공</TableHead>
                <TableHead className="text-right">실패</TableHead>
                <TableHead className="text-right">클릭</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead>상태</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length > 0 ? (
                campaigns.map((c) => (
                  <TableRow key={c.id} className={c.failed_count > 0 ? "bg-destructive/[0.03]" : ""}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.created_at).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="font-medium text-sm truncate" title={c.title}>{c.title}</p>
                      <p className="text-xs text-muted-foreground truncate" title={c.body}>{c.body}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{channelLabel(c.channel)}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {segmentLabel(c.segment)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {c.target_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono text-green-700">
                      {c.sent_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono text-destructive font-semibold">
                      {c.failed_count > 0 ? c.failed_count.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono font-semibold text-primary">
                      {c.click_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {ctr(c.sent_count, c.click_count)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs" asChild>
                        <Link href={`/campaigns/history/${c.id}`}>
                          상세 <ChevronRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-16">
                    {error
                      ? "데이터를 불러올 수 없습니다."
                      : "발송 이력이 없습니다. 캠페인을 생성하고 발송해 보세요."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── 추적 방식 안내 ── */}
      <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground text-sm">클릭 추적 작동 방식</p>
        <p>
          발송된 FCM 알림에는 <code className="font-mono bg-muted px-1 rounded">gleaum.com/api/campaign/click?id=...</code> 추적 URL이 포함됩니다.
        </p>
        <p>
          유저가 알림을 탭하면 이 엔드포인트를 거쳐 원본 랜딩 페이지로 리다이렉트되며, 클릭 건수가 자동 기록됩니다.
        </p>
        <p>
          iOS · Android · 웹 모두 동일한 추적 흐름을 사용합니다. 플랫폼별 분류는 User-Agent 기반으로 이루어집니다.
        </p>
      </div>
    </main>
  );
}

/* ── 서브 컴포넌트 ─────────────────────────────────────────── */
function KpiCard({
  icon, label, value, sub, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-orange-200 bg-orange-50/30" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold tracking-tight">
          {value}
          {sub && <span className="text-sm font-normal text-muted-foreground ml-1">{sub}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
