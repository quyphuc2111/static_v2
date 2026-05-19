import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        // Disable caching for all uploaded content (HTML, assets, etc.)
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ]
  },
  trailingSlash: false,

  // Allow large file uploads up to 1GB for ZIP content packages
  experimental: {
    serverActions: {
      bodySizeLimit: '1024mb',
    },
    middlewareClientMaxBodySize: '1024mb',
  },
};

export default nextConfig;
