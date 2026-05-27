import type { Metadata } from 'next';
export const metadata: Metadata = { title: '가족 — 글리움' };
export default function FamilyLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
