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

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'ComicIssue',
            name: `${series.title} Chapter ${chNum}${chTitle}`,
            issueNumber: String(chNum),
            url: canonicalUrl,
            image: coverUrl,
            isPartOf: {
                '@type': 'ComicSeries',
                name: series.title,
                url: `${BASE_URL}/series/${slug}`,
            },
            publisher: {
                '@type': 'Organization',
                name: 'YomiTranslate',
                url: BASE_URL,
            },
        };

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
            other: {
                'script:ld+json': JSON.stringify(jsonLd),
            },
        };
    } catch {
        return { title: 'YomiTranslate — Read Manga Online' };
    }
}

export default function ChapterLayout({ children }) {
    return children;
}