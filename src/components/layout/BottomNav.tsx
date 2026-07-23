'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { trackEvent } from '@/lib/analytics';
import { useAccountSession } from '@/components/AccountSessionProvider';
import type { AccountCapability } from '@/lib/account-capabilities';

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  capability?: AccountCapability;
  icon: (active: boolean) => React.ReactNode;
}> = [
  {
    href: '/home',
    label: '홈',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--color-primary)' : 'var(--theme-text-subtle)'} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/schedules',
    label: '일정',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--color-primary)' : 'var(--theme-text-subtle)'} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2"/>
        <line x1="16" x2="16" y1="2" y2="6"/>
        <line x1="8" x2="8" y1="2" y2="6"/>
        <line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/space',
    label: '공간',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--color-primary)' : 'var(--theme-text-subtle)'} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/budget',
    label: '가계부',
    capability: 'canViewHouseholdBudget',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--color-primary)' : 'var(--theme-text-subtle)'} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2"/>
        <line x1="2" x2="22" y1="10" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/mypage',
    label: '전체',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? 'var(--color-primary)' : 'var(--theme-text-subtle)'} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const { capabilities } = useAccountSession();

  const hideOnPaths = [
    '/',
    '/login',
    '/onboarding',
    '/auth/callback',
    '/invite',
    '/legal',
    '/space/children',
    '/family/guardian/verify',
  ];
  const shouldHide = hideOnPaths.some(
    path => pathname === path || (path !== '/' && pathname.startsWith(path))
  );

  if (shouldHide || isDesktop) return null;

  return (
    <>
      {/* 하단 고정 네비게이션 바
          body는 overflow:hidden (모바일), #app-shell이 스크롤 → fixed 완전 고정 */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'var(--theme-surface)',
          borderTop: '1px solid var(--theme-border)',
          /* safe-area 포함해 물리 화면 끝까지 흰 배경 확장 */
          paddingBottom: 'var(--app-safe-bottom, env(safe-area-inset-bottom))',
          boxShadow: '0 -1px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            height: '48px',  /* 56 → 48px 슬림화 */
          }}
        >
          {NAV_ITEMS.filter(item => !item.capability || capabilities[item.capability]).map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/home' && pathname.startsWith(item.href + '/'));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (!active) void trackEvent('navigation_click', { destination: item.href });
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  textDecoration: 'none',
                  position: 'relative',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* 활성 탭 상단 인디케이터 */}
                {active && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '28px',
                    height: '2.5px',
                    borderRadius: '0 0 3px 3px',
                    background: 'var(--color-primary)',
                  }} />
                )}

                {item.icon(active)}

                <span style={{
                  fontSize: '10px',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--color-primary)' : 'var(--theme-text-subtle)',
                  letterSpacing: '-0.2px',
                  lineHeight: 1,
                }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
