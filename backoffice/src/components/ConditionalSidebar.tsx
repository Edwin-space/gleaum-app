"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

/** 로그인 페이지에서는 사이드바를 숨김 */
export default function ConditionalSidebar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <Sidebar />;
}
