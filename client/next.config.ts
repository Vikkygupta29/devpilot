import type { NextConfig } from "next";

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/repos",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/chat",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/overview",
        destination: "/dashboard/overview",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/dashboard/settings",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: "/oauth2/:path*",
        destination: `${BACKEND_URL}/oauth2/:path*`,
      },
      {
        source: "/login/oauth2/:path*",
        destination: `${BACKEND_URL}/login/oauth2/:path*`,
      },
    ];
  },
};

export default nextConfig;

