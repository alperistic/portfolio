import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // /en/ → out/en/index.html: funktioniert auf jedem statischen Host ohne Rewrites.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Eigene 404 (app/global-not-found.tsx): nötig, weil es zwei Root-Layouts gibt.
  experimental: {
    globalNotFound: true,
  },
};

export default nextConfig;
