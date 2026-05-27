import type { Metadata } from 'next';
export const metadata: Metadata = { title: '가계부 — 글리움' };
export default function BudgetLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
