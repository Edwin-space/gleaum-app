'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GleaumLogo } from '@/components/ui/GleaumLogo';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  showNotification?: boolean;
  notificationCount?: number;
  rightAction?: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export function AppHeader({
  title,
  showLogo = true,
  showBack = false,
  showNotification = true,
  notificationCount = 0,
  rightAction,
  className,
  dark = false,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center justify-between px-4 h-14',
        dark ? 'bg-[var(--brand-black)]' : 'bg-white/90 backdrop-blur-xl',
        className
      )}
      style={{ borderBottom: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid var(--color-hairline)' }}
    >
      {/* 왼쪽 */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => history.back()}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6"
                stroke={dark ? 'white' : 'var(--color-ink)'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {showLogo && !title && <GleaumLogo variant={dark ? 'dark' : 'light'} size="sm" />}
        {title && (
          <h1
            className="text-[17px] font-semibold"
            style={{ color: dark ? 'white' : 'var(--color-ink)', letterSpacing: '-0.374px' }}
          >
            {title}
          </h1>
        )}
      </div>

      {/* 오른쪽 */}
      <div className="flex items-center gap-2">
        {rightAction}
        {showNotification && (
          <Link href="/notifications" className="relative w-9 h-9 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 10C6 7 8.7 4.5 12 4.5C15.3 4.5 18 7 18 10V14L20 16H4L6 14V10Z"
                stroke={dark ? 'white' : 'var(--color-ink)'}
                strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M10 16V17C10 18.1 10.9 19 12 19C13.1 19 14 18.1 14 17V16"
                stroke={dark ? 'white' : 'var(--color-ink)'}
                strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {notificationCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                style={{ background: '#EF4444' }}
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
