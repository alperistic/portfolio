import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // /en/ → out/en/index.html: funktioniert auf jedem statischen Host ohne Rewrites.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
