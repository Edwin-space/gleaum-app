'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePreferences } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { HomeLayoutPreference, OnboardingPreferences } from '@/types';

const layouts: Array<{ key: HomeLayoutPreference; title: string; desc: string; icon: string }> = [
  { key: 'balanced',       title: '밸런스',     desc: '모든 기능을 균형 있게',  icon: '🎨' },
  { key: 'calendar_first', title: '캘린더 중심', desc: '일정 확인이 최우선',    icon: '🗓️' },
  { key: 'routine_first',  title: '루틴 중심',  desc: '습관 형성에 최적화',    icon: '⚡' },
  { key: 'expense_first',  title: '지출 중심',  desc: '자금 흐름 한눈에',      icon: '💎' },
  { key: 'space_first',    title: '공간 중심',  desc: '그룹 소식을 우선',      icon: '👥' },
];

// ── 레이아웃 미리보기 모의 화면 ────────────────────────────────────────────────
function LayoutPreviewMock({ layoutKey }: { layoutKey: HomeLayoutPreference }) {
  const Block = ({ h, bg, label, cols }: { h: number; bg: string; label: string; cols?: number }) => (
    <div style={{
      height: `${h}px`, borderRadius: '6px', background: bg,
      display: cols ? 'grid' : 'flex',
      alignItems: 'center', justifyContent: 'center',
      gridTemplateColumns: cols ? `repeat(${cols}, 1fr)` : undefined,
      gap: cols ? '4px' : undefined,
    } as React.CSSProperties}>
      {cols
        ? Array.from({ length: cols }).map((_, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '4px', height: '100%' }} />
          ))
        : <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.80)', letterSpacing: '0.2px' }}>{label}</span>
      }
    </div>
  );

  const sectionsByLayout: Record<HomeLayoutPreference, React.ReactNode> = {
    balanced: (
      <>
        <Block h={28} bg="#1A1B2E" label="오늘 요약" cols={3} />
        <Block h={52} bg="#0084CC" label="캘린더" />
        <Block h={22} bg="rgba(12,201,181,0.18)" label="일정 1" />
        <Block h={22} bg="rgba(12,201,181,0.12)" label="일정 2" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <Block h={28} bg="rgba(0,0,0,0.06)" label="루틴" />
          <Block h={28} bg="rgba(0,0,0,0.06)" label="지출" />
        </div>
      </>
    ),
    calendar_first: (
      <>
        <Block h={76} bg="#0084CC" label="캘린더" />
        <Block h={22} bg="rgba(12,201,181,0.18)" label="오늘 일정 1" />
        <Block h={22} bg="rgba(12,201,181,0.14)" label="오늘 일정 2" />
        <Block h={22} bg="rgba(12,201,181,0.10)" label="오늘 일정 3" />
        <Block h={18} bg="rgba(0,0,0,0.05)" label="빠른 액션" cols={2} />
      </>
    ),
    routine_first: (
      <>
        <Block h={20} bg="rgba(12,201,181,0.20)" label="루틴 1 ✓" />
        <Block h={20} bg="rgba(12,201,181,0.15)" label="루틴 2 ✓" />
        <Block h={20} bg="rgba(12,201,181,0.10)" label="루틴 3" />
        <Block h={24} bg="#1A1B2E" label="오늘 요약" cols={3} />
        <Block h={42} bg="rgba(0,132,204,0.15)" label="캘린더" />
        <Block h={18} bg="rgba(0,0,0,0.05)" label="일정" />
      </>
    ),
    expense_first: (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <Block h={52} bg="rgba(245,158,11,0.25)" label="이번 달 지출" />
          <Block h={52} bg="rgba(245,158,11,0.15)" label="예산 잔액" />
        </div>
        <Block h={20} bg="rgba(245,158,11,0.12)" label="지출 내역 1" />
        <Block h={20} bg="rgba(245,158,11,0.08)" label="지출 내역 2" />
        <Block h={24} bg="#1A1B2E" label="오늘 요약" cols={3} />
        <Block h={32} bg="rgba(0,132,204,0.12)" label="캘린더" />
      </>
    ),
    space_first: (
      <>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '0' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', background: `rgba(0,132,204,${0.4 - i * 0.08})`, flexShrink: 0 }} />
          ))}
          <div style={{ flex: 1, background: 'rgba(0,132,204,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#0084CC' }}>공간 멤버</span>
          </div>
        </div>
        <Block h={38} bg="rgba(0,132,204,0.14)" label="공간 최신 소식" />
        <Block h={22} bg="rgba(0,132,204,0.10)" label="공간 일정" />
        <Block h={24} bg="#1A1B2E" label="오늘 요약" cols={3} />
        <Block h={32} bg="rgba(0,132,204,0.10)" label="캘린더" />
      </>
    ),
  };

  return (
    <div style={{
      padding: '10px', background: '#F5F5F7', borderRadius: '14px 14px 0 0',
      display: 'flex', flexDirection: 'column', gap: '5px',
    }}>
      <div style={{
        height: '28px', borderRadius: '8px', background: '#1A1B2E',
        display: 'flex', alignItems: 'center', padding: '0 10px', gap: '6px', marginBottom: '2px',
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(0,132,204,0.4)' }} />
      </div>
      {sectionsByLayout[layoutKey]}
    </div>
  );
}

export default function HomeLayoutSettingsPage() {
  const router = useRouter();
  const { profile } = useCurrentUser();
  const preferences = (profile?.preferences ?? {}) as Partial<OnboardingPreferences>;

  const [selected, setSelected] = useState<HomeLayoutPreference>(
    (preferences.homeLayout as HomeLayoutPreference) ?? 'balanced'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preferences.homeLayout) {
      setSelected(preferences.homeLayout as HomeLayoutPreference);
    }
  }, [preferences.homeLayout]);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const children = Array.from(el.children) as HTMLElement[];
    let closest = 0;
    let minDist = Infinity;
    children.forEach((child, i) => {
      const dist = Math.abs(child.offsetLeft + child.offsetWidth / 2 - center);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    if (layouts[closest]) setSelected(layouts[closest].key);
  }, []);

  const scrollTo = useCallback((key: HomeLayoutPreference) => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = layouts.findIndex(l => l.key === key);
    if (idx === -1) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const offset = child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2;
    el.scrollTo({ left: offset, behavior: 'smooth' });
    setSelected(key);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const ok = await updatePreferences({ homeLayout: selected });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => router.back(), 800);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAFD', paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}>
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        padding: 'calc(env(safe-area-inset-top) + 6px) 20px 10px',
        background: 'rgba(250,250,253,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'white', border: '1px solid rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>홈 레이아웃</h1>
      </header>

      <div style={{ padding: '20px 24px 0' }}>
        <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: 600, margin: '0 0 20px', lineHeight: 1.5 }}>
          스와이프하여 홈 화면 구성을 미리 확인하고 선택하세요
        </p>

        {/* 캐러셀 */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            gap: '12px',
            padding: '4px 32px',
            margin: '0 -24px',
          } as React.CSSProperties}
        >
          {layouts.map((item) => {
            const active = selected === item.key;
            return (
              <div
                key={item.key}
                onClick={() => scrollTo(item.key)}
                style={{
                  scrollSnapAlign: 'center',
                  flexShrink: 0,
                  width: 'calc(100% - 64px)',
                  borderRadius: '24px',
                  border: `2px solid ${active ? '#0084CC' : 'rgba(0,0,0,0.07)'}`,
                  background: 'white',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: active ? '0 6px 24px rgba(0,132,204,0.18)' : '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'border-color 0.18s, box-shadow 0.18s',
                }}
              >
                <LayoutPreviewMock layoutKey={item.key} />
                <div style={{ padding: '14px 18px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 2px' }}>{item.title}</p>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(0,0,0,0.45)', margin: 0 }}>{item.desc}</p>
                  </div>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    border: `2px solid ${active ? '#0084CC' : 'rgba(0,0,0,0.15)'}`,
                    background: active ? '#0084CC' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 닷 인디케이터 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
          {layouts.map((item) => (
            <button
              key={item.key}
              onClick={() => scrollTo(item.key)}
              style={{
                width: selected === item.key ? '20px' : '6px',
                height: '6px', borderRadius: '999px', padding: 0, border: 'none',
                background: selected === item.key ? '#0084CC' : '#E5E5EA',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#0084CC', margin: '12px 0 0' }}>
          {layouts.find(l => l.key === selected)?.icon} {layouts.find(l => l.key === selected)?.title} 선택됨
        </p>
      </div>

      {/* 저장 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '16px 24px calc(env(safe-area-inset-bottom) + 16px)',
        background: 'rgba(250,250,253,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            width: '100%', height: '52px', borderRadius: '18px', border: 'none',
            background: saved
              ? 'linear-gradient(135deg, #2EE895, #0CC9B5)'
              : 'linear-gradient(135deg, #0CC9B5, #0084CC)',
            color: 'white', fontSize: '16px', fontWeight: 800,
            cursor: saving || saved ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
            boxShadow: '0 4px 16px rgba(0,132,204,0.30)',
            transition: 'all 0.2s',
          }}
        >
          {saved ? '저장됨 ✓' : saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
