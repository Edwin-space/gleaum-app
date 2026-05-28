'use client';

/**
 * 글리움 — 관리자 대시보드
 *
 * 탭 구성:
 *   1. Remote Config  — 기능 플래그 실시간 ON/OFF
 *   2. FCM 발송       — 전체/특정 사용자 푸시 알림 브로드캐스트
 *   3. 빌드 현황      — App Distribution 최신 릴리즈 목록
 *   4. 테스터 관리    — 내부 테스터 추가/제거
 */

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_CONFIG } from '@/lib/remote-config';

// ── 색상 ────────────────────────────────────────────────────────────
const C = {
  blue:    '#0084CC',
  teal:    '#0CC9B5',
  green:   '#2EE895',
  red:     '#EF4444',
  navy:    '#1A1B2E',
  gray:    '#8E8E93',
  bgLight: '#F5F5F7',
  border:  'rgba(0,0,0,0.08)',
};

type Tab = 'config' | 'fcm' | 'builds' | 'testers';

// ── Remote Config 타입 ───────────────────────────────────────────────
type RCEntry = { value: string; source: 'remote' | 'default' };
type RCConfig = Record<string, RCEntry>;

// ── App Distribution 타입 ────────────────────────────────────────────
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

// ── 공통 카드 ────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: '24px',
      border: `1px solid ${C.border}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── 버튼 ─────────────────────────────────────────────────────────────
function Btn({
  children, onClick, disabled, variant = 'primary', style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
  style?: React.CSSProperties;
}) {
  const bg =
    variant === 'primary' ? C.blue :
    variant === 'danger'  ? C.red  : C.bgLight;
  const color = variant === 'ghost' ? C.navy : 'white';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px', borderRadius: 12, border: 'none',
        background: disabled ? C.bgLight : bg,
        color: disabled ? C.gray : color,
        fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 48, height: 28, borderRadius: 14, cursor: 'pointer',
        background: checked ? C.blue : '#E5E5EA',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3,
        left: checked ? 23 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Remote Config 탭
// ══════════════════════════════════════════════════════════════════════
function RemoteConfigTab() {
  const [config, setConfig] = useState<RCConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/remote-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config ?? {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const update = async (key: string, value: string) => {
    setSaving(key);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/remote-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { [key]: value } }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, [key]: { value, source: 'remote' } }));
        setMsg({ text: `✅ ${key} 업데이트 완료`, ok: true });
      } else {
        setMsg({ text: `❌ ${data.error ?? '업데이트 실패'}`, ok: false });
      }
    } finally {
      setSaving(null);
    }
  };

  const booleanKeys: (keyof typeof DEFAULT_CONFIG)[] = [
    'weekly_digest_enabled', 'overdue_badge_enabled', 'budget_dday_enabled',
    'onboarding_new_flow', 'maintenance_mode',
  ];
  const numberKeys: (keyof typeof DEFAULT_CONFIG)[] = ['max_expense_categories'];
  const stringKeys: (keyof typeof DEFAULT_CONFIG)[] = ['maintenance_message'];

  const LABELS: Record<string, string> = {
    weekly_digest_enabled:  '주간 소비 다이제스트 알림',
    overdue_badge_enabled:  '홈 미결제 뱃지',
    budget_dday_enabled:    '가계부 D-day UI',
    onboarding_new_flow:    '새 온보딩 플로우 (A/B)',
    maintenance_mode:       '점검 모드',
    max_expense_categories: '최대 지출 카테고리 수',
    maintenance_message:    '점검 공지 메시지',
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>불러오는 중...</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: msg.ok ? 'rgba(46,232,149,0.1)' : 'rgba(239,68,68,0.1)',
          color: msg.ok ? '#15803D' : C.red, fontWeight: 600, fontSize: 14,
        }}>
          {msg.text}
        </div>
      )}

      <Card>
        <p style={{ fontSize: 13, color: C.gray, fontWeight: 600, marginBottom: 20 }}>
          변경 즉시 Firebase Remote Config에 반영됩니다. 앱은 다음 fetch 주기(최대 1시간)에 적용됩니다.
        </p>

        {/* Boolean 토글 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {booleanKeys.map((key, i) => {
            const entry = config[key];
            const isOn = entry?.value === 'true' || entry?.value === '1';
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 0',
                borderBottom: i < booleanKeys.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0 }}>
                    {LABELS[key]}
                  </p>
                  <p style={{ fontSize: 12, color: C.gray, margin: '2px 0 0', fontWeight: 500 }}>
                    {entry?.source === 'default' ? '기본값 사용 중 (Firebase 미설정)' : 'Firebase 설정값'}
                    {' — 현재: '}<strong>{isOn ? 'ON' : 'OFF'}</strong>
                  </p>
                </div>
                <Toggle
                  checked={isOn}
                  onChange={(v) => void update(key, String(v))}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Number 입력 */}
      <Card>
        {numberKeys.map((key) => {
          const entry = config[key];
          return (
            <div key={key}>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                {LABELS[key]}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  defaultValue={entry?.value ?? String(DEFAULT_CONFIG[key])}
                  min={1} max={20}
                  style={{
                    flex: 1, height: 44, padding: '0 16px', borderRadius: 12,
                    border: `1.5px solid ${C.border}`, fontSize: 16, fontWeight: 700,
                    outline: 'none',
                  }}
                  onBlur={(e) => {
                    if (e.target.value !== entry?.value) {
                      void update(key, e.target.value);
                    }
                  }}
                />
                <Btn
                  onClick={() => void update(key, entry?.value ?? String(DEFAULT_CONFIG[key]))}
                  disabled={saving === key}
                >
                  {saving === key ? '저장 중...' : '저장'}
                </Btn>
              </div>
            </div>
          );
        })}
      </Card>

      {/* String 입력 */}
      <Card>
        {stringKeys.map((key) => {
          const entry = config[key];
          return (
            <div key={key}>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                {LABELS[key]}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  defaultValue={entry?.value ?? String(DEFAULT_CONFIG[key])}
                  style={{
                    flex: 1, height: 44, padding: '0 16px', borderRadius: 12,
                    border: `1.5px solid ${C.border}`, fontSize: 14, fontWeight: 600,
                    outline: 'none',
                  }}
                  id={`input-${key}`}
                />
                <Btn
                  disabled={saving === key}
                  onClick={() => {
                    const el = document.getElementById(`input-${key}`) as HTMLInputElement;
                    if (el) void update(key, el.value);
                  }}
                >
                  {saving === key ? '저장 중...' : '저장'}
                </Btn>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// FCM 브로드캐스트 탭
// ══════════════════════════════════════════════════════════════════════
function FCMTab() {
  const [title, setTitle]   = useState('');
  const [body, setBody]     = useState('');
  const [url, setUrl]       = useState('/home');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number; failed: number } | null>(null);
  const [error, setError]   = useState('');

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }
    setSending(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() || '/home' }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setTitle(''); setBody('');
      } else {
        setError(data.error ?? '발송 실패');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <p style={{ fontSize: 13, color: C.gray, fontWeight: 600, marginBottom: 20 }}>
          FCM 토큰이 등록된 모든 사용자에게 즉시 푸시 알림을 발송합니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 6 }}>
              알림 제목 *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 글리움 업데이트 안내"
              maxLength={60}
              style={{
                width: '100%', height: 48, padding: '0 16px', borderRadius: 12,
                border: `1.5px solid ${title ? C.blue : C.border}`,
                fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 6 }}>
              알림 내용 *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="예: 새로운 기능이 추가되었습니다. 지금 확인해보세요!"
              maxLength={200}
              rows={3}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: `1.5px solid ${body ? C.blue : C.border}`,
                fontSize: 14, fontWeight: 600, outline: 'none',
                resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.navy, display: 'block', marginBottom: 6 }}>
              클릭 이동 경로 (선택)
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/home"
              style={{
                width: '100%', height: 48, padding: '0 16px', borderRadius: 12,
                border: `1.5px solid ${C.border}`,
                fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: C.red, fontSize: 13, fontWeight: 600 }}>{error}</p>
          )}

          {result && (
            <div style={{
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(46,232,149,0.1)', border: '1px solid rgba(46,232,149,0.3)',
            }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#15803D', margin: 0 }}>
                ✅ 발송 완료
              </p>
              <p style={{ fontSize: 13, color: '#166534', margin: '4px 0 0', fontWeight: 600 }}>
                성공 {result.sent}건 / 전체 {result.total}건
                {result.failed > 0 && ` (실패 ${result.failed}건)`}
              </p>
            </div>
          )}

          <Btn onClick={() => void send()} disabled={sending || !title.trim() || !body.trim()}>
            {sending ? '발송 중...' : `📣 전체 사용자에게 발송`}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 빌드 현황 탭
// ══════════════════════════════════════════════════════════════════════
function BuildsTab() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/distribution')
      .then((r) => r.json())
      .then((d) => { if (d.releases) setReleases(d.releases); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>불러오는 중...</div>
  );

  if (releases.length === 0) return (
    <Card>
      <p style={{ textAlign: 'center', color: C.gray, fontWeight: 600, padding: '20px 0' }}>
        업로드된 빌드가 없습니다.
        <br />
        <span style={{ fontSize: 13 }}>GitHub Actions 또는 distribute-android.sh로 배포하세요.</span>
      </p>
      <div style={{
        marginTop: 16, padding: '12px 16px', borderRadius: 12,
        background: '#F5F5F7', fontSize: 13, fontWeight: 600, color: C.gray,
      }}>
        <p style={{ margin: 0 }}>📌 GitHub Actions 자동 배포: main 브랜치 push 시 자동 실행</p>
        <p style={{ margin: '4px 0 0' }}>📌 수동 배포: ./scripts/distribute-android.sh "릴리즈 노트"</p>
      </div>
    </Card>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: C.gray, fontWeight: 600, margin: 0 }}>
        최근 {releases.length}개 빌드 (Android)
      </p>
      {releases.map((r, i) => (
        <Card key={r.name} style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {i === 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                  background: 'rgba(0,132,204,0.1)', color: C.blue,
                }}>
                  최신
                </span>
              )}
              <p style={{ fontSize: 16, fontWeight: 800, color: C.navy, margin: 0 }}>
                v{r.version} <span style={{ fontSize: 13, color: C.gray, fontWeight: 600 }}>({r.buildNumber})</span>
              </p>
            </div>
            {r.consoleUrl && (
              <a
                href={r.consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: C.blue, fontWeight: 700, textDecoration: 'none' }}
              >
                Firebase 콘솔 →
              </a>
            )}
          </div>
          {r.releaseNotes && (
            <p style={{ fontSize: 13, color: '#555', margin: '4px 0', fontWeight: 500 }}>
              {r.releaseNotes}
            </p>
          )}
          <p style={{ fontSize: 12, color: C.gray, margin: '4px 0 0', fontWeight: 500 }}>
            {r.createdAt ? new Date(r.createdAt).toLocaleString('ko-KR') : '—'}
          </p>
        </Card>
      ))}

      <Card style={{ background: '#F9F9FB' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>
          🚀 새 빌드 배포 방법
        </p>
        <div style={{ fontSize: 12, color: C.gray, fontWeight: 600, lineHeight: 1.8 }}>
          <p style={{ margin: 0 }}>① <strong>자동</strong>: main 브랜치에 push하면 GitHub Actions가 자동 빌드+배포</p>
          <p style={{ margin: 0 }}>② <strong>수동</strong>: <code style={{ background: '#EEE', padding: '2px 6px', borderRadius: 4 }}>./scripts/distribute-android.sh "릴리즈 노트"</code></p>
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 테스터 관리 탭
// ══════════════════════════════════════════════════════════════════════
function TestersTab() {
  const [testers, setTesters]     = useState<Tester[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading]     = useState(true);
  const [newEmail, setNewEmail]   = useState('');
  const [adding, setAdding]       = useState(false);
  const [removing, setRemoving]   = useState<string | null>(null);
  const [msg, setMsg]             = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/distribution');
      if (res.ok) {
        const data = await res.json();
        setTesters(data.testers ?? []);
        setGroupName(data.groupName ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addTester = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setMsg({ text: '올바른 이메일을 입력해주세요.', ok: false });
      return;
    }
    if (!groupName) {
      setMsg({ text: 'internal-testers 그룹을 찾을 수 없습니다.', ok: false });
      return;
    }
    setAdding(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: [email], groupName }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewEmail('');
        setMsg({ text: `✅ ${email} 추가 완료`, ok: true });
        await load();
      } else {
        setMsg({ text: `❌ ${data.error ?? '추가 실패'}`, ok: false });
      }
    } finally {
      setAdding(false);
    }
  };

  const removeTester = async (email: string) => {
    if (!groupName) return;
    setRemoving(email);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/distribution', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: [email], groupName }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: `✅ ${email} 제거 완료`, ok: true });
        await load();
      } else {
        setMsg({ text: `❌ ${data.error ?? '제거 실패'}`, ok: false });
      }
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>불러오는 중...</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: msg.ok ? 'rgba(46,232,149,0.1)' : 'rgba(239,68,68,0.1)',
          color: msg.ok ? '#15803D' : C.red, fontWeight: 600, fontSize: 14,
        }}>
          {msg.text}
        </div>
      )}

      {/* 추가 폼 */}
      <Card>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 12 }}>
          테스터 추가
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addTester()}
            placeholder="tester@example.com"
            style={{
              flex: 1, height: 48, padding: '0 16px', borderRadius: 12,
              border: `1.5px solid ${newEmail ? C.blue : C.border}`,
              fontSize: 14, fontWeight: 600, outline: 'none',
            }}
          />
          <Btn onClick={() => void addTester()} disabled={adding || !newEmail.trim()}>
            {adding ? '추가 중...' : '추가'}
          </Btn>
        </div>
        {!groupName && (
          <p style={{ fontSize: 12, color: C.red, fontWeight: 600, marginTop: 8 }}>
            ⚠️ Firebase Console에서 internal-testers 그룹을 먼저 생성해주세요.
          </p>
        )}
      </Card>

      {/* 테스터 목록 */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0 }}>
            내부 테스터 ({testers.length}명)
          </p>
        </div>

        {testers.length === 0 ? (
          <p style={{ color: C.gray, fontSize: 14, fontWeight: 600, textAlign: 'center', padding: '16px 0' }}>
            등록된 테스터가 없습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {testers.map((t, i) => (
              <div key={t.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < testers.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: 0 }}>
                  {t.email}
                </p>
                <Btn
                  variant="danger"
                  onClick={() => void removeTester(t.email)}
                  disabled={removing === t.email}
                  style={{ padding: '6px 14px', fontSize: 12 }}
                >
                  {removing === t.email ? '...' : '제거'}
                </Btn>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 메인 대시보드
// ══════════════════════════════════════════════════════════════════════
export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('config');

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'config',   label: 'Remote Config', emoji: '⚙️' },
    { id: 'fcm',      label: 'FCM 발송',      emoji: '📣' },
    { id: 'builds',   label: '빌드 현황',     emoji: '📦' },
    { id: 'testers',  label: '테스터 관리',   emoji: '👥' },
  ];

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F5F5F7',
      padding: '0 0 40px',
    }}>
      {/* 헤더 */}
      <div style={{
        background: C.navy,
        padding: '24px 24px 0',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 4px' }}>
            🛡️ 관리자 대시보드
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', fontWeight: 600 }}>
            gleaum 내부 운영 도구
          </p>

          {/* 탭 */}
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 16px', border: 'none', borderRadius: '12px 12px 0 0',
                  background: tab === t.id ? '#F5F5F7' : 'transparent',
                  color: tab === t.id ? C.navy : 'rgba(255,255,255,0.6)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 0' }}>
        {tab === 'config'  && <RemoteConfigTab />}
        {tab === 'fcm'     && <FCMTab />}
        {tab === 'builds'  && <BuildsTab />}
        {tab === 'testers' && <TestersTab />}
      </div>
    </div>
  );
}
