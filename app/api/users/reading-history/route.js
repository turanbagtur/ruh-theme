import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(request) {
    try {
        const db = getDb();
        const result = getVerifiedUser(request, db);
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { user } = result;

        // Deduplicate at DB level: latest chapter per series, max 5 series
        const history = db.prepare(`
            SELECT rh.chapter_id,
                   rh.updated_at,
                   rh.page_number,
                   c.chapter_number,
                   c.title          AS chapter_title,
                   s.id             AS series_id,
                   s.title          AS series_title,
                   s.cover_url,
                   s.slug,
                   (SELECT MAX(c2.chapter_number)
                    FROM chapters c2
                    WHERE c2.series_id = s.id) AS latest_chapter
            FROM reading_history rh
            JOIN chapters c ON rh.chapter_id = c.id
            JOIN series s   ON c.series_id   = s.id
            WHERE rh.user_id = ?
              AND rh.updated_at = (
                  SELECT MAX(rh2.updated_at)
                  FROM reading_history rh2
                  JOIN chapters c2 ON rh2.chapter_id = c2.id
                  WHERE rh2.user_id = rh.user_id
                    AND c2.series_id = s.id
              )
            ORDER BY rh.updated_at DESC
            LIMIT 5
        `).all(user.id);

        return NextResponse.json({ success: true, history });
    } catch (error) {
        console.error('GET /api/users/reading-history error:', error);
        return NextResponse.json({ error: 'Failed to fetch reading history' }, { status: 500 });
    }
}