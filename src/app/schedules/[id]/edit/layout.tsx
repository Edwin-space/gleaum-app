import type { Metadata } from 'next';

export const metadata: Metadata = { title: '일정 수정 — 글리움' };

export default function EditScheduleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
