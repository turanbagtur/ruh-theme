import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 15;

        // Get distinct series IDs ordered by their most recent chapter upload
        const recentSeries = db.prepare(`
            SELECT s.id, s.title, s.slug, s.cover_url, s.views, MAX(ch.created_at) as last_update
            FROM series s
            JOIN chapters ch ON s.id = ch.series_id
            WHERE s.published = 1
            GROUP BY s.id
            ORDER BY last_update DESC
            LIMIT ?
        `).all(limit);

        if (recentSeries.length === 0) {
            return NextResponse.json({ updates: [] });
        }

        // Fetch the latest 3 chapters per series in a single query — eliminates N+1
        const seriesIds = recentSeries.map(s => s.id);
        const placeholders = seriesIds.map(() => '?').join(', ');
        const allChapters = db.prepare(`
            SELECT id, series_id, chapter_number, title, created_at
            FROM (
                SELECT id, series_id, chapter_number, title, created_at,
                       ROW_NUMBER() OVER (PARTITION BY series_id ORDER BY chapter_number DESC) as rn
                FROM chapters
                WHERE series_id IN (${placeholders})
            ) ranked
            WHERE rn <= 3
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

        return NextResponse.json({ updates });
    } catch (error) {
        console.error('GET /api/series/latest-updates error:', error);
        return NextResponse.json({ error: 'Failed to fetch latest updates' }, { status: 500 });
    }
}
