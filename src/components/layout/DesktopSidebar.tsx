'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';
import { useIsDesktop } from '@/hooks/useMediaQuery';

const NAV_ITEMS = [
  {
    label: '홈', href: '/home',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#0084CC' : 'none'} stroke={active ? '#0084CC' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: '일정', href: '/schedules',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0084CC' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
        <rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/>
        <line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
        {active && <><line x1="8" x2="16" y1="14" y2="14"/><line x1="8" x2="12" y1="18" y2="18"/></>}
      </svg>
    ),
  },
  {
    label: '가계부', href: '/budget',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0084CC' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" x2="22" y1="10" y2="10"/>
        {active && <circle cx="16" cy="15" r="1" fill="#0084CC" stroke="none"/>}
      </svg>
    ),
  },
  {
    label: '공간', href: '/space',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0084CC' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: '알림', href: '/notifications',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'rgba(0,132,204,0.12)' : 'none'} stroke={active ? '#0084CC' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    label: '마이페이지', href: '/mypage',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0084CC' : '#8E8E93'} strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();

  if (!isDesktop) return null;

  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/legal')
  ) {
    return null;
  }

  return (
    <aside style={{
      width: '268px',
      flexShrink: 0,
      height: '100dvh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 16px',
      background: 'white',
      borderRight: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '1px 0 0 rgba(0,0,0,0.03)',
      zIndex: 50,
    }} className="hidden lg:flex">

      {/* ── 로고 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', padding: '0 8px' }}>
        <GleaumLogoImg size={32} />
        <GleaumBI variant="dark" width={96} />
      </div>

      {/* ── 네비게이션 ── */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '16px',
                textDecoration: 'none', transition: 'all 0.15s',
                background: isActive ? 'rgba(0,132,204,0.07)' : 'transparent',
                color: isActive ? '#0084CC' : '#8E8E93',
                position: 'relative',
              }}
            >
              {/* 왼쪽 액티브 인디케이터 */}
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: '3px', height: '20px', borderRadius: '0 3px 3px 0',
                  background: 'linear-gradient(180deg, #0CC9B5, #0084CC)',
                }} />
              )}
              <span style={{ flexShrink: 0 }}>{item.icon(isActive)}</span>
              <span style={{
                fontSize: '14px',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#1A1B2E' : '#6E6E66',
                letterSpacing: '-0.2px',
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#0084CC', flexShrink: 0 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── 하단 프로필 ── */}
      <div style={{
        marginTop: 'auto',
        padding: '14px 16px',
        borderRadius: '20px',
        background: '#FAFAFA',
        border: '1px solid rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: '12px',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '13px',
          background: 'white', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)', flexShrink: 0,
        }}>
          👤
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1B2E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            내 프로필
          </p>
          <p style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            마이페이지 설정
          </p>
        </div>
      </div>
    </aside>
  );
}
