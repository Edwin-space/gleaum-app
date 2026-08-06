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
import {
  DEFAULT_ACCOUNT_CAPABILITIES,
  DENIED_ACCOUNT_CAPABILITIES,
  type AccountCapability,
} from '@/lib/account-capabilities';
import type { AccountSessionContext } from '@/types';

type AccountSessionStatus = 'loading' | 'ready' | 'unauthenticated' | 'error';

interface AccountSessionValue {
  context: AccountSessionContext | null;
  status: AccountSessionStatus;
  capabilities: AccountSessionContext['capabilities'];
  refresh: () => Promise<void>;
}

const AccountSessionContextValue = createContext<AccountSessionValue | null>(null);

const RETIRED_WEB_SESSION: AccountSessionValue = {
  context: null,
  status: 'unauthenticated',
  capabilities: DENIED_ACCOUNT_CAPABILITIES,
  refresh: async () => {},
};

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
    capabilities: context?.capabilities ?? (status === 'unauthenticated' ? DENIED_ACCOUNT_CAPABILITIES : DEFAULT_ACCOUNT_CAPABILITIES),
    refresh,
  }), [context, refresh, status]);

  return (
    <AccountSessionContextValue.Provider value={value}>
      {children}
    </AccountSessionContextValue.Provider>
  );
}

export function useAccountSession(): AccountSessionValue {
  // 웹 앱 종료 후 공개 레이아웃에는 세션 공급자를 두지 않는다. 과거 기능 페이지가
  // 빌드되는 동안에는 모든 권한을 거부한 상태로만 렌더링해 인증 통신을 재활성화하지 않는다.
  return useContext(AccountSessionContextValue) ?? RETIRED_WEB_SESSION;
}

export function useAccountCapability(capability: AccountCapability): boolean {
  return useAccountSession().capabilities[capability];
}
