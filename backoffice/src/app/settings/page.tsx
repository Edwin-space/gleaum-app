"use client";

import { useState } from "react";
import { Key, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const GA4_ENV_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";

export default function SettingsPage() {
  const [ga4Id, setGa4Id] = useState(GA4_ENV_ID);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // 실제 저장 로직: Phase 5에서 DB 연동 예정
    // 현재는 .env 환경변수가 우선 적용되므로, UI 저장은 로컬 상태만 유지
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">시스템 설정</h1>
        <p className="text-muted-foreground mt-1">
          외부 통신망 API 키 및 애널리틱스 설정을 관리합니다.
        </p>
      </header>

      <div className="max-w-2xl space-y-6">
        {/* API 키 카드 */}
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
          </CardContent>
        </Card>

        {/* GA4 카드 */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
            </svg>
            <CardTitle className="text-base">Google Analytics 4 (GA4)</CardTitle>
            {GA4_ENV_ID ? (
              <Badge variant="secondary" className="ml-auto flex items-center gap-1 text-green-700 bg-green-50 border-green-200">
                <CheckCircle2 className="w-3 h-3" />
                환경변수 적용됨
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-auto flex items-center gap-1 text-muted-foreground">
                <AlertCircle className="w-3 h-3" />
                미설정
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ga4-id">GA4 Measurement ID</Label>
              <Input
                id="ga4-id"
                type="text"
                placeholder="G-XXXXXXXXXX"
                value={ga4Id}
                onChange={(e) => !GA4_ENV_ID && setGa4Id(e.target.value)}
                readOnly={!!GA4_ENV_ID}
                className={GA4_ENV_ID ? "bg-muted cursor-not-allowed" : ""}
              />
              {GA4_ENV_ID ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <code className="font-mono">NEXT_PUBLIC_GA4_MEASUREMENT_ID</code> 환경변수로 설정됨 —
                  페이지뷰 추적이 활성화되어 있습니다.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Vercel 환경변수 <code className="font-mono">NEXT_PUBLIC_GA4_MEASUREMENT_ID</code>를
                  설정하면 자동으로 활성화됩니다. 환경변수 설정이 수동 입력보다 우선합니다.
                </p>
              )}
            </div>

            {!GA4_ENV_ID && (
              <>
                <Separator />
                <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">GA4 연동 방법</p>
                  <p>1. Google Analytics → 관리 → 데이터 스트림 → 스트림 선택</p>
                  <p>2. 측정 ID 복사 (형식: G-XXXXXXXXXX)</p>
                  <p>3. Vercel 프로젝트 → Settings → Environment Variables</p>
                  <p>4. <code className="font-mono">NEXT_PUBLIC_GA4_MEASUREMENT_ID</code> 추가 후 재배포</p>
                </div>
                <Button className="w-full" onClick={handleSave} disabled={!ga4Id}>
                  {saved ? "저장됨 ✓" : "설정 저장"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
