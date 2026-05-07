'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';

const NAV_ITEMS = [
  { label: '홈', icon: '🏠', href: '/home' },
  { label: '일정', icon: '📅', href: '/schedules' },
  { label: '가계부', icon: '💰', href: '/budget' },
  { label: '가족', icon: '👨‍👩‍👧‍👦', href: '/family' },
  { label: '알림', icon: '🔔', href: '/notifications' },
  { label: '마이페이지', icon: '👤', href: '/mypage' },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  // 로그인/온보딩 등 레이아웃이 필요 없는 페이지 예외 처리
  if (pathname === '/login' || pathname === '/onboarding' || pathname === '/') {
    return null;
  }

  return (
    <aside className="hidden lg:flex flex-col w-[280px] h-100dvh border-r bg-white/80 backdrop-blur-xl sticky top-0 z-50 p-6"
      style={{ borderColor: 'rgba(0,132,204,0.08)' }}>
      
      {/* 로고 영역 — 공식 BI 워드마크 */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <GleaumLogoImg size={32} />
        <GleaumBI variant="dark" width={100} />
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-4 py-3.5 rounded-[16px] transition-all group"
              style={{
                background: isActive ? 'rgba(0,132,204,0.06)' : 'transparent',
                color: isActive ? '#0084CC' : '#8E8E93',
              }}
            >
              <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[15px] font-bold ${isActive ? 'text-[#1A1B2E]' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0084CC]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 하단 프로필 간단 요약 (추후 확장 가능) */}
      <div className="mt-auto p-4 rounded-[20px] bg-gray-50/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm border border-gray-100">
          👤
        </div>
        <div className="overflow-hidden">
          <p className="text-[13px] font-bold text-[#1A1B2E] truncate">내 프로필</p>
          <p className="text-[11px] text-[#8E8E93] truncate">개인화 설정</p>
        </div>
      </div>
    </aside>
  );
}
