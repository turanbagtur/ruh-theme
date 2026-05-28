'use client';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import CommentSection from '@/components/CommentSection';
import SeriesCard from '@/components/SeriesCard';
import { useAuth } from '@/components/AuthProvider';
import { getDominantColor, generateAdaptivePalette } from '@/components/ColorUtils';

const CHAPTERS_INITIAL = 10;

const STATUS_TR = { 'ongoing': 'Devam Ediyor', 'completed': 'Tamamlandı', 'hiatus': 'Ara Verildi', 'cancelled': 'İptal Edildi' };

const GENRE_TR = {
    'Action': 'Aksiyon', 'Adventure': 'Macera', 'Comedy': 'Komedi', 'Drama': 'Drama',
    'Fantasy': 'Fantastik', 'Historical': 'Tarihi', 'Horror': 'Korku', 'Isekai': 'Isekai',
    'Martial Arts': 'Dövüş Sanatları', 'Mystery': 'Gizem', 'Reincarnation': 'Reenkarnasyon',
    'Romance': 'Romantik', 'School': 'Okul', 'Sci-Fi': 'Bilim Kurgu',
    'Supernatural': 'Doğaüstü', 'Thriller': 'Gerilim',
    'Ecchi': 'Ecchi', 'Harem': 'Harem', 'Josei': 'Josei', 'Mature': 'Yetişkin',
    'Mecha': 'Mecha', 'Psychological': 'Psikolojik', 'Seinen': 'Seinen', 'Shoujo': 'Shoujo',
    'Shounen': 'Shounen', 'Slice of Life': 'Günlük Yaşam', 'Sports': 'Spor',
    'Tragedy': 'Trajedi', 'Webtoon': 'Webtoon', 'Manhwa': 'Manhwa', 'Manhua': 'Manhua'
};

function isDefaultTitle(title, chNum) {
    if (!title) return true;
    const cleanTitle = title.trim().toLowerCase();
    const cleanNum = String(chNum).trim().toLowerCase();
    const normalized = cleanTitle.replace(/\s+/g, ' ');
    const defaults = [
        `chapter ${cleanNum}`,
        `ch. ${cleanNum}`,
        `ch.${cleanNum}`,
        `bölüm ${cleanNum}`,
        `böl. ${cleanNum}`,
        `böl.${cleanNum}`,
        `bö. ${cleanNum}`,
        `bö.${cleanNum}`,
        `${cleanNum}. bölüm`,
        `${cleanNum}.bölüm`,
        `bölüm: ${cleanNum}`,
        `bölüm:${cleanNum}`,
        `bölüm-${cleanNum}`,
        `bölüm_${cleanNum}`,
        cleanNum
    ];
    return defaults.includes(normalized);
}

function capitalizeFirst(str) {
    if (!str) return '';
    let first = str.charAt(0);
    if (first === 'i') first = 'İ';
    else if (first === 'ı') first = 'I';
    else if (first === 'ş') first = 'Ş';
    else if (first === 'ğ') first = 'Ğ';
    else if (first === 'ü') first = 'Ü';
    else if (first === 'ö') first = 'Ö';
    else if (first === 'ç') first = 'Ç';
    else first = first.toUpperCase();
    return first + str.slice(1);
}

function formatType(type) {
    if (!type) return '';
    const lower = type.toLowerCase();
    if (lower === 'manga') return 'Manga';
    if (lower === 'manhwa') return 'Manhwa';
    if (lower === 'manhua') return 'Manhua';
    if (lower === 'webtoon') return 'Webtoon';
    if (lower === 'novel') return 'Roman';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function useAppSettings() {
    const [s, setS] = useState({});
    useEffect(() => {
        fetch('/api/settings').then(r => r.json()).then(d => setS(d.settings || {})).catch(() => {});
    }, []);
    return s;
}

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

const LIST_OPTIONS_BASE = [
    { value: 'reading',   labelKey: 'lang_list_reading',    fallback: 'Okuyor',       Icon: ReadingIcon },
    { value: 'completed', labelKey: 'lang_list_completed',  fallback: 'Tamamlandı',   Icon: CompletedIcon },
    { value: 'plan',      labelKey: 'lang_list_plan',       fallback: 'Okuma Planı',  Icon: PlanIcon },
    { value: 'dropped',   labelKey: 'lang_list_dropped',    fallback: 'Bırakıldı',    Icon: DroppedIcon },
];

export default function SeriesDetailClient({ series, chapters, relatedSeries: initialRelated }) {
    const { user, authFetch } = useAuth();
    const appSettings = useAppSettings();
    const [relatedSeries, setRelatedSeries] = useState(initialRelated || []);
    const [isFavorite, setIsFavorite] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sortDesc, setSortDesc] = useState(true);
    const [dominantColor, setDominantColor] = useState(null);
    const [descExpanded, setDescExpanded] = useState(false);
    const [readingListStatus, setReadingListStatus] = useState(null);
    const [showListDropdown, setShowListDropdown] = useState(false);
    const [showAllChapters, setShowAllChapters] = useState(false);
    const [chapterSearch, setChapterSearch] = useState('');
    const [showStickyCTA, setShowStickyCTA] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        function handleScroll() {
            setShowStickyCTA(window.scrollY > 450);
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch related series if not provided server-side
    useEffect(() => {
        if (initialRelated && initialRelated.length > 0) return;
        if (!series?.id) return;
        async function fetchRelated() {
            try {
                const res = await fetch(`/api/series/similar?id=${series.id}&limit=6`);
                const data = await res.json();
                setRelatedSeries(data.similar || []);
            } catch { }
        }
        fetchRelated();
    }, [series?.id, initialRelated]);

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

    const genres = Array.isArray(series.genres) ? series.genres : (() => { try { return JSON.parse(series.genres || '[]'); } catch { return []; } })();
    const palette = generateAdaptivePalette(dominantColor);
    const adaptiveStyles = palette ? {
        '--accent': palette.accent,
        '--accent-light': palette.accentLight,
        '--accent-glow': palette.accentGlow,
        '--gradient-hero': palette.gradientHero,
        '--gradient-primary': palette.gradientPrimary
    } : {};

    const LIST_OPTIONS = LIST_OPTIONS_BASE.map(o => ({ ...o, label: appSettings[o.labelKey] || o.fallback }));
    const descText = series.description || (appSettings.lang_no_synopsis || 'Bu seri için özet mevcut değil.');
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
        ? (LIST_OPTIONS.find(o => o.value === readingListStatus)?.label || (appSettings.lang_add_to_list || 'Listeye Ekle'))
        : (appSettings.lang_add_to_list || 'Listeye Ekle');

    const firstChapter = sortedChapters[sortedChapters.length - 1];
    const lastChapter = sortedChapters[0];

    const designClass = appSettings.series_detail_design ? appSettings.series_detail_design.replace('_', '-') : 'detail-style1';

    return (
        <div className={`page-container fade-in sd-page ${designClass}`} style={{ position: 'relative', ...adaptiveStyles }}>
            {/* Parallax Background */}
            <div className="sd-parallax-wrapper">
                <div 
                    className="sd-parallax-banner" 
                    style={{ backgroundImage: `url(${series.cover_url || '/demo/cover1.jpg'})` }} 
                />
                <div className="sd-parallax-overlay" />
            </div>

            {/* ── Main Header ── */}
            <div className="sd-header">
                <div className="sd-header-content">
                    {/* Cover */}
                    <div className="sd-cover-col">
                        <div className="sd-cover-wrap">
                            <img
                                src={series.cover_url || '/demo/cover1.jpg'}
                                alt={`${series.title} manga cover`}
                                className="sd-cover-img"
                                crossOrigin="anonymous"
                                onLoad={(e) => setDominantColor(getDominantColor(e.target))}
                                width={460}
                                height={650}
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="sd-info-col">
                        {/* Title */}
                        <h1 className="sd-title">{series.title}</h1>
                        {series.alt_names && series.alt_names.trim() && (
                            <div className="sd-alt-names-subtitle" title="Diğer Alternatif İsimler">
                                {series.alt_names}
                            </div>
                        )}

                        {/* Description */}
                        <div className="sd-desc-wrap">
                            <p className="sd-desc" style={isLongDesc && !descExpanded ? {
                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                            } : {}}>
                                {descText}
                            </p>
                            {isLongDesc && (
                                <button className="sd-desc-toggle" onClick={() => setDescExpanded(v => !v)}>
                                    {descExpanded ? (appSettings.lang_show_less || 'Daralt ▲') : (appSettings.lang_show_more || 'Devamını Göster ▼')}
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
                                {isFavorite ? (appSettings.lang_bookmarked || 'Takip Ediliyor') : (appSettings.lang_favorite || 'Takip Et')}
                            </button>
                            {firstChapter && (
                                <Link href={`/series/${series.slug || series.id}/chapter/${firstChapter.chapter_number}`} className="sd-btn sd-btn-outline">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    {capitalizeFirst(appSettings.lang_first_chapter || 'İlk Bölüm')}
                                </Link>
                            )}
                            {lastChapter && lastChapter.id !== firstChapter?.id && (
                                <Link href={`/series/${series.slug || series.id}/chapter/${lastChapter.chapter_number}`} className="sd-btn sd-btn-outline">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                    {capitalizeFirst(appSettings.lang_latest_chapter || 'Son Bölüm')}
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
                                <span className="sd-stat-label">{capitalizeFirst(appSettings.lang_rating || 'Puan')}</span>
                            </div>
                            <div className="sd-stat">
                                <div className="sd-stat-icon" style={{ color: '#818cf8' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                </div>
                                <span className="sd-stat-value">{chapters.length}</span>
                                <span className="sd-stat-label">{capitalizeFirst(appSettings.lang_chapters || 'Bölümler')}</span>
                            </div>
                            <div className="sd-stat">
                                <div className="sd-stat-icon" style={{ color: '#34d399' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                </div>
                                <span className="sd-stat-value">{fmtNum(series.views)}</span>
                                <span className="sd-stat-label">{capitalizeFirst(appSettings.lang_views || 'Okunma')}</span>
                            </div>
                        </div>

                        {/* Meta details */}
                        <div className="sd-meta-grid">
                            <div className="sd-meta-row">
                                <span className="sd-meta-key">{capitalizeFirst(appSettings.lang_status || 'Durum')}</span>
                                <span className="sd-meta-val">
                                    <span className={`sd-status-dot ${series.status === 'ongoing' ? 'ongoing' : 'completed'}`} />
                                    {STATUS_TR[series.status] || (series.status ? capitalizeFirst(series.status) : '')}
                                </span>
                            </div>
                            {series.type && (
                                <div className="sd-meta-row">
                                    <span className="sd-meta-key">{capitalizeFirst(appSettings.lang_type || 'Tür')}</span>
                                    <span className="sd-meta-val">
                                        <span className="sd-status-dot" style={{ background: '#818cf8' }} />
                                        {formatType(series.type)}
                                    </span>
                                </div>
                            )}
                            {series.author && (
                                <div className="sd-meta-row">
                                    <span className="sd-meta-key">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        {capitalizeFirst(appSettings.lang_author || 'Yazar')}
                                    </span>
                                    <span className="sd-meta-val">{series.author}</span>
                                </div>
                            )}
                            {series.artist && series.artist !== series.author && (
                                <div className="sd-meta-row">
                                    <span className="sd-meta-key">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                                        {capitalizeFirst(appSettings.lang_artist || 'Çizer')}
                                    </span>
                                    <span className="sd-meta-val">{series.artist}</span>
                                </div>
                            )}
                        </div>

                        {/* Genres */}
                        {genres.length > 0 && (
                            <div className="sd-genres">
                                {genres.map((g, i) => (
                                    <span key={i} className="sd-genre-tag">{GENRE_TR[g] || g}</span>
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
                                                    <RemoveIcon /><span>Listeden Çıkar</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <button className="sd-btn sd-btn-outline sd-share-btn" onClick={shareSeries}>
                                {copied ? (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> {appSettings.lang_copied || 'Kopyalandı!'}</>
                                ) : (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> {appSettings.lang_share || 'Paylaş'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Chapter List ── */}
            <div className="sd-chapters-section">
                <div className="sd-chapters-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 className="sd-chapters-title">{chapters.length} {appSettings.lang_chapters || 'Bölümler'}</h2>
                    </div>
                    {chapters.length > 1 && (
                        <button className="sd-sort-btn" onClick={() => setSortDesc(v => !v)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={sortDesc ? "M11 17l-4 4-4-4M7 21V3M21 3v18" : "M11 7l-4-4-4 4M7 3v18M21 21V3"}/></svg>
                            {sortDesc ? (appSettings.lang_newest || 'En Yeni') : (appSettings.lang_oldest || 'En Eski')}
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
                            placeholder={appSettings.lang_search_chapters || 'Bölüm ara...'}
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
                        {appSettings.lang_no_chapters || 'Henüz bölüm yok. Yakında tekrar kontrol edin!'}
                    </div>
                ) : filteredChapters.length === 0 ? (
                    <div className="sd-empty-chapters">{appSettings.lang_no_chapters_match || 'Aramanızla eşleşen bölüm bulunamadı.'}</div>
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
                                        <span className="sdcr-number">Bölüm {Number(ch.chapter_number) % 1 === 0 ? Math.floor(ch.chapter_number) : ch.chapter_number}</span>
                                        {ch.title && !isDefaultTitle(ch.title, ch.chapter_number) && (
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
                                        <span className="sdcr-date">{new Date(ch.created_at).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {hasMore && (
                            <button onClick={() => setShowAllChapters(v => !v)} className="sd-show-more-btn">
                                {showAllChapters ? (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg> {appSettings.lang_show_less || 'Daha Az Göster'}</>
                                ) : (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg> {appSettings.lang_show_all || 'Tümünü Göster'} {chapters.length} {appSettings.lang_chapters || 'Bölümler'}</>
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="sd-seo-tags-section">
                <div className="section-header" style={{ marginBottom: 16 }}>
                    <h2 className="section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                        Etiketler
                    </h2>
                </div>
                <div className="seo-tags-cloud">
                    <Link href={`/series/${series.slug || series.id}`} className="seo-tag-pill seo-tag-pill--primary">
                        {series.title} Oku
                    </Link>
                    <Link href={`/series/${series.slug || series.id}`} className="seo-tag-pill seo-tag-pill--primary">
                        {series.title} Türkçe Oku
                    </Link>
                    <Link href={`/series/${series.slug || series.id}`} className="seo-tag-pill">
                        {series.title} Güncel Bölümler
                    </Link>
                    <Link href="/series" className="seo-tag-pill">
                        Manga Oku
                    </Link>
                    <Link href="/series" className="seo-tag-pill">
                        Türkçe Manga Oku
                    </Link>
                    {series.type && (
                        <Link href={`/series?type=${series.type.toLowerCase()}`} className="seo-tag-pill seo-tag-pill--type">
                            En İyi {formatType(series.type)} Serileri
                        </Link>
                    )}
                    {genres.slice(0, 4).map(g => (
                        <Link key={g} href={`/series?genre=${g}`} className="seo-tag-pill seo-tag-pill--genre">
                            {GENRE_TR[g] || g} Mangaları
                        </Link>
                    ))}
                    {firstChapter && (
                        <Link href={`/series/${series.slug || series.id}/chapter/${firstChapter.chapter_number}`} className="seo-tag-pill seo-tag-pill--chapter">
                            {series.title} 1. Bölüm
                        </Link>
                    )}
                    {series.alt_names && series.alt_names.trim() && series.alt_names.split(',').slice(0, 3).map((name, i) => name.trim() && (
                        <Link key={`alt-${i}`} href={`/series/${series.slug || series.id}`} className="seo-tag-pill seo-tag-pill--alt">
                            {name.trim()} Oku
                        </Link>
                    ))}
                </div>
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
                                {appSettings.lang_you_may_also_like || 'Bunları da Beğenebilirsiniz'}
                            </h2>
                            <Link href="/series" className="section-link">{appSettings.lang_view_all || 'Tümünü Gör'} →</Link>
                    </div>
                    <div className="series-grid">
                        {relatedSeries.map(s => <SeriesCard key={s.id} series={s} />)}
                    </div>
                </div>
            )}

            {/* Sticky CTA */}
            {mounted && createPortal(
                <div className={`sd-sticky-cta ${showStickyCTA ? 'visible' : ''}`}>
                    <div className="sd-sticky-cta-inner">
                        <img src={series.cover_url || '/demo/cover1.jpg'} alt="" className="sd-sticky-img" />
                        <div className="sd-sticky-info">
                            <span className="sd-sticky-title">{series.title}</span>
                        </div>
                        {firstChapter && (
                            <Link href={`/series/${series.slug || series.id}/chapter/${firstChapter.chapter_number}`} className="sd-btn sd-btn-primary" style={{ padding: '8px 24px', margin: 0, whiteSpace: 'nowrap' }}>
                                {appSettings.lang_read_now || 'Okumaya Başla'}
                            </Link>
                        )}
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
}