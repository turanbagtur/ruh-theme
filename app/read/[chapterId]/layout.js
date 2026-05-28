import { getDb } from '@/lib/db';
import { permanentRedirect } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yomitranslate.com';

// Madde 6: /read/[chapterId] sayfaları için noindex + canonical
// Bu sayfalar /series/[slug]/chapter/[num] URL'sine canonical yönlendirir
export async function generateMetadata({ params }) {
    const { chapterId } = await params;
    try {
        const db = getDb();
        const chapter = db.prepare(`
            SELECT ch.id, ch.chapter_number, ch.title,
                   s.id as series_id, s.title as series_title, s.slug as series_slug
            FROM chapters ch
            JOIN series s ON s.id = ch.series_id
            WHERE ch.id = ? AND s.published = 1
        `).get(chapterId);

        if (!chapter) {
            return {
                title: 'YomiTranslate — Türkçe Manga Oku',
                robots: { index: false, follow: false },
            };
        }

        const slug = chapter.series_slug || chapter.series_id;
        const canonicalUrl = `${BASE_URL}/series/${slug}/chapter/${chapter.chapter_number}`;
        const chTitle = chapter.title ? ` — ${chapter.title}` : '';
        const title = `${chapter.series_title} Bölüm ${chapter.chapter_number}${chTitle} | YomiTranslate`;
        const description = `${chapter.series_title} Bölüm ${chapter.chapter_number}${chTitle} online oku. Yapay zeka destekli Türkçe çeviri ile mangayı ücretsiz ve kaliteli okuyun.`;

        return {
            title,
            description,
            // noindex: duplicate URL — canonical points to the SEO-friendly URL
            robots: {
                index: false,
                follow: true,
            },
            alternates: {
                canonical: canonicalUrl,
            },
        };
    } catch {
        return {
            title: 'YomiTranslate — Türkçe Manga Oku',
            robots: { index: false, follow: false },
        };
    }
}

export default async function ReadLayout({ children, params }) {
    const { chapterId } = await params;
    try {
        const db = getDb();
        const chapter = db.prepare(`
            SELECT ch.chapter_number,
                   s.id as series_id, s.slug as series_slug
            FROM chapters ch
            JOIN series s ON s.id = ch.series_id
            WHERE ch.id = ? AND s.published = 1
        `).get(chapterId);

        if (chapter) {
            const slug = chapter.series_slug || chapter.series_id;
            permanentRedirect(`/series/${slug}/chapter/${chapter.chapter_number}`);
        }
    } catch (err) {
        if (err.digest?.startsWith('NEXT_REDIRECT')) {
            throw err;
        }
        console.error('ReadLayout redirect error:', err);
    }
    return children;
}