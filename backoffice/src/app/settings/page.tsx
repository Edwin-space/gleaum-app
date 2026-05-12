"use client";

import { Settings, Key } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">시스템 설정</h1>
        <p className="text-muted-foreground mt-1">글리움 서비스의 전역 통신망 및 API 키를 관리합니다. (광고 설정은 광고 매니저 메뉴로 이동되었습니다.)</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        {/* External API Keys Setup */}
        <section className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col h-fit">
          <div className="p-6 border-b flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">외부 통신망 API Key 관리</h2>
          </div>
          <div className="p-6 flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">알리고 (Aligo SMS)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  defaultValue="sk_test_1234567890"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button className="h-10 px-4 rounded-md border text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap">검증</button>
              </div>
              <p className="text-[10px] text-muted-foreground">마케팅 센터에서 SMS 발송 시 사용됩니다.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">SendGrid (이메일)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  defaultValue="SG.test_key_abcde"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button className="h-10 px-4 rounded-md border text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap">검증</button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">GA4 Property ID</label>
              <input
                type="text"
                placeholder="예: 312345678"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground">대시보드 실시간 통계 연동 시 필요합니다. (.env.local 설정이 우선됨)</p>
            </div>

            <button className="mt-4 w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              설정 저장
            </button>

          </div>
        </section>
      </div>
    </main>
  );
}
