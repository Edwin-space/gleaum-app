"use client";

import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">시스템 설정</h1>
        <p className="text-muted-foreground mt-1">
          외부 통신망 API 키를 관리합니다. 광고 관련 설정은{" "}
          <span className="text-primary font-medium">광고 매니저</span> 메뉴를 이용하세요.
        </p>
      </header>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">외부 통신망 API Key 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="aligo-key">알리고 (Aligo SMS)</Label>
              <div className="flex gap-2">
                <Input id="aligo-key" type="password" defaultValue="sk_test_placeholder" />
                <Button variant="outline">검증</Button>
              </div>
              <p className="text-xs text-muted-foreground">마케팅 센터에서 SMS 발송 시 사용됩니다.</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="sendgrid-key">SendGrid (이메일)</Label>
              <div className="flex gap-2">
                <Input id="sendgrid-key" type="password" defaultValue="SG.test_placeholder" />
                <Button variant="outline">검증</Button>
              </div>
              <p className="text-xs text-muted-foreground">마케팅 센터에서 이메일 발송 시 사용됩니다.</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="ga4-id">GA4 Property ID</Label>
              <Input id="ga4-id" type="text" placeholder="예: 312345678" />
              <p className="text-xs text-muted-foreground">
                대시보드 실시간 통계 연동 시 필요합니다. (.env.local 설정이 우선 적용됩니다.)
              </p>
            </div>

            <Button className="w-full">설정 저장</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
