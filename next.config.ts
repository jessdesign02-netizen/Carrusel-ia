import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (formato estándar: <project>.supabase.co)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // fal.ai CDN — imágenes generadas con Flux
      {
        protocol: 'https',
        hostname: 'v2.fal.media',
      },
      {
        protocol: 'https',
        hostname: 'fal.run',
      },
      {
        protocol: 'https',
        hostname: '*.fal.ai',
      },
    ],
  },
}

export default nextConfig
