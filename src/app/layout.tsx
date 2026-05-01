import type { Metadata, Viewport } from 'next';
import PwaRegistry from '@/components/PwaRegistry';
import './globals.css';

export const metadata: Metadata = {
  title: '글리움 — 나, 그리고 연인/가족의 일상 네트워크',
  description: '가족의 모든 일정을 한 곳에서 관리하는 공유 일정 앱',
  manifest: '/manifest.json',
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
      </head>
      <body className="h-full">
        {/* 전역 프리미엄 메쉬 그라디언트 배경 */}
        <div className="mesh-bg">
          <div className="mesh-blob mesh-blob-1" />
          <div className="mesh-blob mesh-blob-2" />
          <div className="mesh-blob mesh-blob-3" />
        </div>
        <div id="app-shell">
          {children}
        </div>
        <PwaRegistry />
      </body>
    </html>
  );
}
