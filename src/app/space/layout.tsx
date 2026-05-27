import type { Metadata } from 'next';
export const metadata: Metadata = { title: '공간 관리 — 글리움' };
export default function SpaceLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
