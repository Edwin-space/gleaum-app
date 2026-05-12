"use client";

import { useState } from "react";
import { Send, Variable, Smartphone, Globe, Mail, MessageSquare, LayoutGrid } from "lucide-react";
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

const channels = [
  { id: "app_push", label: "앱 푸시", icon: Smartphone },
  { id: "web_push", label: "웹 푸시", icon: Globe },
  { id: "in_app", label: "인앱 팝업", icon: LayoutGrid },
  { id: "sms", label: "SMS/알림톡", icon: MessageSquare },
  { id: "email", label: "이메일", icon: Mail },
];

const VARIABLES = ["{{user_name}}", "{{space_name}}", "{{last_expense}}"];

export default function CampaignsPage() {
  const [activeChannel, setActiveChannel] = useState("app_push");
  const [title, setTitle] = useState("{{user_name}}님, 오늘 어떤 일정이 있나요?");
  const [body, setBody] = useState("글리움에 접속해서 {{space_name}} 공간의 새로운 소식을 확인해 보세요!");

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">캠페인 생성기</h1>
        <p className="text-muted-foreground mt-1">타겟 유저를 설정하고 최적의 채널로 메시지를 발송하세요.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* 1. Audience */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. 타겟 세그먼트(Audience) 설정</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>발송 조건</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="조건 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 회원 발송</SelectItem>
                    <SelectItem value="no_onboarding">DB 쿼리: 온보딩 미완료자</SelectItem>
                    <SelectItem value="ga4_inactive">GA4 연동: 장기 미접속자</SelectItem>
                    <SelectItem value="space_member">특정 Space 멤버 전체</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>예상 도달 유저</Label>
                <div className="h-10 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-semibold text-primary">
                  약 1,420 명
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Channel & Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. 메시지 채널 & 내용 구성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={activeChannel} onValueChange={setActiveChannel}>
                <TabsList className="w-full">
                  {channels.map((ch) => (
                    <TabsTrigger key={ch.id} value={ch.id} className="flex-1 gap-1.5">
                      <ch.icon className="w-4 h-4" />
                      {ch.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>메시지 제목</Label>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <Variable className="w-3 h-3" /> 변수 삽입
                  </Button>
                </div>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>메시지 본문</Label>
                  <div className="flex gap-1.5">
                    {VARIABLES.map((v) => (
                      <Badge
                        key={v}
                        variant="secondary"
                        className="cursor-pointer text-xs hover:bg-accent"
                        onClick={() => setBody((prev) => prev + v)}
                      >
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>딥링크 / 랜딩 URL</Label>
                <Input type="text" placeholder="https://www.gleaum.com/space/123" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="flex flex-col gap-4">
          <Card className="relative overflow-hidden h-[420px] flex flex-col items-center bg-gradient-to-b from-muted to-background">
            <p className="absolute top-4 left-4 text-xs font-semibold text-muted-foreground">
              미리보기 (초개인화 렌더링)
            </p>
            {/* Phone Frame */}
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
                  <p className="text-sm font-bold leading-tight">
                    {title.replace("{{user_name}}", "에드윈")}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {body.replace("{{space_name}}", "글리움 본진").replace("{{last_expense}}", "식비")}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Button className="w-full h-12 gap-2" size="lg">
            <Send className="w-4 h-4" />
            캠페인 발송 시작
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            발송 전 실제 대상자 수를 확인하세요.
          </p>
        </div>
      </div>
    </main>
  );
}
