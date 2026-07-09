import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import Script from 'next/script';
import PwaRegistry from '@/components/PwaRegistry';
import './globals.css';

// ── Outfit: next/font 자동 최적화 (같은 도메인 서빙, 렌더 차단 없음) ──
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
  preload: true,
});
import { FCMProvider } from '@/components/FCMProvider';
import { PWARegister } from '@/components/PWARegister';
import { LazyPWABanner } from '@/components/LazyPWABanner';
import { Toaster } from 'sonner';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { NativeAppProvider } from '@/components/NativeAppProvider';
import { NativeBiometricGate } from '@/components/NativeBiometricGate';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppFooter } from '@/components/layout/AppFooter';
import { FirebaseServicesProvider } from '@/components/FirebaseServicesProvider';

const themeInitScript = `
(function(){
  try {
    var key = 'gleaum:theme-mode';
    var mode = localStorage.getItem(key) || 'system';
    if (mode !== 'light' && mode !== 'dark' && mode !== 'system') mode = 'system';
    var resolved = mode === 'system'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch (_) {
    document.documentElement.dataset.themeMode = 'system';
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;

const SITE_URL = 'https://gleaum.com';
const ANDROID_PACKAGE = 'com.gleaum.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: '글리움 - 나, 그리고 연인/가족/모임 모든 일상 네트워크',
  description: '나, 그리고 연인, 가족 등 공간을 통한 일상 네트워크를 한 곳에서 도와 드립니다.',
  keywords: ['글리움', '가족 일정 관리', '공유 캘린더', '커플 앱', '일상 네트워크', '모임 관리', '가족 앱', 'gleaum'],
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
    title: '글리움 - 나, 그리고 연인/가족/모임 모든 일상 네트워크',
    description: '나, 그리고 연인, 가족 등 공간을 통한 일상 네트워크를 한 곳에서 도와 드립니다.',
    url: 'https://gleaum.com',
    siteName: '글리움 (Gleaum)',
    images: [
      {
        url: '/img/og_image.png',
        width: 1024,
        height: 541,
        alt: '글리움 - 나, 그리고 연인/가족/모임 모든 일상 네트워크',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '글리움 - 나, 그리고 연인/가족/모임 모든 일상 네트워크',
    description: '나, 그리고 연인, 가족 등 공간을 통한 일상 네트워크를 한 곳에서 도와 드립니다.',
    images: ['/img/og_image.png'],
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
    canonical: SITE_URL,
  },
  appLinks: {
    android: {
      package: ANDROID_PACKAGE,
      app_name: '글리움',
      url: SITE_URL,
    },
    web: {
      url: SITE_URL,
      should_fallback: true,
    },
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
  // safe-area-inset 값을 CSS env() 변수로 노출시켜 BottomNav 등이 safe area까지 확장 가능
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* ── Supabase 연결 사전 설정 ── */}
        <link rel="preconnect" href="https://lbzroynnmcvjnpqopagg.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://lbzroynnmcvjnpqopagg.supabase.co" />
        <link rel="preconnect" href="https://play.google.com" />
        <link rel="alternate" href={`android-app://${ANDROID_PACKAGE}/https/gleaum.com`} />
        <link rel="alternate" href={`android-app://${ANDROID_PACKAGE}/https/www.gleaum.com`} />

        {/* ── Pretendard: preconnect + non-blocking async load ──────────────
            Outfit은 next/font로 처리 (같은 도메인, 렌더 차단 없음)
            Pretendard은 CDN에서 비차단 로드 (rel="preload" as="style" + onload)
        ──────────────────────────────────────────────────────────────── */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* React는 문자열 onLoad 핸들러를 무시하므로 media="print" 트릭이 동작하지 않아
            폰트가 영구히 미적용되는 버그가 있었음. 위 preload 덕분에 일반 stylesheet로
            로드해도 렌더 차단 시간은 미미함. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
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
      <body className={`h-full ${outfit.variable}`}>
        <ThemeProvider>
          {/* 전역 프리미엄 메쉬 그라디언트 배경 */}
          <div className="mesh-bg">
            <div className="mesh-blob mesh-blob-1" />
            <div className="mesh-blob mesh-blob-2" />
            <div className="mesh-blob mesh-blob-3" />
          </div>
          <NativeAppProvider>
            <FirebaseServicesProvider>
              <div id="app-shell">
                <DesktopSidebar />
                <div className="pc-content-area w-full">
                  <PWARegister />
                  <LazyPWABanner />
                  <FCMProvider>
                    {children}
                  </FCMProvider>
                </div>
              </div>
            </FirebaseServicesProvider>
          </NativeAppProvider>
          <NativeBiometricGate />
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
                background: 'var(--theme-surface)',
                color: 'var(--theme-text)',
                boxShadow: 'var(--theme-shadow-modal)',
                border: '1px solid var(--theme-border)',
              },
            }}
            offset={96}
            richColors
          />
          <AppFooter />
          <PwaRegistry />
          <Analytics />
          <SpeedInsights />
          <GoogleAnalytics />
          {/* ── Google AdSense (자체 광고 없을 때 폴백) ── */}
          {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
            <Script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
