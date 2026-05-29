'use client';

/**
 * 백오피스 광고 관리 페이지
 * /admin/ads
 */

import { useState, useEffect, useCallback } from 'react';
import type { AdWithStats } from '@/types/ads';

// ── 슬롯 레이블 매핑 ──────────────────────────────────────────
const SLOT_LABELS: Record<string, string> = {
  'home-feed-inline':  '홈피드 인라인',
  'schedule-list-top': '일정 목록 상단',
  'budget-list-top':   '가계부 목록 상단',
};

const SLOT_IDS = Object.keys(SLOT_LABELS);

// ── 빈 폼 ────────────────────────────────────────────────────
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
};

type FormState = typeof emptyForm;

export default function AdsAdminPage() {
  const [ads, setAds]         = useState<AdWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [form, setForm]       = useState<FormState>(emptyForm);
  const [saving, setSaving]   = useState(false);
  const [filter, setFilter]   = useState<string>('all');

  // ── 목록 로드 ────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/ads');
    if (res.ok) setAds(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── 저장 ─────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      priority:  Number(form.priority),
      ends_at:   form.ends_at || null,
      image_url: form.image_url || null,
      description: form.description || null,
      advertiser:  form.advertiser || null,
    };

    const res = editId
      ? await fetch(`/api/admin/ads/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/admin/ads',            { method: 'POST',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

    if (res.ok) {
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      await load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert('저장 실패: ' + (err.error ?? '알 수 없는 오류'));
    }
    setSaving(false);
  };

  // ── 삭제 ─────────────────────────────────────────────────────
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 광고를 삭제하시겠습니까?`)) return;
    await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' });
    await load();
  };

  // ── 활성/비활성 토글 ─────────────────────────────────────────
  const handleToggle = async (ad: AdWithStats) => {
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !ad.is_active }),
    });
    await load();
  };

  // ── 수정 열기 ────────────────────────────────────────────────
  const handleEdit = (ad: AdWithStats) => {
    setForm({
      slot_id:     ad.slot_id,
      title:       ad.title,
      description: ad.description ?? '',
      image_url:   ad.image_url ?? '',
      link_url:    ad.link_url,
      cta_text:    ad.cta_text,
      priority:    ad.priority,
      starts_at:   ad.starts_at.slice(0, 16),
      ends_at:     ad.ends_at?.slice(0, 16) ?? '',
      advertiser:  ad.advertiser ?? '',
      is_active:   ad.is_active,
    });
    setEditId(ad.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredAds = filter === 'all' ? ads : ads.filter(a => a.slot_id === filter);

  return (
    <div>
      {/* ── 페이지 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1B2E', margin: 0 }}>광고 관리</h1>
          <p style={{ fontSize: 13, color: '#6E6E66', margin: '4px 0 0' }}>
            총 {ads.length}개 · 활성 {ads.filter(a => a.is_active).length}개
          </p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(v => !v); }}
          style={{
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: '#0084CC', color: 'white', fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {showForm ? '취소' : '+ 광고 등록'}
        </button>
      </div>

      {/* ── 등록/수정 폼 ── */}
      {showForm && (
        <form onSubmit={handleSave} style={{
          background: 'white', borderRadius: 20, padding: 28,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          marginBottom: 32,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px',
        }}>
          <h2 style={{ gridColumn: '1/-1', margin: 0, fontSize: 18, fontWeight: 800, color: '#1A1B2E' }}>
            {editId ? '광고 수정' : '광고 등록'}
          </h2>

          <Field label="광고 슬롯">
            <select value={form.slot_id} onChange={e => setForm(f => ({ ...f, slot_id: e.target.value }))} required>
              {SLOT_IDS.map(s => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
            </select>
          </Field>

          <Field label="광고주 (선택)">
            <input placeholder="예) 삼성전자" value={form.advertiser}
              onChange={e => setForm(f => ({ ...f, advertiser: e.target.value }))} />
          </Field>

          <Field label="광고 제목 *" full>
            <input placeholder="짧고 명확하게 (30자 이내)" required maxLength={50}
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </Field>

          <Field label="설명 (선택)" full>
            <input placeholder="이미지 없을 때 보조 텍스트로 사용"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </Field>

          <Field label="이미지 URL (선택)" full>
            <input type="url" placeholder="https://..." value={form.image_url}
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
          </Field>

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

          <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              등록 즉시 활성화
            </label>
          </div>

          <div style={{ gridColumn: '1/-1', display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving} style={{
              padding: '12px 28px', borderRadius: 12, border: 'none',
              background: saving ? '#ccc' : '#0084CC', color: 'white',
              fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? '저장 중...' : (editId ? '수정 완료' : '등록')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={{
              padding: '12px 20px', borderRadius: 12,
              border: '1px solid #E0E0E0', background: 'white',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              취소
            </button>
          </div>
        </form>
      )}

      {/* ── 슬롯 필터 탭 ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['all', '전체'], ...SLOT_IDS.map(id => [id, SLOT_LABELS[id]])].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '6px 14px', borderRadius: 999, border: 'none',
            background: filter === val ? '#1A1B2E' : '#F2F2F7',
            color: filter === val ? 'white' : '#1A1B2E',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* ── 광고 목록 ── */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#8E8E93' }}>로딩 중...</div>
      ) : filteredAds.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 20, padding: 48,
          textAlign: 'center', color: '#8E8E93', boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}>
          등록된 광고가 없습니다
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredAds.map(ad => (
            <AdRow key={ad.id} ad={ad} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label style={{ gridColumn: full ? '1/-1' : undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#6E6E66', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <style>{`
        form input, form select {
          height: 40px; padding: 0 12px; border-radius: 10px;
          border: 1.5px solid #E0E0E0; font-size: 14px;
          outline: none; width: 100%; box-sizing: border-box;
          background: #FAFAFA;
        }
        form input:focus, form select:focus { border-color: #0084CC; background: white; }
      `}</style>
      {children}
    </label>
  );
}

function AdRow({
  ad, onEdit, onDelete, onToggle,
}: {
  ad: AdWithStats;
  onEdit: (ad: AdWithStats) => void;
  onDelete: (id: string, title: string) => void;
  onToggle: (ad: AdWithStats) => void;
}) {
  const isExpired = ad.ends_at && new Date(ad.ends_at) < new Date();

  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '16px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 16,
      opacity: isExpired ? 0.6 : 1,
    }}>
      {/* 활성 토글 */}
      <button onClick={() => onToggle(ad)} title={ad.is_active ? '비활성화' : '활성화'} style={{
        width: 36, height: 20, borderRadius: 10,
        background: ad.is_active ? '#34C759' : '#E0E0E0',
        border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
        transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 2,
          left: ad.is_active ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </button>

      {/* 슬롯 뱃지 */}
      <span style={{
        padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
        background: '#EEF2FF', color: '#4B5EFC', flexShrink: 0,
      }}>
        {SLOT_LABELS[ad.slot_id] ?? ad.slot_id}
      </span>

      {/* 제목 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1A1B2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ad.title}
        </p>
        {ad.advertiser && (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8E8E93' }}>{ad.advertiser}</p>
        )}
      </div>

      {/* 통계 */}
      <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
        <Stat label="노출" value={ad.impressions.toLocaleString()} />
        <Stat label="클릭" value={ad.clicks.toLocaleString()} />
        <Stat label="CTR" value={`${ad.ctr_pct}%`} highlight={ad.ctr_pct > 2} />
      </div>

      {/* 기간 */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: 11, color: '#8E8E93' }}>
          {new Date(ad.starts_at).toLocaleDateString('ko')}
          {ad.ends_at ? ` ~ ${new Date(ad.ends_at).toLocaleDateString('ko')}` : ' ~ 무기한'}
        </p>
        {isExpired && (
          <span style={{ fontSize: 10, color: '#FF3B30', fontWeight: 700 }}>만료됨</span>
        )}
      </div>

      {/* 액션 */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <ActionBtn onClick={() => onEdit(ad)} color="#0084CC">수정</ActionBtn>
        <ActionBtn onClick={() => onDelete(ad.id, ad.title)} color="#FF3B30">삭제</ActionBtn>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: highlight ? '#34C759' : '#1A1B2E' }}>{value}</p>
      <p style={{ margin: 0, fontSize: 10, color: '#8E8E93', fontWeight: 600 }}>{label}</p>
    </div>
  );
}

function ActionBtn({ onClick, color, children }: { onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${color}`,
      background: 'white', color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}
