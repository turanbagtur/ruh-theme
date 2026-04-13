import { NextResponse } from 'next/server';
import { translatePage, translateChapter } from '@/lib/torii';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { pageId, chapterId, targetLang } = await request.json();

        if (!targetLang) {
            return NextResponse.json({ error: 'Target language is required' }, { status: 400 });
        }

        // Translate single page
        if (pageId) {
            const result = await translatePage(pageId, targetLang);
            return NextResponse.json(result);
        }

        // Translate entire chapter
        if (chapterId) {
            const results = await translateChapter(chapterId, targetLang);
            return NextResponse.json({ results });
        }

        return NextResponse.json({ error: 'pageId or chapterId is required' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
