import type { Metadata, Viewport } from 'next';
import PwaRegistry from '@/components/PwaRegistry';
import './globals.css';
import { FCMProvider } from '@/components/FCMProvider';
import { PWARegister } from '@/components/PWARegister';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { Toaster } from 'sonner';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';

import { BottomNav } from '@/components/layout/BottomNav';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  metadataBase: new URL('https://gleaum.com'),
  title: '글리움 — 나, 그리고 연인/가족의 일상 네트워크',
  description: '가족의 모든 일정을 한 곳에서 관리하는 공유 일정 앱',
  keywords: ['글리움', '가족 일정 관리', '공유 캘린더', '가족 앱', '일상 네트워크', 'gleaum'],
  manifest: '/manifest.json',
  authors: [{ name: 'Gleaum Team' }],
  creator: 'Gleaum',
  publisher: 'Gleaum',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: '글리움 — 나, 그리고 연인/가족의 일상 네트워크',
    description: '가족의 모든 일정을 한 곳에서 관리하는 공유 일정 앱',
    url: 'https://gleaum.com',
    siteName: '글리움 (Gleaum)',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: '글리움 로고',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '글리움 — 나, 그리고 연인/가족의 일상 네트워크',
    description: '가족의 모든 일정을 한 곳에서 관리하는 공유 일정 앱',
    images: ['/icons/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      'naver-site-verification': ['a11d809e520e40f6fe379b615dd1ca5ad20e4240'],
    },
  },
  alternates: {
    canonical: 'https://gleaum.com',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '글리움',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FAFAFD',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full">
        {/* 전역 프리미엄 메쉬 그라디언트 배경 */}
        <div className="mesh-bg">
          <div className="mesh-blob mesh-blob-1" />
          <div className="mesh-blob mesh-blob-2" />
          <div className="mesh-blob mesh-blob-3" />
        </div>
        <div id="app-shell">
          <DesktopSidebar />
          <div className="pc-content-area w-full">
            <PWARegister />
            <PWAInstallBanner />
            <FCMProvider>
              {children}
            </FCMProvider>
          </div>
        </div>
        {/* 최상위 루트 네비게이션 (z-index: 9999) */}
        <BottomNav />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              borderRadius: '16px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.8)',
            },
          }}
          offset={96}
          richColors
        />
        <PwaRegistry />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
