"use client";

import { useState } from "react";
import { MonitorPlay, Check, Plus, MousePointerClick, Smartphone } from "lucide-react";

export default function AdsPage() {
  const [adMode, setAdMode] = useState("gam");
  const [routeType, setRouteType] = useState("internal"); // 'internal' | 'external'
  const [mockupLocation, setMockupLocation] = useState("home_top"); // 'home_top' | 'feed_middle'

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">광고 매니저</h1>
        <p className="text-muted-foreground mt-1">글로벌 광고 송출 전략을 설정하고 자체 배너를 고도화하여 렌더링하세요.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* 1. Global Strategy */}
          <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MonitorPlay className="w-5 h-5 text-primary" />
              글로벌 광고 송출 전략
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: "inhouse", title: "In-House Only", desc: "자체 이벤트 배너만 100% 노출" },
                { id: "adsense", title: "AdSense Only", desc: "구글 애드센스만 송출" },
                { id: "gam", title: "GAM Smart Mode", desc: "자체 광고 우선 노출, 미노출 시 애드센스 백필" },
              ].map((mode) => (
                <div
                  key={mode.id}
                  onClick={() => setAdMode(mode.id)}
                  className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
                    adMode === mode.id ? "border-primary bg-primary/5" : "border-input bg-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className={`block text-sm font-medium ${adMode === mode.id ? "text-primary" : "text-foreground"}`}>
                      {mode.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{mode.desc}</span>
                  </div>
                  {adMode === mode.id && <Check className="absolute top-4 right-4 h-4 w-4 text-primary" />}
                </div>
              ))}
            </div>
          </section>

          {/* 2. Advanced Banner Editor */}
          <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">인하우스 배너 등록 및 라우팅 제어</h2>
              <button className="flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
                <Plus className="w-4 h-4" /> 새 배너 추가
              </button>
            </div>

            <div className="flex flex-col gap-5 border p-4 rounded-lg bg-muted/20">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">배너 이미지 (URL 또는 업로드)</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="https://example.com/banner-img.png" className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                  <button className="h-10 px-4 rounded-md border bg-background text-sm font-medium hover:bg-muted">파일 첨부</button>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                  클릭 시 이동 액션 (Routing)
                </label>
                
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={routeType === "internal"} onChange={() => setRouteType("internal")} className="accent-primary" />
                    내부 딥링크 (App 내부 화면)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={routeType === "external"} onChange={() => setRouteType("external")} className="accent-primary" />
                    외부 링크 (웹 브라우저)
                  </label>
                </div>

                {routeType === "internal" ? (
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option>선택: [이벤트 팝업] 띄우기</option>
                    <option>이동: 홈 (Home)</option>
                    <option>이동: 가계부 등록 탭 (Budget)</option>
                    <option>이동: 프로필 설정 창</option>
                  </select>
                ) : (
                  <input type="url" placeholder="https://..." className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                )}
              </div>

              <div className="border-t pt-4 flex gap-4">
                 <div className="flex flex-col gap-2 flex-1">
                   <label className="text-sm font-medium text-muted-foreground">노출 위치 (Mockup 확인용)</label>
                   <select 
                     value={mockupLocation}
                     onChange={(e) => setMockupLocation(e.target.value)}
                     className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                   >
                     <option value="home_top">홈(대시보드) 최상단 배너</option>
                     <option value="feed_middle">스페이스 피드(게시글) 사이</option>
                   </select>
                 </div>
                 <div className="flex items-end pb-[2px]">
                   <button className="h-10 px-6 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80">
                     저장 및 송출
                   </button>
                 </div>
              </div>
            </div>

            {/* Active Banners Table Placeholder */}
            <div className="mt-8">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">송출 중인 배너 목록</h3>
              <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                현재 활성화된 배너가 없습니다.
              </div>
            </div>

          </section>
        </div>

        {/* Right Column: Live Mockup Simulator */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden h-[600px] flex flex-col items-center bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-950 dark:to-emerald-950">
            <div className="absolute top-4 left-4 text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> 라이브 앱 시뮬레이터
            </div>
            
            {/* Phone Frame */}
            <div className="w-[280px] h-[580px] mt-8 bg-white dark:bg-zinc-900 border-[8px] border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col">
              <div className="absolute top-0 w-full h-6 flex justify-center z-20">
                <div className="w-1/3 h-full bg-zinc-800 rounded-b-xl"></div>
              </div>
              
              {/* App UI Header */}
              <div className="pt-10 pb-3 px-4 border-b flex justify-between items-center bg-white dark:bg-zinc-900 z-10 shadow-sm">
                <span className="font-bold text-lg text-emerald-500">Gleaum</span>
                <div className="w-6 h-6 rounded-full bg-zinc-200"></div>
              </div>

              {/* Scrollable App Content */}
              <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 flex flex-col relative pb-20">
                
                {/* Home Top Banner Mockup */}
                {mockupLocation === "home_top" && (
                  <div className="w-full aspect-[21/9] bg-gradient-to-r from-blue-500 to-emerald-400 flex items-center justify-center p-4 relative cursor-pointer group">
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">봄맞이 프리미엄 프로모션!</p>
                      <p className="text-white/80 text-[10px]">클릭 시 {routeType === "internal" ? "특정 팝업으로 이동" : "외부 브라우저 띄움"}</p>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                  </div>
                )}

                {/* Dummy App Content */}
                <div className="p-4 flex flex-col gap-4">
                  <div className="h-24 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border p-3 flex flex-col justify-center">
                    <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded mb-2"></div>
                    <div className="h-3 w-1/2 bg-zinc-100 dark:bg-zinc-800/50 rounded"></div>
                  </div>
                  <div className="h-32 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border p-3">
                     <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
                     <div className="flex gap-2">
                       <div className="h-12 flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
                       <div className="h-12 flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded"></div>
                     </div>
                  </div>
                  
                  {/* Feed Middle Banner Mockup */}
                  {mockupLocation === "feed_middle" && (
                    <div className="w-full h-20 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-400 flex items-center justify-center relative cursor-pointer group shadow-sm">
                      <div className="text-center">
                        <p className="text-white font-bold text-xs">피드 사이 배너 광고 영역</p>
                        <p className="text-white/80 text-[10px]">Action: {routeType}</p>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors"></div>
                    </div>
                  )}

                  <div className="h-24 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border p-3"></div>
                </div>
              </div>
              
              {/* Fake Bottom Navigation */}
              <div className="absolute bottom-0 w-full h-16 bg-white dark:bg-zinc-900 border-t flex items-center justify-around px-2 z-20">
                <div className="w-6 h-6 rounded bg-emerald-500"></div>
                <div className="w-6 h-6 rounded bg-zinc-200"></div>
                <div className="w-6 h-6 rounded bg-zinc-200"></div>
                <div className="w-6 h-6 rounded bg-zinc-200"></div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </main>
  );
}
