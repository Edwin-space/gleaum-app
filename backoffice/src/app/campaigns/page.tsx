"use client";

import { useState } from "react";
import { Send, Variable, Smartphone, Globe, Mail, MessageSquare, LayoutGrid } from "lucide-react";

export default function CampaignsPage() {
  const [activeChannel, setActiveChannel] = useState("app_push");

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">캠페인 생성기</h1>
        <p className="text-muted-foreground mt-1">타겟 유저를 설정하고 최적의 채널로 메시지를 발송하세요.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Setup */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* 1. 타겟 세그먼트 설정 */}
          <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">1. 타겟 세그먼트(Audience) 설정</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">발송 조건</label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option>전체 회원 발송</option>
                  <option>GA4 연동: 특정 행동 그룹 (예: 장기 미접속)</option>
                  <option>DB 쿼리: 온보딩 미완료자</option>
                  <option>특정 Space 멤버 전체</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">예상 도달 유저</label>
                <div className="h-10 w-full rounded-md border bg-muted/50 px-3 py-2 text-sm flex items-center font-semibold text-primary">
                  약 1,420 명
                </div>
              </div>
            </div>
          </section>

          {/* 2. 채널 및 메시지 설정 */}
          <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">2. 메시지 채널 & 내용 구성</h2>
            
            {/* Channel Tabs */}
            <div className="flex space-x-1 rounded-lg bg-muted p-1 mb-6">
              {[
                { id: "app_push", label: "앱 푸시", icon: Smartphone },
                { id: "web_push", label: "웹 푸시", icon: Globe },
                { id: "in_app", label: "인앱 팝업", icon: LayoutGrid },
                { id: "sms", label: "SMS/알림톡", icon: MessageSquare },
                { id: "email", label: "이메일", icon: Mail },
              ].map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all flex-1 justify-center ${
                    activeChannel === channel.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted-foreground/10"
                  }`}
                >
                  <channel.icon className="w-4 h-4" />
                  {channel.label}
                </button>
              ))}
            </div>

            {/* Message Editor */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">메시지 제목</label>
                  <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                    <Variable className="w-3 h-3" /> 변수 삽입
                  </button>
                </div>
                <input
                  type="text"
                  defaultValue="{{user_name}}님, 오늘 어떤 일정이 있나요?"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">메시지 본문</label>
                  <div className="flex gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded cursor-pointer hover:bg-accent">&#123;&#123;space_name&#125;&#125;</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded cursor-pointer hover:bg-accent">&#123;&#123;last_expense&#125;&#125;</span>
                  </div>
                </div>
                <textarea
                  rows={4}
                  defaultValue="글리움에 접속해서 {{space_name}} 공간의 새로운 소식을 확인해 보세요!"
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">딥링크 / 랜딩 URL</label>
                <input
                  type="text"
                  placeholder="https://www.gleaum.com/space/123"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Preview & Action */}
        <div className="flex flex-col gap-6">
          {/* Device Preview Simulator */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-muted to-background">
            <div className="absolute top-4 left-4 text-sm font-semibold text-muted-foreground">
              미리보기 (초개인화 렌더링)
            </div>
            
            {/* Fake Phone Screen */}
            <div className="w-[280px] h-full mt-12 bg-background border-[8px] border-black rounded-[2.5rem] shadow-xl overflow-hidden relative flex flex-col">
              {/* Fake Notch */}
              <div className="absolute top-0 w-full h-6 flex justify-center">
                <div className="w-1/3 h-full bg-black rounded-b-xl"></div>
              </div>
              
              {/* Simulated Push UI */}
              <div className="flex-1 bg-muted/30 p-4 pt-10">
                <div className="bg-background/80 backdrop-blur-md border shadow-sm rounded-xl p-3 flex flex-col gap-1 animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center text-[8px] text-primary-foreground font-bold">G</div>
                    <span className="text-xs font-semibold">Gleaum</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">지금</span>
                  </div>
                  <p className="text-sm font-bold leading-tight">에드윈님, 오늘 어떤 일정이 있나요?</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">글리움에 접속해서 글리움 본진 공간의 새로운 소식을 확인해 보세요!</p>
                </div>
              </div>
            </div>
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-12 px-4 py-2 font-medium shadow hover:bg-primary/90 transition-colors">
            <Send className="w-4 h-4" />
            캠페인 발송 시작
          </button>
          <p className="text-xs text-center text-muted-foreground">발송 전 실제 대상자 수가 1,420명이 맞는지 확인하세요.</p>
        </div>

      </div>
    </main>
  );
}
