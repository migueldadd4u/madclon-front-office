import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.BASEPATH || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.BASEPATH ?? ''
  },
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false }
}

export default nextConfig
