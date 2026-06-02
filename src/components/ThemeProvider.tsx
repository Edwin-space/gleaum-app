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
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const initialMode = isThemeMode(stored) ? stored : 'system';
    setModeState(initialMode);
    setResolvedTheme(applyTheme(initialMode));
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

