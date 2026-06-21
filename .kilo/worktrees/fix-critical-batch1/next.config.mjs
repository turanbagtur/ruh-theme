/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3', 'jsonwebtoken', 'sharp'],
  // Prevent Turbopack from statically tracing the uploads directory
  // (path.join calls in admin route would otherwise match thousands of files)
  outputFileTracingExcludes: {
    '*': [
      './public/uploads/**',
      './public/uploads/pages/**',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Performans: WebP/AVIF otomatik dönüşümü
    formats: ['image/avif', 'image/webp'],
    // Caching süresi (saniye) - 30 gün
    minimumCacheTTL: 2592000,
  },
  // Sayfa boyutunu küçültmek için compression
  compress: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/uploads/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      // NOT: /_next/static için özel header eklenmez — Next.js bunu otomatik yönetir
    ];
  },
  poweredByHeader: false,
  async redirects() {
    return [
      // /series/slug → /seri/slug (301 kalıcı yönlendirme)
      {
        source: '/series/:slug',
        destination: '/seri/:slug',
        permanent: true,
      },
      // /series/slug/chapter/N → /seri/slug/bolum/N
      {
        source: '/series/:slug/chapter/:chapterNumber',
        destination: '/seri/:slug/bolum/:chapterNumber',
        permanent: true,
      },
      // /series (liste sayfası)
      {
        source: '/series',
        destination: '/seri',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
