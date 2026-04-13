'use client';
import { useState, useEffect, Suspense, useCallback } from 'react';
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

    // Initialize theater mode on mount
    useEffect(() => {
        const stored = localStorage.getItem('yt_theater_mode');
        if (stored === 'true') setTheaterMode(true);
    }, []);

    const toggleTheaterMode = () => {
        const next = !theaterMode;
        setTheaterMode(next);
        localStorage.setItem('yt_theater_mode', String(next));
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

    // Gamification Hook: separated to avoid re-triggering on auth state changes
    // Only runs once when chapter ID changes (not language/auth changes)
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

    async function handleLanguageChange(lang) {
        setSelectedLang(lang);
        window.history.replaceState(null, '', lang ? `/read/${chapterId}?lang=${lang}` : `/read/${chapterId}`);
    }

    // Translate a single page with up to `maxRetries` retries and delay between attempts
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
                    // Exponential backoff: 1.5s → 3s → 6s
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

        // Reset cancel flag
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

            // Process pages with concurrency limit of 2 to avoid overwhelming the API
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

    // Navigate to chapter helper
    const navigateTo = useCallback((chapter) => {
        if (!chapter) return;
        const langSuffix = selectedLang ? `?lang=${selectedLang}` : '';
        router.push(`/read/${chapter.id}${langSuffix}`);
    }, [selectedLang, router]);

    // Keyboard navigation
    useEffect(() => {
        if (!data) return;
        function handleKeyDown(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft' && data.prevChapter) {
                navigateTo(data.prevChapter);
            } else if (e.key === 'ArrowRight' && data.nextChapter) {
                navigateTo(data.nextChapter);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data, navigateTo]);

    // Show shortcut hint briefly
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

    return (
        <div className={`fade-in ${theaterMode ? 'theater-mode' : ''}`}>
            {/* Reader Header */}
            <div className="reader-header">
                <div className="reader-header-left">
                    <Link href={`/series/${series.slug || series.id}`} className="btn btn-icon" title="Back to series">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    </Link>
                    <div className="reader-header-info">
                        <h2>{series.title}</h2>
                        <span>Chapter {chapter.chapter_number} — {chapter.title}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-icon" onClick={toggleTheaterMode} title={theaterMode ? "Turn Lights On" : "Theater Mode"} style={{ color: theaterMode ? 'var(--warning)' : 'inherit' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={theaterMode ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                    </button>
                    <LanguageSelector selectedLang={selectedLang} onSelect={handleLanguageChange} disabled={translating} />
                    {hasUntranslated && !translating && (
                        <button className="btn btn-primary btn-sm" onClick={translateAllPages}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                            Translate All
                        </button>
                    )}
                    {translating && (
                        <button className="btn btn-danger btn-sm" onClick={cancelTranslation} disabled={translateCancelled}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
            <div className="reader-container" style={{ position: 'relative' }}>
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
                        <div key={page.id} className="reader-page">
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

            {/* Keyboard shortcut tooltip */}
            {showShortcuts && (
                <div className="shortcut-tooltip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12"/></svg>
                    Use ← → arrow keys to navigate chapters
                </div>
            )}

            {/* Chapter Navigation */}
            <div className="reader-nav">
                {prevChapter ? (
                    <Link href={`/read/${prevChapter.id}${selectedLang ? `?lang=${selectedLang}` : ''}`} className="btn btn-ghost">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                        Chapter {prevChapter.chapter_number}
                    </Link>
                ) : <span />}
                <Link href={`/series/${series.slug || series.id}`} className="btn btn-ghost">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    Series
                </Link>
                {nextChapter ? (
                    <Link href={`/read/${nextChapter.id}${selectedLang ? `?lang=${selectedLang}` : ''}`} className="btn btn-primary">
                        Chapter {nextChapter.chapter_number}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                    </Link>
                ) : <span />}
            </div>

            {/* Comments */}
            <div className="page-container">
                <CommentSection chapterId={chapterId} seriesId={series.id} />
            </div>
        </div>
    );
}

export default function ReaderPage() {
    return (
        <Suspense fallback={<div className="page-loading"><div className="spinner" /></div>}>
            <ReaderContent />
        </Suspense>
    );
}
