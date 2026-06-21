import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';

// Hash IP + user-agent for anonymous fingerprinting (no PII stored)
function getViewerHash(request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';
    const ua = request.headers.get('user-agent') || '';
    return crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 32);
}

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const db = getDb();
        const requestUser = getUserFromRequest(request);

        // Support both numeric ID and slug (e.g. /series/7 or /series/shadow-ronin)
        const isNumeric = /^\d+$/.test(id);
        const series = isNumeric
            ? db.prepare('SELECT * FROM series WHERE id = ?').get(id)
            : db.prepare('SELECT * FROM series WHERE slug = ?').get(id);

        if (!series) {
            return NextResponse.json({ error: 'Series not found' }, { status: 404 });
        }

        // Block access to unpublished series for non-admin users
        if (!series.published && (!requestUser || requestUser.role !== 'admin')) {
            return NextResponse.json({ error: 'Series not found' }, { status: 404 });
        }

        const numericId = series.id; // always use the DB numeric ID for queries

        // Bot protection: only count 1 view per viewer per series per hour
        const viewerHash = getViewerHash(request);
        const recentView = db.prepare(`
            SELECT id FROM series_views_log
            WHERE series_id = ? AND viewer_hash = ? AND created_at >= datetime('now', '-1 hour')
            LIMIT 1
        `).get(numericId, viewerHash);

        if (!recentView) {
            db.prepare('UPDATE series SET views = views + 1 WHERE id = ?').run(numericId);
            db.prepare('INSERT INTO series_views_log (series_id, viewer_hash) VALUES (?, ?)').run(numericId, viewerHash);
        }

        // read_count: read_history tablosundan gerçek okunma sayısını al
        // (chapters.views de eklenir; ikisi de varsa daha büyük olan gösterilir)
        const chaptersRaw = db.prepare(
            "SELECT id, series_id, chapter_number, title, created_at, COALESCE(views, 0) as chapter_views FROM chapters WHERE series_id = ? AND (publish_at IS NULL OR publish_at <= datetime('now')) ORDER BY chapter_number ASC"
        ).all(numericId);

        const readHistoryCounts = db.prepare(`
            SELECT chapter_id, COUNT(DISTINCT user_id) as rh_count
            FROM read_history
            WHERE chapter_id IN (SELECT id FROM chapters WHERE series_id = ?)
            GROUP BY chapter_id
        `).all(numericId);

        const rhMap = {};
        for (const row of readHistoryCounts) {
            rhMap[row.chapter_id] = row.rh_count;
        }

        const chapters = chaptersRaw.map(ch => ({
            ...ch,
            // Hangisi büyükse onu kullan — veri tutarsızlığına karşı koruma
            read_count: Math.max(ch.chapter_views || 0, rhMap[ch.id] || 0),
        }));

        return NextResponse.json({
            series: { ...series, genres: JSON.parse(series.genres || '[]') },
            chapters: chapters,
        });
    } catch (error) {
        console.error('GET /api/series/[id] error:', error);
        return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
    }
}
