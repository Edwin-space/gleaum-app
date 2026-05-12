"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutGrid, Megaphone, Settings, MonitorPlay } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "대시보드", icon: LayoutGrid },
    { href: "/users", label: "회원 및 공간 관리", icon: Users },
    { href: "/campaigns", label: "마케팅 센터 (CRM)", icon: Megaphone },
    { href: "/ads", label: "광고 매니저", icon: MonitorPlay },
    { href: "/settings", label: "시스템 설정", icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 border-r bg-card text-card-foreground p-6 flex flex-col gap-6 fixed h-full z-10 md:relative">
      <div className="flex items-center gap-2 font-bold text-xl mb-4 text-primary">
        <LayoutGrid className="w-6 h-6" />
        <span>Gleaum Admin</span>
      </div>
      <nav className="flex flex-col gap-2 flex-1">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              } ${link.href === "/settings" ? "mt-auto" : ""}`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
