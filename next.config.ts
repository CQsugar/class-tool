import bundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

// Bundle Analyzer 配置
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 支持静态文件服务
  rewrites: async () => {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
