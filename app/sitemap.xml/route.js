import { getDb } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yomitranslate.com';

export async function GET() {
    try {
        const db = getDb();
        
        // Get all series
        const series = db.prepare('SELECT id, slug, created_at FROM series ORDER BY created_at DESC').all();
        
        // Static pages
        const staticPages = [
            { url: '/', changefreq: 'daily', priority: '1.0' },
            { url: '/series', changefreq: 'daily', priority: '0.9' },
            { url: '/ranking', changefreq: 'daily', priority: '0.7' },
            { url: '/privacy', changefreq: 'monthly', priority: '0.3' },
            { url: '/terms', changefreq: 'monthly', priority: '0.3' },
        ];

        const now = new Date().toISOString().split('T')[0];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

        // Add static pages
        for (const page of staticPages) {
            xml += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
        }

        // Add series pages
        for (const s of series) {
            const slug = s.slug || s.id;
            const lastmod = s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : now;
            xml += `  <url>
    <loc>${BASE_URL}/series/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }

        xml += `</urlset>`;

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Sitemap generation error:', error);
        // Return a minimal sitemap on error
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/series</loc><priority>0.9</priority></url>
</urlset>`;
        return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
    }
}
