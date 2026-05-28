import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/series/similar?id=X&limit=6
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 12);

    if (!seriesId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const db = getDb();
    try {
        // Get the target series genres and type
        const target = db.prepare('SELECT genres, type FROM series WHERE id = ? AND published = 1').get(seriesId);
        if (!target) return NextResponse.json({ similar: [] });

        const genres = target.genres ? target.genres.split(',').map(g => g.trim()).filter(Boolean) : [];

        let similar = [];

        if (genres.length > 0) {
            // Find series that share at least one genre, same type preferred
            // Score by number of shared genres
            const allSeries = db.prepare(`
                SELECT id, title, slug, cover_url, genres, type,
                    (SELECT COUNT(*) FROM chapters c WHERE c.series_id = s.id) as chapter_count
                FROM series s
                WHERE id != ? AND published = 1
            `).all(seriesId);

            const scored = allSeries.map(s => {
                const sGenres = s.genres ? s.genres.split(',').map(g => g.trim()) : [];
                const shared = genres.filter(g => sGenres.includes(g)).length;
                const typeBonus = s.type === target.type ? 1 : 0;
                return { ...s, score: shared * 2 + typeBonus };
            }).filter(s => s.score > 0);

            scored.sort((a, b) => b.score - a.score);
            similar = scored.slice(0, limit);
        }

        // If not enough, fill with recent same-type series
        if (similar.length < limit) {
            const existingIds = new Set(similar.map(s => s.id));
            existingIds.add(parseInt(seriesId));
            const fill = db.prepare(`
                SELECT id, title, slug, cover_url, genres, type,
                    (SELECT COUNT(*) FROM chapters c WHERE c.series_id = s.id) as chapter_count
                FROM series s
                WHERE id != ? AND published = 1 AND type = ?
                ORDER BY id DESC
                LIMIT ?
            `).all(seriesId, target.type || 'manga', limit * 2);

            for (const s of fill) {
                if (!existingIds.has(s.id) && similar.length < limit) {
                    similar.push(s);
                    existingIds.add(s.id);
                }
            }
        }

        return NextResponse.json({ similar: similar.slice(0, limit) });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}