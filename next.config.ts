import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Firebase SDK — 동적 임포트로 서버 빌드 안전성 확보, transpile로 ESM 호환
  transpilePackages: ['firebase'],
};

export default nextConfig;
