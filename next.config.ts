import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path((?!auth).*)',
        destination: 'http://localhost:5000/api/:path*', // Proxy to Backend
      },
    ]
  },
};

export default nextConfig;
