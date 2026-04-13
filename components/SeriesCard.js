'use client';
import Link from 'next/link';

export default function SeriesCard({ series }) {
    const genres = (() => {
        try {
            if (Array.isArray(series.genres)) return series.genres;
            return JSON.parse(series.genres || '[]');
        } catch { return []; }
    })();

    return (
        <Link href={`/series/${series.slug || series.id}`} className="series-card">
            <div className="series-card-image">
                <img src={series.cover_url || '/demo/cover1.jpg'} alt={series.title} loading="lazy" />
                <div className="series-card-overlay">
                    <span className={`status-badge status-${series.status}`}>
                        {series.status === 'ongoing' ? (
                            <>
                                <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
                                Ongoing
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                Completed
                            </>
                        )}
                    </span>
                </div>
            </div>
            <div className="series-card-body">
                <div className="series-card-title">{series.title}</div>
                <div className="series-card-meta">
                    <span>★ {series.rating?.toFixed(1)}</span>
                    <span>{series.chapterCount || series.chapter_count || 0} ch.</span>
                </div>
                <div className="series-card-genres">
                    {genres.slice(0, 3).map((g, i) => (
                        <span key={i} className="genre-tag">{g}</span>
                    ))}
                </div>
            </div>
        </Link>
    );
}
