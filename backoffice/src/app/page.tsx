export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { ExternalLink } from "lucide-react";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";

async function getKpiData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [usersRes, spacesRes, schedulesTodayRes, schedulesTotalRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("family_groups").select("id", { count: "exact", head: true }),
    supabase
      .from("schedules")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase
      .from("schedules")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 86400000).toISOString()), // 어제 이후
  ]);

  const totalUsers    = usersRes.count ?? 0;
  const totalSpaces   = spacesRes.count ?? 0;
  const todaySchedules = schedulesTodayRes.count ?? 0;

  return { totalUsers, totalSpaces, todaySchedules };
}

export default async function Dashboard() {
  const { totalUsers, totalSpaces, todaySchedules } = await getKpiData();

  const kpis = [
    {
      title: "총 누적 회원",
      value: totalUsers.toLocaleString("ko-KR"),
      desc: "가입된 전체 회원 수",
      icon: "👥",
    },
    {
      title: "활성 공간(Space)",
      value: totalSpaces.toLocaleString("ko-KR"),
      desc: "생성된 전체 공간 수",
      icon: "🏠",
    },
    {
      title: "오늘 생성된 일정",
      value: todaySchedules.toLocaleString("ko-KR"),
      desc: "오늘 00:00 이후 생성",
      icon: "📅",
    },
    {
      title: "실시간 접속자 (GA4)",
      value: GA4_ID ? "—" : "미연동",
      desc: GA4_ID ? "GA4 대시보드에서 확인" : "NEXT_PUBLIC_GA4_MEASUREMENT_ID 설정 필요",
      icon: "🔥",
      ga4Link: GA4_ID
        ? `https://analytics.google.com/analytics/web/#/p${GA4_ID.replace("G-", "")}/reports/realtime`
        : null,
    },
  ];

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground mt-1">글리움 서비스의 실시간 현황을 한눈에 파악하세요.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, i) => (
          <Card key={i} className={kpi.ga4Link ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}>
            {kpi.ga4Link ? (
              <a href={kpi.ga4Link} target="_blank" rel="noopener noreferrer" className="block">
                <KpiCardContent kpi={kpi} />
              </a>
            ) : (
              <KpiCardContent kpi={kpi} />
            )}
          </Card>
        ))}
      </div>

      {/* GA4 연동 안내 (미설정 시) */}
      {!GA4_ID && (
        <div className="mb-6 rounded-md border border-dashed p-4 text-sm text-muted-foreground flex items-center gap-3">
          <span className="text-xl">📊</span>
          <div>
            <p className="font-medium text-foreground">GA4 미연동 상태</p>
            <p>
              Vercel 환경변수{" "}
              <code className="font-mono bg-muted px-1 rounded">NEXT_PUBLIC_GA4_MEASUREMENT_ID</code>를
              추가하면 실시간 접속자 및 유입 분석을 확인할 수 있습니다.
            </p>
          </div>
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 flex items-center gap-1 text-primary hover:underline text-xs"
          >
            GA4 열기 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground font-medium flex flex-col items-center gap-2">
            <span className="text-4xl">📈</span>
            주간 활성 사용자(WAU) 트렌드
            <span className="text-xs text-muted-foreground mt-1">Phase 5 — Recharts 연동 예정</span>
          </div>
        </Card>
        <Card className="min-h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground font-medium flex flex-col items-center gap-2">
            <span className="text-4xl">🎯</span>
            가계부 vs 캘린더 생성 비율
            <span className="text-xs text-muted-foreground mt-1">Phase 5 — Recharts 연동 예정</span>
          </div>
        </Card>
      </div>
    </main>
  );
}

function KpiCardContent({ kpi }: { kpi: { title: string; value: string; desc: string; icon: string; ga4Link?: string | null } }) {
  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
        <span className="text-xl">{kpi.icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{kpi.value}</div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {kpi.desc}
          {kpi.ga4Link && <ExternalLink className="w-3 h-3 inline" />}
        </p>
      </CardContent>
    </>
  );
}
