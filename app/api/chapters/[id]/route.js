import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const db = getDb();

        const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(id);
        if (!chapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }

        const series = db.prepare('SELECT * FROM series WHERE id = ?').get(chapter.series_id);
        if (!series) {
            return NextResponse.json({ error: 'Series not found' }, { status: 404 });
        }

        const pages = db.prepare(
            'SELECT * FROM pages WHERE chapter_id = ? ORDER BY page_number ASC'
        ).all(id);

        // Map pages with display_image field
        const pagesWithDisplay = pages.map(p => ({ ...p, display_image: p.image_path }));

        // Get prev/next chapters
        const prevChapter = db.prepare(
            'SELECT id, chapter_number FROM chapters WHERE series_id = ? AND chapter_number < ? ORDER BY chapter_number DESC LIMIT 1'
        ).get(chapter.series_id, chapter.chapter_number);

        const nextChapter = db.prepare(
            'SELECT id, chapter_number FROM chapters WHERE series_id = ? AND chapter_number > ? ORDER BY chapter_number ASC LIMIT 1'
        ).get(chapter.series_id, chapter.chapter_number);

        return NextResponse.json({
            chapter,
            series: { ...series, genres: JSON.parse(series.genres || '[]') },
            pages: pagesWithDisplay,
            prevChapter: prevChapter || null,
            nextChapter: nextChapter || null,
        });
    } catch (error) {
        console.error('GET /api/chapters/[id] error:', error);
        return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 });
    }
}
