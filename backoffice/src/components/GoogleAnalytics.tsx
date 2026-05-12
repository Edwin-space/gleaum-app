"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface Props {
  measurementId: string;
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export default function GoogleAnalytics({ measurementId }: Props) {
  const pathname = usePathname();

  // 경로 변경마다 페이지뷰 이벤트 전송
  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_title: document.title,
    });
  }, [pathname]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
