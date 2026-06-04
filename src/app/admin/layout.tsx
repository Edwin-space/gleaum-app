import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: '글리움 관리자' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, name')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/home');

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--theme-surface-muted)', fontFamily: 'system-ui, sans-serif' }}>
      {/* 관리자 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#1A1B2E', color: 'white',
        padding: '0 24px',
        height: 56,
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>
          글리움 백오피스
        </span>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
          {[
            { href: '/admin/ads', label: '광고 관리' },
          ].map(({ href, label }) => (
            <a key={href} href={href} style={{
              padding: '6px 14px', borderRadius: 8,
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {label}
            </a>
          ))}
        </nav>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          {profile.name}
        </span>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  );
}
