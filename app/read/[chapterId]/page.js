'use client';
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LanguageSelector from '@/components/LanguageSelector';
import CommentSection from '@/components/CommentSection';
import { useAuth } from '@/components/AuthProvider';

function ReaderContent() {
    const { chapterId } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedLang, setSelectedLang] = useState(searchParams.get('lang') || '');
    const [translating, setTranslating] = useState(false);
    const [translateProgress, setTranslateProgress] = useState('');
    const [translateCancelled, setTranslateCancelled] = useState(false);
    const translateCancelRef = useState({ cancelled: false })[0];
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [theaterMode, setTheaterMode] = useState(false);
    const { user, authFetch, refreshUser } = useAuth();

    // Reader settings
    const [showSettings, setShowSettings] = useState(false);
    const [fontSize, setFontSize] = useState(100); // image width %
    const [brightness, setBrightness] = useState(100);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const settingsRef = useRef(null);

    // Tap-to-show overlay
    const [showReaderOverlay, setShowReaderOverlay] = useState(false);
    const [showOverlaySettings, setShowOverlaySettings] = useState(false);
    const [showChapterPicker, setShowChapterPicker] = useState(false);
    const [allChapters, setAllChapters] = useState([]);
    const overlayTimerRef = useRef(null);

    // Initialize reader settings from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('yt_theater_mode');
        if (stored === 'true') setTheaterMode(true);
        const storedFs = localStorage.getItem('yt_font_size');
        if (storedFs) setFontSize(Number(storedFs));
        const storedBr = localStorage.getItem('yt_brightness');
        if (storedBr) setBrightness(Number(storedBr));
    }, []);

    // Scroll to top whenever the chapter changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [chapterId]);

    // Scroll-to-top visibility
    useEffect(() => {
        function handleScroll() {
            setShowScrollTop(window.scrollY > 400);
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch all chapters for chapter selector in overlay
    useEffect(() => {
        if (!data?.series?.id) return;
        fetch(`/api/series/${data.series.id}`)
            .then(r => r.json())
            .then(d => { if (d.chapters) setAllChapters(d.chapters); })
            .catch(() => {});
    }, [data?.series?.id]);

    // Tap-to-show overlay logic — show overlay on tap, auto-hide after 3s
    function handleReaderTap(e) {
        // Ignore taps on interactive elements or anything inside the navbar / dropdowns
        if (e.target.closest('button, a, input, select, .navbar, .user-menu, .dropdown-menu, .notif-dropdown, .notif-bell-wrapper')) return;
        // Only show if user has scrolled down a bit
        if (window.scrollY < 200) return;
        // Toggle
        if (showReaderOverlay) {
            setShowReaderOverlay(false);
            if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
        } else {
            setShowReaderOverlay(true);
            if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
            overlayTimerRef.current = setTimeout(() => setShowReaderOverlay(false), 4000);
        }
    }

    function keepOverlayOpen() {
        if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
        overlayTimerRef.current = setTimeout(() => setShowReaderOverlay(false), 4000);
    }

    // Close settings panel on outside click
    useEffect(() => {
        function handleClick(e) {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setShowSettings(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const toggleTheaterMode = () => {
        const next = !theaterMode;
        setTheaterMode(next);
        localStorage.setItem('yt_theater_mode', String(next));
    };

    const changeFontSize = (val) => {
        setFontSize(val);
        localStorage.setItem('yt_font_size', String(val));
    };

    const changeBrightness = (val) => {
        setBrightness(val);
        localStorage.setItem('yt_brightness', String(val));
    };

    const fetchChapter = useCallback(async () => {
        setLoading(true);
        try {
            const langParam = selectedLang ? `?lang=${selectedLang}` : '';
            const res = await fetch(`/api/chapters/${chapterId}${langParam}`);
            const result = await res.json();
            setData(result);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [chapterId, selectedLang]);

    useEffect(() => { fetchChapter(); }, [fetchChapter]);

    // Gamification: mark chapter as read (only on chapter change, not lang)
    useEffect(() => {
        if (!user || !authFetch) return;
        authFetch('/api/users/read-chapter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chapterId })
        }).then(() => { if (refreshUser) refreshUser(); })
          .catch(err => console.error('Failed to trigger Yomi Points hook', err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chapterId, user]);

    // Update browser URL to SEO-friendly format when data loads
    useEffect(() => {
        if (!data?.series || !data?.chapter) return;
        const slug = data.series.slug || data.series.id;
        const chNum = data.chapter.chapter_number;
        const langSuffix = selectedLang ? `?lang=${selectedLang}` : '';
        const seoUrl = `/series/${slug}/chapter/${chNum}${langSuffix}`;
        window.history.replaceState(null, '', seoUrl);
    }, [data, selectedLang]);

    async function handleLanguageChange(lang) {
        setSelectedLang(lang);
        if (data?.series && data?.chapter) {
            const slug = data.series.slug || data.series.id;
            const chNum = data.chapter.chapter_number;
            const langSuffix = lang ? `?lang=${lang}` : '';
            window.history.replaceState(null, '', `/series/${slug}/chapter/${chNum}${langSuffix}`);
        } else {
            window.history.replaceState(null, '', lang ? `/read/${chapterId}?lang=${lang}` : `/read/${chapterId}`);
        }
    }

    async function translatePageWithRetry(page, lang, maxRetries = 3, delayMs = 1500) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            if (translateCancelRef.cancelled) return { ok: false, cancelled: true };
            try {
                const res = await authFetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pageId: page.id, targetLang: lang }),
                });
                if (!res || !res.ok) {
                    const errData = await res?.json().catch(() => ({}));
                    throw new Error(errData?.error || `HTTP ${res?.status}`);
                }
                return { ok: true };
            } catch (err) {
                if (translateCancelRef.cancelled) return { ok: false, cancelled: true };
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, delayMs * attempt));
                } else {
                    return { ok: false, error: err.message };
                }
            }
        }
    }

    async function translateAllPages() {
        if (!selectedLang || !data?.pages) return;
        if (!user) { alert('Please log in to translate pages.'); return; }

        translateCancelRef.cancelled = false;
        setTranslateCancelled(false);
        setTranslating(true);
        setTranslateProgress('Starting...');

        try {
            const untranslated = data.pages.filter(p => !p.is_translated);
            if (untranslated.length === 0) {
                setTranslateProgress('All pages already translated!');
                setTimeout(() => setTranslating(false), 2000);
                return;
            }

            let done = 0;
            let errorCount = 0;
            const total = untranslated.length;
            const CONCURRENCY = 2;
            const queue = [...untranslated];
            const workers = Array.from({ length: CONCURRENCY }, async () => {
                while (queue.length > 0) {
                    if (translateCancelRef.cancelled) return;
                    const page = queue.shift();
                    if (!page) continue;
                    const result = await translatePageWithRetry(page, selectedLang);
                    done++;
                    if (result?.cancelled) return;
                    if (!result?.ok) errorCount++;
                    const pct = Math.round((done / total) * 100);
                    setTranslateProgress(`${pct}% — ${done}/${total} pages${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
                }
            });

            await Promise.all(workers);

            if (translateCancelRef.cancelled) {
                setTranslateProgress(`Cancelled — ${done}/${total} done`);
            } else if (errorCount > 0) {
                setTranslateProgress(`Done — ${errorCount} page(s) failed`);
            } else {
                setTranslateProgress(`Complete! (${total} pages)`);
            }
            await fetchChapter();
        } catch (err) {
            setTranslateProgress(`Error: ${err.message}`);
        } finally {
            setTranslating(false);
            translateCancelRef.cancelled = false;
        }
    }

    function cancelTranslation() {
        translateCancelRef.cancelled = true;
        setTranslateCancelled(true);
        setTranslateProgress('Cancelling...');
    }

    // Build SEO-friendly read URL
    function buildReadUrl(chapter) {
        if (!chapter) return null;
        const langSuffix = selectedLang ? `?lang=${selectedLang}` : '';
        return `/read/${chapter.id}${langSuffix}`;
    }

    const navigateTo = useCallback((chapter) => {
        if (!chapter) return;
        window.scrollTo({ top: 0, behavior: 'instant' });
        router.push(buildReadUrl(chapter));
    }, [selectedLang, router]); // eslint-disable-line

    // Keyboard navigation
    useEffect(() => {
        if (!data) return;
        function handleKeyDown(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft' && data.prevChapter) navigateTo(data.prevChapter);
            else if (e.key === 'ArrowRight' && data.nextChapter) navigateTo(data.nextChapter);
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data, navigateTo]);

    // Show shortcut hint briefly (desktop only)
    useEffect(() => {
        const timer = setTimeout(() => setShowShortcuts(true), 2000);
        const hide = setTimeout(() => setShowShortcuts(false), 8000);
        return () => { clearTimeout(timer); clearTimeout(hide); };
    }, []);

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    if (!data || !data.chapter) {
        return (
            <div className="page-container page-section" style={{ textAlign: 'center' }}>
                <h2>Chapter not found</h2>
                <Link href="/series" className="btn btn-ghost" style={{ marginTop: 16 }}>Back to Browse</Link>
            </div>
        );
    }

    const { chapter, series, pages, prevChapter, nextChapter } = data;
    const hasUntranslated = selectedLang && pages?.some(p => !p.is_translated);
    const seriesSlug = series.slug || series.id;

    return (
        <>
        {/* Floating scroll-to-top button — MUST be outside fade-in div (transform breaks position:fixed) */}
        {showScrollTop && (
            <button
                className="scroll-top-btn"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Scroll to top"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6" /></svg>
            </button>
        )}

        {/* ─── Tap-to-show Reader Control Overlay ─────────────────── */}
        {showReaderOverlay && data && (
            <div
                className="reader-tap-overlay"
                onClick={e => e.stopPropagation()}
                onTouchStart={e => { e.stopPropagation(); keepOverlayOpen(); }}
                onMouseMove={keepOverlayOpen}
            >
                <div className="rto-inner">
                    {/* Row 1: Seri adı + kapat */}
                    <div className="rto-topbar">
                        <span className="rto-title">{data.series?.title} — Ch. {data.chapter?.chapter_number}</span>
                        <button className="rto-icon-btn rto-close" onClick={() => setShowReaderOverlay(false)} title="Close">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                    </div>

                    {/* Row 2: Önceki | Bölüm Seçici | Sonraki */}
                    <div className="rto-nav-row">
                        {data.prevChapter ? (
                            <button className="rto-btn rto-btn-prev" onClick={() => { setShowReaderOverlay(false); navigateTo(data.prevChapter); }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                                Ch. {data.prevChapter.chapter_number}
                            </button>
                        ) : <span className="rto-empty-side"/>}

                        {allChapters.length > 0 ? (
                            <div className="rto-chapter-picker-wrap">
                                <button
                                    className="rto-chapter-btn"
                                    onClick={e => { e.stopPropagation(); setShowChapterPicker(v => !v); keepOverlayOpen(); }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                                    Ch. {data.chapter?.chapter_number}
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6"/></svg>
                                </button>
                                {showChapterPicker && (
                                    <div className="rto-chapter-list" onClick={e => e.stopPropagation()}>
                                        {[...allChapters].sort((a,b) => b.chapter_number - a.chapter_number).map(ch => (
                                            <button
                                                key={ch.id}
                                                className={`rto-chapter-item ${String(ch.id) === String(data.chapter?.id) ? 'current' : ''}`}
                                                onClick={() => { setShowChapterPicker(false); setShowReaderOverlay(false); navigateTo(ch); }}
                                            >
                                                Ch. {ch.chapter_number}{ch.title ? ` — ${ch.title}` : ''}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="rto-ch-label">Chapter {data.chapter?.chapter_number}</span>
                        )}

                        {data.nextChapter ? (
                            <button className="rto-btn rto-btn-next" onClick={() => { setShowReaderOverlay(false); navigateTo(data.nextChapter); }}>
                                Ch. {data.nextChapter.chapter_number}
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                            </button>
                        ) : <span className="rto-empty-side"/>}
                    </div>

                    {/* Row 3: Utility buttons */}
                    <div className="rto-tools-row">
                        {/* Scroll to top */}
                        <button className="rto-tool-btn" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setShowReaderOverlay(false); }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6"/></svg>
                            <span>Top</span>
                        </button>

                        {/* Go to comments */}
                        <button className="rto-tool-btn" onClick={() => {
                            // Capture offset BEFORE closing overlay
                            const el = document.getElementById('comments-section');
                            const targetScrollY = el
                                ? el.getBoundingClientRect().top + window.scrollY - 80
                                : document.body.scrollHeight;
                            setShowReaderOverlay(false);
                            setTimeout(() => {
                                window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                            }, 80);
                        }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <span>Comments</span>
                        </button>

                        {/* Theater mode */}
                        <button className={`rto-tool-btn ${theaterMode ? 'active' : ''}`} onClick={() => { toggleTheaterMode(); keepOverlayOpen(); }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill={theaterMode ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                            <span>{theaterMode ? 'Lights On' : 'Lights Off'}</span>
                        </button>

                        {/* Settings toggle (inline in overlay) */}
                        <button className={`rto-tool-btn ${showOverlaySettings ? 'active' : ''}`} onClick={() => { setShowOverlaySettings(v => !v); keepOverlayOpen(); }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            <span>Settings</span>
                        </button>

                        {/* Series page */}
                        <Link href={`/series/${seriesSlug}`} className="rto-tool-btn" onClick={() => setShowReaderOverlay(false)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                            <span>Series</span>
                        </Link>
                    </div>

                    {/* Settings panel (inline, shown when settings toggled) */}
                    {showOverlaySettings && (
                        <div className="rto-settings-panel" onMouseMove={keepOverlayOpen} onTouchStart={keepOverlayOpen}>
                            <div className="rto-setting-row">
                                <label>Image Width</label>
                                <div className="rto-slider-wrap">
                                    <input type="range" min="50" max="100" step="5" value={fontSize}
                                        onClick={e => e.stopPropagation()}
                                        onTouchStart={e => e.stopPropagation()}
                                        onTouchMove={e => e.stopPropagation()}
                                        onChange={e => {
                                            const scrollY = window.scrollY;
                                            changeFontSize(Number(e.target.value));
                                            requestAnimationFrame(() => window.scrollTo(0, scrollY));
                                            keepOverlayOpen();
                                        }} />
                                    <span>{fontSize}%</span>
                                </div>
                            </div>
                            <div className="rto-setting-row">
                                <label>Brightness</label>
                                <div className="rto-slider-wrap">
                                    <input type="range" min="30" max="100" step="5" value={brightness}
                                        onClick={e => e.stopPropagation()}
                                        onTouchStart={e => e.stopPropagation()}
                                        onTouchMove={e => e.stopPropagation()}
                                        onChange={e => { changeBrightness(Number(e.target.value)); keepOverlayOpen(); }} />
                                    <span>{brightness}%</span>
                                </div>
                            </div>
                            <button className="rto-reset-btn" onClick={e => { e.stopPropagation(); changeFontSize(100); changeBrightness(100); keepOverlayOpen(); }}>Reset All</button>
                        </div>
                    )}
                </div>
            </div>
        )}
        <div className={`fade-in ${theaterMode ? 'theater-mode' : ''}`}>
            {/* Reader Header */}
            <div className="reader-header">
                <div className="reader-header-left">
                    <Link href={`/series/${seriesSlug}`} className="btn btn-icon" title="Back to series">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    </Link>
                    <div className="reader-header-info">
                        <h2>{series.title}</h2>
                        <span>Chapter {chapter.chapter_number}{chapter.title ? ` — ${chapter.title}` : ''}</span>
                    </div>
                </div>

                <div className="reader-header-controls">
                    {/* Theater / Lights toggle */}
                    <button
                        className="btn btn-icon reader-ctrl-btn"
                        onClick={toggleTheaterMode}
                        title={theaterMode ? 'Turn Lights On' : 'Theater Mode (Lights Off)'}
                        style={{ color: theaterMode ? 'var(--warning)' : 'inherit' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={theaterMode ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5" />
                            <path d="M9 18h6" /><path d="M10 22h4" />
                        </svg>
                    </button>

                    {/* Reader Settings Panel */}
                    <div className="reader-settings-wrap" ref={settingsRef}>
                        <button
                            className={`btn btn-icon reader-ctrl-btn ${showSettings ? 'active' : ''}`}
                            onClick={() => setShowSettings(!showSettings)}
                            title="Reader Settings"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                        </button>

                        {showSettings && (
                            <div className="reader-settings-panel">
                                <div className="rsp-header">Reader Settings</div>

                                <div className="rsp-row">
                                    <label className="rsp-label">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                                        Image Width
                                    </label>
                                    <div className="rsp-slider-row">
                                        <input
                                            type="range"
                                            min="50"
                                            max="100"
                                            step="5"
                                            value={fontSize}
                                            onChange={e => changeFontSize(Number(e.target.value))}
                                            className="rsp-slider"
                                        />
                                        <span className="rsp-value">{fontSize}%</span>
                                    </div>
                                </div>

                                <div className="rsp-row">
                                    <label className="rsp-label">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                                        Brightness
                                    </label>
                                    <div className="rsp-slider-row">
                                        <input
                                            type="range"
                                            min="30"
                                            max="100"
                                            step="5"
                                            value={brightness}
                                            onChange={e => changeBrightness(Number(e.target.value))}
                                            className="rsp-slider"
                                        />
                                        <span className="rsp-value">{brightness}%</span>
                                    </div>
                                </div>

                                <div className="rsp-row">
                                    <label className="rsp-label">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill={theaterMode ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                                        Theater Mode
                                    </label>
                                    <button
                                        className={`rsp-toggle ${theaterMode ? 'on' : ''}`}
                                        onClick={toggleTheaterMode}
                                    >
                                        <span className="rsp-toggle-knob" />
                                    </button>
                                </div>

                                <div className="rsp-row">
                                    <label className="rsp-label">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                                        Reset
                                    </label>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => { changeFontSize(100); changeBrightness(100); }}
                                        style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                                    >
                                        Reset All
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <LanguageSelector selectedLang={selectedLang} onSelect={handleLanguageChange} disabled={translating} />

                    {hasUntranslated && !translating && (
                        <button className="btn btn-primary btn-sm translate-btn" onClick={translateAllPages}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                            <span className="translate-btn-text">Translate All</span>
                        </button>
                    )}
                    {translating && (
                        <button className="btn btn-danger btn-sm" onClick={cancelTranslation} disabled={translateCancelled}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Translation Progress bar */}
            {translating && (
                <div className="translate-loading">
                    <div className="translate-spinner" />
                    <div className="translate-progress" style={{ flex: 1 }}>{translateProgress}</div>
                </div>
            )}

            {/* Reader with tap zones */}
            <div
                className="reader-container"
                style={{
                    position: 'relative',
                    filter: brightness < 100 ? `brightness(${brightness}%)` : undefined,
                }}
                onClick={handleReaderTap}
            >
                {/* Left tap zone (previous chapter) */}
                {prevChapter && (
                    <div className="reader-tap-zone left" onClick={() => navigateTo(prevChapter)} title="Previous Chapter">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    </div>
                )}
                {/* Right tap zone (next chapter) */}
                {nextChapter && (
                    <div className="reader-tap-zone right" onClick={() => navigateTo(nextChapter)} title="Next Chapter">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </div>
                )}

                {pages && pages.length > 0 ? (
                    pages.map((page, index) => (
                        <div key={page.id} className="reader-page" style={{ maxWidth: `${fontSize}%`, margin: '0 auto 2px' }}>
                            <img
                                src={page.display_image}
                                alt={`Page ${page.page_number}`}
                                loading={index < 3 ? 'eager' : 'lazy'}
                                style={{ backgroundColor: 'var(--bg-secondary)', minHeight: 200 }}
                            />
                            {selectedLang && !page.is_translated && !translating && (
                                <div className="reader-page-overlay">
                                    <button
                                        className="btn btn-primary"
                                        onClick={async () => {
                                            if (!user) { alert('Please log in to translate pages.'); return; }
                                            setTranslating(true);
                                            setTranslateProgress(`Translating page ${page.page_number}...`);
                                            try {
                                                await authFetch('/api/translate', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ pageId: page.id, targetLang: selectedLang }),
                                                });
                                                await fetchChapter();
                                            } catch (err) {
                                                alert(err.message);
                                            } finally {
                                                setTranslating(false);
                                                setTranslateProgress('');
                                            }
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                        Translate
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        <p>No pages available for this chapter yet.</p>
                        <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Upload pages from the admin panel.</p>
                    </div>
                )}
            </div>

            {/* Keyboard shortcut tooltip – desktop only */}
            {showShortcuts && (
                <div className="shortcut-tooltip hide-on-mobile">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12" /></svg>
                    Use ← → arrow keys to navigate chapters
                </div>
            )}

            {/* Chapter Navigation */}
            <div className="reader-nav">
                {prevChapter ? (
                    <Link href={buildReadUrl(prevChapter)} className="btn btn-ghost">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                        Ch. {prevChapter.chapter_number}
                    </Link>
                ) : <span />}
                <Link href={`/series/${seriesSlug}`} className="btn btn-ghost">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    Series
                </Link>
                {nextChapter ? (
                    <Link href={buildReadUrl(nextChapter)} className="btn btn-primary">
                        Ch. {nextChapter.chapter_number}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </Link>
                ) : <span />}
            </div>

            {/* Comments */}
            <div id="comments-section" className="page-container">
                <CommentSection chapterId={chapterId} seriesId={series.id} />
            </div>
        </div>
        </>
    );
}

export default function ReaderPage() {
    return (
        <Suspense fallback={<div className="page-loading"><div className="spinner" /></div>}>
            <ReaderContent />
        </Suspense>
    );
}
