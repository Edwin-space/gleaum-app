'use client';

import Script from 'next/script';
import { useAccountCapability } from '@/components/AccountSessionProvider';

export function AccountAdSenseScript({ clientId }: { clientId?: string }) {
  const canShowAds = useAccountCapability('canShowAds');
  if (!canShowAds || !clientId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
