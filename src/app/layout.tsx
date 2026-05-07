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
        url: '/og_image.png',
        width: 1200,
        height: 630,
        alt: '글리움 — 나, 그리고 연인/가족의 일상 네트워크',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '글리움 — 나, 그리고 연인/가족의 일상 네트워크',
    description: '가족의 모든 일정을 한 곳에서 관리하는 공유 일정 앱',
    images: ['/og_image.png'],
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

        {/* ── Favicon 세트 ── */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />

        {/* ── Apple Touch Icons ── */}
        <link rel="apple-touch-icon" sizes="57x57"   href="/favicons/apple-touch-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60"   href="/favicons/apple-touch-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72"   href="/favicons/apple-touch-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76"   href="/favicons/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="96x96"   href="/favicons/apple-touch-icon-96x96.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/favicons/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/favicons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/favicons/apple-touch-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/favicons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon-180x180.png" />

        {/* ── iOS PWA 스플래시 스크린 (흰 화면 방지) ── */}
        {/* iPhone SE (640×1136) */}
        <link rel="apple-touch-startup-image" media="(device-width:320px) and (device-height:568px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)"  href="/splash/launch-640x1136.png" />
        <link rel="apple-touch-startup-image" media="(device-width:320px) and (device-height:568px) and (-webkit-device-pixel-ratio:2) and (orientation:landscape)" href="/splash/launch-1136x640.png" />
        {/* iPhone 8/7/6 (750×1334) */}
        <link rel="apple-touch-startup-image" media="(device-width:375px) and (device-height:667px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)"  href="/splash/launch-750x1334.png" />
        <link rel="apple-touch-startup-image" media="(device-width:375px) and (device-height:667px) and (-webkit-device-pixel-ratio:2) and (orientation:landscape)" href="/splash/launch-1334x750.png" />
        {/* iPhone 8 Plus / 6s Plus (1242×2208) */}
        <link rel="apple-touch-startup-image" media="(device-width:414px) and (device-height:736px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)"  href="/splash/launch-1242x2208.png" />
        <link rel="apple-touch-startup-image" media="(device-width:414px) and (device-height:736px) and (-webkit-device-pixel-ratio:3) and (orientation:landscape)" href="/splash/launch-2208x1242.png" />
        {/* iPhone X / XS / 11 Pro (1125×2436) */}
        <link rel="apple-touch-startup-image" media="(device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)"  href="/splash/launch-1125x2436.png" />
        <link rel="apple-touch-startup-image" media="(device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3) and (orientation:landscape)" href="/splash/launch-2436x1125.png" />
        {/* iPhone XR / 11 (828×1792) */}
        <link rel="apple-touch-startup-image" media="(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)"  href="/splash/launch-828x1792.png" />
        <link rel="apple-touch-startup-image" media="(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:2) and (orientation:landscape)" href="/splash/launch-1792x828.png" />
        {/* iPhone XS Max / 11 Pro Max (1242×2688) */}
        <link rel="apple-touch-startup-image" media="(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)"  href="/splash/launch-1242x2688.png" />
        <link rel="apple-touch-startup-image" media="(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:3) and (orientation:landscape)" href="/splash/launch-2688x1242.png" />
        {/* iPad (1536×2048) */}
        <link rel="apple-touch-startup-image" media="(device-width:768px) and (device-height:1024px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)"  href="/splash/launch-1536x2048.png" />
        <link rel="apple-touch-startup-image" media="(device-width:768px) and (device-height:1024px) and (-webkit-device-pixel-ratio:2) and (orientation:landscape)" href="/splash/launch-2048x1536.png" />
        {/* iPad Pro 10.5 / Air (1668×2224) */}
        <link rel="apple-touch-startup-image" media="(device-width:834px) and (device-height:1112px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)"  href="/splash/launch-1668x2224.png" />
        <link rel="apple-touch-startup-image" media="(device-width:834px) and (device-height:1112px) and (-webkit-device-pixel-ratio:2) and (orientation:landscape)" href="/splash/launch-2224x1668.png" />
        {/* iPad Pro 11 (1668×2388) */}
        <link rel="apple-touch-startup-image" media="(device-width:834px) and (device-height:1194px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)"  href="/splash/launch-1668x2388.png" />
        <link rel="apple-touch-startup-image" media="(device-width:834px) and (device-height:1194px) and (-webkit-device-pixel-ratio:2) and (orientation:landscape)" href="/splash/launch-2388x1668.png" />
        {/* iPad Pro 12.9 (2048×2732) */}
        <link rel="apple-touch-startup-image" media="(device-width:1024px) and (device-height:1366px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)"  href="/splash/launch-2048x2732.png" />
        <link rel="apple-touch-startup-image" media="(device-width:1024px) and (device-height:1366px) and (-webkit-device-pixel-ratio:2) and (orientation:landscape)" href="/splash/launch-2732x2048.png" />

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
