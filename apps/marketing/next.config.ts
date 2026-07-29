import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@benrobo/iconary", "@reeldock/shared"],
};

export default nextConfig;
