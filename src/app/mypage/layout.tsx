import type { Metadata } from 'next';
export const metadata: Metadata = { title: '마이페이지 — 글리움' };
export default function MyPageLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
