import { AdminDashboard } from './AdminDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '관리자 대시보드 — 글리움',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
