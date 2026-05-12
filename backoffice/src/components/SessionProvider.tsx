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

/** 세션 유지 시간: 10분 */
const SESSION_DURATION_SEC = 10 * 60;
const STORAGE_KEY = "gleaum_admin_login_at";

interface SessionContextValue {
  remainingSeconds: number;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  remainingSeconds: SESSION_DURATION_SEC,
  logout: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [remainingSeconds, setRemainingSeconds] = useState(SESSION_DURATION_SEC);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    // 로그인 페이지에서는 타이머 불필요
    if (isLoginPage) return;

    // 로그인 시각 초기화 (세션 시작)
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
    }

    const tick = () => {
      const loginAt = parseInt(sessionStorage.getItem(STORAGE_KEY) || "0", 10);
      if (!loginAt) return;

      const elapsed = Math.floor((Date.now() - loginAt) / 1000);
      const remaining = Math.max(0, SESSION_DURATION_SEC - elapsed);
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        logout();
      }
    };

    tick(); // 즉시 1회 실행
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoginPage, logout]);

  // 로그인 성공 후 타이머 리셋용 헬퍼 (login 페이지에서 호출)
  useEffect(() => {
    if (!isLoginPage) return;
    // 로그인 페이지 진입 시 기존 타이머 세션 초기화
    sessionStorage.removeItem(STORAGE_KEY);
    setRemainingSeconds(SESSION_DURATION_SEC);
  }, [isLoginPage]);

  return (
    <SessionContext.Provider value={{ remainingSeconds, logout }}>
      {children}
    </SessionContext.Provider>
  );
}
