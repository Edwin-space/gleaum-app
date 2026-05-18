'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useMediaQuery';

const NAV_ITEMS = [
  {
    href: '/home', label: '홈',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#0084CC' : '#AEAEB2'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/schedules', label: '일정',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#0084CC' : '#AEAEB2'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2"/>
        <line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
    ),
  },
  null, // FAB spacer
  {
    href: '/budget', label: '가계부',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#0084CC' : '#AEAEB2'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/mypage', label: '마이',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#0084CC' : '#AEAEB2'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const hideOnPaths = ['/', '/login', '/onboarding', '/auth/callback', '/invite', '/legal', '/schedules/new', '/schedules/edit'];
  const shouldHide = hideOnPaths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path)));

  if (shouldHide || isDesktop) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 9999,
        pointerEvents: 'none',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
        paddingLeft: '16px',
        paddingRight: '16px',
        // safe-area inset 영역(홈 인디케이터 아래)까지 앱 배경색으로 채워
        // iOS/Android 에서 OS 네비게이션 바 색과 다른 배경이 보이는 갭 제거
        background: '#FAFAFD',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '68px',
          paddingLeft: '28px',
          paddingRight: '28px',
          borderRadius: '28px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          pointerEvents: 'auto',
        }}
      >
        {/* FAB — center floating */}
        <button
          onClick={() => router.push('/schedules/new')}
          aria-label="일정 추가"
          style={{
            position: 'absolute',
            top: '-22px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
            border: '3px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,132,204,0.45)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onTouchStart={e => { e.currentTarget.style.transform = 'translateX(-50%) scale(0.90)'; }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'translateX(-50%) scale(1)'; }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        {/* Left nav items */}
        {NAV_ITEMS.slice(0, 2).map((item) => {
          if (!item) return null;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                flex: 1,
                textDecoration: 'none',
                transition: 'transform 0.15s',
                position: 'relative',
                zIndex: 110,
              }}
            >
              {item.icon(active)}
              <span style={{
                fontSize: '10px',
                fontWeight: active ? 800 : 600,
                color: active ? '#0084CC' : '#AEAEB2',
                letterSpacing: '-0.2px',
              }}>
                {item.label}
              </span>
              {active && (
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#0084CC',
                }} />
              )}
            </Link>
          );
        })}

        {/* Center spacer for FAB */}
        <div style={{ flex: 1 }} />

        {/* Right nav items */}
        {NAV_ITEMS.slice(3).map((item) => {
          if (!item) return null;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                flex: 1,
                textDecoration: 'none',
                transition: 'transform 0.15s',
                position: 'relative',
                zIndex: 110,
              }}
            >
              {item.icon(active)}
              <span style={{
                fontSize: '10px',
                fontWeight: active ? 800 : 600,
                color: active ? '#0084CC' : '#AEAEB2',
                letterSpacing: '-0.2px',
              }}>
                {item.label}
              </span>
              {active && (
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#0084CC',
                }} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
