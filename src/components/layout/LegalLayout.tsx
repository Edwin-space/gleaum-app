import Link from 'next/link';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
  variant?: 'web' | 'app';
}

/**
 * 법률 문서 전용 레이아웃
 * - 랜딩 페이지와 동일한 다크 테마 (#08080E)
 * - 앱 사이드바/바텀네비 없음 (DesktopSidebar, BottomNav에서 /legal 경로 제외 처리)
 * - 로그인 여부와 무관하게 접근 가능 (proxy.ts publicPaths /legal 포함)
 */
export function LegalLayout({ title, children, variant = 'web' }: LegalLayoutProps) {
  const isAppView = variant === 'app';

  return (
    <div
      className="landing-fullscreen"
      style={{
        minHeight: '100dvh',
        background: '#08080E',
        color: 'white',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* 배경 블롭 */}
      {!isAppView && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-150px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,132,204,0.1), transparent 70%)', filter: 'blur(70px)' }} />
          <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(12,201,181,0.07), transparent 70%)', filter: 'blur(70px)' }} />
        </div>
      )}

      {/* ── 네비게이션 ── */}
      {!isAppView && (
        <nav style={{
          position: 'sticky' as const,
          top: 0,
          zIndex: 100,
          background: 'rgba(8,8,14,0.88)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 48px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* 로고 */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <GleaumLogoImg size={28} />
            <GleaumBI variant="white" width={80} />
          </Link>

          {/* 페이지 제목 */}
          <span style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            position: 'absolute' as const,
            left: '50%',
            transform: 'translateX(-50%)',
          }}>
            {title}
          </span>

          {/* 홈으로 */}
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            홈으로
          </Link>
        </nav>
      )}

      {/* ── 본문 ── */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1, width: '100%' }}>
        {children}
      </main>

      {/* ── 푸터 ── */}
      {!isAppView && (
        <footer style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '24px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            © 2026 글리움 (Gleaum). All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              { label: '개인정보처리방침', href: '/legal/privacy' },
              { label: '이용약관', href: '/legal/terms' },
              { label: '계정 삭제', href: '/legal/delete-account' },
              { label: '문의', href: 'mailto:helper@gleaum.com' },
            ].map(({ label, href }) => (
              <a key={label} href={href} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                {label}
              </a>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
