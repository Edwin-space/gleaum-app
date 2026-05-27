import type { Metadata } from 'next';

export const metadata: Metadata = { title: '일정 상세 — 글리움' };

export default function ScheduleDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
