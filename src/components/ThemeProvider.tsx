'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  getSystemTheme,
  isThemeMode,
  type ResolvedTheme,
  type ThemeMode,
} from '@/lib/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // themeInitScript가 <html data-theme="..."> 를 이미 설정했으므로
  // DOM 값으로 초기화 → hydration 불일치(라이트/다크 깜박임) 방지
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof document === 'undefined') return 'system';
    const dom = document.documentElement.dataset['themeMode'];
    return isThemeMode(dom) ? dom : 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    // localStorage 재확인 (SSR과 DOM이 다를 경우 보정)
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const initialMode = isThemeMode(stored) ? stored : 'system';
    if (initialMode !== mode) {
      setModeState(initialMode);
      setResolvedTheme(applyTheme(initialMode));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setResolvedTheme((current) => {
        if (mode !== 'system') return current;
        return applyTheme('system');
      });
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [mode]);

  const setMode = (nextMode: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    setModeState(nextMode);
    setResolvedTheme(applyTheme(nextMode));
  };

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme: mode === 'system' ? getSystemTheme() : resolvedTheme,
      setMode,
    }),
    [mode, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

