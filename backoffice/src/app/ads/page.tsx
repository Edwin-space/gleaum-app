"use client";

/**
 * 광고 매니저 — gleaum-backoffice
 *
 * 기능:
 *  - 광고 CRUD (등록 / 수정 / 삭제 / 활성 토글)
 *  - 이미지 업로드 (Supabase Storage + 브라우저 압축 → WebP)
 *  - 실시간 미리보기
 *  - 광고 복제
 *  - 플랫폼 타겟 (web / android / ios)
 *  - 기간별 통계 (오늘 / 7일 / 30일 / 전체)
 *  - 상태 필터 (활성 / 비활성 / 만료)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import imageCompression from "browser-image-compression";
import { createBrowserClient } from "@supabase/ssr";
import {
  MonitorPlay, Plus, Pencil, Archive, Copy,
  Globe, Smartphone, Apple, ImageIcon, X,
  TrendingUp, MousePointerClick, Eye, Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── 타입 ────────────────────────────────────────────────────────
interface Ad {
  id:            string;
  slot_id:       string;
  title:         string;
  description:   string | null;
  image_url:     string | null;
  link_url:      string;
  cta_text:      string;
  is_active:     boolean;
  priority:      number;
  starts_at:     string;
  ends_at:       string | null;
  advertiser:    string | null;
  platforms:     string[];
  created_at:    string;
  impressions:   number;
  clicks:        number;
  ctr_pct:       number;
}

// ── 기본 슬롯 (DB 로딩 전 폴백) ─────────────────────────────────
const DEFAULT_SLOT_LABELS: Record<string, string> = {
  "home-feed-inline":  "홈피드 인라인",
  "schedule-list-top": "일정 목록 상단",
  "budget-list-top":   "가계부 목록 상단",
  "save-prompt":       "저장 후 바텀시트",
  "in-app-popup":      "인앱 팝업",
};

const PLATFORM_OPTIONS = [
  { value: "web",     label: "웹",      Icon: Globe      },
  { value: "android", label: "Android", Icon: Smartphone },
  { value: "ios",     label: "iOS",     Icon: Apple      },
];

const PERIOD_OPTIONS = [
  { value: "today", label: "오늘" },
  { value: "7d",    label: "7일"  },
  { value: "30d",   label: "30일" },
  { value: "all",   label: "전체" },
] as const;
type PeriodValue = typeof PERIOD_OPTIONS[number]["value"];

const emptyForm = {
  slot_id:     "home-feed-inline",
  title:       "",
  description: "",
  image_url:   "",
  link_url:    "",
  cta_text:    "자세히 보기",
  priority:    0,
  starts_at:   new Date().toISOString().slice(0, 16),
  ends_at:     "",
  advertiser:  "",
  is_active:   true,
  platforms:   ["web", "android", "ios"] as string[],
};
type FormState = typeof emptyForm;

// ── Supabase 브라우저 클라이언트 ─────────────────────────────────
function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── 이미지 압축 + 업로드 ─────────────────────────────────────────
async function uploadAdImage(file: File, onProgress?: (p: number) => void): Promise<string | null> {
  let compressed: File;
  try {
    compressed = await imageCompression(file, {
      maxSizeMB: 0.2, maxWidthOrHeight: 640,
      useWebWorker: true, fileType: "image/webp", onProgress,
    });
  } catch { compressed = file; }

  const supabase = getBrowserClient();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const { error } = await supabase.storage
    .from("ad-images")
    .upload(path, compressed, { cacheControl: "2592000", upsert: false, contentType: "image/webp" });

  if (error) { alert("이미지 업로드 실패: " + error.message); return null; }
  const { data } = supabase.storage.from("ad-images").getPublicUrl(path);
  return data.publicUrl;
}

// ── 기간 → ISO 변환 ──────────────────────────────────────────────
function periodToFrom(period: PeriodValue): string | null {
  const now = new Date();
  if (period === "today") { now.setHours(0,0,0,0); return now.toISOString(); }
  if (period === "7d")  { now.setDate(now.getDate() - 7);  return now.toISOString(); }
  if (period === "30d") { now.setDate(now.getDate() - 30); return now.toISOString(); }
  return null;
}

// ════════════════════════════════════════════════════════════════
export default function AdsPage() {
  const [ads, setAds]           = useState<Ad[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState<FormState>(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [period, setPeriod]     = useState<PeriodValue>("7d");
  const [slotFilter, setSlotFilter]     = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── 슬롯 목록 (DB에서 동적 로드) ─────────────────────────────
  const [slotLabels, setSlotLabels] = useState<Record<string, string>>(DEFAULT_SLOT_LABELS);

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.from("ad_slots").select("id, description").then(({ data }) => {
      if (!data || data.length === 0) return;
      const labels: Record<string, string> = {};
      data.forEach((s: { id: string; description: string }) => {
        labels[s.id] = s.description;
      });
      setSlotLabels(labels);
    });
  }, []);

  // ── 데이터 로드 ───────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const supabase = getBrowserClient();
    const { data: adsData } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    const fromISO = periodToFrom(period);
    let eventsQuery = supabase.from("ad_events").select("ad_id, event");
    if (fromISO) eventsQuery = eventsQuery.gte("created_at", fromISO);
    const { data: events } = await eventsQuery;

    const statsMap = new Map<string, { impressions: number; clicks: number }>();
    for (const e of events ?? []) {
      const s = statsMap.get(e.ad_id) ?? { impressions: 0, clicks: 0 };
      if (e.event === "impression") s.impressions++;
      if (e.event === "click")      s.clicks++;
      statsMap.set(e.ad_id, s);
    }

    const result = (adsData ?? []).map((ad: Ad) => {
      const s = statsMap.get(ad.id) ?? { impressions: 0, clicks: 0 };
      return { ...ad, ...s, ctr_pct: s.impressions > 0 ? Math.round((s.clicks / s.impressions) * 10000) / 100 : 0 };
    });
    setAds(result);
    setLoading(false);
  }, [period]);

  useEffect(() => { void load(); }, [load]);

  const isExpired = (ad: Ad) => !!ad.ends_at && new Date(ad.ends_at) < new Date();

  // ── CRUD ──────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = getBrowserClient();

    // 현재 로그인 유저 ID (created_by 기록용)
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...form,
      priority:    Number(form.priority),
      ends_at:     form.ends_at     || null,
      image_url:   form.image_url   || null,
      description: form.description || null,
      advertiser:  form.advertiser  || null,
    };

    const { error } = editId
      ? await supabase.from("ads").update(payload).eq("id", editId)
      : await supabase.from("ads").insert({ ...payload, created_by: user?.id ?? null });

    if (error) { alert("저장 실패: " + error.message); }
    else { setShowForm(false); setEditId(null); setForm(emptyForm); await load(); }
    setSaving(false);
  };

  const handleArchive = async (id: string, title: string) => {
    if (!confirm(`"${title}" 광고를 보관 처리하시겠습니까? 보관된 광고는 즉시 노출되지 않습니다.`)) return;
    const supabase = getBrowserClient();
    await supabase.from("ads").update({ is_active: false, ends_at: new Date().toISOString() }).eq("id", id);
    await load();
  };

  const handleToggle = async (ad: Ad) => {
    const supabase = getBrowserClient();
    await supabase.from("ads").update({ is_active: !ad.is_active }).eq("id", ad.id);
    await load();
  };

  const handleEdit = (ad: Ad) => {
    setForm({
      slot_id: ad.slot_id, title: ad.title, description: ad.description ?? "",
      image_url: ad.image_url ?? "", link_url: ad.link_url, cta_text: ad.cta_text,
      priority: ad.priority, starts_at: ad.starts_at.slice(0, 16),
      ends_at: ad.ends_at?.slice(0, 16) ?? "", advertiser: ad.advertiser ?? "",
      is_active: ad.is_active, platforms: ad.platforms ?? ["web", "android", "ios"],
    });
    setEditId(ad.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDuplicate = (ad: Ad) => {
    setForm({
      slot_id: ad.slot_id, title: ad.title + " (복사)", description: ad.description ?? "",
      image_url: ad.image_url ?? "", link_url: ad.link_url, cta_text: ad.cta_text,
      priority: ad.priority, starts_at: new Date().toISOString().slice(0, 16),
      ends_at: "", advertiser: ad.advertiser ?? "",
      is_active: false, platforms: ad.platforms ?? ["web", "android", "ios"],
    });
    setEditId(null); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true); setUploadPct(0);
    const url = await uploadAdImage(file, setUploadPct);
    if (url) setForm(f => ({ ...f, image_url: url }));
    setUploading(false); setUploadPct(0);
  };

  // ── 필터링 ────────────────────────────────────────────────────
  const filtered = ads
    .filter(a => slotFilter === "all" || a.slot_id === slotFilter)
    .filter(a => {
      if (statusFilter === "active")   return a.is_active && !isExpired(a);
      if (statusFilter === "inactive") return !a.is_active;
      if (statusFilter === "expired")  return isExpired(a);
      return true;
    });

  // ── 요약 통계 ─────────────────────────────────────────────────
  const totalImp    = ads.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const avgCtr      = totalImp > 0 ? Math.round((totalClicks / totalImp) * 10000) / 100 : 0;
  const expiredCnt  = ads.filter(isExpired).length;

  return (
    <main className="p-8 space-y-6">

      {/* ── 헤더 ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MonitorPlay className="w-7 h-7 text-primary" /> 광고 매니저
          </h1>
          <p className="text-muted-foreground mt-1">
            자체 광고 소재를 등록하고 성과를 관리하세요.
            {expiredCnt > 0 && <span className="text-destructive ml-2">· 만료 {expiredCnt}개</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 기간 필터 */}
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <button key={value} onClick={() => setPeriod(value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  period === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >{label}</button>
            ))}
          </div>
          <Button onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(v => !v); }}
            variant={showForm ? "outline" : "default"} className="gap-2">
            <Plus className="w-4 h-4" />{showForm ? "취소" : "광고 등록"}
          </Button>
        </div>
      </div>

      {/* ── 요약 카드 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "전체 광고",  value: String(ads.length), sub: `활성 ${ads.filter(a => a.is_active && !isExpired(a)).length}개`, Icon: MonitorPlay },
          { label: "노출",       value: totalImp.toLocaleString(),    sub: `${PERIOD_OPTIONS.find(p => p.value === period)?.label} 기준`, Icon: Eye },
          { label: "클릭",       value: totalClicks.toLocaleString(), sub: `${PERIOD_OPTIONS.find(p => p.value === period)?.label} 기준`, Icon: MousePointerClick },
          { label: "평균 CTR",   value: `${avgCtr}%`, sub: avgCtr > 2 ? "🔥 양호" : "보통", Icon: Percent },
        ].map(({ label, value, sub, Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">{label}</span>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 등록/수정 폼 ── */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">{editId ? "✏️ 광고 수정" : "✨ 새 광고 등록"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 왼쪽: 폼 */}
              <form onSubmit={handleSave} className="lg:col-span-2 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>광고 슬롯</Label>
                    <Select value={form.slot_id} onValueChange={v => setForm(f => ({ ...f, slot_id: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(slotLabels).map(s => <SelectItem key={s} value={s}>{slotLabels[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>광고주</Label>
                    <Input placeholder="예) 삼성전자" value={form.advertiser}
                      onChange={e => setForm(f => ({ ...f, advertiser: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>광고 제목 *</Label>
                  <Input required maxLength={50} placeholder="짧고 명확하게 (30자 이내)"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>설명 (이미지 없을 때 보조 텍스트)</Label>
                  <Input placeholder="부가 설명" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                {/* 이미지 업로드 */}
                <ImageUploader
                  imageUrl={form.image_url} uploading={uploading} uploadPct={uploadPct}
                  onUpload={handleImageUpload}
                  onUrlChange={url => setForm(f => ({ ...f, image_url: url }))}
                  onRemove={() => setForm(f => ({ ...f, image_url: "" }))}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>랜딩 URL *</Label>
                    <Input type="url" required placeholder="https://..."
                      value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA 버튼 텍스트</Label>
                    <Input maxLength={12} placeholder="자세히 보기"
                      value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>시작일시 *</Label>
                    <input
                      type="datetime-local"
                      required
                      value={form.starts_at}
                      onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>종료일시 (빈 칸 = 무기한)</Label>
                    {/* shadcn Input이 datetime-local과 호환 불가 → 네이티브 input 사용 */}
                    <input
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>우선순위 (높을수록 먼저)</Label>
                    <Input type="number" min={0} max={100} value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>등록 즉시 활성화</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Switch checked={form.is_active}
                        onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                      <span className="text-sm text-muted-foreground">{form.is_active ? "활성" : "비활성"}</span>
                    </div>
                  </div>
                </div>

                {/* 플랫폼 타겟 */}
                <div className="space-y-2">
                  <Label>노출 플랫폼</Label>
                  <div className="flex gap-2">
                    {PLATFORM_OPTIONS.map(({ value, label, Icon }) => {
                      const active = form.platforms.includes(value);
                      return (
                        <button key={value} type="button"
                          onClick={() => setForm(f => ({
                            ...f, platforms: active
                              ? f.platforms.filter(p => p !== value)
                              : [...f.platforms, value],
                          }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
                            active ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <Icon className="w-3 h-3" />{label}
                        </button>
                      );
                    })}
                  </div>
                  {/* 플랫폼별 폴백 광고 안내 */}
                  <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">📌 하우스광고 없을 때 폴백 광고</p>
                    {form.platforms.includes("web") && (
                      <p>🌐 <span className="font-medium">웹</span> → Google AdSense 자동 노출</p>
                    )}
                    {(form.platforms.includes("android") || form.platforms.includes("ios")) && (
                      <p>📱 <span className="font-medium">앱 (Android/iOS)</span> → AdMob 자동 노출</p>
                    )}
                    {form.platforms.length === 0 && (
                      <p className="text-destructive">⚠️ 플랫폼을 하나 이상 선택해야 합니다.</p>
                    )}
                  </div>
                </div>

                <Separator />
                <div className="flex gap-3">
                  <Button type="submit" disabled={saving || uploading || form.platforms.length === 0}>
                    {uploading ? "이미지 업로드 중..." : saving ? "저장 중..." : editId ? "수정 완료" : "등록"}
                  </Button>
                  <Button type="button" variant="outline"
                    onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>
                    취소
                  </Button>
                </div>
              </form>

              {/* 오른쪽: 미리보기 */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">실시간 미리보기</p>
                  <p className="text-xs text-muted-foreground mb-2">배너 (320 × 60)</p>
                  <AdPreview form={form} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">등록 전 체크</p>
                  {[
                    { ok: !!form.title,    label: "제목 입력됨" },
                    { ok: !!form.link_url, label: "랜딩 URL 입력됨" },
                    { ok: !!form.image_url || !!form.title, label: "소재 준비됨" },
                    { ok: form.platforms.length > 0, label: "노출 플랫폼 선택됨" },
                  ].map(({ ok, label }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <span>{ok ? "✅" : "⬜"}</span>
                      <span className={ok ? "text-foreground font-medium" : "text-muted-foreground"}>{label}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-2">정보 요약</p>
                  {[
                    { label: "슬롯",     value: slotLabels[form.slot_id] ?? form.slot_id },
                    { label: "플랫폼",   value: form.platforms.length === 3 ? "전체" : form.platforms.join(", ") || "없음" },
                    { label: "우선순위", value: `${form.priority}점` },
                    { label: "상태",     value: form.is_active ? "✅ 활성" : "⏸ 비활성" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 필터 바 ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={slotFilter} onValueChange={setSlotFilter}>
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            {Object.keys(slotLabels).map(id => <TabsTrigger key={id} value={id}>{slotLabels[id]}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex gap-2">
          {[
            { value: "all",      label: "전체" },
            { value: "active",   label: "활성" },
            { value: "inactive", label: "비활성" },
            { value: "expired",  label: "만료" },
          ].map(({ value, label }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === value
                  ? "bg-foreground text-background border-foreground"
                  : "border-input text-muted-foreground hover:border-foreground/50"
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* ── 광고 목록 ── */}
      {loading ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">불러오는 중...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <MonitorPlay className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>조건에 맞는 광고가 없습니다</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(ad => (
            <AdRow key={ad.id} ad={ad} expired={isExpired(ad)}
              slotLabels={slotLabels}
              onEdit={handleEdit} onArchive={handleArchive}
              onToggle={handleToggle} onDuplicate={handleDuplicate} />
          ))}
        </div>
      )}
    </main>
  );
}

// ── 이미지 업로더 ────────────────────────────────────────────────
function ImageUploader({ imageUrl, uploading, uploadPct, onUpload, onUrlChange, onRemove }: {
  imageUrl: string; uploading: boolean; uploadPct: number;
  onUpload: (f: File) => void; onUrlChange: (u: string) => void; onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> 광고 이미지</Label>
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) onUpload(f); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${drag ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"}`}
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-primary font-medium">{uploadPct < 50 ? "압축 중..." : "업로드 중..."}</span>
              <span className="text-primary font-bold">{uploadPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
            </div>
          </div>
        ) : imageUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="w-16 h-10 object-cover rounded" />
            <div className="flex-1">
              <p className="text-sm font-medium">이미지 등록됨</p>
              <p className="text-xs text-muted-foreground">클릭하여 변경</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="text-destructive h-7 w-7"
              onClick={e => { e.stopPropagation(); onRemove(); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-2">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">클릭하거나 이미지를 드래그하여 업로드</p>
            <p className="text-xs text-muted-foreground/60 mt-1">자동 압축 → WebP 변환 (최대 200KB)</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
      </div>
      <Input type="url" placeholder="또는 이미지 URL 직접 입력 (https://...)"
        value={imageUrl} onChange={e => onUrlChange(e.target.value)} className="text-xs" />
    </div>
  );
}

// ── 광고 미리보기 ─────────────────────────────────────────────────
// 슬롯별 미리보기 형태 정의
const SLOT_PREVIEW: Record<string, { label: string; aspect: string; height: number; style: "banner" | "sheet" | "popup" }> = {
  "home-feed-inline":  { label: "홈피드 배너",     aspect: "320/60",  height: 60,  style: "banner" },
  "schedule-list-top": { label: "일정 목록 상단",  aspect: "320/60",  height: 60,  style: "banner" },
  "budget-list-top":   { label: "가계부 목록 상단",aspect: "320/60",  height: 60,  style: "banner" },
  "save-prompt":       { label: "저장 후 바텀시트", aspect: "375/200", height: 200, style: "sheet"  },
  "in-app-popup":      { label: "인앱 팝업",        aspect: "375/300", height: 300, style: "popup"  },
};

function AdPreview({ form }: { form: FormState }) {
  const meta = SLOT_PREVIEW[form.slot_id] ?? SLOT_PREVIEW["home-feed-inline"];
  const isSheet = meta.style === "sheet";
  const isPopup = meta.style === "popup";

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground font-medium">
        📍 {meta.label} 미리보기
      </p>
      {/* 바텀시트 / 팝업 형태 */}
      {(isSheet || isPopup) ? (
        <div className="w-full rounded-xl overflow-hidden relative border bg-white shadow-md"
          style={{ maxWidth: 280, minHeight: meta.height * 0.7 }}>
          {isSheet && (
            <div className="w-8 h-1 rounded-full bg-muted mx-auto mt-2 mb-1" />
          )}
          {form.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" className="w-full object-cover"
              style={{ maxHeight: 120 }} />
          ) : (
            <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4"
              style={{ minHeight: 80 }}>
              <span className="text-2xl">🖼️</span>
            </div>
          )}
          <div className="p-3 space-y-1.5">
            <p className="text-[9px] font-bold text-muted-foreground">AD</p>
            <p className="text-sm font-bold text-foreground leading-tight">
              {form.title || "광고 제목"}
            </p>
            {form.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{form.description}</p>
            )}
            <div className="w-full rounded-lg bg-primary text-white text-xs font-bold text-center py-2">
              {form.cta_text || "자세히 알아보기"}
            </div>
          </div>
        </div>
      ) : (
        /* 배너 형태 */
        <div className="w-full h-14 rounded-lg overflow-hidden relative border bg-muted" style={{ maxWidth: 320 }}>
          {form.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center px-3 gap-2 bg-gradient-to-r from-slate-50 to-blue-50">
              <span className="text-xs font-bold text-foreground flex-1 truncate">
                {form.title || "광고 제목 미리보기"}
              </span>
              <span className="text-[10px] font-bold text-white bg-primary rounded px-2 py-1 shrink-0">
                {form.cta_text || "자세히 보기"}
              </span>
            </div>
          )}
          <span className="absolute top-1 right-1 text-[8px] font-bold text-muted-foreground">AD</span>
        </div>
      )}
    </div>
  );
}

// ── 광고 행 ──────────────────────────────────────────────────────
function AdRow({ ad, expired, slotLabels, onEdit, onArchive, onToggle, onDuplicate }: {
  ad: Ad; expired: boolean;
  slotLabels: Record<string, string>;
  onEdit: (a: Ad) => void; onArchive: (id: string, title: string) => void;
  onToggle: (a: Ad) => void; onDuplicate: (a: Ad) => void;
}) {
  return (
    <Card className={`transition-opacity ${expired ? "opacity-60" : ""}`}>
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-4">
          {/* 활성 토글 */}
          <Switch checked={ad.is_active && !expired} disabled={expired}
            onCheckedChange={() => onToggle(ad)} />

          {/* 썸네일 */}
          {ad.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.image_url} alt={ad.title} className="w-14 h-9 object-cover rounded border shrink-0" />
          )}

          {/* 슬롯 + 제목 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant="secondary" className="text-xs shrink-0">{slotLabels[ad.slot_id] ?? ad.slot_id}</Badge>
              {expired && <Badge variant="destructive" className="text-xs shrink-0">만료</Badge>}
              <span className="font-semibold text-sm truncate">{ad.title}</span>
            </div>
            <div className="flex items-center gap-3">
              {ad.advertiser && <span className="text-xs text-muted-foreground">{ad.advertiser}</span>}
              <div className="flex gap-1">
                {(ad.platforms ?? ["web","android","ios"]).map(p => {
                  const opt = PLATFORM_OPTIONS.find(o => o.value === p);
                  return opt ? <opt.Icon key={p} className="w-3 h-3 text-muted-foreground" /> : null;
                })}
              </div>
            </div>
          </div>

          {/* 통계 */}
          <div className="hidden md:flex gap-5 shrink-0">
            {[
              { label: "노출", value: ad.impressions.toLocaleString() },
              { label: "클릭", value: ad.clicks.toLocaleString() },
              { label: "CTR",  value: `${ad.ctr_pct}%`, highlight: ad.ctr_pct > 2 },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="text-center">
                <p className={`text-sm font-bold ${highlight ? "text-green-600" : ""}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* 기간 */}
          <div className="hidden lg:block text-right shrink-0 min-w-24">
            <p className="text-xs text-muted-foreground">{new Date(ad.starts_at).toLocaleDateString("ko")}</p>
            <p className="text-xs text-muted-foreground">{ad.ends_at ? `~ ${new Date(ad.ends_at).toLocaleDateString("ko")}` : "~ 무기한"}</p>
          </div>

          {/* 액션 */}
          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" variant="outline" className="gap-1 h-8 px-2.5" onClick={() => onEdit(ad)}>
              <Pencil className="w-3 h-3" /><span className="text-xs">수정</span>
            </Button>
            <Button size="sm" variant="outline" className="gap-1 h-8 px-2.5 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => onDuplicate(ad)}>
              <Copy className="w-3 h-3" /><span className="text-xs">복제</span>
            </Button>
            <Button size="sm" variant="outline" className="gap-1 h-8 px-2.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => onArchive(ad.id, ad.title)}>
              <Archive className="w-3 h-3" /><span className="text-xs">보관</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
