import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  // Artwork is pre-encoded WebP; no runtime native image optimizer is needed.
  images: { unoptimized: true },
  outputFileTracingExcludes: {
    "next-server": ["**/node_modules/sharp/**/*", "**/node_modules/@img/**/*"],
    "/*": ["**/node_modules/sharp/**/*", "**/node_modules/@img/**/*"],
  },
};

export default nextConfig;
