import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || '';

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

        let pagesWithTranslations = pages;
        if (lang && pages.length > 0) {
            // Fetch all translations for this chapter+lang in a single query — eliminates N+1
            const pageIds = pages.map(p => p.id);
            const placeholders = pageIds.map(() => '?').join(', ');
            const translations = db.prepare(
                `SELECT page_id, translated_image_path FROM translations WHERE page_id IN (${placeholders}) AND language_code = ?`
            ).all(...pageIds, lang);

            const translationMap = {};
            for (const t of translations) {
                translationMap[t.page_id] = t.translated_image_path;
            }

            pagesWithTranslations = pages.map(page => ({
                ...page,
                display_image: translationMap[page.id] || page.image_path,
                is_translated: !!translationMap[page.id],
            }));
        } else {
            pagesWithTranslations = pages.map(p => ({ ...p, display_image: p.image_path, is_translated: false }));
        }

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
            pages: pagesWithTranslations,
            prevChapter: prevChapter || null,
            nextChapter: nextChapter || null,
        });
    } catch (error) {
        console.error('GET /api/chapters/[id] error:', error);
        return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 });
    }
}
