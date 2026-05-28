import { redirect } from 'next/navigation';
import { isAdminUser } from '@/lib/admin-auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '관리자 — 글리움',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ok } = await isAdminUser();
  if (!ok) redirect('/home');
  return <>{children}</>;
}
