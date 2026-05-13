import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@google-analytics/data", "@grpc/grpc-js", "google-auth-library"],
};

export default nextConfig;
