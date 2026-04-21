import { getDb } from '@/lib/db';
import { SUPPORTED_LANGUAGES } from '@/lib/torii';

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

        const genres = series.genres
            ? (() => { try { return JSON.parse(series.genres); } catch { return series.genres.split(',').map(g => g.trim()).filter(Boolean); } })()
            : [];

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

        // Madde 10: Hreflang alternates — each supported language via ?lang=XX
        const languageAlternates = {};
        for (const lang of SUPPORTED_LANGUAGES) {
            languageAlternates[lang.code] = `${canonicalUrl}?lang=${lang.code}`;
        }

        return {
            title: `${series.title} — Read Online | YomiTranslate`,
            description,
            keywords,
            alternates: {
                canonical: canonicalUrl,
                languages: {
                    'x-default': canonicalUrl,
                    ...languageAlternates,
                },
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
        };
    } catch {
        return {
            title: 'YomiTranslate — Read Manga Online',
        };
    }
}

// Madde 2+3: JSON-LD doğrudan script tag ile + BreadcrumbList
async function SeriesJsonLd({ id }) {
    try {
        const db = getDb();
        const isNumeric = /^\d+$/.test(id);
        const series = isNumeric
            ? db.prepare('SELECT * FROM series WHERE id = ? AND published = 1').get(id)
            : db.prepare('SELECT * FROM series WHERE slug = ? AND published = 1').get(id);

        if (!series) return null;

        const slug = series.slug || series.id;
        const canonicalUrl = `${BASE_URL}/series/${slug}`;
        const coverUrl = series.cover_url
            ? (series.cover_url.startsWith('http') ? series.cover_url : `${BASE_URL}${series.cover_url}`)
            : `${BASE_URL}/icon-512.png`;

        const genres = series.genres
            ? (() => { try { return JSON.parse(series.genres); } catch { return series.genres.split(',').map(g => g.trim()).filter(Boolean); } })()
            : [];

        const description = series.description
            ? series.description.slice(0, 155).replace(/\s+$/, '') + (series.description.length > 155 ? '…' : '')
            : `Read ${series.title} manga online for free with AI translation on YomiTranslate.`;

        const comicSeriesSchema = {
            '@context': 'https://schema.org',
            '@type': 'ComicSeries',
            '@id': `${canonicalUrl}#series`,
            name: series.title,
            description,
            url: canonicalUrl,
            image: {
                '@type': 'ImageObject',
                url: coverUrl,
                width: 460,
                height: 650,
            },
            genre: genres,
            ...(series.author ? { author: { '@type': 'Person', name: series.author } } : {}),
            publisher: {
                '@type': 'Organization',
                name: 'YomiTranslate',
                url: BASE_URL,
                logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon-512.png` },
            },
            ...(series.status ? { creativeWorkStatus: series.status } : {}),
        };

        // BreadcrumbList schema
        const breadcrumbSchema = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: BASE_URL,
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Browse',
                    item: `${BASE_URL}/series`,
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: series.title,
                    item: canonicalUrl,
                },
            ],
        };

        return (
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(comicSeriesSchema) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
                />
            </>
        );
    } catch {
        return null;
    }
}

export default async function SeriesLayout({ children, params }) {
    const { id } = await params;
    return (
        <>
            <SeriesJsonLd id={id} />
            {children}
        </>
    );
}