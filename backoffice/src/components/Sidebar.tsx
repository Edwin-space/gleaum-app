"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  LayoutGrid,
  Megaphone,
  Settings,
  MonitorPlay,
  LogOut,
  Clock,
} from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { Button } from "@/components/ui/button";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { remainingSeconds, logout } = useSession();

  const isWarning = remainingSeconds <= 120; // 2분 이하: 경고색
  const isDanger  = remainingSeconds <= 60;  // 1분 이하: 위험색

  const links = [
    { href: "/",          label: "대시보드",             icon: LayoutGrid  },
    { href: "/users",     label: "회원 및 공간 관리",    icon: Users       },
    { href: "/campaigns", label: "마케팅 센터 (CRM)",    icon: Megaphone   },
    { href: "/ads",       label: "광고 매니저",          icon: MonitorPlay },
    { href: "/settings",  label: "시스템 설정",          icon: Settings    },
  ];

  return (
    <aside className="w-full md:w-64 border-r bg-card text-card-foreground p-6 flex flex-col gap-6 fixed h-full z-10 md:relative">
      {/* 로고 */}
      <div className="flex items-center gap-2 font-bold text-xl text-primary">
        <LayoutGrid className="w-6 h-6" />
        <span>Gleaum Admin</span>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex flex-col gap-2 flex-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단: 세션 타이머 + 로그아웃 */}
      <div className="border-t pt-4 flex flex-col gap-3">
        {/* 세션 타이머 */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
            isDanger
              ? "bg-destructive/10 text-destructive"
              : isWarning
              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
              : "text-muted-foreground"
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span className="text-xs">세션 만료까지</span>
          <span
            className={`ml-auto font-mono font-semibold text-sm tabular-nums ${
              isDanger
                ? "text-destructive"
                : isWarning
                ? "text-yellow-700 dark:text-yellow-400"
                : "text-foreground"
            }`}
          >
            {formatTime(remainingSeconds)}
          </span>
        </div>

        {/* 로그아웃 버튼 */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
