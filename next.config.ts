import type { NextConfig } from "next";

// ── CSP / 보안 헤더 ──────────────────────────────────────────
// script-src에 'unsafe-inline'이 포함된 이유:
//   Next.js가 빌드 시 인라인 스크립트를 삽입하므로 제거 불가.
//   그러나 connect-src·img-src·object-src 제한으로 데이터 유출 경로를 차단.
const CSP = [
  "default-src 'self'",
  // Next.js 인라인 스크립트 + Google 서비스 (GA4, OAuth, Maps) + 카카오 AdFit
  // www.gstatic.com: firebase-messaging-sw.js의 importScripts(FCM SDK) — 누락 시 SW 평가 실패로 웹 푸시 전체 미작동
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://accounts.google.com https://maps.googleapis.com https://www.gstatic.com https://t1.kakaocdn.net https://*.daumcdn.net",
  // cdn.jsdelivr.net: Pretendard 폰트 CSS/woff2
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://t1.kakaocdn.net https://*.daumcdn.net",
  // 외부 이미지: Google 프로필, Supabase Storage
  "img-src 'self' data: blob: https: ",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  // 서비스워커(sw.js, firebase-messaging-sw.js)는 same-origin만 허용
  "worker-src 'self'",
  // XHR/fetch 허용 도메인 — 이 목록 외 도메인으로의 데이터 전송 차단
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://firebaseinstallations.googleapis.com",
    "https://fcmregistrations.googleapis.com",
    "https://firebase.googleapis.com",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://www.googletagmanager.com",
    "https://maps.googleapis.com",
    "https://t1.kakaocdn.net",
    "https://*.daumcdn.net",
    "https://*.kakao.com",
    "https://*.daum.net",
  ].join(" "),
  // 카카오 AdFit 광고 iframe
  "frame-src https://accounts.google.com https://t1.kakaocdn.net https://*.daumcdn.net https://*.kakao.com",
  // Flash/ActiveX 완전 차단
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // XSS 데이터 유출 경로 제한
  { key: "Content-Security-Policy", value: CSP },
  // 클릭재킹 방지
  { key: "X-Frame-Options", value: "DENY" },
  // MIME 스니핑 방지
  { key: "X-Content-Type-Options", value: "nosniff" },
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

  // ── 번들 최적화: 사용한 아이콘/함수만 포함 ──
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'sonner'],
  },

  async headers() {
    return [
      // 정적 자산(JS/CSS/폰트): 1년 불변 캐시 (hash 포함 파일명)
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
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
    ];
  },
};

export default nextConfig;
