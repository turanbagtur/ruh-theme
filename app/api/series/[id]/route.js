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

        const chapters = db.prepare(
            'SELECT * FROM chapters WHERE series_id = ? ORDER BY chapter_number ASC'
        ).all(numericId);

        // Fetch all translations for all chapters in one query — eliminates N+1
        const allTranslations = db.prepare(`
            SELECT DISTINCT p.chapter_id, t.language_code
            FROM translations t
            JOIN pages p ON t.page_id = p.id
            WHERE p.chapter_id IN (SELECT id FROM chapters WHERE series_id = ?)
        `).all(numericId);

        // Fetch read counts per chapter from read_history
        const readCounts = db.prepare(`
            SELECT chapter_id, COUNT(*) as read_count
            FROM read_history
            WHERE chapter_id IN (SELECT id FROM chapters WHERE series_id = ?)
            GROUP BY chapter_id
        `).all(numericId);

        // Group language codes by chapter_id
        const langsByChapter = {};
        for (const row of allTranslations) {
            if (!langsByChapter[row.chapter_id]) langsByChapter[row.chapter_id] = [];
            langsByChapter[row.chapter_id].push(row.language_code);
        }

        // Group read counts by chapter_id
        const readCountByChapter = {};
        for (const row of readCounts) {
            readCountByChapter[row.chapter_id] = row.read_count;
        }

        const chaptersWithTranslations = chapters.map(ch => ({
            ...ch,
            availableLanguages: langsByChapter[ch.id] || [],
            read_count: readCountByChapter[ch.id] || 0,
        }));

        return NextResponse.json({
            series: { ...series, genres: JSON.parse(series.genres || '[]') },
            chapters: chaptersWithTranslations,
        });
    } catch (error) {
        console.error('GET /api/series/[id] error:', error);
        return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
    }
}
