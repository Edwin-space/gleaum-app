'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    href: '/home',
    label: '홈',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#0084CC' : '#8E8E93'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/schedules',
    label: '일정',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#0084CC' : '#8E8E93'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
        <line x1="16" x2="16" y1="2" y2="6"/>
        <line x1="8" x2="8" y1="2" y2="6"/>
        <line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
    ),
  },
  // FAB 자리 (중앙 빈칸)
  null,
  {
    href: '/budget',
    label: '가계부',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#0084CC' : '#8E8E93'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2"/>
        <line x1="2" x2="22" y1="10" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/mypage',
    label: '마이',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#0084CC' : '#8E8E93'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  // 네비게이션 바를 숨길 경로 목록
  const hideOnPaths = ['/login', '/onboarding', '/auth/callback', '/invite'];
  const shouldHide = hideOnPaths.some(path => pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    /* 전체 고정 영역 — pointer-events none으로 클릭 통과 */
    <div className="fixed bottom-0 left-0 w-full flex justify-center pb-8 px-4 z-[9999] pointer-events-none lg:hidden">
      <div
        className="w-full max-w-[430px] relative flex items-center justify-between px-8 h-[68px] pointer-events-auto glass-card shadow-2xl"
        style={{
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* FAB — 중앙 상단 돌출 */}
        <button
          onClick={() => {
            router.push('/schedules/new');
            setTimeout(() => {
              if (window.location.pathname !== '/schedules/new') {
                window.location.href = '/schedules/new';
              }
            }, 100);
          }}
          className="absolute -top-7 left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-full flex items-center justify-center text-white transition-transform active:scale-90 hover:-translate-y-0.5 pointer-events-auto shadow-fab"
          style={{
            background: 'var(--brand-gradient)',
          }}
          aria-label="일정 추가"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        {/* 왼쪽 2개 */}
        {NAV_ITEMS.slice(0, 2).map((item) => {
          if (!item) return null;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClickCapture={(e) => {
                e.stopPropagation();
                // 1. Next.js 라우팅 시도
                router.push(item.href);
                // 2. 만약 라우팅이 막혔을 경우를 대비한 최후의 수단 (잠시 후 실행)
                setTimeout(() => {
                  if (window.location.pathname !== item.href) {
                    window.location.href = item.href;
                  }
                }, 100);
              }}

              className="flex flex-col items-center gap-0.5 flex-1 transition-transform active:scale-90 relative z-[110] pointer-events-auto"
            >

              {item.icon(active)}
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? '#0084CC' : '#8E8E93' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* 중앙 FAB 자리 spacer */}
        <div className="flex-1" />

        {/* 오른쪽 2개 */}
        {NAV_ITEMS.slice(3).map((item) => {
          if (!item) return null;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClickCapture={(e) => {
                e.stopPropagation();
                // 1. Next.js 라우팅 시도
                router.push(item.href);
                // 2. 만약 라우팅이 막혔을 경우를 대비한 최후의 수단 (잠시 후 실행)
                setTimeout(() => {
                  if (window.location.pathname !== item.href) {
                    window.location.href = item.href;
                  }
                }, 100);
              }}

              className="flex flex-col items-center gap-0.5 flex-1 transition-transform active:scale-90 relative z-[110] pointer-events-auto"
            >

              {item.icon(active)}
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? '#0084CC' : '#8E8E93' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
