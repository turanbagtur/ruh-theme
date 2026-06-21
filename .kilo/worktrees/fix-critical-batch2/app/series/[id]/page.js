import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import SeriesDetailClient from '@/components/SeriesDetailClient';

// Her istekte sunucu tarafında render et
export const dynamic = 'force-dynamic';

// Bot koruması: IP + UA SHA-256 hash (PII saklanmaz)
function getViewerHash(headersList) {
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
        || headersList.get('x-real-ip')
        || 'unknown';
    const ua = headersList.get('user-agent') || '';
    return crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 32);
}

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
    if (isNumeric && series.slug) {
        redirect(`/series/${series.slug}`);
    }

    // ─── Seri görüntülenme sayacı (bot korumalı, saatte 1 artış) ────────────
    try {
        const headersList = await headers();
        const viewerHash = getViewerHash(headersList);
        const recentView = db.prepare(`
            SELECT id FROM series_views_log
            WHERE series_id = ? AND viewer_hash = ? AND created_at >= datetime('now', '-1 hour')
            LIMIT 1
        `).get(series.id, viewerHash);

        if (!recentView) {
            db.prepare('UPDATE series SET views = COALESCE(views, 0) + 1 WHERE id = ?').run(series.id);
            db.prepare('INSERT INTO series_views_log (series_id, viewer_hash) VALUES (?, ?)').run(series.id, viewerHash);
            // Güncel views değerini seri objesine yansıt
            series.views = (series.views || 0) + 1;
        }
    } catch { /* görüntülenme takibi kritik değil, hata sayfa yüklenmesini engellemesin */ }

    // ─── Bölümleri çek ───────────────────────────────────────────────────────
    const chaptersRaw = db.prepare(
        'SELECT *, COALESCE(views, 0) as chapter_views FROM chapters WHERE series_id = ? ORDER BY chapter_number ASC'
    ).all(series.id);

    // ─── read_history tablosundan benzersiz kullanıcı okuma sayısı ──────────
    // UNIQUE(user_id, chapter_id) kısıtı sayesinde COUNT(*) = COUNT(DISTINCT user_id)
    const readCounts = db.prepare(`
        SELECT chapter_id, COUNT(*) as rh_count
        FROM read_history
        WHERE chapter_id IN (SELECT id FROM chapters WHERE series_id = ?)
        GROUP BY chapter_id
    `).all(series.id);

    const readCountByChapter = {};
    for (const row of readCounts) {
        readCountByChapter[row.chapter_id] = row.rh_count;
    }

    // read_count: chapter.views (tüm ziyaretçiler) ile read_history sayısının büyüğü
    // Bu, API /api/series/[id] ile birebir aynı formülü kullanır
    const chapters = chaptersRaw.map(ch => ({
        ...ch,
        read_count: Math.max(ch.chapter_views || 0, readCountByChapter[ch.id] || 0),
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
    const chaptersData = JSON.parse(JSON.stringify(chapters));
    const relatedData = JSON.parse(JSON.stringify(relatedSeries));

    return (
        <SeriesDetailClient
            series={seriesData}
            chapters={chaptersData}
            relatedSeries={relatedData}
        />
    );
}
