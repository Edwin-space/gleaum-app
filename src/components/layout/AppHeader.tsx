'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GleaumBI } from '@/components/ui/GleaumLogo';
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
  const router = useRouter();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center justify-between px-5 h-14',
        dark ? 'bg-[var(--brand-navy)]' : 'bg-white/80',
        className
      )}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: dark
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid rgba(0,132,204,0.06)',
      }}
    >
      {/* 왼쪽 */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors active:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6"
                stroke={dark ? 'white' : 'var(--color-ink)'}
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {showLogo && !title && <GleaumBI variant={dark ? 'white' : 'dark'} width={88} />}
        {title && (
          <h1
            className="text-[17px] font-bold tracking-tight"
            style={{ color: dark ? 'white' : 'var(--color-ink)' }}
          >
            {title}
          </h1>
        )}
      </div>

      {/* 오른쪽 */}
      <div className="flex items-center gap-2">
        {rightAction}
        {showNotification && (
          <Link
            href="/notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-full transition-colors active:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke={dark ? 'white' : 'var(--color-ink)'}
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            {notificationCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                style={{ background: '#0084CC' }}
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
