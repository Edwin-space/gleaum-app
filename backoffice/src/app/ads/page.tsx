"use client";

import { useState } from "react";
import { MonitorPlay, Plus, MousePointerClick, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const AD_MODES = [
  { id: "inhouse", title: "In-House Only", desc: "자체 이벤트 배너만 100% 노출" },
  { id: "adsense", title: "AdSense Only", desc: "구글 애드센스만 송출" },
  { id: "gam", title: "GAM Smart Mode", desc: "자체 광고 우선 노출, 미노출 시 애드센스 백필" },
];

export default function AdsPage() {
  const [adMode, setAdMode] = useState("gam");
  const [routeType, setRouteType] = useState("internal");
  const [mockupLocation, setMockupLocation] = useState("home_top");

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">광고 매니저</h1>
        <p className="text-muted-foreground mt-1">글로벌 광고 송출 전략을 설정하고 자체 배너를 고도화하여 렌더링하세요.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* 1. Global Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MonitorPlay className="w-4 h-4 text-primary" />
                글로벌 광고 송출 전략
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={adMode} onValueChange={setAdMode} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {AD_MODES.map((mode) => (
                  <label
                    key={mode.id}
                    htmlFor={mode.id}
                    className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                      adMode === mode.id ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={mode.id} id={mode.id} className="sr-only" />
                    <div className="flex flex-col gap-1">
                      <span className={`text-sm font-medium ${adMode === mode.id ? "text-primary" : ""}`}>
                        {mode.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{mode.desc}</span>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 2. Banner Editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">인하우스 배너 등록 및 라우팅 제어</CardTitle>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> 새 배너 추가
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>배너 이미지 (URL 또는 업로드)</Label>
                <div className="flex gap-2">
                  <Input placeholder="https://example.com/banner-img.png" />
                  <Button variant="outline">파일 첨부</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                  클릭 시 이동 액션 (Routing)
                </Label>
                <RadioGroup
                  value={routeType}
                  onValueChange={setRouteType}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="internal" id="internal" />
                    <Label htmlFor="internal" className="cursor-pointer font-normal">내부 딥링크 (App 내부 화면)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="external" id="external" />
                    <Label htmlFor="external" className="cursor-pointer font-normal">외부 링크 (웹 브라우저)</Label>
                  </div>
                </RadioGroup>
                {routeType === "internal" ? (
                  <Select defaultValue="popup">
                    <SelectTrigger>
                      <SelectValue placeholder="이동할 화면 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popup">선택: [이벤트 팝업] 띄우기</SelectItem>
                      <SelectItem value="home">이동: 홈 (Home)</SelectItem>
                      <SelectItem value="budget">이동: 가계부 등록 탭 (Budget)</SelectItem>
                      <SelectItem value="profile">이동: 프로필 설정 창</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input type="url" placeholder="https://..." />
                )}
              </div>

              <Separator />

              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>노출 위치 (Mockup 확인용)</Label>
                  <Select value={mockupLocation} onValueChange={setMockupLocation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_top">홈(대시보드) 최상단 배너</SelectItem>
                      <SelectItem value="feed_middle">스페이스 피드(게시글) 사이</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>저장 및 송출</Button>
              </div>

              <div className="mt-4 rounded-md border p-8 text-center text-sm text-muted-foreground">
                현재 활성화된 배너가 없습니다.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Mockup Simulator */}
        <div>
          <Card className="relative overflow-hidden h-[620px] flex flex-col items-center bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-950 dark:to-emerald-950">
            <p className="absolute top-4 left-4 text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> 라이브 앱 시뮬레이터
            </p>

            {/* Phone Frame */}
            <div className="w-[280px] h-[560px] mt-12 bg-white dark:bg-zinc-900 border-[8px] border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col">
              <div className="absolute top-0 w-full h-6 flex justify-center z-20">
                <div className="w-1/3 h-full bg-zinc-800 rounded-b-xl" />
              </div>
              <div className="pt-10 pb-3 px-4 border-b flex justify-between items-center bg-white dark:bg-zinc-900 z-10 shadow-sm">
                <span className="font-bold text-lg text-emerald-500">Gleaum</span>
                <div className="w-6 h-6 rounded-full bg-zinc-200" />
              </div>
              <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 flex flex-col pb-16">
                {mockupLocation === "home_top" && (
                  <div className="w-full aspect-[21/9] bg-gradient-to-r from-blue-500 to-emerald-400 flex items-center justify-center p-4 relative cursor-pointer group">
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">봄맞이 프리미엄 프로모션!</p>
                      <p className="text-white/80 text-[10px]">
                        클릭 시 {routeType === "internal" ? "앱 내 화면으로 이동" : "외부 브라우저 오픈"}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                )}
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-24 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border p-3 flex flex-col justify-center">
                    <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                    <div className="h-2.5 w-1/2 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                  </div>
                  <div className="h-28 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border p-3">
                    <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded mb-3" />
                    <div className="flex gap-2">
                      <div className="h-12 flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded" />
                      <div className="h-12 flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded" />
                    </div>
                  </div>
                  {mockupLocation === "feed_middle" && (
                    <div className="w-full h-20 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-400 flex items-center justify-center relative cursor-pointer group shadow-sm">
                      <div className="text-center">
                        <p className="text-white font-bold text-xs">피드 사이 배너 광고 영역</p>
                        <p className="text-white/80 text-[10px]">Action: {routeType}</p>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors" />
                    </div>
                  )}
                  <div className="h-24 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border p-3" />
                </div>
              </div>
              <div className="absolute bottom-0 w-full h-16 bg-white dark:bg-zinc-900 border-t flex items-center justify-around px-2 z-20">
                <div className="w-6 h-6 rounded bg-emerald-500" />
                <div className="w-6 h-6 rounded bg-zinc-200" />
                <div className="w-6 h-6 rounded bg-zinc-200" />
                <div className="w-6 h-6 rounded bg-zinc-200" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
