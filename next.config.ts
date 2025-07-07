import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.137.1',
        port: '9000',
        pathname: '/nestjsstorage/**',
      },
      // Add other patterns if needed
    ],
  },
};

export default nextConfig;
