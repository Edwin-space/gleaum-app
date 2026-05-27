import type { Metadata } from 'next';
export const metadata: Metadata = { title: '자녀 일정 — 글리움' };
export default function ChildrenLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
