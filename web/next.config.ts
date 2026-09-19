import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The workspace root sits above this package (docs + assets live there), so
  // pin Turbopack's root to avoid it picking up an unrelated lockfile.
  turbopack: {
    root: path.join(__dirname),
  },
  // The dev overlay badge sits on top of the sidebar and would show up in demo
  // recordings. Off by default; re-enable locally if you need the dev tools.
  devIndicators: false,
};

export default nextConfig;
