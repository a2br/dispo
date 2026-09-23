import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second dev server in this folder (e.g. a preview next to another one) needs its own build
  // directory: `next dev` allows one server per directory.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
