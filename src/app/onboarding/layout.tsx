import type { Metadata } from 'next';
export const metadata: Metadata = { title: '시작하기 — 글리움' };
export default function OnboardingLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
