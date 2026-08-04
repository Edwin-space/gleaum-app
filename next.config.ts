import type { NextConfig } from "next";

// ── CSP / 보안 헤더 ──────────────────────────────────────────
// script-src에 'unsafe-inline'이 포함된 이유:
//   Next.js가 빌드 시 인라인 스크립트를 삽입하므로 제거 불가.
//   그러나 connect-src·img-src·object-src 제한으로 데이터 유출 경로를 차단.
const CSP = [
  "default-src 'self'",
  // 공개 웹은 소개·지원·약관·앱 연결만 제공한다. 웹 로그인·광고·FCM SDK는 로드하지 않는다.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  // 기존 PWA 설치본의 서비스워커 자가 해제만 허용한다.
  "worker-src 'self'",
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://www.googletagmanager.com",
  ].join(" "),
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // XSS 데이터 유출 경로 제한
  { key: "Content-Security-Policy", value: CSP },
  // 클릭재킹·교차 출처 창/리소스 격리
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  // MIME 스니핑 방지
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // 레퍼러 정보 최소화
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 불필요한 브라우저 기능 비활성화
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS 강제 (Vercel은 HTTPS만 서비스하므로 안전)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Firebase SDK — 동적 임포트로 서버 빌드 안전성 확보, transpile로 ESM 호환
  transpilePackages: ['firebase'],

  // ── 외부 이미지 도메인 허용 ───────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        // Supabase Storage (하우스 광고 이미지, 프로필 아바타 등)
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Google 프로필 사진
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },

  turbopack: {
    root: __dirname,
  },

  // ── 번들 최적화: 사용한 아이콘/함수만 포함 ──
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'sonner'],
  },

  async redirects() {
    return [
      {
        source: '/admin',
        destination: 'https://admins.gleaum.com',
        permanent: true,
      },
      {
        source: '/admin/:path*',
        destination: 'https://admins.gleaum.com/:path*',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      // `_next/static`은 Next.js가 해시 기반 immutable 캐시를 직접 관리한다.
      // 여기서 덮어쓰면 개발·재검증 동작이 깨질 수 있으므로 별도 헤더를 두지 않는다.
      // 공개 자산: 1일 캐시
      {
        source: '/(favicon.*|splash/.*|favicons/.*|manifest.json)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      // 보안 헤더
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // 검색엔진/AI 크롤러가 관리자·백엔드 운영 구간을 인덱싱하지 않도록 명시 차단
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/api/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/api/cron/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/api/support/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
        ],
      },
      ...[
        '/auth/callback',
        '/login/:path*',
        '/home/:path*',
        '/onboarding/:path*',
        '/schedules/:path*',
        '/space/:path*',
        '/budget/:path*',
        '/mypage/:path*',
        '/notifications/:path*',
        '/settings/:path*',
        '/family/:path*',
        '/invite/:path*',
      ].map((source) => ({
        source,
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
        ],
      })),
    ];
  },
};

export default nextConfig;
