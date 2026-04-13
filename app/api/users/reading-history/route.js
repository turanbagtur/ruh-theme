import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
    try {
        const userData = getUserFromRequest(request);
        if (!userData) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const db = getDb();

        // Get the user's most recently read chapters with series info
        const history = db.prepare(`
            SELECT rh.chapter_id, rh.updated_at,
                   c.chapter_number, c.title as chapter_title,
                   s.id as series_id, s.title as series_title, s.cover_url,
                   (SELECT MAX(c2.chapter_number) FROM chapters c2 WHERE c2.series_id = s.id) as latest_chapter
            FROM reading_history rh
            JOIN chapters c ON rh.chapter_id = c.id
            JOIN series s ON c.series_id = s.id
            WHERE rh.user_id = ?
            ORDER BY rh.updated_at DESC
            LIMIT 10
        `).all(userData.id);

        // Deduplicate by series (keep only the latest chapter per series)
        const seen = new Set();
        const deduplicated = [];
        for (const item of history) {
            if (!seen.has(item.series_id)) {
                seen.add(item.series_id);
                deduplicated.push(item);
            }
        }

        return NextResponse.json({ success: true, history: deduplicated.slice(0, 5) });
    } catch (error) {
        console.error('GET /api/users/reading-history error:', error);
        return NextResponse.json({ error: 'Failed to fetch reading history' }, { status: 500 });
    }
}
