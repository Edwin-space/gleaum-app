'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { DENIED_ACCOUNT_CAPABILITIES, type AccountCapability } from '@/lib/account-capabilities';
import type { AccountSessionContext } from '@/types';

type AccountSessionStatus = 'loading' | 'ready' | 'unauthenticated' | 'error';

interface AccountSessionValue {
  context: AccountSessionContext | null;
  status: AccountSessionStatus;
  capabilities: AccountSessionContext['capabilities'];
  refresh: () => Promise<void>;
}

const AccountSessionContextValue = createContext<AccountSessionValue | null>(null);

export function AccountSessionProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<AccountSessionContext | null>(null);
  const [status, setStatus] = useState<AccountSessionStatus>('loading');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/session/context', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (response.status === 401) {
        setContext(null);
        setStatus('unauthenticated');
        return;
      }
      if (!response.ok) throw new Error(`session_context_${response.status}`);
      setContext(await response.json() as AccountSessionContext);
      setStatus('ready');
    } catch {
      setContext(null);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => {
      window.clearTimeout(initialRefresh);
      subscription.unsubscribe();
    };
  }, [refresh]);

  const value = useMemo<AccountSessionValue>(() => ({
    context,
    status,
    capabilities: context?.capabilities ?? DENIED_ACCOUNT_CAPABILITIES,
    refresh,
  }), [context, refresh, status]);

  return (
    <AccountSessionContextValue.Provider value={value}>
      {children}
    </AccountSessionContextValue.Provider>
  );
}

export function useAccountSession(): AccountSessionValue {
  const value = useContext(AccountSessionContextValue);
  if (!value) throw new Error('useAccountSession must be used within AccountSessionProvider');
  return value;
}

export function useAccountCapability(capability: AccountCapability): boolean {
  return useAccountSession().capabilities[capability];
}
