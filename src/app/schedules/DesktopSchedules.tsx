'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScheduleCard } from '@/components/ui/Card';
import type { Schedule, ScheduleType } from '@/types';

interface DesktopSchedulesProps {
  loading: boolean;
  grouped: Record<string, Schedule[]>;
  filter: 'all' | ScheduleType;
  setFilter: (f: 'all' | ScheduleType) => void;
  search: string;
  setSearch: (s: string) => void;
  filters: { key: 'all' | ScheduleType; label: string }[];
}

export function DesktopSchedules({
  loading,
  grouped,
  filter,
  setFilter,
  search,
  setSearch,
  filters,
}: DesktopSchedulesProps) {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);

  const totalCount = Object.values(grouped).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── 페이지 헤더 ── */}
      <div style={{
        position: 'relative',
        padding: '36px 44px',
        borderRadius: '28px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
        color: 'white',
        marginBottom: '28px',
        boxShadow: '0 14px 44px rgba(26,27,46,0.2)',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(0,132,204,0.18)', filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '30%', width: '150px', height: '150px', background: 'rgba(12,201,181,0.12)', filter: 'blur(48px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', margin: '0 0 6px' }}>일정</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: 0 }}>
              모든 일정을 한 눈에 확인하고 관리하세요
            </p>
          </div>

          {/* 검색 + 추가 버튼 */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, maxWidth: '640px' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '12px',
              padding: '0 18px', height: '50px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: `1px solid ${searchFocused ? 'rgba(12,201,181,0.6)' : 'rgba(255,255,255,0.15)'}`,
              backdropFilter: 'blur(10px)',
              transition: 'border-color 0.2s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="일정 검색..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '15px', fontWeight: 600, color: 'white',
                }}
              />
            </div>

            <Link
              href="/schedules/new"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '0 22px', height: '50px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #0CC9B5, #0084CC)',
                color: 'white', textDecoration: 'none',
                fontSize: '14px', fontWeight: 800, whiteSpace: 'nowrap',
                boxShadow: '0 8px 20px rgba(0,132,204,0.4)', transition: 'all 0.2s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              일정 추가
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2-컬럼 레이아웃 ── */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* 왼쪽: 필터 패널 */}
        <div style={{ width: '220px', flexShrink: 0, position: 'sticky', top: '0' }}>
          <div style={{
            background: 'var(--theme-surface)', borderRadius: '24px', padding: '20px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#C7C7CC', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px 4px' }}>필터</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                    background: filter === f.key ? 'rgba(0,132,204,0.08)' : 'transparent',
                    color: filter === f.key ? '#0084CC' : '#6E6E66',
                    fontWeight: filter === f.key ? 800 : 600, fontSize: '14px',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                >
                  <span>{f.label}</span>
                  {filter === f.key && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0084CC' }} />}
                </button>
              ))}
            </div>

            <div style={{
              marginTop: '20px', padding: '20px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
              color: 'white', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '70px', height: '70px', background: 'rgba(0,132,204,0.2)', filter: 'blur(20px)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 6px' }}>💡 Smart Tip</p>
                <p style={{ fontSize: '11px', lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                  공유 일정은 Space 멤버 모두가 볼 수 있고, 개인 일정은 나에게만 보여요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 일정 그리드 */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(0,132,204,0.15)', borderTopColor: '#0084CC', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : Object.keys(grouped).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {Object.entries(grouped).map(([date, items]) => (
                <section key={date}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--theme-text)', margin: 0, letterSpacing: '-0.3px' }}>{date}</h2>
                    <div style={{ flex: 1, height: '1px', background: '#F0F0F0' }} />
                    <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#F5F5F9', fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)' }}>
                      {items.length}개
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                    {items.map(s => (
                      <ScheduleCard
                        key={s.id}
                        schedule={s}
                        onClick={() => router.push(`/schedules/${s.id}`)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '100px 20px', gap: '20px',
              background: 'var(--theme-surface)', borderRadius: '28px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
            }}>
              <div style={{ width: '88px', height: '88px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,132,204,0.05)', fontSize: '40px' }}>
                🗓️
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 8px' }}>일정이 비어있습니다</p>
                <p style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', fontWeight: 600, margin: 0 }}>새로운 계획을 세워보세요</p>
              </div>
              <Link
                href="/schedules/new"
                style={{
                  marginTop: '8px', padding: '14px 32px', borderRadius: '18px',
                  fontSize: '15px', fontWeight: 800, color: 'white', textDecoration: 'none',
                  background: 'linear-gradient(135deg, #0CC9B5, #0084CC)',
                  boxShadow: '0 8px 24px rgba(0,132,204,0.3)',
                }}
              >
                일정 추가하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
