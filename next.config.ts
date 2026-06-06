// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },       // UploadThing
      { protocol: 'https', hostname: '*.ufs.sh' },       // UploadThing CDN
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
}

export default nextConfig
