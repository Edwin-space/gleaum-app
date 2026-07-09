'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BG      = '#08080E';
const BLUE    = '#0084CC';
const TEAL    = '#0CC9B5';
const GREEN   = '#2EE895';
const CARD_BG = 'rgba(255,255,255,0.04)';
const CARD_BD = 'rgba(255,255,255,0.08)';
const TEXT1   = '#FFFFFF';
const TEXT2   = 'rgba(255,255,255,0.6)';
const GRAD    = `linear-gradient(135deg, ${BLUE}, ${TEAL}, ${GREEN})`;
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gleaum.app';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function soon() {
  toast('준비중입니다', {
    description: '곧 서비스될 예정입니다.',
    icon: '🚀',
  });
}

// ─── Store Badge Components ────────────────────────────────────────────────────
function AppStoreBadge({ small }: { small?: boolean }) {
  return (
    <button
      onClick={soon}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '12px',
        padding: small ? '8px 18px' : '10px 22px',
        borderRadius: '14px', background: '#000',
        border: '1.5px solid rgba(255,255,255,0.2)', cursor: 'pointer',
        transition: 'opacity 0.2s', height: small ? '56px' : '66px',
        minWidth: small ? '170px' : '200px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      {/* Apple logo */}
      <svg width={small ? 22 : 26} height={small ? 27 : 32} viewBox="0 0 26 32" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.33 17.04c-.04-3.88 3.17-5.75 3.32-5.85-1.81-2.65-4.63-3.01-5.62-3.05-2.38-.24-4.67 1.41-5.88 1.41-1.22 0-3.08-1.38-5.07-1.34-2.59.04-5 1.51-6.33 3.82-2.72 4.72-1.55 11.69 1.94 15.51 1.64 2.37 3.58 5.02 6.13 4.93 2.47-.1 3.41-1.59 6.41-1.59s3.85 1.59 6.47 1.54c2.66-.04 4.34-2.4 5.96-4.78 1.89-2.73 2.66-5.39 2.7-5.53-2.52-.97-4.37-3.9-4.03-6.57zM17.16 5.35C18.39 3.84 19.23 1.76 19 -.18c-1.75.07-3.87 1.17-5.12 2.63-1.12 1.3-2.1 3.39-1.84 5.37 1.95.15 3.94-.95 5.12-2.47z"/>
      </svg>
      <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
        <div style={{ fontSize: small ? '9px' : '10px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>App Store에서</div>
        <div style={{ fontSize: small ? '15px' : '17px', fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>다운로드하기</div>
      </div>
    </button>
  );
}

function GooglePlayBadge({ small }: { small?: boolean }) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Google Play에서 글리움 Android 앱 다운로드"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '12px',
        padding: small ? '8px 18px' : '10px 22px',
        borderRadius: '14px', background: '#000',
        border: '1.5px solid rgba(255,255,255,0.2)', cursor: 'pointer',
        transition: 'opacity 0.2s', height: small ? '56px' : '66px',
        minWidth: small ? '170px' : '200px',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      {/* Google Play logo */}
      <svg width={small ? 22 : 26} height={small ? 24 : 28} viewBox="0 0 26 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.5 0C.67.46.13 1.34.13 2.43v23.14c0 1.09.54 1.97 1.37 2.43l.13.08 12.96-12.96v-.28L1.63-.08 1.5 0z" fill="#4285F4"/>
        <path d="M18.93 17.28l-4.35-4.28v-.54l4.35-4.28.1.06 5.15 2.93c1.47.84 1.47 2.2 0 3.04l-5.15 2.93-.1.14z" fill="#FBBC04"/>
        <path d="M19.03 17.14L14.58 13 1.5 26.07c.48.51 1.27.57 2.17.06l15.36-8.99z" fill="#34A853"/>
        <path d="M19.03 10.86L3.67.93C2.77.42 1.98.48 1.5.99L14.58 14l4.45-3.14z" fill="#EA4335"/>
      </svg>
      <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
        <div style={{ fontSize: small ? '9px' : '10px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>Google Play에서</div>
        <div style={{ fontSize: small ? '15px' : '17px', fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>다운로드하기</div>
      </div>
    </a>
  );
}

// ─── Phone Mockup ──────────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div style={{ position: 'relative', width: '320px', flexShrink: 0 }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', inset: '-60px',
        background: `radial-gradient(ellipse, ${BLUE}18, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      {/* Frame */}
      <div style={{
        borderRadius: '46px', background: '#0C0C12', padding: '10px',
        boxShadow: `0 48px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.04)`,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ borderRadius: '38px', overflow: 'hidden', background: '#0D1117' }}>
          {/* Status bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 24px 8px', background: '#0D1117',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: TEXT1 }}>9:41</span>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <rect x="0" y="5" width="2.5" height="7" rx="1" fill="white" opacity="0.4"/>
                <rect x="4" y="3" width="2.5" height="9" rx="1" fill="white" opacity="0.6"/>
                <rect x="8" y="1" width="2.5" height="11" rx="1" fill="white" opacity="0.8"/>
                <rect x="12" y="0" width="2.5" height="12" rx="1" fill="white"/>
              </svg>
              <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
                <rect x="0.5" y="0.5" width="19" height="11" rx="2" stroke="white" opacity="0.35"/>
                <rect x="20" y="3.5" width="1.5" height="5" rx="0.75" fill="white" opacity="0.35"/>
                <rect x="2" y="2" width="14" height="8" rx="1" fill="white"/>
              </svg>
            </div>
          </div>

          {/* App header */}
          <div style={{
            padding: '10px 18px 8px', background: '#0D1117',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GleaumLogoImg size={26} />
              <GleaumBI variant="white" width={68} />
            </div>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: `${BLUE}20`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '15px',
            }}>👤</div>
          </div>

          {/* Mini calendar */}
          <div style={{ padding: '8px 14px 10px' }}>
            <div style={{
              borderRadius: '16px', padding: '14px',
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${CARD_BD}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: TEXT1 }}>2026년 5월</span>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: `${BLUE}25`, color: BLUE }}>오늘</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                {['일','월','화','수','목','금','토'].map((d) => (
                  <span key={d} style={{ fontSize: '9px', fontWeight: 700, color: TEXT2 }}>{d}</span>
                ))}
                {[...Array(14)].map((_, i) => {
                  const d = i + 1;
                  const isToday = d === 15;
                  const hasEvent = [3, 7, 10, 15].includes(d);
                  return (
                    <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: isToday ? 800 : 500,
                        width: '22px', height: '22px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%',
                        background: isToday ? GRAD : 'transparent',
                        color: isToday ? 'white' : TEXT1,
                      }}>{d}</span>
                      {hasEvent && !isToday && (
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: TEAL }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Events */}
          <div style={{ padding: '0 14px 22px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {[
              { emoji: '📅', title: '팀 스프린트 리뷰', time: '오전 10:00', color: BLUE },
              { emoji: '💑', title: '연인과 저녁 약속', time: '오후 7:00', color: '#FF6B9D' },
              { emoji: '💳', title: '넷플릭스 구독료', time: '자동이체', color: TEAL },
            ].map((item) => (
              <div key={item.title} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${CARD_BD}`,
              }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '9px',
                  background: `${item.color}20`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '13px', flexShrink: 0,
                }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: TEXT1, margin: 0 }}>{item.title}</p>
                  <p style={{ fontSize: '9px', color: TEXT2, margin: 0 }}>{item.time}</p>
                </div>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Home indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        <div style={{ width: '120px', height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.18)' }} />
      </div>
    </div>
  );
}

// ─── Dashboard Mockup ──────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${CARD_BD}`,
      borderRadius: '24px', padding: '28px',
      boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '11px', color: TEXT2, margin: '0 0 4px' }}>2026년 5월</p>
          <p style={{ fontSize: '17px', fontWeight: 800, color: TEXT1, margin: 0 }}>오늘의 일상</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[{ tag: '개인', color: BLUE }, { tag: '연인', color: '#FF6B9D' }, { tag: '가족', color: TEAL }].map(({ tag, color }) => (
            <span key={tag} style={{
              fontSize: '10px', fontWeight: 600, padding: '3px 10px',
              borderRadius: '99px', background: `${color}20`, color,
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '16px' }}>
        {['일','월','화','수','목','금','토'].map((d) => (
          <span key={d} style={{ fontSize: '9px', fontWeight: 700, color: TEXT2, textAlign: 'center', padding: '4px 0' }}>{d}</span>
        ))}
        {[...Array(31)].map((_, i) => {
          const d = i + 1;
          const isToday = d === 15;
          const events = [3, 7, 10, 15, 20, 24, 28];
          return (
            <div key={d} style={{ textAlign: 'center' }}>
              <span style={{
                fontSize: '11px', fontWeight: isToday ? 800 : 400,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '26px', height: '26px', borderRadius: '50%',
                background: isToday ? GRAD : events.includes(d) ? `${BLUE}15` : 'transparent',
                color: isToday ? 'white' : events.includes(d) ? BLUE : TEXT1,
              }}>{d}</span>
            </div>
          );
        })}
      </div>

      {/* Event list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '16px' }}>
        {[
          { dot: BLUE, time: '10:00', title: '팀 스프린트 리뷰', tag: '개인' },
          { dot: '#FF6B9D', time: '19:00', title: '연인과 저녁 데이트', tag: '연인' },
          { dot: TEAL, time: '자동', title: '정기구독 결제 알림', tag: '지출' },
        ].map((ev) => (
          <div key={ev.title} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 12px', borderRadius: '11px',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${CARD_BD}`,
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: ev.dot, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: TEXT2, minWidth: '32px' }}>{ev.time}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: TEXT1, flex: 1 }}>{ev.title}</span>
            <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '99px', background: `${ev.dot}20`, color: ev.dot }}>{ev.tag}</span>
          </div>
        ))}
      </div>

      {/* Expense bar */}
      <div style={{
        padding: '14px 18px', borderRadius: '14px',
        background: `linear-gradient(135deg, ${BLUE}15, ${TEAL}10)`,
        border: `1px solid ${BLUE}20`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: '10px', color: TEXT2, margin: '0 0 3px' }}>이번 달 지출</p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: TEXT1, margin: 0 }}>₩284,500</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', color: GREEN, margin: '0 0 3px' }}>↓ 전월 대비</p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: GREEN, margin: 0 }}>-12%</p>
        </div>
      </div>
    </div>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
const SECTION_ALT = { background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${CARD_BD}`, borderBottom: `1px solid ${CARD_BD}` };

// ─── Main Component ────────────────────────────────────────────────────────────
export function PcLandingPage() {
  return (
    <div
      className="landing-fullscreen"
      style={{ background: BG, minHeight: '100dvh', position: 'relative', color: TEXT1, fontFamily: 'var(--font-body)' }}
    >
      {/* ── Dark mesh blobs ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-200px', left: '-100px', width: '700px', height: '700px', borderRadius: '50%', background: `radial-gradient(circle, ${BLUE}12, transparent 70%)`, filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${TEAL}08, transparent 70%)`, filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '30%', width: '800px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${GREEN}06, transparent 70%)`, filter: 'blur(100px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ═══════════════════════════════════════════════════════════════
            NAV
        ═══════════════════════════════════════════════════════════════ */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(8,8,14,0.88)', backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 64px', height: '72px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GleaumLogoImg size={32} />
            <GleaumBI variant="white" width={88} />
          </div>

          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            {([
              { label: '서비스 소개', fn: soon },
              { label: '기능', fn: soon },
              { label: '다운로드', href: '/download' },
            ] as const).map((item) => (
              'fn' in item ? (
                <button key={item.label} onClick={item.fn}
                  style={{ background: 'none', border: 'none', color: TEXT2, fontSize: '15px', fontWeight: 500, cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = TEXT1; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = TEXT2; }}
                >{item.label}</button>
              ) : (
                <Link key={item.label} href={item.href}
                  style={{ color: TEXT2, fontSize: '15px', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = TEXT1; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = TEXT2; }}
                >{item.label}</Link>
              )
            ))}
          </div>

          {/* CTA */}
          <Link href="/login" style={{
            padding: '10px 28px', borderRadius: '999px', fontWeight: 700,
            fontSize: '14px', background: TEXT1, color: BG,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            transition: 'opacity 0.2s',
          }}>
            시작하기
          </Link>
        </nav>

        {/* ═══════════════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{
          padding: '100px 80px 120px',
          maxWidth: '1440px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '80px', alignItems: 'center',
        }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {/* Badge pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 18px', borderRadius: '999px',
              background: `${BLUE}15`, border: `1px solid ${BLUE}30`,
              width: 'fit-content',
            }}>
              <span style={{ color: BLUE, fontSize: '13px' }}>✦</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: BLUE }}>나, 그리고 연인/가족의 일상 네트워크</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(44px, 4.8vw, 72px)', fontWeight: 800,
              lineHeight: 1.1, letterSpacing: '-2.5px', margin: 0,
              fontFamily: 'var(--font-display)',
            }}>
              나, 그리고<br />
              연인/가족의<br />
              <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                일상 네트워크
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: '18px', lineHeight: 1.75, color: TEXT2, margin: 0, maxWidth: '440px' }}>
              일정부터 지출까지, 내 삶의 모든 것을 연결하는<br />스마트 라이프 플랫폼
            </p>

            {/* Store badges */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>

            {/* Web CTA */}
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: 600, color: TEXT2, textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT1; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT2; }}
            >
              <span>또는 웹에서 무료로 시작하기</span>
              <span>→</span>
            </Link>
          </div>

          {/* Right: Phone */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PhoneMockup />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 — Connected life
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '120px 80px', maxWidth: '1440px', margin: '0 auto' }}>
          {/* Feature pills */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '64px', justifyContent: 'center' }}>
            {[
              { icon: '📅', label: '스마트 일정' },
              { icon: '💳', label: '지출 관리' },
              { icon: '👥', label: '공간 공유' },
              { icon: '🔔', label: '스마트 알림' },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 22px', borderRadius: '999px',
                background: CARD_BG, border: `1px solid ${CARD_BD}`,
                fontSize: '14px', fontWeight: 600, color: TEXT2,
              }}>
                <span>{icon}</span> {label}
              </div>
            ))}
          </div>

          {/* Text + Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(30px, 3vw, 48px)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-1.5px' }}>
                일정부터 지출까지<br />
                <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>연결되는 일상 네트워크</span>
              </h2>
              <p style={{ fontSize: '17px', lineHeight: 1.8, color: TEXT2, margin: 0 }}>
                개인 일정부터 공유 일정, 자동 지출 추적까지<br />하나의 앱으로 모두 관리하세요.
              </p>
            </div>
            <DashboardMockup />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2 — Sharing
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '120px 80px', ...SECTION_ALT }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            {/* Calendar visual */}
            <div style={{
              background: CARD_BG, border: `1px solid ${CARD_BD}`,
              borderRadius: '24px', padding: '32px',
              boxShadow: `0 40px 80px rgba(0,0,0,0.35)`,
            }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', color: TEXT2, margin: '0 0 4px' }}>공유 캘린더</p>
                <p style={{ fontSize: '20px', fontWeight: 800, color: TEXT1, margin: 0 }}>2026년 5월</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '10px', textAlign: 'center' }}>
                {['일','월','화','수','목','금','토'].map(d => (
                  <span key={d} style={{ fontSize: '10px', fontWeight: 700, color: TEXT2 }}>{d}</span>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
                {[...Array(31)].map((_, i) => {
                  const d = i + 1;
                  const isToday = d === 15;
                  const myEv = [5, 12, 15, 22, 26].includes(d);
                  const sharedEv = [8, 15, 19, 27].includes(d);
                  return (
                    <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: isToday ? 800 : 400,
                        width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%',
                        background: isToday ? GRAD : 'transparent',
                        color: isToday ? 'white' : TEXT1,
                      }}>{d}</span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {myEv && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: BLUE }} />}
                        {sharedEv && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#FF6B9D' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${CARD_BD}` }}>
                {[
                  { color: BLUE, label: '내 일정' },
                  { color: '#FF6B9D', label: '연인 공유' },
                  { color: TEAL, label: '가족 공유' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '12px', color: TEXT2 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Text */}
            <div>
              <h2 style={{ fontSize: 'clamp(30px, 3vw, 48px)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-1.5px' }}>
                함께 공유하고<br />
                <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>혼자도 완벽하게</span>
              </h2>
              <p style={{ fontSize: '17px', lineHeight: 1.8, color: TEXT2, margin: '0 0 36px' }}>
                연인, 가족, 친구와 일정을 공유하면서도<br />나만의 개인 일정은 완벽하게 분리 관리.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  '공간별로 완벽하게 분리된 일정 관리',
                  '실시간 공유 캘린더로 함께 확인',
                  '초대 코드 하나로 간편하게 연결',
                ].map((text) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: `${GREEN}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', color: GREEN, flexShrink: 0, fontWeight: 800,
                    }}>✓</div>
                    <span style={{ fontSize: '15px', color: TEXT2 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3 — Budget
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '120px 80px', maxWidth: '1440px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '80px', alignItems: 'center' }}>
            {/* Bar chart */}
            <div style={{
              background: CARD_BG, border: `1px solid ${CARD_BD}`,
              borderRadius: '24px', padding: '32px',
              boxShadow: `0 40px 80px rgba(0,0,0,0.35)`,
            }}>
              <div style={{ marginBottom: '28px' }}>
                <p style={{ fontSize: '11px', color: TEXT2, margin: '0 0 4px' }}>월별 지출 현황</p>
                <p style={{ fontSize: '24px', fontWeight: 800, color: TEXT1, margin: 0 }}>₩284,500</p>
                <p style={{ fontSize: '13px', color: GREEN, margin: '4px 0 0' }}>↓ 전월 대비 12% 절약</p>
              </div>
              {/* Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '140px', marginBottom: '24px' }}>
                {[
                  { month: '12월', pct: 85, amount: '389k' },
                  { month: '1월',  pct: 72, amount: '331k' },
                  { month: '2월',  pct: 68, amount: '308k' },
                  { month: '3월',  pct: 78, amount: '356k' },
                  { month: '4월',  pct: 90, amount: '412k' },
                  { month: '5월',  pct: 62, amount: '285k', current: true },
                ].map(({ month, pct, amount, current }) => (
                  <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '9px', color: current ? GREEN : TEXT2, fontWeight: current ? 700 : 400 }}>{amount}</span>
                    <div style={{
                      width: '100%', height: `${pct}%`, borderRadius: '6px 6px 3px 3px',
                      background: current ? `linear-gradient(180deg, ${GREEN}, ${TEAL})` : 'rgba(255,255,255,0.08)',
                    }} />
                    <span style={{ fontSize: '10px', color: current ? TEXT1 : TEXT2, fontWeight: current ? 700 : 400 }}>{month}</span>
                  </div>
                ))}
              </div>
              {/* Categories */}
              <div style={{ paddingTop: '20px', borderTop: `1px solid ${CARD_BD}` }}>
                {[
                  { label: '정기구독', amount: '₩89,000', pct: 31, color: BLUE },
                  { label: '식비', amount: '₩120,000', pct: 42, color: TEAL },
                  { label: '교통', amount: '₩45,000', pct: 16, color: GREEN },
                ].map(({ label, amount, pct, color }) => (
                  <div key={label} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: TEXT2 }}>{label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: TEXT1 }}>{amount}</span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Text */}
            <div>
              <h2 style={{ fontSize: 'clamp(30px, 3vw, 48px)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-1.5px' }}>
                지출을 한눈에<br />
                <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>파악하고 절약하세요</span>
              </h2>
              <p style={{ fontSize: '17px', lineHeight: 1.8, color: TEXT2, margin: '0 0 36px' }}>
                정기 결제부터 공동 지출까지<br />자동으로 추적하고 분석해드려요.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { value: '₩128k', label: '월평균 절약' },
                  { value: '98%', label: '자동 분류율' },
                ].map(({ value, label }) => (
                  <div key={label} style={{
                    padding: '20px', borderRadius: '16px',
                    background: CARD_BG, border: `1px solid ${CARD_BD}`,
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '24px', fontWeight: 800, color: GREEN, margin: '0 0 4px' }}>{value}</p>
                    <p style={{ fontSize: '12px', color: TEXT2, margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4 — Spaces
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '120px 80px', ...SECTION_ALT }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 style={{ fontSize: 'clamp(30px, 3.5vw, 52px)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 20px', letterSpacing: '-1.5px' }}>
                관계별로 완벽하게 분리된<br />
                <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  나만의 스마트 공간
                </span>
              </h2>
              <p style={{ fontSize: '17px', lineHeight: 1.75, color: TEXT2, margin: 0 }}>
                개인, 연인, 가족, 그룹 — 각 관계에 맞는 완벽한 공간을 제공합니다
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {[
                { icon: '🧑', title: '개인', desc: '나만의 일정과 지출을 완벽하게 프라이빗하게 관리', color: BLUE, grad: `linear-gradient(135deg, ${BLUE}18, ${BLUE}04)` },
                { icon: '💑', title: '연인', desc: '함께하는 데이트 일정, 공동 지출을 로맨틱하게 관리', color: '#FF6B9D', grad: 'linear-gradient(135deg, rgba(255,107,157,0.18), rgba(255,107,157,0.04))' },
                { icon: '👨‍👩‍👧', title: '가족', desc: '가족 모두의 일정을 한눈에, 아이 학원부터 집안일까지', color: TEAL, grad: `linear-gradient(135deg, ${TEAL}18, ${TEAL}04)` },
                { icon: '👥', title: '그룹', desc: '친구, 동료와 여행 계획부터 공동 프로젝트까지 함께', color: GREEN, grad: `linear-gradient(135deg, ${GREEN}18, ${GREEN}04)` },
              ].map(({ icon, title, desc, color, grad }) => (
                <div key={title} style={{
                  padding: '28px', borderRadius: '22px',
                  background: grad, border: `1px solid ${color}18`,
                  display: 'flex', flexDirection: 'column', gap: '16px',
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '17px',
                    background: `${color}20`, border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px',
                  }}>{icon}</div>
                  <div>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: TEXT1, margin: '0 0 8px' }}>{title}</p>
                    <p style={{ fontSize: '13px', lineHeight: 1.65, color: TEXT2, margin: 0 }}>{desc}</p>
                  </div>
                  <div style={{
                    padding: '7px 14px', borderRadius: '999px', width: 'fit-content',
                    background: `${color}14`, border: `1px solid ${color}22`,
                    fontSize: '12px', fontWeight: 600, color,
                  }}>
                    공간 만들기 →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5 — Notifications
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '120px 80px', maxWidth: '1440px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(30px, 3vw, 48px)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-1.5px' }}>
                놓치는 일정 없이<br />
                <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>완벽한 일상 관리</span>
              </h2>
              <p style={{ fontSize: '17px', lineHeight: 1.8, color: TEXT2, margin: '0 0 40px' }}>
                스마트 알림으로 중요한 일정을 놓치지 마세요.<br />
                일정 상태를 실시간으로 추적하고 관리합니다.
              </p>
              {/* Status flow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: '대기중', color: TEXT2 },
                  { arrow: true },
                  { label: '진행중', color: BLUE },
                  { arrow: true },
                  { label: '완료', color: GREEN },
                  { arrow: true },
                  { label: '재알림', color: TEAL },
                ].map((item, i) => (
                  'arrow' in item
                    ? <span key={i} style={{ color: 'rgba(255,255,255,0.25)', fontSize: '18px' }}>→</span>
                    : (
                      <div key={item.label} style={{
                        padding: '8px 18px', borderRadius: '999px',
                        background: item.color !== TEXT2 ? `${item.color}18` : CARD_BG,
                        border: `1px solid ${item.color !== TEXT2 ? item.color + '28' : CARD_BD}`,
                        fontSize: '13px', fontWeight: 700, color: item.color,
                      }}>{item.label}</div>
                    )
                ))}
              </div>
            </div>

            {/* Notification stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { emoji: '📅', title: '팀 스프린트 리뷰', sub: '30분 후 시작', status: '진행중', color: BLUE, time: '09:30' },
                { emoji: '💑', title: '연인과 저녁 약속', sub: '오후 7:00 예정', status: '대기중', color: '#FF6B9D', time: '19:00' },
                { emoji: '💳', title: '넷플릭스 정기결제', sub: '오늘 자동이체', status: '완료', color: GREEN, time: '완료' },
                { emoji: '👨‍👩‍👧', title: '가족 주말 여행 계획', sub: '내일 오전 출발', status: '대기중', color: TEAL, time: '내일' },
              ].map((n) => (
                <div key={n.title} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px 20px', borderRadius: '16px',
                  background: CARD_BG, border: `1px solid ${CARD_BD}`,
                }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '13px',
                    background: `${n.color}20`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '19px', flexShrink: 0,
                  }}>{n.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT1, margin: '0 0 3px' }}>{n.title}</p>
                    <p style={{ fontSize: '12px', color: TEXT2, margin: 0 }}>{n.sub}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    <span style={{ fontSize: '11px', color: TEXT2 }}>{n.time}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: `${n.color}20`, color: n.color }}>{n.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            REVIEWS
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{ padding: '120px 80px', ...SECTION_ALT }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 style={{ fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1.5px' }}>
                글리움 사용자들의 이야기
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
                <span style={{ fontSize: '15px', fontWeight: 700, color: TEXT1, marginLeft: '10px' }}>4.9</span>
                <span style={{ fontSize: '14px', color: TEXT2, marginLeft: '4px' }}>/ 5.0 (1,200+ 리뷰)</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {[
                {
                  name: '이지원', age: '28세 직장인 커플', avatar: '💑', color: '#FF6B9D',
                  text: '연인과 함께 일정을 관리하니 훨씬 편해요! 데이트 계획부터 공동 지출까지 한 앱에서 할 수 있어서 더 이상 카카오톡으로 주고받을 필요가 없어요.',
                },
                {
                  name: '박민준', age: '35세 기혼 직장인', avatar: '👨‍👩‍👧', color: TEAL,
                  text: '가족 공유 캘린더로 아내와의 소통이 훨씬 늘었어요. 아이 학원 일정이랑 집안 행사를 같이 볼 수 있어서 진짜 편리합니다. 지출 관리 기능도 최고예요.',
                },
                {
                  name: '김수아', age: '42세 주부', avatar: '🏠', color: GREEN,
                  text: '아이들 학원 일정부터 집안일, 정기결제까지 한눈에 볼 수 있어요. 특히 자동 지출 알림 기능 덕분에 불필요한 구독을 발견하고 월 5만원을 아꼈어요!',
                },
                {
                  name: '최도현', age: '55세 자영업자', avatar: '🏪', color: BLUE,
                  text: '거래처 약속부터 가게 운영 일정까지 완벽하게 관리됩니다. 직원들과 공간을 공유해서 스케줄 조율도 쉬워졌고, 월별 비용 분석도 사업에 큰 도움이 돼요.',
                },
              ].map(({ name, age, avatar, color, text }) => (
                <div key={name} style={{
                  padding: '32px', borderRadius: '24px',
                  background: CARD_BG, border: `1px solid ${CARD_BD}`,
                  display: 'flex', flexDirection: 'column', gap: '20px',
                }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="#F59E0B">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <p style={{ fontSize: '15px', lineHeight: 1.8, color: TEXT2, margin: 0 }}>
                    &ldquo;{text}&rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '16px', borderTop: `1px solid ${CARD_BD}` }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: `${color}20`, border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                    }}>{avatar}</div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 800, color: TEXT1, margin: 0 }}>{name}</p>
                      <p style={{ fontSize: '13px', color: TEXT2, margin: 0 }}>{age}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CTA
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{
          padding: '120px 80px',
          background: `linear-gradient(135deg, ${BLUE}18 0%, ${TEAL}12 50%, ${GREEN}08 100%)`,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-2.5px' }}>
              지금 바로 시작하세요
            </h2>
            <p style={{ fontSize: '18px', lineHeight: 1.75, color: TEXT2, margin: '0 0 52px' }}>
              무료로 시작하고 삶의 모든 순간을 연결하세요.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '36px' }}>
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', marginBottom: '28px' }}>
              <div style={{ height: '1px', width: '80px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: '13px', color: TEXT2 }}>또는</span>
              <div style={{ height: '1px', width: '80px', background: 'rgba(255,255,255,0.1)' }} />
            </div>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '18px 52px', borderRadius: '999px',
              background: TEXT1, color: BG, textDecoration: 'none',
              fontSize: '16px', fontWeight: 800,
              boxShadow: '0 24px 64px rgba(255,255,255,0.12)',
            }}>
              웹에서 무료로 시작하기 →
            </Link>
            <p style={{ fontSize: '13px', color: TEXT2, margin: '24px 0 0' }}>
              무료로 시작 · 신용카드 불필요 · 언제든 취소 가능
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════════════════ */}
        <footer style={{
          borderTop: `1px solid ${CARD_BD}`,
          padding: '72px 80px 48px',
          background: 'rgba(0,0,0,0.4)',
        }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            {/* Top grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '48px', marginBottom: '60px' }}>
              {/* Brand */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GleaumLogoImg size={32} />
                  <GleaumBI variant="white" width={88} />
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.75, color: TEXT2, margin: 0, maxWidth: '260px' }}>
                  나, 그리고 연인/가족의<br />일상 네트워크
                </p>
              </div>

              {/* Sitemap columns */}
              {([
                {
                  title: '서비스',
                  links: [
                    { label: '서비스 소개', fn: soon },
                    { label: '기능 안내', fn: soon },
              { label: '다운로드', href: '/download' },
                  ],
                },
                {
                  title: '법적 정보',
                  links: [
                    { label: '개인정보처리방침', href: '/legal/privacy' },
                    { label: '이용약관', href: '/legal/terms' },
                    { label: '계정 삭제', href: '/legal/delete-account' },
                  ],
                },
                {
                  title: '지원',
                  links: [
                    { label: '고객센터', fn: soon },
                    { label: '문의하기', href: 'mailto:helper@gleaum.com' },
                  ],
                },
                {
                  title: '회사',
                  links: [
                    { label: '글리움 소개', fn: soon },
                    { label: '팀 소개', fn: soon },
                  ],
                },
              ] as const).map(({ title, links }) => (
                <div key={title}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {links.map((link) => (
                      'fn' in link
                        ? (
                          <button key={link.label} onClick={link.fn}
                            style={{
                              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                              fontSize: '14px', color: TEXT2, fontFamily: 'var(--font-body)',
                              textAlign: 'left', transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT1; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT2; }}
                          >{link.label}</button>
                        )
                        : (
                          <a key={link.label} href={link.href}
                            style={{ fontSize: '14px', color: TEXT2, textDecoration: 'none', transition: 'color 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT1; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT2; }}
                          >{link.label}</a>
                        )
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Copyright bar */}
            <div style={{
              paddingTop: '24px', borderTop: `1px solid ${CARD_BD}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
            }}>
              <p style={{ fontSize: '13px', color: TEXT2, margin: 0 }}>
                © 2026 글리움 (Gleaum). All rights reserved.
              </p>
              <div style={{ display: 'flex', gap: '24px' }}>
                {[
                  { label: '개인정보처리방침', href: '/legal/privacy' },
                  { label: '이용약관', href: '/legal/terms' },
                ].map(({ label, href }) => (
                  <a key={label} href={href} style={{ fontSize: '13px', color: TEXT2, textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
