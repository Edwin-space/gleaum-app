'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 앱 전체 하단 푸터
 * - 법적 문서 링크 제공 (Google OAuth 브랜딩 인증 요건 충족)
 * - 모든 페이지에 클라이언트 사이드로 포함 → 크롤러에서 인식 가능
 * - 랜딩 페이지(/)에서는 숨김 (랜딩 페이지 자체 푸터 사용)
 */
export function AppFooter() {
  const pathname = usePathname();

  // 랜딩 페이지에서는 자체 푸터를 사용하므로 AppFooter 숨김
  if (pathname === '/') return null;

  return (
    <footer
      style={{
        width: '100%',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(250,250,253,0.8)',
        fontSize: '12px',
        color: 'var(--theme-text-subtle)',
        marginTop: 'auto',
      }}
    >
      <span>© 2026 글리움 (Gleaum)</span>
      <Link
        href="/legal/privacy"
        style={{ color: '#0084CC', textDecoration: 'none' }}
      >
        개인정보처리방침
      </Link>
      <Link
        href="/legal/terms"
        style={{ color: 'var(--theme-text-subtle)', textDecoration: 'none' }}
      >
        이용약관
      </Link>
      <Link
        href="/legal/delete-account"
        style={{ color: 'var(--theme-text-subtle)', textDecoration: 'none' }}
      >
        계정 삭제
      </Link>
      <a
        href="mailto:helper@gleaum.com"
        style={{ color: 'var(--theme-text-subtle)', textDecoration: 'none' }}
      >
        문의
      </a>
    </footer>
  );
}
