import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["edge-tts"],
  /* config options here */
  reactCompiler: true,
  typescript: {
    // 🚀 This tells Next.js to successfully build even if
    // shadcn components or third-party packages have type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
