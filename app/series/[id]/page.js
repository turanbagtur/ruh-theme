'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CommentSection from '@/components/CommentSection';
import SeriesCard from '@/components/SeriesCard';
import { useAuth } from '@/components/AuthProvider';
import { getDominantColor, generateAdaptivePalette } from '@/components/ColorUtils';

const CHAPTERS_INITIAL = 10;

// SVG Icons for reading list dropdown
const ReadingIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
);
const CompletedIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
);
const PlanIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);
const DroppedIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
);
const RemoveIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
);

const LIST_OPTIONS = [
    { value: 'reading',   label: 'Reading',      Icon: ReadingIcon },
    { value: 'completed', label: 'Completed',    Icon: CompletedIcon },
    { value: 'plan',      label: 'Plan to Read', Icon: PlanIcon },
    { value: 'dropped',   label: 'Dropped',      Icon: DroppedIcon },
];

export default function SeriesDetailPage() {
    const { id } = useParams();
    const { user, authFetch } = useAuth();
    const [series, setSeries] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [relatedSeries, setRelatedSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sortDesc, setSortDesc] = useState(true);
    const [dominantColor, setDominantColor] = useState(null);
    const [descExpanded, setDescExpanded] = useState(false);
    const [readingListStatus, setReadingListStatus] = useState(null);
    const [showListDropdown, setShowListDropdown] = useState(false);
    const [showAllChapters, setShowAllChapters] = useState(false);
    const [chapterSearch, setChapterSearch] = useState('');

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

    useEffect(() => {
        if (series?.title) document.title = `${series.title} — YomiTranslate`;
    }, [series?.title]);

    useEffect(() => {
        if (!series?.id) return;
        async function fetchRelated() {
            try {
                const res = await fetch(`/api/series/similar?id=${series.id}&limit=6`);
                const data = await res.json();
                setRelatedSeries(data.similar || []);
            } catch { }
        }
        fetchRelated();
    }, [series?.id]);

    useEffect(() => {
        if (user && series?.id) {
            checkFavorite(series.id);
            checkReadingList(series.id);
        }
    }, [user, series?.id]);

    useEffect(() => {
        if (!showListDropdown) return;
        function handleClick(e) {
            if (!e.target.closest('.reading-list-dropdown-wrapper')) setShowListDropdown(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showListDropdown]);

    async function checkFavorite(numericId) {
        try {
            const res = await authFetch(`/api/favorites?seriesId=${numericId}`);
            const data = await res.json();
            setIsFavorite(data.isFavorite);
        } catch { }
    }

    async function checkReadingList(numericId) {
        try {
            const res = await authFetch(`/api/reading-list?status=all`);
            if (!res) return;
            const data = await res.json();
            const entry = (data.list || []).find(item => item.series_id === numericId);
            setReadingListStatus(entry?.status || null);
        } catch { }
    }

    async function updateReadingList(status) {
        if (!user || !series?.id) return;
        setShowListDropdown(false);
        try {
            if (status === null) {
                await authFetch(`/api/reading-list?seriesId=${series.id}`, { method: 'DELETE' });
                setReadingListStatus(null);
            } else {
                await authFetch('/api/reading-list', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ seriesId: series.id, status })
                });
                setReadingListStatus(status);
            }
        } catch (err) { console.error(err); }
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
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function fmtNum(n) {
        if (!n) return '0';
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return String(n);
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

    const descText = series.description || 'No synopsis available for this series.';
    const isLongDesc = descText.length > 250;

    const sortedChapters = [...chapters].sort((a, b) => sortDesc ? b.chapter_number - a.chapter_number : a.chapter_number - b.chapter_number);
    const filteredChapters = chapterSearch.trim()
        ? sortedChapters.filter(ch => {
            const q = chapterSearch.toLowerCase();
            return String(ch.chapter_number).includes(q) || (ch.title || '').toLowerCase().includes(q);
        })
        : sortedChapters;
    const visibleChapters = (!chapterSearch.trim() && !showAllChapters) ? filteredChapters.slice(0, CHAPTERS_INITIAL) : filteredChapters;
    const hasMore = !chapterSearch.trim() && filteredChapters.length > CHAPTERS_INITIAL;

    const currentListLabel = readingListStatus
        ? (LIST_OPTIONS.find(o => o.value === readingListStatus)?.label || 'Add to List')
        : 'Add to List';

    const firstChapter = sortedChapters[sortedChapters.length - 1]; // oldest = first
    const lastChapter = sortedChapters[0]; // newest = last

    return (
        <div className="page-container fade-in sd-page" style={{ position: 'relative', ...adaptiveStyles }}>
            {/* Blurred backdrop */}
            <div className="asura-series-backdrop" style={{ backgroundImage: `url(${series.cover_url || '/demo/cover1.jpg'})` }} />
            <div className="asura-series-overlay" />

            {/* ── Main Header ── */}
            <div className="sd-header">

                {/* Cover */}
                <div className="sd-cover-col">
                    <div className="sd-cover-wrap">
                        <img
                            src={series.cover_url || '/demo/cover1.jpg'}
                            alt={series.title}
                            className="sd-cover-img"
                            crossOrigin="anonymous"
                            onLoad={(e) => setDominantColor(getDominantColor(e.target))}
                        />
                    </div>
                </div>

                {/* Info */}
                <div className="sd-info-col">
                    {/* Title */}
                    <h1 className="sd-title">{series.title}</h1>

                    {/* Description */}
                    <div className="sd-desc-wrap">
                        <p className="sd-desc" style={isLongDesc && !descExpanded ? {
                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        } : {}}>
                            {descText}
                        </p>
                        {isLongDesc && (
                            <button className="sd-desc-toggle" onClick={() => setDescExpanded(v => !v)}>
                                {descExpanded ? 'Show less ▲' : 'Show more ▼'}
                            </button>
                        )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="sd-actions">
                        <button
                            className={`sd-btn ${isFavorite ? 'sd-btn-active' : 'sd-btn-outline'}`}
                            onClick={toggleFavorite}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                            {isFavorite ? 'Bookmarked' : 'Bookmark'}
                        </button>
                        {firstChapter && (
                            <Link href={`/series/${series.slug || series.id}/chapter/${firstChapter.chapter_number}`} className="sd-btn sd-btn-outline">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                First Chapter
                            </Link>
                        )}
                        {lastChapter && lastChapter.id !== firstChapter?.id && (
                            <Link href={`/series/${series.slug || series.id}/chapter/${lastChapter.chapter_number}`} className="sd-btn sd-btn-outline">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                Latest Chapter
                            </Link>
                        )}
                    </div>

                    {/* Big Stats */}
                    <div className="sd-stats">
                        <div className="sd-stat">
                            <div className="sd-stat-icon" style={{ color: '#f59e0b' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            </div>
                            <span className="sd-stat-value">{series.rating?.toFixed(1) || '0.0'}</span>
                            <span className="sd-stat-label">Rating</span>
                        </div>
                        <div className="sd-stat">
                            <div className="sd-stat-icon" style={{ color: '#818cf8' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                            </div>
                            <span className="sd-stat-value">{chapters.length}</span>
                            <span className="sd-stat-label">Chapters</span>
                        </div>
                        <div className="sd-stat">
                            <div className="sd-stat-icon" style={{ color: '#34d399' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </div>
                            <span className="sd-stat-value">{fmtNum(series.views)}</span>
                            <span className="sd-stat-label">Views</span>
                        </div>
                    </div>

                    {/* Meta details */}
                    <div className="sd-meta-grid">
                        <div className="sd-meta-row">
                            <span className="sd-meta-key">Status</span>
                            <span className="sd-meta-val">
                                <span className={`sd-status-dot ${series.status === 'ongoing' ? 'ongoing' : 'completed'}`} />
                                {series.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                            </span>
                        </div>
                        {series.type && (
                            <div className="sd-meta-row">
                                <span className="sd-meta-key">Type</span>
                                <span className="sd-meta-val">
                                    <span className="sd-status-dot" style={{ background: '#818cf8' }} />
                                    {series.type.toUpperCase()}
                                </span>
                            </div>
                        )}
                        {series.author && (
                            <div className="sd-meta-row">
                                <span className="sd-meta-key">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Author
                                </span>
                                <span className="sd-meta-val">{series.author}</span>
                            </div>
                        )}
                        {series.artist && series.artist !== series.author && (
                            <div className="sd-meta-row">
                                <span className="sd-meta-key">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                                    Artist
                                </span>
                                <span className="sd-meta-val">{series.artist}</span>
                            </div>
                        )}
                    </div>

                    {/* Genres */}
                    {genres.length > 0 && (
                        <div className="sd-genres">
                            {genres.map((g, i) => (
                                <span key={i} className="sd-genre-tag">{g}</span>
                            ))}
                        </div>
                    )}

                    {/* Share + Add to List */}
                    <div className="sd-bottom-actions">
                        {user && (
                            <div className="reading-list-dropdown-wrapper sd-reading-list-wrapper">
                                <button
                                    className={`sd-btn ${readingListStatus ? 'sd-btn-list-active' : 'sd-btn-outline'}`}
                                    onClick={() => setShowListDropdown(v => !v)}
                                    style={{ gap: 8 }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                                    {currentListLabel}
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: showListDropdown ? 'rotate(180deg)' : 'none' }}><path d="m6 9 6 6 6-6"/></svg>
                                </button>
                                {showListDropdown && (
                                    <div className="reading-list-dropdown">
                                        {LIST_OPTIONS.map(opt => (
                                            <button key={opt.value} onClick={() => updateReadingList(opt.value)} className={`rld-item ${readingListStatus === opt.value ? 'active' : ''}`}>
                                                <opt.Icon />
                                                <span>{opt.label}</span>
                                                {readingListStatus === opt.value && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto' }}><polyline points="20 6 9 17 4 12"/></svg>}
                                            </button>
                                        ))}
                                        {readingListStatus && (
                                            <button onClick={() => updateReadingList(null)} className="rld-item rld-remove">
                                                <RemoveIcon /><span>Remove from List</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <button className="sd-btn sd-btn-outline sd-share-btn" onClick={shareSeries}>
                            {copied ? (
                                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
                            ) : (
                                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Chapter List ── */}
            <div className="sd-chapters-section">
                <div className="sd-chapters-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 className="sd-chapters-title">{chapters.length} Chapters</h2>
                    </div>
                    {chapters.length > 1 && (
                        <button className="sd-sort-btn" onClick={() => setSortDesc(v => !v)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={sortDesc ? "M11 17l-4 4-4-4M7 21V3M21 3v18" : "M11 7l-4-4-4 4M7 3v18M21 21V3"}/></svg>
                            {sortDesc ? 'Newest' : 'Oldest'}
                        </button>
                    )}
                </div>

                {/* Search */}
                {chapters.length > 5 && (
                    <div className="sd-chapter-search-wrap">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sd-search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input
                            type="text"
                            className="sd-chapter-search"
                            placeholder="Search chapters..."
                            value={chapterSearch}
                            onChange={e => setChapterSearch(e.target.value)}
                        />
                        {chapterSearch && (
                            <button className="sd-search-clear" onClick={() => setChapterSearch('')}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        )}
                    </div>
                )}

                {chapters.length === 0 ? (
                    <div className="sd-empty-chapters">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        No chapters available yet. Check back soon!
                    </div>
                ) : filteredChapters.length === 0 ? (
                    <div className="sd-empty-chapters">No chapters match your search.</div>
                ) : (
                    <>
                        <div className="sd-chapter-list">
                            {visibleChapters.map(ch => (
                                <Link
                                    key={ch.id}
                                    href={`/series/${series.slug || series.id}/chapter/${ch.chapter_number}`}
                                    className="sd-chapter-row"
                                >
                                    <div className="sdcr-left">
                                        <span className="sdcr-number">Chapter {Number(ch.chapter_number) % 1 === 0 ? Math.floor(ch.chapter_number) : ch.chapter_number}</span>
                                        {ch.title && ch.title !== `Chapter ${ch.chapter_number}` && (
                                            <span className="sdcr-title">{ch.title}</span>
                                        )}
                                    </div>
                                    <div className="sdcr-right">
                                        {ch.read_count > 0 && (
                                            <span className="sdcr-reads">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                {fmtNum(ch.read_count)}
                                            </span>
                                        )}
                                        <span className="sdcr-date">{new Date(ch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {hasMore && (
                            <button onClick={() => setShowAllChapters(v => !v)} className="sd-show-more-btn">
                                {showAllChapters ? (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg> Show Less</>
                                ) : (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg> Show All {chapters.length} Chapters</>
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* ── Comments ── */}
            <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 32 }}>
                <CommentSection seriesId={series?.id} />
            </div>

            {/* ── You May Also Like ── */}
            {relatedSeries.length > 0 && (
                <div style={{ marginTop: 40 }}>
                    <div className="section-header">
                        <h2 className="section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
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
