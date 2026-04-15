'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import SeriesCard from '@/components/SeriesCard';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { user, authFetch } = useAuth();
  const [popularSeries, setPopularSeries] = useState([]);
  const [latestUpdates, setLatestUpdates] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const [editorPick, setEditorPick] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [topSeries, setTopSeries] = useState([]);
  const [appSettings, setAppSettings] = useState({});
  const [topPeriod, setTopPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [topLoading, setTopLoading] = useState(false);
  const [stats, setStats] = useState({ series: 0, chapters: 0, languages: 0, users: 0, translations: 0 });
  const [slideIndex, setSlideIndex] = useState(0);
  const sliderRef = useRef(null);
  const autoplayRef = useRef(null);

  // Fetch real-time stats from dedicated endpoint
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats({
        series: data.series || 0,
        chapters: data.chapters || 0,
        languages: data.languages || 0,
        users: data.users || 0,
        translations: data.translations || 0,
      });
    } catch {}
  }, []);

  // Auto-refresh stats every 60 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [popRes, updRes, trendRes, edRes, annRes, settRes] = await Promise.all([
          fetch('/api/series?sort=popular&limit=5'),
          fetch('/api/series/latest-updates?limit=15'),
          fetch('/api/series/trending'),
          fetch('/api/series/editor-pick'),
          fetch('/api/announcements?active=true'),
          fetch('/api/settings')
        ]);
        const popData = await popRes.json();
        const updData = await updRes.json();
        const trendData = await trendRes.json();
        const edData = await edRes.json();
        const annData = await annRes.json();
        const settData = await settRes.json();

        setPopularSeries(popData.series || []);
        setLatestUpdates(updData.updates || []);
        setTrending(trendData.series || []);
        setEditorPick(edData.series || null);
        setAnnouncements(annData.announcements || []);
        if (settData.success) {
            setAppSettings(settData.settings || {});
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchTop() {
      setTopLoading(true);
      try {
        const res = await fetch(`/api/series/top?period=${topPeriod}`);
        const data = await res.json();
        setTopSeries(data.series || []);
      } catch (err) { console.error(err); }
      finally { setTopLoading(false); }
    }
    fetchTop();
  }, [topPeriod]);

  // Fetch real reading history if logged in
  useEffect(() => {
    if (!user) return;
    async function fetchHistory() {
      try {
        const res = await authFetch('/api/users/reading-history');
        const data = await res.json();
        setReadingHistory(data.history || []);
      } catch { }
    }
    fetchHistory();
  }, [user, authFetch]);


  const goToSlide = useCallback((i) => {
    setSlideIndex(i);
    if (sliderRef.current) {
      sliderRef.current.style.transform = `translateX(-${i * 100}%)`;
    }
  }, []);

  useEffect(() => {
    if (popularSeries.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      setSlideIndex(prev => {
        const next = (prev + 1) % popularSeries.length;
        if (sliderRef.current) {
          sliderRef.current.style.transform = `translateX(-${next * 100}%)`;
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(autoplayRef.current);
  }, [popularSeries.length]);

  function prevSlide() {
    const i = slideIndex === 0 ? popularSeries.length - 1 : slideIndex - 1;
    goToSlide(i);
  }
  function nextSlide() {
    const i = (slideIndex + 1) % popularSeries.length;
    goToSlide(i);
  }

  function parseGenres(g) {
    try { return Array.isArray(g) ? g : JSON.parse(g || '[]'); } catch { return []; }
  }

  function timeAgo(date) {
    if (!date) return '';
    const d = typeof date === 'string' && !date.endsWith('Z') ? date + 'Z' : date;
    const seconds = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="fade-in">
      {/* Hero Slider */}
      <div className="page-container page-section pt-0">
        {!loading && popularSeries.length > 0 && (
          <div className="hero-slider rounded-slider">
            <div className="hero-slider-track" ref={sliderRef}>
              {popularSeries.map((s, i) => (
                <div key={s.id} className="hero-slide">
                  <div className="hero-slide-bg">
                    <img src={s.cover_url || '/demo/cover1.jpg'} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
                  </div>
                  <div className="hero-slide-content">
                    <div className="hero-slide-meta">
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        {s.rating?.toFixed(1)}
                      </span>
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        {(s.views || 0).toLocaleString()}
                      </span>
                    </div>
                    <h2>{s.title}</h2>
                    <div className="hero-slide-genres">
                      {parseGenres(s.genres).slice(0, 3).map((g, j) => (
                        <span key={j} className="genre-tag">{g}</span>
                      ))}
                    </div>
                    <div className="hero-slide-actions">
                      <Link href={`/series/${s.slug || s.id}`} className="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                        Read Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {popularSeries.length > 1 && (
              <>
                <button className="hero-slider-arrow left" onClick={prevSlide} aria-label="Previous">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button className="hero-slider-arrow right" onClick={nextSlide} aria-label="Next">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                </button>
                <div className="hero-slider-dots">
                  {popularSeries.map((_, i) => (
                    <button key={i} className={`hero-dot ${slideIndex === i ? 'active' : ''}`} onClick={() => goToSlide(i)} aria-label={`Slide ${i + 1}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {loading && (
          <div className="hero-slider rounded-slider skeleton" style={{ height: '420px' }}></div>
        )}
      </div>

      {/* Announcements Bar */}
      {announcements.length > 0 && (
        <section className="page-container page-section pt-0" style={{ paddingBottom: '10px' }}>
          <div className="announcements-bar">
            {announcements.map(ann => (
              <div key={ann.id} className="ann-item">
                <span className="ann-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  ANNOUNCEMENT
                </span>
                {ann.link_url ? (
                  <a href={ann.link_url} target="_blank" rel="noopener noreferrer" className="ann-message">{ann.message}</a>
                ) : (
                  <span className="ann-message">{ann.message}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Donation Banner */}
      {!loading && appSettings?.donation_enabled === '1' && (
        <section className="page-container page-section pt-0" style={{ paddingBottom: '10px' }}>
             <div className="donation-banner">
                <div className="donation-banner-content">
                    <svg className="donation-heart-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span>{appSettings.donation_text || 'Support us to keep the servers alive!'}</span>
                </div>
                <div className="donation-banner-actions">
                    {appSettings.paypal_url && (
                        <a href={appSettings.paypal_url} target="_blank" rel="noopener noreferrer" className="donation-btn paypal">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 21h4.5l.5-3.5h3.5a5.5 5.5 0 0 0 0-11H7z"/><path d="M10 14h5a3.5 3.5 0 0 0 0-7h-5z"/></svg> PayPal
                        </a>
                    )}
                    {appSettings.kofi_url && (
                        <a href={appSettings.kofi_url} target="_blank" rel="noopener noreferrer" className="donation-btn kofi">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> Ko-fi
                        </a>
                    )}
                </div>
             </div>
          </section>
        )}

      {/* Continue Reading (Homepage) */}
      {user && readingHistory.length > 0 && (
          <section className="page-container page-section pt-0" style={{ paddingBottom: '14px' }}>
             <Link href={`/read/${readingHistory[0].chapter_id}`} className="continue-reading-card group">
                <div className="cr-cover-wrapper">
                    <img src={readingHistory[0].cover_url || '/demo/cover1.jpg'} alt="" className="cr-cover" />
                </div>
                <div className="cr-info">
                   <span className="cr-subtitle">CONTINUE READING</span>
                   <h3 className="cr-title">{readingHistory[0].series_title}</h3>
                   <span className="cr-chapter">
                      Ch. {readingHistory[0].chapter_number}
                      {readingHistory[0].latest_chapter && readingHistory[0].latest_chapter > readingHistory[0].chapter_number ?
                          <span className="cr-badge">{readingHistory[0].latest_chapter - readingHistory[0].chapter_number} New</span> : null
                      }
                   </span>
                </div>
                <div className="cr-action">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
             </Link>
          </section>
      )}

      {/* Trending Series (Numbered) - Full Width Grid above the split */}
      {!loading && trending.length > 0 && (
        <section className="page-container page-section pt-0">
          <div className="section-header">
            <h2 className="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
              Trending Right Now
            </h2>
          </div>
          <div className="trending-grid">
            {trending.map((s, idx) => (
              <Link key={`trend-${s.id}`} href={`/series/${s.slug || s.id}`} className="trending-card group">
                <div className="tc-cover">
                  <span className={`tc-number rank-${idx + 1}`}>{idx + 1}</span>
                  <img src={s.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" />
                  <div className="tc-overlay" />
                </div>
                <div className="tc-info">
                  <span className="tc-title">{s.title}</span>
                  <span className="tc-genres">
                    {parseGenres(s.genres).slice(0, 2).join(', ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* MAIN LAYOUT: 2-COLUMN STRUCTURE (SCANLATION STYLE) */}
      <section className="page-container page-section pt-0 pb-40">
        <div className="main-layout">
          
          {/* LEFT COLUMN: LATEST UPDATES */}
          <div className="main-content">
            <div className="section-header">
              <h2 className="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                Latest Updates
              </h2>
            </div>
            
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner"></div></div>
            ) : (
              <div className="updates-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                {latestUpdates.map(s => (
                  <div key={s.id} className="asura-card">
                    <Link href={`/series/${s.slug || s.id}`} className="asura-cover-wrapper">
                        <img src={s.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" />
                      </Link>
                    <div className="asura-content">
                      <Link href={`/series/${s.slug || s.id}`} className="asura-title">{s.title}</Link>
                      <div className="asura-chapters">
                        {s.chapters && s.chapters.map(ch => (
                          <Link key={ch.id} href={`/read/${ch.id}`} className="asura-chapter-row">
                            <span className="name" style={{ fontWeight: 600 }}>
                              {ch.title && ch.title !== `Chapter ${ch.chapter_number}` 
                                ? `Ch. ${ch.chapter_number} - ${ch.title}` 
                                : `Chapter ${ch.chapter_number}`}
                            </span>
                            <span className="time" suppressHydrationWarning>{timeAgo(ch.created_at)}</span>
                          </Link>
                        ))}
                        {(!s.chapters || s.chapters.length === 0) && (
                          <span className="asura-chapter-row" style={{ opacity: 0.5 }}>No chapters yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <aside className="sidebar">
            
            {/* User Continue Reading Widget */}
            {user && readingHistory.length > 0 && (
              <div className="sidebar-widget">
                <div className="widget-header">
                  <h3>Continue Reading</h3>
                  <Link href="/profile">All →</Link>
                </div>
                <div className="sidebar-list">
                  {readingHistory.slice(0, 3).map(item => (
                    <Link key={item.chapter_id} href={`/read/${item.chapter_id}`} className="sidebar-item">
                      <img src={item.cover_url || '/demo/cover1.jpg'} alt="" />
                      <div className="si-info">
                        <span className="si-title">{item.series_title}</span>
                        <span className="si-sub">Ch. {item.chapter_number} — Continue</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Editor's Pick Widget */}
            {!loading && editorPick && (
              <div className="sidebar-widget">
                <div className="widget-header">
                  <h3>Editor's Pick</h3>
                </div>
                <Link href={`/series/${editorPick.slug || editorPick.id}`} className="editor-pick-widget">
                  <div className="epw-cover">
                    <img src={editorPick.cover_url || '/demo/cover1.jpg'} alt="" loading="lazy" />
                  </div>
                  <div className="epw-info">
                    <span className="epw-title">{editorPick.title}</span>
                    <p className="epw-desc">{editorPick.description}</p>
                    <button className="btn btn-primary btn-sm mt-2 w-full">Start Reading</button>
                  </div>
                </Link>
              </div>
            )}

            {/* Most Read Widget — v3 (reference style) */}
            <div className="mr3-widget">
              {/* Header row: title left, tabs right */}
              <div className="mr3-header">
                <h3 className="mr3-title">Most Read</h3>
                <div className="mr3-tabs">
                  {[['daily','Daily'],['weekly','Weekly'],['monthly','Monthly'],['all','All']].map(([key, label]) => (
                    <button key={key} className={`mr3-tab ${topPeriod === key ? 'active' : ''}`} onClick={() => setTopPeriod(key)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mr3-list" style={{ opacity: topLoading ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                {topSeries.map((s, idx) => {
                  // rating is 0-10 scale; display as-is, show 5 stars by dividing by 2
                  const rating = s.rating || 0;
                  const starVal = rating / 2; // 0-5 for stars
                  const fullStars = Math.floor(starVal);
                  const halfStar = starVal - fullStars >= 0.4;
                  const gradId = `half-${s.id}`;
                  const genres = parseGenres(s.genres).slice(0, 3).join(', ');
                  return (
                    <Link key={s.id} href={`/series/${s.slug || s.id}`} className="mr3-item">
                      {/* Badge rank */}
                      <div className={`mr3-badge mr3-badge-${Math.min(idx + 1, 4)}`}>{idx + 1}</div>
                      {/* Cover */}
                      <div className="mr3-cover">
                        <img src={s.cover_url || '/demo/cover1.jpg'} alt={s.title} loading="lazy" />
                      </div>
                      {/* Info */}
                      <div className="mr3-info">
                        <span className="mr3-name">{s.title}</span>
                        {genres && <span className="mr3-genres-text">Genres: {genres}</span>}
                        <div className="mr3-stars">
                          <svg width="0" height="0" style={{position:'absolute'}}>
                            <defs>
                              <linearGradient id={gradId}>
                                <stop offset="50%" stopColor="#f59e0b"/>
                                <stop offset="50%" stopColor="transparent"/>
                              </linearGradient>
                            </defs>
                          </svg>
                          {Array.from({length: 5}).map((_, i) => (
                            <svg key={i} width="13" height="13" viewBox="0 0 24 24"
                              fill={i < fullStars ? '#f59e0b' : (i === fullStars && halfStar ? `url(#${gradId})` : 'none')}
                              stroke="#f59e0b" strokeWidth="1.5">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ))}
                          {/* Show actual rating value, not /2 */}
                          <span className="mr3-rating-num">{rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {!topLoading && topSeries.length === 0 && (
                  <div className="empty-text" style={{padding:'20px 0',textAlign:'center'}}>No views recorded.</div>
                )}
              </div>
            </div>

          </aside>
        </div>
      </section>

      {/* Stats Bar — Bottom */}
      <div className="stats-bar">
        <div className="stats-bar-inner">
          <div className="stat-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
            <div className="stat-content">
              <span className="stat-number">{stats.series}</span>
              <span className="stat-label">Series</span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            <div className="stat-content">
              <span className="stat-number">{stats.chapters}</span>
              <span className="stat-label">Chapters</span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
            <div className="stat-content">
              <span className="stat-number">{stats.languages || 12}+</span>
              <span className="stat-label">Languages</span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div className="stat-content">
              <span className="stat-number">{stats.users || 0}</span>
              <span className="stat-label">Members</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
