import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.pdga.com" },
    ],
  },
  outputFileTracingIncludes: {
    "/api/leaderboard": ["./data/leaderboard.json.gz"],
  },
};

export default nextConfig;
