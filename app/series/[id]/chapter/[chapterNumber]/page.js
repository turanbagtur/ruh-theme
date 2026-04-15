'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

// SEO-friendly reader URL: /series/[seriesSlug]/chapter/[chapterNumber]
// Resolves to the internal reader at /read/[chapterId]
export default function SEOReaderPage() {
    const { id: seriesSlug, chapterNumber } = useParams();
    const router = useRouter();

    useEffect(() => {
        async function resolveChapter() {
            try {
                // /api/series/[id] accepts both numeric IDs and slugs
                const res = await fetch(`/api/series/${encodeURIComponent(seriesSlug)}`);
                if (!res.ok) { router.replace('/series'); return; }

                const data = await res.json();
                const chapters = data.chapters || [];
                const num = parseFloat(chapterNumber);
                const chapter = chapters.find(
                    c => c.chapter_number === num || String(c.chapter_number) === String(chapterNumber)
                );

                if (!chapter) {
                    // Chapter not found – go back to series page
                    router.replace(`/series/${seriesSlug}`);
                    return;
                }

                // Redirect to internal reader, preserving any query string (e.g. ?lang=en)
                const searchStr = typeof window !== 'undefined' ? window.location.search : '';
                router.replace(`/read/${chapter.id}${searchStr}`);
            } catch {
                router.replace('/series');
            }
        }
        resolveChapter();
    }, [seriesSlug, chapterNumber, router]);

    return (
        <div className="page-loading">
            <div className="spinner" />
        </div>
    );
}