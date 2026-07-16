export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminPageSupabase } from "@/lib/supabase";
import { fetchGA4Summary, GA4_PROPERTY_ID } from "@/lib/ga4";
import { ExternalLink, Activity, Users, Eye, TrendingUp } from "lucide-react";

async function getKpiData() {
  const supabase = await getAdminPageSupabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [usersRes, spacesRes, schedulesTodayRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("family_groups").select("id", { count: "exact", head: true }),
    supabase
      .from("schedules")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
  ]);

  return {
    totalUsers:      usersRes.count      ?? 0,
    totalSpaces:     spacesRes.count     ?? 0,
    todaySchedules:  schedulesTodayRes.count ?? 0,
  };
}

export default async function Dashboard() {
  const [{ totalUsers, totalSpaces, todaySchedules }, ga4] = await Promise.all([
    getKpiData(),
    fetchGA4Summary(),
  ]);

  const isGA4Connected = !!ga4;
  const ga4Configured  = !!GA4_PROPERTY_ID && !!process.env.GOOGLE_SERVICE_ACCOUNT;

  const kpis = [
    {
      title: "총 누적 회원",
      value: totalUsers.toLocaleString("ko-KR"),
      desc:  "가입된 전체 회원 수",
      icon:  "👥",
    },
    {
      title: "활성 공간(Space)",
      value: totalSpaces.toLocaleString("ko-KR"),
      desc:  "생성된 전체 공간 수",
      icon:  "🏠",
    },
    {
      title: "오늘 생성된 일정",
      value: todaySchedules.toLocaleString("ko-KR"),
      desc:  "오늘 00:00 이후 생성",
      icon:  "📅",
    },
    {
      title: "실시간 접속자",
      value: isGA4Connected ? ga4!.realtimeUsers.toLocaleString("ko-KR") : "—",
      desc:  isGA4Connected ? "최근 30분 (GA4 Realtime)" : ga4Configured ? "GA4 조회 실패" : "GA4 미연동",
      icon:  "🔥",
      live:  isGA4Connected,
    },
  ];

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground mt-1">
          글리움 서비스의 실시간 현황을 한눈에 파악하세요.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className="flex items-center gap-1.5">
                {kpi.live && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
                <span className="text-xl">{kpi.icon}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GA4 Analytics 섹션 */}
      {isGA4Connected ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Google Analytics — 최근 7일</h2>
            <Badge variant="secondary" className="text-green-700 bg-green-50 border-green-200">
              GA4 연동됨
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard icon={<Users className="w-4 h-4" />}    label="활성 사용자"  value={ga4!.activeUsers7d} />
            <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="신규 사용자"  value={ga4!.newUsers7d} />
            <MetricCard icon={<Activity className="w-4 h-4" />}  label="세션 수"      value={ga4!.sessions7d} />
            <MetricCard icon={<Eye className="w-4 h-4" />}       label="페이지뷰"     value={ga4!.pageViews7d} />
          </div>

          {/* 상위 페이지 */}
          {ga4!.topPages.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">상위 페이지 (7일)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ga4!.topPages.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <span className="text-sm font-mono truncate flex-1">{p.page}</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {p.views.toLocaleString("ko-KR")}
                    </span>
                    <span className="text-xs text-muted-foreground">뷰</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* GA4 미연동 안내 */
        <div className="mb-8 rounded-lg border border-dashed p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">📊</span>
            <div className="flex-1">
              <p className="font-semibold mb-1">GA4 Analytics 미연동</p>
              <p className="text-sm text-muted-foreground mb-3">
                아래 환경변수를 Vercel에 추가하면 이 섹션에 실시간 접속자, 세션, 페이지뷰 등
                GA4 데이터가 표시됩니다.
              </p>
              <div className="rounded-md bg-muted p-3 text-xs font-mono space-y-1 mb-3">
                <div><span className="text-muted-foreground">GA4_PROPERTY_ID</span> = <span className="text-foreground">123456789</span></div>
                <div><span className="text-muted-foreground">GOOGLE_SERVICE_ACCOUNT</span> = <span className="text-foreground">{"{"}"type":"service_account", ...{"}"}</span></div>
              </div>
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                GA4 대시보드 열기 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[280px] flex items-center justify-center">
          <div className="text-muted-foreground flex flex-col items-center gap-2 text-sm">
            <span className="text-4xl">📈</span>
            주간 활성 사용자(WAU) 트렌드
            <span className="text-xs mt-1">Phase 5 — Recharts 연동 예정</span>
          </div>
        </Card>
        <Card className="min-h-[280px] flex items-center justify-center">
          <div className="text-muted-foreground flex flex-col items-center gap-2 text-sm">
            <span className="text-4xl">🎯</span>
            가계부 vs 캘린더 생성 비율
            <span className="text-xs mt-1">Phase 5 — Recharts 연동 예정</span>
          </div>
        </Card>
      </div>
    </main>
  );
}

function MetricCard({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <div className="text-2xl font-bold tabular-nums">
          {value.toLocaleString("ko-KR")}
        </div>
      </CardContent>
    </Card>
  );
}
