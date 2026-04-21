import { notFound, redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import SeriesDetailClient from '@/components/SeriesDetailClient';

// Madde 8: generateStaticParams — popüler serileri build time'da pre-render et
export async function generateStaticParams() {
    try {
        const db = getDb();
        // En çok görüntülenen / en yüksek puanlı top 50 seriyi pre-render et
        const topSeries = db.prepare(`
            SELECT slug, id FROM series
            WHERE published = 1 AND slug IS NOT NULL AND slug != ''
            ORDER BY views DESC, rating DESC
            LIMIT 50
        `).all();
        return topSeries.map(s => ({ id: s.slug || String(s.id) }));
    } catch {
        return [];
    }
}

// ISR: sayfaları saatte bir yenile
export const revalidate = 3600;

export default async function SeriesDetailPage({ params }) {
    const { id } = await params;

    const db = getDb();
    const isNumeric = /^\d+$/.test(id);

    const series = isNumeric
        ? db.prepare('SELECT * FROM series WHERE id = ? AND published = 1').get(id)
        : db.prepare('SELECT * FROM series WHERE slug = ? AND published = 1').get(id);

    if (!series) {
        notFound();
    }

    // Madde 7: Numeric ID → slug 301 redirect
    // If accessed by numeric ID but series has a slug, permanently redirect to slug URL
    if (isNumeric && series.slug) {
        redirect(`/series/${series.slug}`);
    }

    // Fetch chapters with available languages
    const chapters = db.prepare(`
        SELECT ch.*,
               GROUP_CONCAT(DISTINCT ct.language) as availableLanguagesList
        FROM chapters ch
        LEFT JOIN chapter_translations ct ON ct.chapter_id = ch.id
        WHERE ch.series_id = ?
        GROUP BY ch.id
        ORDER BY ch.chapter_number ASC
    `).all(series.id).map(ch => ({
        ...ch,
        availableLanguages: ch.availableLanguagesList
            ? ch.availableLanguagesList.split(',').filter(Boolean)
            : [],
        availableLanguagesList: undefined,
    }));

    // Fetch related series (server-side)
    let relatedSeries = [];
    try {
        const genres = series.genres
            ? (Array.isArray(series.genres)
                ? series.genres
                : (() => { try { return JSON.parse(series.genres); } catch { return []; } })())
            : [];
        if (genres.length > 0) {
            const allSeries = db.prepare(
                'SELECT id, title, slug, cover_url, genres, status, type, rating, views FROM series WHERE published = 1 AND id != ? LIMIT 50'
            ).all(series.id);
            relatedSeries = allSeries.filter(s => {
                const sg = s.genres
                    ? (Array.isArray(s.genres)
                        ? s.genres
                        : (() => { try { return JSON.parse(s.genres); } catch { return []; } })())
                    : [];
                return genres.some(g => sg.includes(g));
            }).slice(0, 6);
        }
    } catch { }

    // Serialize safely for client component props
    const seriesData = JSON.parse(JSON.stringify(series));
    const chaptersData = JSON.parse(JSON.stringify(
        chapters.map(ch => { const { availableLanguagesList, ...rest } = ch; return rest; })
    ));
    const relatedData = JSON.parse(JSON.stringify(relatedSeries));

    return (
        <SeriesDetailClient
            series={seriesData}
            chapters={chaptersData}
            relatedSeries={relatedData}
        />
    );
}
