/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3', 'jsonwebtoken', 'sharp'],
  // Prevent Turbopack from statically tracing the uploads directory
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
    // Cihaz boyutları: gereksiz breakpoint'leri kaldır, sadece kullanılanlar
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  // Gzip/Brotli compression
  compress: true,
  // X-Powered-By header'ını kaldır (küçük güvenlik + gereksiz byte)
  poweredByHeader: false,
  // Üretimde console.log'ları kaldır (bundle küçülür, runtime hızlanır)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
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
        // Kullanıcı yükleme görselleri — 30 gün cache
        source: '/uploads/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        // Public statik dosyalar (icon, manifest vb.) — 7 gün cache
        source: '/:file(.*\\.(?:png|ico|svg|webp|jpg|jpeg|gif|woff2|woff))',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      // NOT: /_next/static için özel header eklenmez — Next.js bunu otomatik yönetir
    ];
  },
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
