import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Firebase SDK — 동적 임포트로 서버 빌드 안전성 확보, transpile로 ESM 호환
  transpilePackages: ['firebase'],

  // .well-known 파일 (assetlinks.json 등) 올바른 Content-Type 서빙
  async headers() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
};

export default nextConfig;
