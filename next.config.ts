import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(process.env.SUPABASE_URL ?? "https://supabase.co").hostname,
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
