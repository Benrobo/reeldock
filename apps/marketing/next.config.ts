import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@benrobo/iconary",
    "@reeldock/shared",
    "@reeldock/tailwind-config",
    "@reeldock/ui",
  ],
};

export default nextConfig;
