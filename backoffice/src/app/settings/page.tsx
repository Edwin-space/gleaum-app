"use client";

import { useState, useEffect, useCallback } from "react";
import { Key, CheckCircle2, AlertCircle, ShieldCheck, Eye, EyeOff, Sliders, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { createBrowserClient } from "@supabase/ssr";

const GA4_ENV_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";

function PasswordChangeCard() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPw.length < 8) {
      setMessage({ type: "error", text: "새 비밀번호는 8자 이상이어야 합니다." });
      return;
    }
    if (newPw !== confirmPw) {
      setMessage({ type: "error", text: "새 비밀번호가 일치하지 않습니다." });
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 현재 비밀번호 확인 (재로그인으로 검증)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setMessage({ type: "error", text: "세션이 만료되었습니다. 다시 로그인해 주세요." });
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPw,
    });
    if (signInError) {
      setMessage({ type: "error", text: "현재 비밀번호가 올바르지 않습니다." });
      setLoading(false);
      return;
    }

    // 새 비밀번호로 변경
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      setMessage({ type: "error", text: `변경 실패: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "비밀번호가 변경되었습니다." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <CardTitle className="text-base">관리자 비밀번호 변경</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pw">현재 비밀번호</Label>
            <Input
              id="current-pw"
              type="password"
              placeholder="현재 비밀번호"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="new-pw">새 비밀번호</Label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showNew ? "text" : "password"}
                placeholder="8자 이상"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-pw">새 비밀번호 확인</Label>
            <Input
              id="confirm-pw"
              type="password"
              placeholder="새 비밀번호 재입력"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {message && (
            <p className={`text-sm flex items-center gap-1.5 ${
              message.type === "success" ? "text-green-600" : "text-destructive"
            }`}>
              {message.type === "success"
                ? <CheckCircle2 className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Remote Config 편집 카드 ─────────────────────────────────────────
type RCEntry = { value: string; source: "remote" | "default" };

const RC_LABELS: Record<string, string> = {
  weekly_digest_enabled:  "주간 소비 다이제스트 알림",
  overdue_badge_enabled:  "홈 미결제 뱃지",
  budget_dday_enabled:    "가계부 D-day UI",
  onboarding_new_flow:    "새 온보딩 플로우 (A/B 테스트)",
  maintenance_mode:       "점검 모드",
  max_expense_categories: "최대 지출 카테고리 수",
  maintenance_message:    "점검 공지 메시지",
};

const BOOLEAN_KEYS = [
  "weekly_digest_enabled", "overdue_badge_enabled", "budget_dday_enabled",
  "onboarding_new_flow", "maintenance_mode",
];

function RemoteConfigCard() {
  const [config,  setConfig]  = useState<Record<string, RCEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string | null>(null);
  const [msg,     setMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/remote-config");
      if (res.ok) setConfig((await res.json()).config ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (key: string, value: string) => {
    setSaving(key);
    setMsg(null);
    try {
      const res  = await fetch("/api/remote-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: { [key]: value } }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, [key]: { value, source: "remote" } }));
        setMsg({ type: "success", text: `${RC_LABELS[key] ?? key} 업데이트 완료` });
      } else {
        setMsg({ type: "error", text: data.error ?? "업데이트 실패" });
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Sliders className="w-4 h-4 text-primary" />
        <CardTitle className="text-base">Firebase Remote Config (기능 플래그)</CardTitle>
        <Badge variant="outline" className="ml-auto text-xs">
          변경 즉시 반영 · 앱 1시간 내 적용
        </Badge>
      </CardHeader>
      <CardContent>
        {msg && (
          <div className={`mb-4 flex items-center gap-2 rounded-md p-3 text-sm ${
            msg.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-destructive/5 text-destructive"
          }`}>
            {msg.type === "success"
              ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              : <AlertCircle  className="h-4 w-4 shrink-0" />
            }
            {msg.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Firebase 연결 중...</span>
          </div>
        ) : (
          <div className="space-y-0 divide-y">
            {/* Boolean 토글 */}
            {BOOLEAN_KEYS.map((key) => {
              const entry = config[key];
              const isOn  = entry?.value === "true" || entry?.value === "1";
              return (
                <div key={key} className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-medium">{RC_LABELS[key]}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry?.source === "default" ? "기본값 (Firebase 미설정)" : "Firebase 설정값"}
                    </p>
                  </div>
                  <Switch
                    checked={isOn}
                    disabled={saving === key}
                    onCheckedChange={(v) => update(key, String(v))}
                  />
                </div>
              );
            })}

            <Separator className="my-2" />

            {/* 최대 카테고리 수 */}
            <div className="py-3.5">
              <Label className="text-sm font-medium mb-2 block">
                {RC_LABELS.max_expense_categories}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number" min={1} max={20}
                  defaultValue={config.max_expense_categories?.value ?? "7"}
                  id="rc-max-categories"
                  className="w-28"
                />
                <Button
                  variant="outline" size="sm"
                  disabled={saving === "max_expense_categories"}
                  onClick={() => {
                    const el = document.getElementById("rc-max-categories") as HTMLInputElement;
                    if (el) update("max_expense_categories", el.value);
                  }}
                >
                  {saving === "max_expense_categories"
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : "저장"}
                </Button>
              </div>
            </div>

            {/* 점검 공지 메시지 */}
            <div className="py-3.5">
              <Label className="text-sm font-medium mb-2 block">
                {RC_LABELS.maintenance_message}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  defaultValue={config.maintenance_message?.value ?? "서비스 점검 중입니다."}
                  id="rc-maintenance-msg"
                  placeholder="점검 안내 메시지"
                />
                <Button
                  variant="outline" size="sm"
                  disabled={saving === "maintenance_message"}
                  onClick={() => {
                    const el = document.getElementById("rc-maintenance-msg") as HTMLInputElement;
                    if (el) update("maintenance_message", el.value);
                  }}
                >
                  {saving === "maintenance_message"
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : "저장"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [ga4Id, setGa4Id] = useState(GA4_ENV_ID);
  const [saved, setSaved]  = useState(false);

  const handleSave = () => {
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
        {/* 비밀번호 변경 */}
        <PasswordChangeCard />

        {/* Remote Config */}
        <RemoteConfigCard />

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
