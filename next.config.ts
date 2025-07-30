import type { NextConfig } from 'next'

const nextConfig: NextConfig = {

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/nestjsstorage/**',
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
