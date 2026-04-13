'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LanguageSelector from '@/components/LanguageSelector';
import CommentSection from '@/components/CommentSection';
import SeriesCard from '@/components/SeriesCard';
import { useAuth } from '@/components/AuthProvider';
import { getDominantColor, generateAdaptivePalette } from '@/components/ColorUtils';

export default function SeriesDetailPage() {
    const { id } = useParams();
    const { user, authFetch } = useAuth();
    const [series, setSeries] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [relatedSeries, setRelatedSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLang, setSelectedLang] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sortDesc, setSortDesc] = useState(true);
    const [dominantColor, setDominantColor] = useState(null);

    useEffect(() => {
        async function fetchSeries() {
            try {
                const res = await fetch(`/api/series/${id}`);
                const data = await res.json();
                setSeries(data.series);
                setChapters(data.chapters || []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        fetchSeries();
    }, [id]);

    // Fetch related series
    useEffect(() => {
        async function fetchRelated() {
            try {
                const res = await fetch('/api/series?sort=popular');
                const data = await res.json();
                // Filter by numeric id since series objects have id field
                const others = (data.series || []).filter(s => String(s.slug || s.id) !== String(id));
                setRelatedSeries(others.slice(0, 4));
            } catch { }
        }
        fetchRelated();
    }, [id]);

    // Use numeric series.id for API calls (id param may be a slug)
    useEffect(() => {
        if (user && series?.id) checkFavorite(series.id);
    }, [user, series?.id]);

    async function checkFavorite(numericId) {
        try {
            const res = await authFetch(`/api/favorites?seriesId=${numericId}`);
            const data = await res.json();
            setIsFavorite(data.isFavorite);
        } catch { }
    }

    async function toggleFavorite() {
        if (!user || !series?.id) return;
        try {
            const res = await authFetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seriesId: series.id })
            });
            const data = await res.json();
            setIsFavorite(data.isFavorite);
        } catch (err) { console.error(err); }
    }

    function shareSeries() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    if (!series) {
        return (
            <div className="page-container page-section" style={{ textAlign: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: 12 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <h2>Series not found</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: '0.88rem' }}>The series you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                <Link href="/series" className="btn btn-ghost" style={{ marginTop: 16 }}>Back to Browse</Link>
            </div>
        );
    }

    const genres = Array.isArray(series.genres) ? series.genres : JSON.parse(series.genres || '[]');
    const palette = generateAdaptivePalette(dominantColor);
    const adaptiveStyles = palette ? {
        '--accent': palette.accent,
        '--accent-light': palette.accentLight,
        '--accent-glow': palette.accentGlow,
        '--gradient-hero': palette.gradientHero,
        '--gradient-primary': palette.gradientPrimary
    } : {};

    return (
        <div className="page-container fade-in" style={{ position: 'relative', ...adaptiveStyles }}>
            <div className="asura-series-backdrop" style={{ backgroundImage: `url(${series.cover_url || '/demo/cover1.jpg'})` }} />
            <div className="asura-series-overlay" />
            
            <div className="asura-series-header">
                {/* Left Column - Cover & Buttons */}
                <div>
                    <div className="series-cover" style={{ borderRadius: '4px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}>
                        <img 
                            src={series.cover_url || '/demo/cover1.jpg'} 
                            alt={series.title} 
                            style={{ borderRadius: '4px' }} 
                            crossOrigin="anonymous"
                            onLoad={(e) => setDominantColor(getDominantColor(e.target))}
                        />
                    </div>
                    
                    <div className="asura-action-buttons">
                        {chapters.length > 0 && (
                            <Link href={`/read/${chapters[0].id}${selectedLang ? `?lang=${selectedLang}` : ''}`} className="btn btn-primary" style={{ padding: '16px 0', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                Read First Chapter
                            </Link>
                        )}
                        {chapters.length > 1 && (
                            <Link href={`/read/${chapters[chapters.length - 1].id}${selectedLang ? `?lang=${selectedLang}` : ''}`} className="btn btn-ghost" style={{ background: 'var(--bg-glass)' }}>
                                Read Last Chapter
                            </Link>
                        )}
                        <button className={`btn ${isFavorite ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleFavorite} style={{ background: isFavorite ? 'var(--accent-light)' : 'rgba(255,255,255,0.05)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                            {isFavorite ? 'Favorited' : 'Bookmark Series'}
                        </button>
                    </div>
                </div>

                {/* Right Column - Info */}
                <div style={{ zIndex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '-0.5px' }}>{series.title}</h1>
                    <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '16px' }}>{series.author} &middot; {series.artist}</div>
                    
                    <div className="asura-series-metadata">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '1.1rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--warning)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            {series.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            {(series.views || 0).toLocaleString()} views
                        </span>
                        <span className={`status-badge status-${series.status}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>
                            {series.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                        {genres.map((g, i) => (
                            <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '3px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{g}</span>
                        ))}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', background: 'var(--bg-card)', padding: '20px', borderRadius: '4px', borderLeft: '2px solid var(--border)', marginBottom: '24px' }}>
                        {series.description || 'No synopsis available for this series.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <LanguageSelector selectedLang={selectedLang} onSelect={setSelectedLang} />
                        <button className="btn btn-ghost btn-sm" onClick={shareSeries} style={{ background: 'var(--bg-glass)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                            {copied ? 'Copied' : 'Share'}
                        </button>
                    </div>
                </div>
            </div>

                    {/* Chapter List */}
                    <div style={{ marginTop: '24px' }}>
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-glass)', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px' }}>
                            <h2 className="section-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                Chapters ({chapters.length})
                            </h2>
                            {chapters.length > 1 && (
                                <button className="btn btn-ghost btn-sm" onClick={() => setSortDesc(!sortDesc)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d={sortDesc ? "M11 17l-4 4-4-4M7 21V3M21 3v18" : "M11 7l-4-4-4 4M7 3v18M21 21V3"} />
                                    </svg>
                                    Sort: {sortDesc ? 'Newest' : 'Oldest'}
                                </button>
                            )}
                        </div>
                        {chapters.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                No chapters available yet. Check back soon!
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[...chapters].sort((a, b) => sortDesc ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number).map(ch => (
                                    <Link key={ch.id} href={`/read/${ch.id}${selectedLang ? `?lang=${selectedLang}` : ''}`} className="asura-chapter-row" style={{ padding: '12px 16px', borderRadius: '4px', background: 'var(--bg-card)', borderLeft: '3px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Ch. {ch.chapter_number}</span>
                                            {ch.title && ch.title !== `Chapter ${ch.chapter_number}` && (
                                                <span style={{ color: 'var(--text-secondary)' }}>— {ch.title}</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {ch.availableLanguages && ch.availableLanguages.length > 0 && (
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    {ch.availableLanguages.map(lang => (
                                                        <span key={lang} className="chapter-lang-badge">{lang.toUpperCase()}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(ch.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

            {/* Series Comments */}
            <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 32 }}>
                <CommentSection seriesId={series?.id} />
            </div>

            {/* You May Also Like */}
            {relatedSeries.length > 0 && (
                <div style={{ marginTop: 40 }}>
                    <div className="section-header">
                        <h2 className="section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></svg>
                            You May Also Like
                        </h2>
                        <Link href="/series" className="section-link">View All →</Link>
                    </div>
                    <div className="series-grid">
                        {relatedSeries.map(s => <SeriesCard key={s.id} series={s} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
