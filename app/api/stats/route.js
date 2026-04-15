import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        // Single combined query — eliminates multiple round-trips
        const row = db.prepare(`
            SELECT
                (SELECT COUNT(*) FROM series WHERE published = 1) as series,
                (SELECT COUNT(*) FROM chapters) as chapters,
                (SELECT COUNT(DISTINCT language_code) FROM translations) as languages,
                (SELECT COUNT(*) FROM users) as users,
                (SELECT COUNT(*) FROM translations) as translations
        `).get();

        return NextResponse.json({
            series: row.series || 0,
            chapters: row.chapters || 0,
            languages: row.languages || 0,
            users: row.users || 0,
            translations: row.translations || 0,
        }, {
            // Cache for 5 minutes on CDN/browser — stats don't need to be real-time
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
        });
    } catch {
        return NextResponse.json({ series: 0, chapters: 0, languages: 0, users: 0, translations: 0 });
    }
}