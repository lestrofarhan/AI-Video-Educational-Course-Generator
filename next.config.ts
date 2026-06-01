import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["edge-tts"],
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
