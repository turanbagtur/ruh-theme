'use client';
import Link from 'next/link';

const STATUS_TR = {
    'ongoing': 'Devam Ediyor',
    'completed': 'Tamamlandı',
    'hiatus': 'Ara Verildi',
    'cancelled': 'İptal Edildi'
};

const GENRE_TR = {
    'Action': 'Aksiyon', 'Adventure': 'Macera', 'Comedy': 'Komedi', 'Drama': 'Drama',
    'Fantasy': 'Fantastik', 'Historical': 'Tarihi', 'Horror': 'Korku', 'Isekai': 'Isekai',
    'Martial Arts': 'Dövüş Sanatları', 'Mystery': 'Gizem', 'Reincarnation': 'Reenkarnasyon',
    'Romance': 'Romantik', 'School': 'Okul', 'Sci-Fi': 'Bilim Kurgu',
    'Supernatural': 'Doğaüstü', 'Thriller': 'Gerilim', 'Ecchi': 'Ecchi', 'Harem': 'Harem',
    'Josei': 'Josei', 'Mature': 'Yetişkin', 'Mecha': 'Mecha', 'Psychological': 'Psikolojik',
    'Seinen': 'Seinen', 'Shoujo': 'Shoujo', 'Shounen': 'Shounen', 'Slice of Life': 'Günlük Yaşam',
    'Sports': 'Spor', 'Tragedy': 'Trajedi', 'Webtoon': 'Webtoon', 'Manhwa': 'Manhwa', 'Manhua': 'Manhua'
};

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
                                {STATUS_TR[series.status] || 'Devam Ediyor'}
                            </>
                        ) : series.status === 'completed' ? (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                {STATUS_TR[series.status] || 'Tamamlandı'}
                            </>
                        ) : (
                            STATUS_TR[series.status] || series.status
                        )}
                    </span>
                </div>
            </div>
            <div className="series-card-body">
                <div className="series-card-title">{series.title}</div>
                <div className="series-card-meta">
                    <span>★ {series.rating != null ? series.rating.toFixed(1) : 'N/A'}</span>
                    <span>{series.chapterCount || series.chapter_count || 0} bölüm</span>
                </div>
                <div className="series-card-genres">
                    {genres.slice(0, 3).map((g, i) => (
                        <span key={i} className="genre-tag">{GENRE_TR[g] || g}</span>
                    ))}
                </div>
            </div>
        </Link>
    );
}
