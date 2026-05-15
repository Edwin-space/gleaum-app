import Link from 'next/link';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
}

/**
 * 법률 문서 전용 레이아웃
 * - 랜딩 페이지와 동일한 독립형 레이아웃 (앱 사이드바/바텀네비 없음)
 * - 가독성을 위해 라이트 배경 유지
 * - 로그인 여부와 무관하게 접근 가능 (proxy.ts publicPaths에 /legal 포함)
 */
export function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <div
      className="landing-fullscreen"
      style={{
        minHeight: '100dvh',
        background: '#FAFAFD',
        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── 네비게이션 ── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(250,250,253,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '0 40px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* 로고 */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <GleaumLogoImg size={28} />
          <GleaumBI variant="dark" width={80} />
        </Link>

        {/* 페이지 제목 */}
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#1A1B2E',
          position: 'absolute',
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
          color: '#8E8E93',
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          홈으로
        </Link>
      </nav>

      {/* ── 본문 ── */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* ── 푸터 ── */}
      <footer style={{
        borderTop: '1px solid rgba(0,0,0,0.06)',
        padding: '24px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'white',
      }}>
        <p style={{ fontSize: '13px', color: '#8E8E93', margin: 0 }}>
          © 2026 글리움 (Gleaum). All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/legal/privacy" style={{ fontSize: '13px', color: '#0084CC', textDecoration: 'none' }}>
            개인정보처리방침
          </Link>
          <Link href="/legal/terms" style={{ fontSize: '13px', color: '#8E8E93', textDecoration: 'none' }}>
            이용약관
          </Link>
          <Link href="/legal/delete-account" style={{ fontSize: '13px', color: '#8E8E93', textDecoration: 'none' }}>
            계정 삭제
          </Link>
          <a href="mailto:helper@gleaum.com" style={{ fontSize: '13px', color: '#8E8E93', textDecoration: 'none' }}>
            문의
          </a>
        </div>
      </footer>
    </div>
  );
}
