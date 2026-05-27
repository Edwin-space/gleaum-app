import type { Metadata } from 'next';
export const metadata: Metadata = { title: '일정 — 글리움' };
export default function SchedulesLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
