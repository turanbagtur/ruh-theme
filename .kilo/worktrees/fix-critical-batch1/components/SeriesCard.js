'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

const DEFAULT_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231a1a2e'/%3E%3Crect x='1' y='1' width='298' height='448' fill='none' stroke='%23333' stroke-width='1'/%3E%3Cpath d='M100 160 L100 290 L150 260 L200 290 L200 160 Z' fill='none' stroke='%23444' stroke-width='2'/%3E%3Ccircle cx='150' cy='140' r='20' fill='none' stroke='%23444' stroke-width='2'/%3E%3Ctext x='150' y='330' text-anchor='middle' fill='%23555' font-family='sans-serif' font-size='13'%3EKapak Yok%3C/text%3E%3C/svg%3E";

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

export default function SeriesCard({ series, priority = false }) {
    const { user } = useAuth();
    const [showGuestAlert, setShowGuestAlert] = useState(false);

    const genres = (() => {
        try {
            if (Array.isArray(series.genres)) return series.genres;
            return JSON.parse(series.genres || '[]');
        } catch { return []; }
    })();

    const isAdult = !!series.is_adult;
    // Guest visitors cannot see adult series content
    const isBlurred = isAdult && !user;

    if (isBlurred) {
        return (
            <div className="series-card adult-card-guest" style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => setShowGuestAlert(v => !v)}>
                <div className="series-card-image" style={{ position: 'relative' }}>
                    <img
                        src={series.cover_url || DEFAULT_COVER}
                        alt="18+ İçerik"
                        loading={priority ? 'eager' : 'lazy'}
                        fetchPriority={priority ? 'high' : 'auto'}
                        style={{ filter: 'blur(14px)', transform: 'scale(1.05)' }}
                    />
                    {/* 18+ badge */}
                    <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: '#ef4444', color: '#fff', fontWeight: 800,
                        fontSize: '0.7rem', padding: '3px 7px', borderRadius: 4,
                        letterSpacing: '0.05em', zIndex: 2
                    }}>18+</div>
                    {/* Login prompt overlay */}
                    <div className="adult-guest-overlay">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <span>Giriş Yapın</span>
                    </div>
                    <div className="series-card-overlay">
                        <span className={`status-badge status-${series.status}`}>
                            {STATUS_TR[series.status] || series.status}
                        </span>
                    </div>
                </div>
                <div className="series-card-body">
                    <div className="series-card-title" style={{ filter: 'blur(5px)', userSelect: 'none' }}>
                        {series.title}
                    </div>
                    <div className="series-card-meta">
                        <span>★ —</span>
                        <span>— bölüm</span>
                    </div>
                    <div className="series-card-genres">
                        <span className="genre-tag" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                            🔞 Yetişkin
                        </span>
                    </div>
                </div>
                {/* Guest alert tooltip */}
                {showGuestAlert && (
                    <div className="adult-guest-alert" onClick={e => e.stopPropagation()}>
                        <p>Bu içerik yalnızca kayıtlı üyelere özeldir.</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                            <a href="/login" className="adult-alert-btn adult-alert-btn-primary">Giriş Yap</a>
                            <a href="/register" className="adult-alert-btn adult-alert-btn-outline">Kayıt Ol</a>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link href={`/seri/${series.slug || series.id}`} className="series-card">
            <div className="series-card-image">
                <img
src={series.cover_url || DEFAULT_COVER}
                 alt={series.title}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
            />
                <div className="series-card-overlay">
                    {isAdult && (
                        <span style={{
                            position: 'absolute', top: 8, left: 8,
                            background: '#ef4444', color: '#fff', fontWeight: 800,
                            fontSize: '0.7rem', padding: '3px 7px', borderRadius: 4,
                            letterSpacing: '0.05em'
                        }}>18+</span>
                    )}
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