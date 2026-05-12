export default function Dashboard() {
  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">대시보드</h1>
        <p className="text-muted-foreground mt-1">글리움 서비스의 실시간 현황을 한눈에 파악하세요.</p>
      </header>

      {/* KPI Cards (shadcn Card style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "총 누적 회원", value: "0", desc: "어제 대비 +0명", icon: "👥" },
          { title: "활성 공간(Space)", value: "0", desc: "어제 대비 +0개", icon: "🏠" },
          { title: "오늘 생성된 일정", value: "0", desc: "개인 0 / 공간 0", icon: "📅" },
          { title: "실시간 접속자 (GA4)", value: "-", desc: "데이터 연동 필요", icon: "🔥" },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{kpi.title}</span>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <div className="text-3xl font-bold mt-2">{kpi.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground font-medium flex flex-col items-center gap-2">
            <span className="text-4xl">📊</span>
            주간 활성 사용자(WAU) 트렌드
            <span className="text-xs text-muted-foreground mt-1">Recharts 컴포넌트 추가 예정</span>
          </p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground font-medium flex flex-col items-center gap-2">
            <span className="text-4xl">🎯</span>
            가계부 vs 캘린더 생성 비율
            <span className="text-xs text-muted-foreground mt-1">Recharts 컴포넌트 추가 예정</span>
          </p>
        </div>
      </div>
    </main>
  );
}
