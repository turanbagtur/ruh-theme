import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;

        // per_page: önce query param, yoksa admin ayarı, yoksa varsayılan 16
        let perPage = parseInt(searchParams.get('limit')) || 0;
        if (!perPage) {
            const setting = db.prepare(`SELECT value FROM app_settings WHERE key = 'updates_per_page'`).get();
            perPage = setting ? (parseInt(setting.value) || 16) : 16;
        }
        const offset = (page - 1) * perPage;

        // Toplam seri sayısı (sayfalama için)
        const totalRow = db.prepare(`
            SELECT COUNT(DISTINCT s.id) as total
            FROM series s
            JOIN chapters ch ON s.id = ch.series_id
            WHERE s.published = 1
        `).get();
        const total = totalRow?.total || 0;

        // Get distinct series IDs ordered by their most recent chapter upload
        const recentSeries = db.prepare(`
            SELECT s.id, s.title, s.slug, s.cover_url, s.status, s.type, s.views, s.is_adult, MAX(ch.created_at) as last_update
            FROM series s
            JOIN chapters ch ON s.id = ch.series_id
            WHERE s.published = 1
            GROUP BY s.id
            ORDER BY last_update DESC
            LIMIT ? OFFSET ?
        `).all(perPage, offset);

        if (recentSeries.length === 0) {
            return NextResponse.json({ updates: [], hasMore: false, total, page, perPage });
        }

        // Fetch the latest 4 chapters per series in a single query — eliminates N+1
        const seriesIds = recentSeries.map(s => s.id);
        const placeholders = seriesIds.map(() => '?').join(', ');
        const allChapters = db.prepare(`
            SELECT id, series_id, chapter_number, title, created_at,
                   CASE WHEN created_at >= datetime('now', '-1 day')
             OR created_at >= datetime('now', 'localtime', '-1 day')
        THEN 1 ELSE 0 END as is_new
            FROM (
                SELECT id, series_id, chapter_number, title, created_at,
                       ROW_NUMBER() OVER (PARTITION BY series_id ORDER BY chapter_number DESC) as rn
                FROM chapters
                WHERE series_id IN (${placeholders})
                  AND (publish_at IS NULL OR publish_at <= datetime('now'))
            ) ranked
            WHERE rn <= 4
            ORDER BY series_id, chapter_number DESC
        `).all(...seriesIds);

        // Group chapters by series_id
        const chaptersBySeries = {};
        for (const ch of allChapters) {
            if (!chaptersBySeries[ch.series_id]) chaptersBySeries[ch.series_id] = [];
            chaptersBySeries[ch.series_id].push(ch);
        }

        const updates = recentSeries.map(s => ({
            ...s,
            chapters: chaptersBySeries[s.id] || [],
        }));

        const totalPages = Math.ceil(total / perPage);
        const hasMore = page < totalPages;

        return NextResponse.json({ updates, hasMore, total, page, perPage, totalPages });
    } catch (error) {
        console.error('GET /api/series/latest-updates error:', error);
        return NextResponse.json({ error: 'Failed to fetch latest updates' }, { status: 500 });
    }
}
