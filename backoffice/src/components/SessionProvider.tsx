"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, usePathname } from "next/navigation";

/** 비활동 허용 시간: 10분 */
const IDLE_LIMIT_SEC = 10 * 60;
/** sessionStorage 키: 마지막 활동 시각 (ms) */
const STORAGE_KEY = "gleaum_admin_last_active";
/** 활동 이벤트마다 storage 갱신하면 부하가 크므로 최소 간격(ms) */
const DEBOUNCE_MS = 10_000;

interface SessionContextValue {
  remainingSeconds: number;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  remainingSeconds: IDLE_LIMIT_SEC,
  logout: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [remainingSeconds, setRemainingSeconds] = useState(IDLE_LIMIT_SEC);
  const router        = useRouter();
  const pathname      = usePathname();
  const isLoginPage   = pathname === "/login";
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastWriteRef  = useRef<number>(0);

  // ── 로그아웃 ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    sessionStorage.removeItem(STORAGE_KEY);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  // ── 활동 감지 → lastActive 갱신 (디바운스) ─────────────────
  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastWriteRef.current < DEBOUNCE_MS) return;
    lastWriteRef.current = now;
    sessionStorage.setItem(STORAGE_KEY, now.toString());
  }, []);

  // ── 메인 타이머 ─────────────────────────────────────────────
  useEffect(() => {
    if (isLoginPage) return;

    // 첫 진입 시 lastActive 초기화
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const now = Date.now();
      sessionStorage.setItem(STORAGE_KEY, now.toString());
      lastWriteRef.current = now;
    }

    // 활동 이벤트 리스너 등록
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;
    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    // 1초 tick
    const tick = () => {
      const lastActive = parseInt(sessionStorage.getItem(STORAGE_KEY) || "0", 10);
      if (!lastActive) return;

      const elapsed   = Math.floor((Date.now() - lastActive) / 1000);
      const remaining = Math.max(0, IDLE_LIMIT_SEC - elapsed);
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        logout();
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [isLoginPage, handleActivity, logout]);

  // ── 로그인 페이지 진입 시 초기화 ────────────────────────────
  useEffect(() => {
    if (!isLoginPage) return;
    sessionStorage.removeItem(STORAGE_KEY);
    setRemainingSeconds(IDLE_LIMIT_SEC);
  }, [isLoginPage]);

  return (
    <SessionContext.Provider value={{ remainingSeconds, logout }}>
      {children}
    </SessionContext.Provider>
  );
}
