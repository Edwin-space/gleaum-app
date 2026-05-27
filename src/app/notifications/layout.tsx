import type { Metadata } from 'next';
export const metadata: Metadata = { title: '알림 — 글리움' };
export default function NotificationsLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
