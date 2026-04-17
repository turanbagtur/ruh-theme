import { getDb } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yomitranslate.com';

// Server component: generates per-series metadata for SEO
export async function generateMetadata({ params }) {
    const { id } = await params;
    try {
        const db = getDb();
        const isNumeric = /^\d+$/.test(id);
        const series = isNumeric
            ? db.prepare('SELECT * FROM series WHERE id = ? AND published = 1').get(id)
            : db.prepare('SELECT * FROM series WHERE slug = ? AND published = 1').get(id);

        if (!series) {
            return {
                title: 'Series Not Found | YomiTranslate',
                robots: { index: false },
            };
        }

        const slug = series.slug || series.id;
        const canonicalUrl = `${BASE_URL}/series/${slug}`;
        const coverUrl = series.cover_url
            ? (series.cover_url.startsWith('http') ? series.cover_url : `${BASE_URL}${series.cover_url}`)
            : `${BASE_URL}/icon-512.png`;

        const genres = series.genres ? series.genres.split(',').map(g => g.trim()).filter(Boolean) : [];
        const genreText = genres.length > 0 ? genres.slice(0, 4).join(', ') : 'manga';

        const description = series.description
            ? series.description.slice(0, 155).replace(/\s+$/, '') + (series.description.length > 155 ? '…' : '')
            : `Read ${series.title} manga online for free with AI translation on YomiTranslate.`;

        const keywords = [
            series.title,
            `${series.title} manga`,
            `${series.title} read online`,
            `${series.title} chapters`,
            `${series.title} AI translation`,
            ...genres,
            'manga', 'read manga online', 'yomitranslate',
            series.type || '',
        ].filter(Boolean).join(', ');

        // JSON-LD structured data
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'ComicSeries',
            name: series.title,
            description: description,
            url: canonicalUrl,
            image: coverUrl,
            genre: genres,
            ...(series.author ? { author: { '@type': 'Person', name: series.author } } : {}),
            publisher: {
                '@type': 'Organization',
                name: 'YomiTranslate',
                url: BASE_URL,
            },
            ...(series.status ? { creativeWorkStatus: series.status } : {}),
        };

        return {
            title: `${series.title} — Read Online | YomiTranslate`,
            description,
            keywords,
            alternates: {
                canonical: canonicalUrl,
            },
            openGraph: {
                type: 'book',
                url: canonicalUrl,
                siteName: 'YomiTranslate',
                title: `${series.title} — Read Manga Online | YomiTranslate`,
                description,
                images: [{
                    url: coverUrl,
                    width: 460,
                    height: 650,
                    alt: `${series.title} cover`,
                }],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${series.title} — Read Online`,
                description,
                images: [coverUrl],
            },
            other: {
                'script:ld+json': JSON.stringify(jsonLd),
            },
        };
    } catch {
        return {
            title: 'YomiTranslate — Read Manga Online',
        };
    }
}

export default function SeriesLayout({ children }) {
    return children;
}