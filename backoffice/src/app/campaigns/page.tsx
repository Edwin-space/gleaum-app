"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Send, Variable, Smartphone, Globe, Mail,
  MessageSquare, LayoutGrid, Loader2, CheckCircle2, AlertCircle, RefreshCw, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ── 채널 정의 ─────────────────────────────────────────── */
const channels = [
  { id: "app_push",  label: "앱 푸시",    icon: Smartphone,    supported: true  },
  { id: "web_push",  label: "웹 푸시",    icon: Globe,         supported: false },
  { id: "in_app",    label: "인앱 팝업",  icon: LayoutGrid,    supported: false },
  { id: "sms",       label: "SMS/알림톡", icon: MessageSquare, supported: false },
  { id: "email",     label: "이메일",     icon: Mail,          supported: false },
];

const VARIABLES = ["{{user_name}}", "{{space_name}}", "{{last_expense}}"];

type SendResult = { sent: number; failed: number; total: number; message: string };
type Status     = "idle" | "counting" | "sending" | "success" | "error";

/* ── 컴포넌트 ──────────────────────────────────────────── */
export default function CampaignsPage() {
  const [activeChannel, setActiveChannel] = useState("app_push");
  const [segment,       setSegment]       = useState("all");
  const [title,         setTitle]         = useState("{{user_name}}님, 오늘 어떤 일정이 있나요?");
  const [body,          setBody]          = useState("글리움에 접속해서 {{space_name}} 공간의 새로운 소식을 확인해 보세요!");
  const [deeplink,      setDeeplink]      = useState("");

  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [status,      setStatus]      = useState<Status>("idle");
  const [result,      setResult]      = useState<SendResult | null>(null);
  const [errorMsg,    setErrorMsg]    = useState("");

  /* 세그먼트·채널 변경 시 대상 수 자동 조회 */
  const fetchCount = useCallback(async () => {
    setTargetCount(null);
    setStatus("counting");
    try {
      const params = new URLSearchParams({ segment, channel: activeChannel });
      const res  = await fetch(`/api/campaigns/count?${params}`);
      const data = await res.json() as { count: number };
      setTargetCount(data.count ?? 0);
    } catch {
      setTargetCount(0);
    } finally {
      setStatus((prev) => (prev === "counting" ? "idle" : prev));
    }
  }, [segment, activeChannel]);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  const insertVariable = (v: string) => setBody((prev) => prev + v);

  /* 발송 실행 */
  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setErrorMsg("제목과 본문을 입력해주세요.");
      setStatus("error");
      return;
    }
    if (activeChannel !== "app_push") {
      setErrorMsg("현재 앱 푸시만 지원됩니다. 다른 채널은 준비 중입니다.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setResult(null);
    setErrorMsg("");
    try {
      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment, channel: activeChannel, title, body, url: deeplink || undefined }),
      });
      const data = await res.json() as SendResult & { error?: string };
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "발송 중 오류가 발생했습니다.");
        setStatus("error");
        return;
      }
      setResult(data);
      setStatus("success");
      fetchCount();
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStatus("error");
    }
  };

  const isSending = status === "sending";

  return (
    <main className="p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">캠페인 생성기</h1>
          <p className="text-muted-foreground mt-1">
            타겟 유저를 설정하고 최적의 채널로 메시지를 발송하세요.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/campaigns/history">
            <History className="h-4 w-4 mr-1.5" /> 발송 이력
          </Link>
        </Button>
      </header>

      {/* 발송 결과 배너 */}
      {status === "success" && result && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="font-semibold">발송 완료</p>
            <p className="mt-0.5">
              총 {result.total}명 중 <strong>{result.sent}명 성공</strong>
              {result.failed > 0 && `, ${result.failed}명 실패`}
            </p>
          </div>
          <Link
            href="/campaigns/history"
            className="text-xs underline text-green-700 hover:text-green-900 whitespace-nowrap"
          >
            이력 확인 →
          </Link>
          <button className="text-green-600 hover:text-green-800 ml-2" onClick={() => setStatus("idle")}>✕</button>
        </div>
      )}
      {status === "error" && errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">오류</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
          <button className="ml-auto" onClick={() => setStatus("idle")}>✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* 1. Audience */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. 타겟 세그먼트(Audience) 설정</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>발송 조건</Label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger><SelectValue placeholder="조건 선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 회원 발송</SelectItem>
                    <SelectItem value="no_onboarding">온보딩 미완료자</SelectItem>
                    <SelectItem value="space_member">특정 Space 멤버</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>예상 도달 유저</Label>
                  <button onClick={fetchCount} title="새로고침" className="text-muted-foreground hover:text-foreground transition-colors">
                    <RefreshCw className={`h-3.5 w-3.5 ${status === "counting" ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <div className="h-10 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-semibold text-primary">
                  {status === "counting" ? (
                    <span className="text-muted-foreground flex items-center gap-1.5 text-sm font-normal">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> 조회 중...
                    </span>
                  ) : targetCount === null ? (
                    <span className="text-muted-foreground font-normal">—</span>
                  ) : (
                    `약 ${targetCount.toLocaleString("ko-KR")} 명`
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Channel & Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. 메시지 채널 &amp; 내용 구성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={activeChannel} onValueChange={setActiveChannel}>
                <TabsList className="w-full">
                  {channels.map((ch) => (
                    <TabsTrigger
                      key={ch.id}
                      value={ch.id}
                      className="flex-1 gap-1.5"
                      disabled={!ch.supported}
                    >
                      <ch.icon className="w-4 h-4" />
                      {ch.label}
                      {!ch.supported && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-0.5">준비중</Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>메시지 제목</Label>
                  <Button
                    variant="ghost" size="sm" type="button"
                    className="h-7 text-xs gap-1"
                    onClick={() => setTitle((prev) => prev + "{{user_name}}")}
                  >
                    <Variable className="w-3 h-3" /> 변수 삽입
                  </Button>
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="알림 제목을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>메시지 본문</Label>
                  <div className="flex gap-1.5">
                    {VARIABLES.map((v) => (
                      <Badge
                        key={v} variant="secondary"
                        className="cursor-pointer text-xs hover:bg-accent"
                        onClick={() => insertVariable(v)}
                      >
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Textarea
                  rows={4} value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="resize-none"
                  placeholder="알림 본문을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label>딥링크 / 랜딩 URL <span className="text-muted-foreground text-xs">(선택)</span></Label>
                <Input
                  type="text"
                  placeholder="https://www.gleaum.com/home"
                  value={deeplink}
                  onChange={(e) => setDeeplink(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="flex flex-col gap-4">
          {/* Phone Preview */}
          <Card className="relative overflow-hidden h-[420px] flex flex-col items-center bg-gradient-to-b from-muted to-background">
            <p className="absolute top-4 left-4 text-xs font-semibold text-muted-foreground">미리보기</p>
            <div className="w-[260px] h-[360px] mt-10 bg-background border-[8px] border-black rounded-[2.5rem] shadow-xl overflow-hidden relative flex flex-col">
              <div className="absolute top-0 w-full h-5 flex justify-center z-10">
                <div className="w-1/3 h-full bg-black rounded-b-xl" />
              </div>
              <div className="flex-1 bg-muted/30 p-3 pt-8">
                <div className="bg-background/90 backdrop-blur border shadow-sm rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center text-[8px] text-primary-foreground font-bold">G</div>
                    <span className="text-xs font-semibold">Gleaum</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">지금</span>
                  </div>
                  <p className="text-sm font-bold leading-tight line-clamp-2">
                    {title.replace(/\{\{user_name\}\}/g, "에드윈")}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {body
                      .replace(/\{\{user_name\}\}/g, "에드윈")
                      .replace(/\{\{space_name\}\}/g, "글리움 본진")
                      .replace(/\{\{last_expense\}\}/g, "식비")}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 발송 요약 */}
          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <p className="flex justify-between">
              <span>채널</span>
              <span className="font-medium text-foreground">
                {channels.find((c) => c.id === activeChannel)?.label}
              </span>
            </p>
            <p className="flex justify-between">
              <span>세그먼트</span>
              <span className="font-medium text-foreground">
                {segment === "all" ? "전체" : segment === "no_onboarding" ? "온보딩 미완료" : "Space 멤버"}
              </span>
            </p>
            <p className="flex justify-between">
              <span>예상 발송</span>
              <span className="font-semibold text-primary">
                {targetCount !== null ? `${targetCount.toLocaleString("ko-KR")}명` : "—"}
              </span>
            </p>
          </div>

          <Button
            className="w-full h-12 gap-2" size="lg"
            onClick={handleSend}
            disabled={isSending || targetCount === 0 || status === "counting"}
          >
            {isSending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 발송 중...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                캠페인 발송 시작
                {targetCount !== null && targetCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {targetCount.toLocaleString("ko-KR")}명
                  </Badge>
                )}
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            발송 전 미리보기를 반드시 확인하세요.
          </p>
        </div>
      </div>
    </main>
  );
}
