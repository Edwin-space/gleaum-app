"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package, Users, Plus, Trash2, RefreshCw,
  ExternalLink, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Release {
  name: string;
  version: string;
  buildNumber: string;
  releaseNotes: string;
  createdAt: string;
  consoleUrl: string;
}

interface Tester {
  name: string;
  email: string;
}

export default function ReleasesPage() {
  const [activeTab, setActiveTab] = useState<"builds" | "testers">("builds");

  const [releases,   setReleases]   = useState<Release[]>([]);
  const [testers,    setTesters]    = useState<Tester[]>([]);
  const [groupName,  setGroupName]  = useState("");
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 테스터 추가
  const [newEmail, setNewEmail] = useState("");
  const [adding,   setAdding]   = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res  = await fetch("/api/releases");
      const data = await res.json() as {
        releases?: Release[];
        testers?:  Tester[];
        groupName?: string;
        error?: string;
      };
      if (!res.ok || data.error) {
        setAlert({ type: "error", text: data.error ?? "데이터 조회 실패" });
        return;
      }
      setReleases(data.releases ?? []);
      setTesters(data.testers   ?? []);
      setGroupName(data.groupName ?? "");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTester = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      setAlert({ type: "error", text: "올바른 이메일을 입력해주세요." });
      return;
    }
    if (!groupName) {
      setAlert({ type: "error", text: "Firebase Console에서 internal-testers 그룹을 먼저 생성해주세요." });
      return;
    }
    setAdding(true);
    setAlert(null);
    try {
      const res  = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [email], groupName }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewEmail("");
        setAlert({ type: "success", text: `${email} 테스터 추가 완료` });
        await load(true);
      } else {
        setAlert({ type: "error", text: data.error ?? "추가 실패" });
      }
    } finally {
      setAdding(false);
    }
  };

  const removeTester = async (email: string) => {
    if (!groupName) return;
    setRemoving(email);
    setAlert(null);
    try {
      const res  = await fetch("/api/releases", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [email], groupName }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: "success", text: `${email} 제거 완료` });
        await load(true);
      } else {
        setAlert({ type: "error", text: data.error ?? "제거 실패" });
      }
    } finally {
      setRemoving(null);
    }
  };

  return (
    <main className="p-8">
      {/* 헤더 */}
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">릴리즈 관리</h1>
          <p className="text-muted-foreground mt-1">
            Android 빌드 현황 및 내부 테스터 관리 (Firebase App Distribution)
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </header>

      {/* 알림 배너 */}
      {alert && (
        <div className={`mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm ${
          alert.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-destructive/20 bg-destructive/5 text-destructive"
        }`}>
          {alert.type === "success"
            ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            : <AlertCircle  className="mt-0.5 h-4 w-4 shrink-0" />
          }
          <p className="flex-1">{alert.text}</p>
          <button onClick={() => setAlert(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Firebase App Distribution 연결 중...</span>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{releases.length}</p>
                  <p className="text-sm text-muted-foreground">업로드된 빌드</p>
                </div>
                {releases[0] && (
                  <Badge variant="secondary" className="ml-auto">
                    최신 v{releases[0].version}
                  </Badge>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{testers.length}</p>
                  <p className="text-sm text-muted-foreground">내부 테스터</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 탭 */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "builds" | "testers")}>
            <TabsList className="mb-6">
              <TabsTrigger value="builds"  className="gap-1.5">
                <Package className="h-4 w-4" /> 빌드 목록
              </TabsTrigger>
              <TabsTrigger value="testers" className="gap-1.5">
                <Users className="h-4 w-4" /> 테스터 관리
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 빌드 목록 탭 */}
          {activeTab === "builds" && (
            <div className="flex flex-col gap-4">
              {releases.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">업로드된 빌드가 없습니다</p>
                    <p className="text-sm mt-1">
                      main 브랜치에 push하면 GitHub Actions가 자동으로 빌드하고 배포합니다.
                    </p>
                    <div className="mt-4 text-xs bg-muted rounded-lg p-3 text-left inline-block">
                      <p className="font-mono">$ git push origin main</p>
                      <p className="font-mono">$ ./scripts/distribute-android.sh "릴리즈 노트"</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                releases.map((r, i) => (
                  <Card key={r.name}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {i === 0 && <Badge className="text-xs">최신</Badge>}
                          <CardTitle className="text-base">
                            v{r.version}
                            <span className="text-muted-foreground font-normal text-sm ml-2">
                              (빌드 {r.buildNumber})
                            </span>
                          </CardTitle>
                        </div>
                        {r.consoleUrl && (
                          <a
                            href={r.consoleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Firebase 콘솔
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {r.releaseNotes && (
                        <p className="text-sm text-muted-foreground mb-2">{r.releaseNotes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString("ko-KR") : "—"}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* 테스터 관리 탭 */}
          {activeTab === "testers" && (
            <div className="flex flex-col gap-4">
              {/* 추가 폼 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">테스터 추가</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="tester@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTester()}
                    />
                    <Button
                      onClick={addTester}
                      disabled={adding || !newEmail.trim()}
                    >
                      {adding
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><Plus className="h-4 w-4 mr-1" />추가</>
                      }
                    </Button>
                  </div>
                  {!groupName && (
                    <p className="text-xs text-destructive mt-2">
                      ⚠️ Firebase Console → App Distribution → Groups에서 &apos;internal-testers&apos; 그룹을 먼저 생성해주세요.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 테스터 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    내부 테스터 ({testers.length}명)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      등록된 테스터가 없습니다.
                    </p>
                  ) : (
                    <div className="divide-y">
                      {testers.map((t) => (
                        <div key={t.name} className="flex items-center justify-between py-3">
                          <span className="text-sm font-medium">{t.email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={removing === t.email}
                            onClick={() => removeTester(t.email)}
                          >
                            {removing === t.email
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />
                            }
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </main>
  );
}
