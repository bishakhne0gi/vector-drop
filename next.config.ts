import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["potrace", "sharp"],
  devIndicators: false,
};

export default nextConfig;
