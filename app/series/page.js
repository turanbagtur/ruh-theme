'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SeriesCard from '@/components/SeriesCard';

const ALL_GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Historical', 'Horror', 'Isekai', 'Martial Arts', 'Mystery', 'Reincarnation', 'Romance', 'School', 'Sci-Fi', 'Supernatural', 'Thriller'];

function SeriesContent() {
    const searchParams = useSearchParams();
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        fetchSeries();
    }, [selectedGenres, sortBy, statusFilter]);

    async function fetchSeries() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (selectedGenres.length > 0) params.set('genre', selectedGenres.join(','));
            if (sortBy) params.set('sort', sortBy);
            if (statusFilter) params.set('status', statusFilter);
            const res = await fetch(`/api/series?${params.toString()}`);
            const data = await res.json();
            let filteredSeries = data.series || [];

            // Client-side multi-genre AND filter
            if (selectedGenres.length > 0) {
                filteredSeries = filteredSeries.filter(s => {
                    const genres = Array.isArray(s.genres) ? s.genres : (() => { try { return JSON.parse(s.genres || '[]'); } catch { return []; } })();
                    return selectedGenres.every(g => genres.includes(g));
                });
            }

            setSeries(filteredSeries);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        fetchSeries();
    }

    function toggleGenre(genre) {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    }

    function clearFilters() {
        setSearch('');
        setSelectedGenres([]);
        setStatusFilter('');
        setSortBy('latest');
    }

    const hasFilters = search || selectedGenres.length > 0 || statusFilter;

    return (
        <div className="page-container page-section fade-in">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: '-4px', marginRight: 8 }}>
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Browse Manga
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {loading ? 'Loading...' : `${series.length} series available${hasFilters ? ' (filtered)' : ''}`}
                </p>
            </div>

            <div className="filter-bar">
                <form onSubmit={handleSearch} style={{ display: 'contents' }}>
                    <input
                        type="text"
                        placeholder="Search manga by title, author..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, minWidth: 200 }}
                    />
                </form>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="latest">Latest</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="title">A-Z</option>
                </select>
            </div>

            {/* Multi-Select Genre Tags */}
            <div className="genre-tags-filter">
                {ALL_GENRES.map(g => (
                    <button
                        key={g}
                        className={`genre-tag-filter ${selectedGenres.includes(g) ? 'active' : ''}`}
                        onClick={() => toggleGenre(g)}
                    >
                        {g}
                    </button>
                ))}
            </div>

            {/* Active filters & view toggle */}
            <div className="filter-actions-row">
                <div className="active-filters">
                    {hasFilters && (
                        <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ fontSize: '0.75rem' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            Clear Filters {selectedGenres.length > 0 && `(${selectedGenres.length} genres)`}
                        </button>
                    )}
                </div>
                <div className="view-toggle">
                    <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Grid View">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                    </button>
                    <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="List View">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="series-grid">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ aspectRatio: '3/5' }} />
                    ))}
                </div>
            ) : series.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p style={{ fontSize: '1.1rem' }}>No series found.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Try adjusting your search or filters.</p>
                    {hasFilters && (
                        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={clearFilters}>Clear Filters</button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="series-grid">
                    {series.map(s => <SeriesCard key={s.id} series={s} />)}
                </div>
            ) : (
                <div className="series-list-view">
                    {series.map(s => {
                        const genres = Array.isArray(s.genres) ? s.genres : [];
                        return (
                            <a key={s.id} href={`/series/${s.slug || s.id}`} className="series-list-item">
                                <div className="series-list-cover">
                                    <img src={s.cover_url || '/demo/cover1.jpg'} alt={s.title} loading="lazy" />
                                </div>
                                <div className="series-list-info">
                                    <h3>{s.title}</h3>
                                    <p>{s.author}{s.artist && s.artist !== s.author ? ` / ${s.artist}` : ''}</p>
                                    <div className="series-list-meta">
                                        <span className={`status-badge status-${s.status}`}>{s.status === 'ongoing' ? 'Ongoing' : 'Completed'}</span>
                                        <span>★ {s.rating?.toFixed(1)}</span>
                                        <span>{s.chapterCount || 0} ch.</span>
                                        {genres.slice(0, 2).map(g => <span key={g} className="genre-tag" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>{g}</span>)}
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function SeriesListPage() {
    return (
        <Suspense fallback={<div className="page-loading"><div className="spinner" /></div>}>
            <SeriesContent />
        </Suspense>
    );
}
