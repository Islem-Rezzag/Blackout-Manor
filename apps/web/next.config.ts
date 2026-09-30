import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  reactStrictMode: true,
  devIndicators: false,
  transpilePackages: ["@blackout-manor/client-game"],
};

export default nextConfig;
