import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '글리움 — 반짝이는 글이 모여있는 공간',
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
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=Noto+Sans+KR:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-[var(--color-canvas-parchment)]">
        {/* 배경 블롭 그래픽 */}
        <div className="blob-1" />
        <div className="blob-2" />
        <div className="blob-3" />
        <div id="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
