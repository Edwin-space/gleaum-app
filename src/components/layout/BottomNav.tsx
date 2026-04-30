'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/home',
    label: '홈',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
          fill={active ? 'var(--color-primary)' : 'none'}
          stroke={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}
          strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/schedules',
    label: '일정',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="3"
          fill={active ? 'rgba(0,132,204,0.1)' : 'none'}
          stroke={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}
          strokeWidth="1.8"/>
        <path d="M8 2V6M16 2V6M3 10H21"
          stroke={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}
          strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="8" cy="15" r="1.2"
          fill={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}/>
        <circle cx="12" cy="15" r="1.2"
          fill={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}/>
        <circle cx="16" cy="15" r="1.2"
          fill={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}/>
      </svg>
    ),
  },
  {
    href: '/schedules/new',
    label: '추가',
    icon: (_active: boolean) => (
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-5"
        style={{ background: 'var(--brand-gradient)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </div>
    ),
  },
  {
    href: '/budget',
    label: '가계부',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="16" rx="2"
          fill={active ? 'rgba(0,132,204,0.1)' : 'none'}
          stroke={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}
          strokeWidth="1.8"/>
        <path d="M16 12C16 13.1 15.1 14 14 14H10C8.9 14 8 13.1 8 12C8 10.9 8.9 10 10 10H14C15.1 10 16 10.9 16 12Z"
          fill={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}/>
        <path d="M2 9H22"
          stroke={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}
          strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/mypage',
    label: '마이페이지',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4"
          fill={active ? 'rgba(0,132,204,0.1)' : 'none'}
          stroke={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}
          strokeWidth="1.8"/>
        <path d="M4 20C4 17.8 7.6 16 12 16C16.4 16 20 17.8 20 20"
          stroke={active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)'}
          strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-xl z-50"
      style={{
        borderTop: '1px solid var(--color-hairline)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-3">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href) && item.href !== '/schedules/new';
          const isCenter = item.href === '/schedules/new';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 flex-1',
                isCenter && 'items-center'
              )}
            >
              {item.icon(active)}
              {!isCenter && (
                <span
                  className="text-[10px] font-medium"
                  style={{ color: active ? 'var(--color-primary)' : 'var(--color-ink-muted-48)' }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
