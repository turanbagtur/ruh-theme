'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SeriesCard from '@/components/SeriesCard';
import { useSettings } from '@/components/SettingsProvider';

const ALL_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Historical',
  'Horror', 'Isekai', 'Martial Arts', 'Mystery', 'Reincarnation', 'Romance',
  'School', 'Sci-Fi', 'Supernatural', 'Thriller',
];

const GENRE_TR = {
  'Action': 'Aksiyon', 'Adventure': 'Macera', 'Comedy': 'Komedi', 'Drama': 'Drama',
  'Fantasy': 'Fantastik', 'Historical': 'Tarihi', 'Horror': 'Korku', 'Isekai': 'Isekai',
  'Martial Arts': 'Dövüş Sanatları', 'Mystery': 'Gizem', 'Reincarnation': 'Reenkarnasyon',
  'Romance': 'Romantik', 'School': 'Okul', 'Sci-Fi': 'Bilim Kurgu',
  'Supernatural': 'Doğaüstü', 'Thriller': 'Gerilim'
};

const STATUS_TR = {
  'ongoing': 'Devam Ediyor', 'completed': 'Tamamlandı', 'hiatus': 'Ara Verildi', 'cancelled': 'İptal Edildi'
};

const PAGE_SIZE = 24;

function SeriesContent() {
  const searchParams = useSearchParams();
  // mounted flag: prevents SSR/CSR hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState('latest');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const { settings: lang } = useSettings();
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Read URL params only on client after mount to avoid hydration mismatch
  useEffect(() => {
    setSearch(searchParams.get('search') || searchParams.get('q') || '');
    setSortBy(searchParams.get('sort') || 'latest');
    setStatusFilter(searchParams.get('status') || '');
    setTypeFilter(searchParams.get('type') || '');
    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = useCallback((key, fallback) => lang[key] || fallback, [lang]);

  const fetchSeries = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedGenres.length > 0) params.set('genre', selectedGenres.join(','));
      if (sortBy) params.set('sort', sortBy);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      params.set('limit', String(PAGE_SIZE));
      params.set('page', String(pageNum));

      const res = await fetch(`/api/series?${params.toString()}`);
      const data = await res.json();
      const items = data.series || [];

      if (append) {
        setSeries(prev => [...prev, ...items]);
      } else {
        setSeries(items);
        setPage(1);
      }
      setTotal(data.total || items.length);
      setHasMore(data.hasMore || (data.total ? pageNum * PAGE_SIZE < data.total : items.length === PAGE_SIZE));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, selectedGenres, sortBy, statusFilter, typeFilter]);

// Initial load after mount + refetch when filters change
  useEffect(() => {
    if (!mounted) return;
    fetchSeries(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, selectedGenres, sortBy, statusFilter, typeFilter]);

  // Debounced search
  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSeries(1, false);
    }, 420);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    fetchSeries(1, false);
  }

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSeries(nextPage, true);
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
    setTypeFilter('');
    setSortBy('latest');
    if (searchInputRef.current) searchInputRef.current.value = '';
  }

  const hasFilters = search.trim() || selectedGenres.length > 0 || statusFilter || typeFilter || sortBy !== 'latest';

  // Before mount: render static skeleton to match server output exactly
  if (!mounted) {
    return (
      <div className="page-container page-section fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: '-4px', marginRight: 8 }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Manga Keşfet
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Yükleniyor...</p>
        </div>
        <div className="series-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  const statusOptions = [
    { value: '', label: t('lang_status_all', 'Tüm Durumlar') },
    { value: 'ongoing', label: t('lang_status_ongoing', 'Devam Ediyor') },
    { value: 'completed', label: t('lang_status_completed', 'Tamamlandı') },
    { value: 'hiatus', label: t('lang_status_hiatus', 'Ara Verildi') },
  ];

  const sortOptions = [
    { value: 'latest', label: t('lang_sort_latest', 'Son Güncellenen') },
    { value: 'popular', label: t('lang_sort_popular', 'En Popüler') },
    { value: 'rating', label: t('lang_sort_rating', 'En Yüksek Puan') },
    { value: 'title', label: t('lang_sort_az', 'A-Z') },
  ];

  return (
    <div className="page-container page-section fade-in">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {t('lang_browse_title', 'Manga Keşfet')}
        </h1>
        {t('lang_browse_subtitle', '') && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>
            {t('lang_browse_subtitle', '')}
          </p>
        )}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          {loading
            ? t('lang_reader_loading', 'Yükleniyor...')
            : `${total > 0 ? total : series.length} ${t('lang_stat_series', 'seri')}${hasFilters ? ' (filtrelenmiş)' : ''}`}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ marginBottom: 12 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'contents' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('lang_search_placeholder', 'Başlık veya yazara göre manga ara...')}
            value={search}
            onChange={handleSearchChange}
            style={{ flex: 1, minWidth: 0 }}
          />
        </form>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ minWidth: 0 }}>
          <option value="">Tüm Türler</option>
          <option value="manga">Manga</option>
          <option value="manhwa">Manhwa</option>
          <option value="manhua">Manhua</option>
          <option value="comic">Çizgi Roman</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 0 }}>
          {statusOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ minWidth: 0 }}>
          {sortOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Genre Tags */}
      <div className="genre-tags-filter" style={{ marginBottom: 12 }}>
        {ALL_GENRES.map(g => (
          <button
            key={g}
            className={`genre-tag-filter ${selectedGenres.includes(g) ? 'active' : ''}`}
            onClick={() => toggleGenre(g)}
            type="button"
          >
            {GENRE_TR[g] || g}
          </button>
        ))}
      </div>

      {/* Actions row */}
      <div className="filter-actions-row" style={{ marginBottom: 16 }}>
        <div className="active-filters">
          {hasFilters && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
              type="button"
              style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {t('lang_status_all', 'Filtreleri Temizle')}
              {selectedGenres.length > 0 && ` (${selectedGenres.length})`}
            </button>
          )}
        </div>
        <div className="view-toggle">
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
            title="Izgara Görünümü"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
            title="Liste Görünümü"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="series-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 8 }} />
          ))}
        </div>
      ) : series.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.5 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6 }}>
            {t('lang_no_results', 'Seri bulunamadı.')}
          </p>
          <p style={{ fontSize: '0.85rem' }}>Arama veya filtrelerinizi değiştirmeyi deneyin.</p>
          {hasFilters && (
            <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={clearFilters} type="button">
              Filtreleri Temizle
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="series-grid">
          {series.map(s => <SeriesCard key={s.id} series={s} />)}
        </div>
      ) : (
        <div className="series-list-view">
          {series.map(s => {
            const genres = Array.isArray(s.genres)
              ? s.genres
              : (() => { try { return JSON.parse(s.genres || '[]'); } catch { return []; } })();
            const statusLabel = s.status === 'ongoing'
              ? t('lang_status_ongoing', 'Devam Ediyor')
              : s.status === 'completed'
                ? t('lang_status_completed', 'Tamamlandı')
                : s.status === 'hiatus'
                  ? t('lang_status_hiatus', 'Ara Verildi')
                  : STATUS_TR[s.status] || s.status;
            return (
              <a key={s.id} href={`/series/${s.slug || s.id}`} className="series-list-item">
                <div className="series-list-cover">
                  <img src={s.cover_url || '/demo/cover1.jpg'} alt={s.title} loading="lazy" />
                </div>
                <div className="series-list-info">
                  <h3>{s.title}</h3>
                  {(s.author || s.artist) && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0' }}>
                      {s.author}{s.artist && s.artist !== s.author ? ` / ${s.artist}` : ''}
                    </p>
                  )}
                  <div className="series-list-meta">
                    <span className={`status-badge status-${s.status}`}>{statusLabel}</span>
                    {s.rating > 0 && <span>★ {s.rating?.toFixed(1)}</span>}
                    <span>{s.chapterCount || s.chapter_count || 0} bölüm</span>
                    {genres.slice(0, 3).map(g => (
                      <span key={g} className="genre-tag" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>{GENRE_TR[g] || g}</span>
                    ))}
                  </div>
                  {s.description && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.description}
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {!loading && hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            className="btn btn-secondary"
            onClick={loadMore}
            disabled={loadingMore}
            type="button"
            style={{ minWidth: 160 }}
          >
            {loadingMore ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Yükleniyor...
              </span>
            ) : (
              t('lang_load_more', 'Daha Fazla Yükle')
            )}
          </button>
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