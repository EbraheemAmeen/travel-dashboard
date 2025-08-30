import type { NextConfig } from 'next'

const nextConfig: NextConfig = {

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/avatars/**',
      },
    ],
  },
}

export default nextConfig
