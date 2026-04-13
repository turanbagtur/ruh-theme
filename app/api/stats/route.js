import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const series = db.prepare('SELECT COUNT(*) as count FROM series WHERE published = 1').get().count;
        const chapters = db.prepare('SELECT COUNT(*) as count FROM chapters').get().count;
        const languages = db.prepare('SELECT COUNT(DISTINCT language_code) as count FROM translations').get().count;
        const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const translations = db.prepare('SELECT COUNT(*) as count FROM translations').get().count;

        return NextResponse.json({
            series,
            chapters,
            languages,
            users,
            translations,
        }, {
            headers: { 'Cache-Control': 'no-store' }
        });
    } catch {
        return NextResponse.json({ series: 0, chapters: 0, languages: 0, users: 0, translations: 0 });
    }
}