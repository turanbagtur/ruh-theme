import { getDb } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yomitranslate.com';

export async function generateMetadata({ params }) {
    const { id, chapterNumber } = await params;
    try {
        const db = getDb();
        const isNumeric = /^\d+$/.test(id);
        const series = isNumeric
            ? db.prepare('SELECT id, title, slug, cover_url, genres FROM series WHERE id = ? AND published = 1').get(id)
            : db.prepare('SELECT id, title, slug, cover_url, genres FROM series WHERE slug = ? AND published = 1').get(id);

        if (!series) return { title: 'YomiTranslate', robots: { index: false } };

        const chapter = db.prepare(
            'SELECT id, title, chapter_number FROM chapters WHERE series_id = ? AND chapter_number = ?'
        ).get(series.id, parseFloat(chapterNumber));

        const slug = series.slug || series.id;
        const chNum = chapter?.chapter_number ?? chapterNumber;
        const chTitle = chapter?.title ? ` — ${chapter.title}` : '';
        const canonicalUrl = `${BASE_URL}/series/${slug}/chapter/${chNum}`;
        const coverUrl = series.cover_url
            ? (series.cover_url.startsWith('http') ? series.cover_url : `${BASE_URL}${series.cover_url}`)
            : `${BASE_URL}/icon-512.png`;

        const title = `${series.title} Chapter ${chNum}${chTitle} | YomiTranslate`;
        const description = `Read ${series.title} Chapter ${chNum}${chTitle} online for free with AI translation on YomiTranslate.`;

        return {
            title,
            description,
            alternates: { canonical: canonicalUrl },
            openGraph: {
                type: 'article',
                url: canonicalUrl,
                siteName: 'YomiTranslate',
                title,
                description,
                images: [{ url: coverUrl, alt: `${series.title} cover` }],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [coverUrl],
            },
        };
    } catch {
        return { title: 'YomiTranslate — Read Manga Online' };
    }
}

// Madde 2+3: JSON-LD doğrudan script tag + BreadcrumbList for chapters
async function ChapterJsonLd({ id, chapterNumber }) {
    try {
        const db = getDb();
        const isNumeric = /^\d+$/.test(id);
        const series = isNumeric
            ? db.prepare('SELECT id, title, slug, cover_url FROM series WHERE id = ? AND published = 1').get(id)
            : db.prepare('SELECT id, title, slug, cover_url FROM series WHERE slug = ? AND published = 1').get(id);

        if (!series) return null;

        const chapter = db.prepare(
            'SELECT id, title, chapter_number FROM chapters WHERE series_id = ? AND chapter_number = ?'
        ).get(series.id, parseFloat(chapterNumber));

        const slug = series.slug || series.id;
        const chNum = chapter?.chapter_number ?? chapterNumber;
        const chTitle = chapter?.title ? ` — ${chapter.title}` : '';
        const seriesUrl = `${BASE_URL}/series/${slug}`;
        const canonicalUrl = `${seriesUrl}/chapter/${chNum}`;
        const coverUrl = series.cover_url
            ? (series.cover_url.startsWith('http') ? series.cover_url : `${BASE_URL}${series.cover_url}`)
            : `${BASE_URL}/icon-512.png`;

        const comicIssueSchema = {
            '@context': 'https://schema.org',
            '@type': 'ComicIssue',
            '@id': `${canonicalUrl}#chapter`,
            name: `${series.title} Chapter ${chNum}${chTitle}`,
            issueNumber: String(chNum),
            url: canonicalUrl,
            image: {
                '@type': 'ImageObject',
                url: coverUrl,
            },
            isPartOf: {
                '@type': 'ComicSeries',
                '@id': `${seriesUrl}#series`,
                name: series.title,
                url: seriesUrl,
            },
            publisher: {
                '@type': 'Organization',
                name: 'YomiTranslate',
                url: BASE_URL,
                logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon-512.png` },
            },
        };

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
                    item: seriesUrl,
                },
                {
                    '@type': 'ListItem',
                    position: 4,
                    name: `Chapter ${chNum}`,
                    item: canonicalUrl,
                },
            ],
        };

        return (
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(comicIssueSchema) }}
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

export default async function ChapterLayout({ children, params }) {
    const { id, chapterNumber } = await params;
    return (
        <>
            <ChapterJsonLd id={id} chapterNumber={chapterNumber} />
            {children}
        </>
    );
}