import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second dev server in this folder (e.g. a preview next to another one) needs its own build
  // directory: `next dev` allows one server per directory.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    // The assistant consent page can't be framed (so no page can trick a click on Allow).
    return [{ source: "/oauth/:path*", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }] }];
  },
};

export default nextConfig;
