import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  ...(process.env.NEXT_BUILD_STANDALONE === "true" && {
    output: "standalone",
  }),
};

export default nextConfig;
