'use client';

/**
 * 백오피스 광고 관리 페이지 v2
 * /admin/ads
 *
 * 개선사항:
 *  - 이미지 직접 업로드 (Supabase Storage)
 *  - 실시간 광고 미리보기
 *  - 광고 복제
 *  - 플랫폼 타겟팅 (web / android / ios)
 *  - 기간별 통계 필터 (오늘 / 7일 / 30일 / 전체)
 *  - 상태별 필터 (활성 / 비활성 / 만료)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';
import type { AdWithStats } from '@/types/ads';

// ── 상수 ────────────────────────────────────────────────────────
const SLOT_LABELS: Record<string, string> = {
  'home-feed-inline':  '홈피드 인라인',
  'schedule-list-top': '일정 목록 상단',
  'budget-list-top':   '가계부 목록 상단',
};
const SLOT_IDS = Object.keys(SLOT_LABELS);

const PLATFORM_OPTIONS = [
  { value: 'web',     label: '웹',      emoji: '🌐' },
  { value: 'android', label: 'Android', emoji: '🤖' },
  { value: 'ios',     label: 'iOS',     emoji: '🍎' },
] as const;

const PERIOD_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: '7d',    label: '7일' },
  { value: '30d',   label: '30일' },
  { value: 'all',   label: '전체' },
] as const;

const STATUS_OPTIONS = [
  { value: 'all',      label: '전체' },
  { value: 'active',   label: '활성' },
  { value: 'inactive', label: '비활성' },
  { value: 'expired',  label: '만료' },
] as const;

type PeriodValue = typeof PERIOD_OPTIONS[number]['value'];
type StatusValue = typeof STATUS_OPTIONS[number]['value'];

// ── 유틸 ────────────────────────────────────────────────────────
const isExpiredAd = (ad: AdWithStats) =>
  !!ad.ends_at && new Date(ad.ends_at) < new Date();

// ── 기본 폼 ─────────────────────────────────────────────────────
const emptyForm = {
  slot_id:     'home-feed-inline',
  title:       '',
  description: '',
  image_url:   '',
  link_url:    '',
  cta_text:    '자세히 보기',
  priority:    0,
  starts_at:   new Date().toISOString().slice(0, 16),
  ends_at:     '',
  advertiser:  '',
  is_active:   true,
  platforms:   ['web', 'android', 'ios'] as string[],
};
type FormState = typeof emptyForm;

// ── 이미지 압축 + 업로드 ─────────────────────────────────────────
async function uploadAdImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string | null> {
  // 1. 브라우저에서 압축 (최대 200KB, 최대 640px 너비)
  let compressed: File;
  try {
    compressed = await imageCompression(file, {
      maxSizeMB:           0.2,   // 200KB
      maxWidthOrHeight:    640,   // 배너 최적 너비
      useWebWorker:        true,
      fileType:            'image/webp', // WebP로 변환 (최고 압축률)
      onProgress,
    });
  } catch {
    // 압축 실패 시 원본 사용
    compressed = file;
  }

  // 2. Supabase Storage 업로드
  const supabase = createClient();
  const path     = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  const { error } = await supabase.storage
    .from('ad-images')
    .upload(path, compressed, { cacheControl: '2592000', upsert: false, contentType: 'image/webp' });

  if (error) { alert('이미지 업로드 실패: ' + error.message); return null; }

  const { data } = supabase.storage.from('ad-images').getPublicUrl(path);
  return data.publicUrl;
}

// ════════════════════════════════════════════════════════════════
// 메인 페이지
// ════════════════════════════════════════════════════════════════
export default function AdsAdminPage() {
  const [ads, setAds]           = useState<AdWithStats[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState<FormState>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  // 필터
  const [period, setPeriod]           = useState<PeriodValue>('7d');
  const [slotFilter, setSlotFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusValue>('all');

  // ── 목록 로드 ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/ads?period=${period}`);
    if (res.ok) setAds(await res.json());
    setLoading(false);
  }, [period]);

  useEffect(() => { void load(); }, [load]);

  // ── 이미지 업로드 핸들러 ───────────────────────────────────────
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadPct(0);
    const url = await uploadAdImage(file, setUploadPct);
    if (url) setForm(f => ({ ...f, image_url: url }));
    setUploading(false);
    setUploadPct(0);
  };

  // ── 저장 ───────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      priority:    Number(form.priority),
      ends_at:     form.ends_at     || null,
      image_url:   form.image_url   || null,
      description: form.description || null,
      advertiser:  form.advertiser  || null,
    };

    const res = editId
      ? await fetch(`/api/admin/ads/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/admin/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      setShowForm(false); setEditId(null); setForm(emptyForm);
      await load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert('저장 실패: ' + (err.error ?? '알 수 없는 오류'));
    }
    setSaving(false);
  };

  // ── 삭제 ───────────────────────────────────────────────────────
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 광고를 삭제하시겠습니까?`)) return;
    await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' });
    await load();
  };

  // ── 활성 토글 ──────────────────────────────────────────────────
  const handleToggle = async (ad: AdWithStats) => {
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !ad.is_active }),
    });
    await load();
  };

  // ── 수정 ───────────────────────────────────────────────────────
  const handleEdit = (ad: AdWithStats) => {
    setForm({
      slot_id:     ad.slot_id,
      title:       ad.title,
      description: ad.description ?? '',
      image_url:   ad.image_url   ?? '',
      link_url:    ad.link_url,
      cta_text:    ad.cta_text,
      priority:    ad.priority,
      starts_at:   ad.starts_at.slice(0, 16),
      ends_at:     ad.ends_at?.slice(0, 16) ?? '',
      advertiser:  ad.advertiser ?? '',
      is_active:   ad.is_active,
      platforms:   ad.platforms ?? ['web', 'android', 'ios'],
    });
    setEditId(ad.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── 복제 ───────────────────────────────────────────────────────
  const handleDuplicate = (ad: AdWithStats) => {
    setForm({
      slot_id:     ad.slot_id,
      title:       ad.title + ' (복사)',
      description: ad.description ?? '',
      image_url:   ad.image_url   ?? '',
      link_url:    ad.link_url,
      cta_text:    ad.cta_text,
      priority:    ad.priority,
      starts_at:   new Date().toISOString().slice(0, 16),
      ends_at:     '',
      advertiser:  ad.advertiser ?? '',
      is_active:   false,
      platforms:   ad.platforms ?? ['web', 'android', 'ios'],
    });
    setEditId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── 필터링 ─────────────────────────────────────────────────────
  const filteredAds = ads
    .filter(a => slotFilter === 'all' || a.slot_id === slotFilter)
    .filter(a => {
      if (statusFilter === 'active')   return a.is_active && !isExpiredAd(a);
      if (statusFilter === 'inactive') return !a.is_active;
      if (statusFilter === 'expired')  return isExpiredAd(a);
      return true;
    });

  // ── 요약 통계 ──────────────────────────────────────────────────
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalClicks      = ads.reduce((s, a) => s + a.clicks, 0);
  const avgCtr           = totalImpressions > 0
    ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0;
  const expiredCount     = ads.filter(isExpiredAd).length;

  return (
    <div>
      {/* ── 페이지 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--theme-text)', margin: 0 }}>광고 관리</h1>
          <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: '4px 0 0' }}>
            총 {ads.length}개 · 활성 {ads.filter(a => a.is_active && !isExpiredAd(a)).length}개
            {expiredCount > 0 && (
              <span style={{ color: '#FF3B30', marginLeft: 8 }}>· 만료 {expiredCount}개</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* 기간 필터 */}
          <div style={{ display: 'flex', background: 'var(--theme-surface-muted)', borderRadius: 10, padding: 3, gap: 2 }}>
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <button key={value} onClick={() => setPeriod(value)} style={{
                padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
                background: period === value ? 'white' : 'transparent',
                color: period === value ? '#1A1B2E' : '#8E8E93',
                boxShadow: period === value ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>
          <button
            onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(v => !v); }}
            style={{
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: showForm ? '#F2F2F7' : '#0084CC',
              color: showForm ? '#1A1B2E' : 'white',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {showForm ? '취소' : '+ 광고 등록'}
          </button>
        </div>
      </div>

      {/* ── 요약 카드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <SummaryCard label="전체 광고" value={String(ads.length)} sub={`활성 ${ads.filter(a => a.is_active && !isExpiredAd(a)).length}개`} color="#0084CC" />
        <SummaryCard label="노출 수" value={totalImpressions.toLocaleString()} sub={`${PERIOD_OPTIONS.find(p => p.value === period)?.label} 기준`} color="#34C759" />
        <SummaryCard label="클릭 수" value={totalClicks.toLocaleString()} sub={`${PERIOD_OPTIONS.find(p => p.value === period)?.label} 기준`} color="#FF9500" />
        <SummaryCard label="평균 CTR" value={`${avgCtr}%`} sub={avgCtr > 2 ? '🔥 양호' : avgCtr > 0 ? '보통' : '데이터 없음'} color={avgCtr > 2 ? '#34C759' : '#8E8E93'} />
      </div>

      {/* ── 등록/수정 폼 ── */}
      {showForm && (
        <AdForm
          form={form} setForm={setForm}
          editId={editId} saving={saving} uploading={uploading} uploadPct={uploadPct}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
          onImageUpload={handleImageUpload}
        />
      )}

      {/* ── 필터 바 ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* 슬롯 필터 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', '전체'], ...SLOT_IDS.map(id => [id, SLOT_LABELS[id]])].map(([val, label]) => (
            <button key={val} onClick={() => setSlotFilter(val)} style={{
              padding: '6px 14px', borderRadius: 999, border: 'none',
              background: slotFilter === val ? '#1A1B2E' : '#F2F2F7',
              color: slotFilter === val ? 'white' : '#1A1B2E',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        {/* 구분선 */}
        <div style={{ width: 1, height: 20, background: '#E0E0E0' }} />

        {/* 상태 필터 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setStatusFilter(value)} style={{
              padding: '6px 14px', borderRadius: 999,
              border: `1.5px solid ${statusFilter === value ? STATUS_COLORS[value] : 'transparent'}`,
              background: statusFilter === value ? STATUS_BG[value] : '#F2F2F7',
              color: statusFilter === value ? STATUS_COLORS[value] : '#8E8E93',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── 광고 목록 ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--theme-text-subtle)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          불러오는 중...
        </div>
      ) : filteredAds.length === 0 ? (
        <div style={{
          background: 'var(--theme-surface)', borderRadius: 20, padding: 60,
          textAlign: 'center', color: 'var(--theme-text-subtle)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          조건에 맞는 광고가 없습니다
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredAds.map(ad => (
            <AdRow
              key={ad.id} ad={ad}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 상태 색상 ────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  all: '#1A1B2E', active: '#34C759', inactive: '#8E8E93', expired: '#FF3B30',
};
const STATUS_BG: Record<string, string> = {
  all: '#F2F2F7', active: '#E8FFF0', inactive: '#F2F2F7', expired: '#FFF0F0',
};

// ════════════════════════════════════════════════════════════════
// 광고 등록/수정 폼 + 미리보기
// ════════════════════════════════════════════════════════════════
function AdForm({
  form, setForm, editId, saving, uploading, uploadPct,
  onSave, onCancel, onImageUpload,
}: {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  editId: string | null;
  saving: boolean;
  uploading: boolean;
  uploadPct: number;
  onSave: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  onImageUpload: (file: File) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) void onImageUpload(file);
  };

  const togglePlatform = (val: string) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(val)
        ? f.platforms.filter(p => p !== val)
        : [...f.platforms, val],
    }));
  };

  return (
    <div style={{
      background: 'var(--theme-surface)', borderRadius: 20,
      boxShadow: '0 4px 32px rgba(0,0,0,0.1)',
      marginBottom: 32, overflow: 'hidden',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px' }}>

        {/* ── 왼쪽: 폼 ── */}
        <form onSubmit={onSave} style={{ padding: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: 'var(--theme-text)' }}>
            {editId ? '✏️ 광고 수정' : '✨ 새 광고 등록'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>

            <Field label="광고 슬롯">
              <select value={form.slot_id} onChange={e => setForm(f => ({ ...f, slot_id: e.target.value }))} required>
                {SLOT_IDS.map(s => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
              </select>
            </Field>

            <Field label="광고주">
              <input placeholder="예) 삼성전자" value={form.advertiser}
                onChange={e => setForm(f => ({ ...f, advertiser: e.target.value }))} />
            </Field>

            <Field label="광고 제목 *" full>
              <input placeholder="짧고 명확하게 (30자 이내)" required maxLength={50}
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </Field>

            <Field label="설명 (이미지 없을 때 보조 텍스트)" full>
              <input placeholder="부가 설명"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Field>

            {/* 이미지 업로드 */}
            <div style={{ gridColumn: '1/-1' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                광고 이미지
              </span>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#0084CC' : '#E0E0E0'}`,
                  borderRadius: 12, padding: '16px 20px',
                  background: dragOver ? '#F0F8FF' : '#FAFAFA',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                {uploading ? (
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#0084CC', fontWeight: 600 }}>
                        {uploadPct < 50 ? '압축 중...' : '업로드 중...'}
                      </span>
                      <span style={{ fontSize: 12, color: '#0084CC', fontWeight: 700 }}>{uploadPct}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#E0EFFF', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: 'linear-gradient(90deg, #0084CC, #34C759)',
                        width: `${uploadPct}%`, transition: 'width 0.2s ease',
                      }} />
                    </div>
                  </div>
                ) : form.image_url ? (
                  <>
                    <div style={{ width: 48, height: 32, borderRadius: 6, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--theme-text)' }}>이미지 등록됨</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--theme-text-subtle)' }}>클릭하여 변경</p>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, image_url: '' })); }}
                      style={{ marginLeft: 'auto', fontSize: 11, color: '#FF3B30', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                      제거
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🖼️</div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--theme-text-subtle)' }}>
                      클릭하거나 이미지를 드래그하여 업로드
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#C7C7CC' }}>
                      또는 아래에 URL 직접 입력
                    </p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) void onImageUpload(f); }} />
              </div>
              {/* URL 직접 입력 폴백 */}
              <input type="url" placeholder="또는 이미지 URL 직접 입력 (https://...)"
                value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                style={{ marginTop: 8, height: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 13, width: '100%', boxSizing: 'border-box', background: '#FAFAFA', outline: 'none' }} />
            </div>

            <Field label="랜딩 URL *">
              <input type="url" placeholder="https://..." required
                value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} />
            </Field>

            <Field label="CTA 버튼 텍스트">
              <input placeholder="자세히 보기" maxLength={12}
                value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} />
            </Field>

            <Field label="시작일시 *">
              <input type="datetime-local" required
                value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
            </Field>

            <Field label="종료일시 (빈 칸 = 무기한)">
              <input type="datetime-local"
                value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
            </Field>

            <Field label="우선순위 (높을수록 먼저)">
              <input type="number" min={0} max={100}
                value={form.priority} onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))} />
            </Field>

            {/* 플랫폼 타겟 */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                노출 플랫폼
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {PLATFORM_OPTIONS.map(({ value, label, emoji }) => {
                  const active = form.platforms.includes(value);
                  return (
                    <button key={value} type="button" onClick={() => togglePlatform(value)} style={{
                      padding: '6px 14px', borderRadius: 10, border: `2px solid ${active ? '#0084CC' : '#E0E0E0'}`,
                      background: active ? '#EEF8FF' : 'white',
                      color: active ? '#0084CC' : '#8E8E93',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span>{emoji}</span> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 활성화 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span style={{ fontWeight: 600 }}>등록 즉시 활성화</span>
              </label>
            </div>

            {/* 버튼 */}
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="submit" disabled={saving || uploading || form.platforms.length === 0} style={{
                padding: '12px 28px', borderRadius: 12, border: 'none',
                background: (saving || uploading || form.platforms.length === 0) ? '#C7C7CC' : '#0084CC',
                color: 'white', fontSize: 14, fontWeight: 700,
                cursor: (saving || uploading || form.platforms.length === 0) ? 'not-allowed' : 'pointer',
              }}>
                {uploading ? '이미지 업로드 중...' : saving ? '저장 중...' : editId ? '수정 완료' : '등록'}
              </button>
              <button type="button" onClick={onCancel} style={{
                padding: '12px 20px', borderRadius: 12,
                border: '1px solid #E0E0E0', background: 'var(--theme-surface)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>취소</button>
            </div>
          </div>
        </form>

        {/* ── 오른쪽: 미리보기 ── */}
        <div style={{
          borderLeft: '1px solid #F2F2F7',
          background: 'var(--theme-surface-muted)',
          padding: 28,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div>
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              실시간 미리보기
            </p>

            {/* 슬롯 크기 기준 미리보기 */}
            <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--theme-text-subtle)' }}>배너 (320 × 60)</p>
            <AdPreview form={form} width={280} height={55} />

            <p style={{ margin: '16px 0 8px', fontSize: 11, color: 'var(--theme-text-subtle)' }}>정보 요약</p>
            <div style={{ background: 'var(--theme-surface)', borderRadius: 12, padding: 14, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InfoRow label="슬롯" value={SLOT_LABELS[form.slot_id] ?? form.slot_id} />
              <InfoRow label="플랫폼" value={
                form.platforms.length === 3 ? '전체'
                : form.platforms.map(p => PLATFORM_OPTIONS.find(o => o.value === p)?.label ?? p).join(', ')
                  || '없음 (플랫폼 선택 필요)'
              } />
              <InfoRow label="우선순위" value={`${form.priority}점`} />
              <InfoRow label="상태" value={form.is_active ? '✅ 활성' : '⏸ 비활성'} />
              <InfoRow label="노출기간" value={
                form.ends_at
                  ? `${form.starts_at.slice(0, 10)} ~ ${form.ends_at.slice(0, 10)}`
                  : `${form.starts_at.slice(0, 10)} ~ 무기한`
              } />
            </div>
          </div>

          {/* 체크리스트 */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--theme-text-subtle)' }}>등록 전 체크</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <CheckItem ok={!!form.title}     label="제목 입력됨" />
              <CheckItem ok={!!form.link_url}  label="랜딩 URL 입력됨" />
              <CheckItem ok={!!form.image_url || !!form.title} label="소재 준비됨 (이미지 또는 제목)" />
              <CheckItem ok={form.platforms.length > 0} label="노출 플랫폼 선택됨" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 광고 미리보기 컴포넌트 ───────────────────────────────────────
function AdPreview({ form, width, height }: { form: typeof emptyForm; width: number; height: number }) {
  return (
    <div style={{
      width, height, borderRadius: 10, overflow: 'hidden',
      position: 'relative', background: 'var(--theme-surface-muted)', flexShrink: 0,
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    }}>
      {form.image_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 12px', gap: 8, boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #F8F9FF 0%, #EEF2FF 100%)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {form.title || '광고 제목 미리보기'}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'white',
            background: '#0084CC', borderRadius: 6, padding: '3px 8px', flexShrink: 0,
          }}>
            {form.cta_text || '자세히 보기'}
          </span>
        </div>
      )}
      <span style={{
        position: 'absolute', top: 2, right: 4,
        fontSize: 8, fontWeight: 700, color: 'rgba(0,0,0,0.3)', letterSpacing: '0.05em',
      }}>AD</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 광고 행
// ════════════════════════════════════════════════════════════════
function AdRow({
  ad, onEdit, onDelete, onToggle, onDuplicate,
}: {
  ad: AdWithStats;
  onEdit: (ad: AdWithStats) => void;
  onDelete: (id: string, title: string) => void;
  onToggle: (ad: AdWithStats) => void;
  onDuplicate: (ad: AdWithStats) => void;
}) {
  const expired = isExpiredAd(ad);

  return (
    <div style={{
      background: 'var(--theme-surface)', borderRadius: 16, padding: '14px 18px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 14,
      opacity: expired ? 0.65 : 1,
      borderLeft: `4px solid ${expired ? '#FF3B30' : ad.is_active ? '#34C759' : '#E0E0E0'}`,
    }}>
      {/* 활성 토글 */}
      <button onClick={() => onToggle(ad)} title={ad.is_active ? '비활성화' : '활성화'} style={{
        width: 36, height: 20, borderRadius: 10,
        background: ad.is_active && !expired ? '#34C759' : '#E0E0E0',
        border: 'none', cursor: expired ? 'not-allowed' : 'pointer',
        position: 'relative', flexShrink: 0, transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 2,
          left: (ad.is_active && !expired) ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: 'var(--theme-surface)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </button>

      {/* 썸네일 */}
      {ad.image_url && (
        <div style={{ width: 48, height: 32, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'var(--theme-surface-muted)' }}>
          <Image src={ad.image_url} alt={ad.title} fill style={{ objectFit: 'cover' }} sizes="48px" />
        </div>
      )}

      {/* 슬롯 뱃지 */}
      <span style={{
        padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
        background: '#EEF2FF', color: '#4B5EFC', flexShrink: 0,
      }}>
        {SLOT_LABELS[ad.slot_id] ?? ad.slot_id}
      </span>

      {/* 제목 + 광고주 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--theme-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ad.title}
          </p>
          {expired && (
            <span style={{ fontSize: 10, color: '#FF3B30', fontWeight: 700, background: '#FFF0F0', padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>
              만료
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          {ad.advertiser && (
            <p style={{ margin: 0, fontSize: 11, color: 'var(--theme-text-subtle)' }}>{ad.advertiser}</p>
          )}
          {/* 플랫폼 뱃지 */}
          <div style={{ display: 'flex', gap: 3 }}>
            {(ad.platforms ?? ['web', 'android', 'ios']).map(p => (
              <span key={p} style={{ fontSize: 9, fontWeight: 700, color: 'var(--theme-text-subtle)', background: 'var(--theme-surface-muted)', borderRadius: 4, padding: '1px 5px' }}>
                {PLATFORM_OPTIONS.find(o => o.value === p)?.emoji} {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div style={{ display: 'flex', gap: 18, flexShrink: 0 }}>
        <Stat label="노출" value={ad.impressions.toLocaleString()} />
        <Stat label="클릭" value={ad.clicks.toLocaleString()} />
        <Stat label="CTR" value={`${ad.ctr_pct}%`} highlight={ad.ctr_pct > 2} />
      </div>

      {/* 기간 */}
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 100 }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--theme-text-subtle)' }}>
          {new Date(ad.starts_at).toLocaleDateString('ko')}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--theme-text-subtle)' }}>
          {ad.ends_at ? `~ ${new Date(ad.ends_at).toLocaleDateString('ko')}` : '~ 무기한'}
        </p>
      </div>

      {/* 액션 */}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <ActionBtn onClick={() => onEdit(ad)} color="#0084CC">수정</ActionBtn>
        <ActionBtn onClick={() => onDuplicate(ad)} color="#FF9500">복제</ActionBtn>
        <ActionBtn onClick={() => onDelete(ad.id, ad.title)} color="#FF3B30">삭제</ActionBtn>
      </div>
    </div>
  );
}

// ── 유틸 컴포넌트 ────────────────────────────────────────────────

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      background: 'var(--theme-surface)', borderRadius: 16, padding: '16px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      borderTop: `3px solid ${color}`,
    }}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--theme-text-subtle)', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '6px 0 4px', fontSize: 24, fontWeight: 800, color: 'var(--theme-text)' }}>{value}</p>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--theme-text-subtle)' }}>{sub}</p>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label style={{ gridColumn: full ? '1/-1' : undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <style>{`
        form input[type="text"], form input[type="url"], form input[type="number"],
        form input[type="datetime-local"], form select {
          height: 40px; padding: 0 12px; border-radius: 10px;
          border: 1.5px solid #E0E0E0; font-size: 14px;
          outline: none; width: 100%; box-sizing: border-box; background: #FAFAFA;
        }
        form input:focus, form select:focus { border-color: #0084CC; background: white; }
      `}</style>
      {children}
    </label>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: highlight ? '#34C759' : '#1A1B2E' }}>{value}</p>
      <p style={{ margin: 0, fontSize: 10, color: 'var(--theme-text-subtle)', fontWeight: 600 }}>{label}</p>
    </div>
  );
}

function ActionBtn({ onClick, color, children }: { onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${color}`,
      background: 'var(--theme-surface)', color, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ fontSize: 14 }}>{ok ? '✅' : '⬜'}</span>
      <span style={{ color: ok ? '#1A1B2E' : '#C7C7CC', fontWeight: ok ? 600 : 400 }}>{label}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--theme-text-subtle)', fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--theme-text)', fontWeight: 700, textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}
