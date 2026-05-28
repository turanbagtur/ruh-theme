'use client';
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CommentSection from '@/components/CommentSection';
import { useAuth } from '@/components/AuthProvider';

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
        `chapter ${cleanNum}`, `ch. ${cleanNum}`, `ch.${cleanNum}`,
        `bölüm ${cleanNum}`, `böl. ${cleanNum}`, `böl.${cleanNum}`,
        `${cleanNum}. bölüm`, `bölüm: ${cleanNum}`, cleanNum
    ];
    return defaults.includes(normalized);
}

export function ReaderContent({ chapterId: propChapterId } = {}) {
    const params = useParams();
    const chapterId = propChapterId || params.chapterId;
    const router = useRouter();
    
    // Core Data
    const [data, setData] = useState(null);
    const [allChapters, setAllChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [failedPages, setFailedPages] = useState({});
    const [appSettings, setAppSettings] = useState({});
    
    // Auth & Gamification
    const { user, authFetch, refreshUser } = useAuth();
    const [readTriggered, setReadTriggered] = useState(false);
    
    // Reader Settings
    const [readingMode, setReadingMode] = useState('webtoon'); // 'webtoon' or 'manga'
    const [mangaDirection, setMangaDirection] = useState('rtl'); // 'rtl' (Right-to-Left) or 'ltr'
    const [seamlessMode, setSeamlessMode] = useState(false);
    const [theaterMode, setTheaterMode] = useState(false);
    const [fontSize, setFontSize] = useState(100);
    const [brightness, setBrightness] = useState(100);
    
    // Novel Mode State
    const [novelTheme, setNovelTheme] = useState('dark'); // 'dark', 'light', 'sepia'
    const [novelFontFamily, setNovelFontFamily] = useState('sans-serif'); // 'sans-serif', 'serif'
    const [novelFontSize, setNovelFontSize] = useState(18); // px
    const [novelLineHeight, setNovelLineHeight] = useState(1.8);
    const [novelTextAlign, setNovelTextAlign] = useState('left'); // 'left', 'justify'
    
    // TTS State
    const [ttsPlaying, setTtsPlaying] = useState(false);
    const [ttsPaused, setTtsPaused] = useState(false);
    const [ttsRate, setTtsRate] = useState(1.0);

    // Manga Mode State
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    
    // HUD State
    const [hudVisible, setHudVisible] = useState(true);
    const [activePanel, setActivePanel] = useState(null); // 'settings', 'chapters', null
    const [readingProgress, setReadingProgress] = useState(0);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    const lastScrollY = useRef(0);
    const hudTimerRef = useRef(null);
    const isMangaMode = readingMode === 'manga' && data?.series?.type !== 'novel';
    const isNovelMode = data?.series?.type === 'novel';

    // 1. INIT SETTINGS
    useEffect(() => {
        const _mode = localStorage.getItem('yt_reading_mode') || 'webtoon';
        const _dir = localStorage.getItem('yt_manga_dir') || 'rtl';
        const _theater = localStorage.getItem('yt_theater_mode') === 'true';
        const _seamless = localStorage.getItem('yt_seamless_mode') === 'true';
        const _fs = localStorage.getItem('yt_font_size');
        const _br = localStorage.getItem('yt_brightness');

        setReadingMode(_mode);
        setMangaDirection(_dir);
        setTheaterMode(_theater);
        setSeamlessMode(_seamless);
        if (_fs) setFontSize(Number(_fs));
        if (_br) setBrightness(Number(_br));

        const _nTheme = localStorage.getItem('yt_novel_theme') || 'dark';
        const _nFont = localStorage.getItem('yt_novel_font') || 'sans-serif';
        const _nFs = localStorage.getItem('yt_novel_fontsize');
        const _nLh = localStorage.getItem('yt_novel_lineheight');
        const _nAlign = localStorage.getItem('yt_novel_textalign') || 'left';
        const _ttsRate = localStorage.getItem('yt_tts_rate');

        setNovelTheme(_nTheme);
        setNovelFontFamily(_nFont);
        if (_nFs) setNovelFontSize(Number(_nFs));
        if (_nLh) setNovelLineHeight(Number(_nLh));
        setNovelTextAlign(_nAlign);
        if (_ttsRate) setTtsRate(Number(_ttsRate));

        fetch('/api/settings').then(r => r.json()).then(d => setAppSettings(d.settings || {})).catch(() => {});
        setMounted(true);
    }, []);

    // 2. FETCH DATA
    const fetchChapter = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/chapters/${chapterId}`);
            const result = await res.json();
            setData(result);
            setCurrentPageIndex(0); // reset manga page on load
            
            // Auto scroll bookmark logic for novel
            if (result?.series?.type === 'novel') {
                const savedScroll = localStorage.getItem(`yt_novel_scroll_${chapterId}`);
                if (savedScroll) {
                    setTimeout(() => {
                        window.scrollTo({ top: Number(savedScroll), behavior: 'smooth' });
                    }, 500); // Wait for render
                }
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [chapterId]);

    useEffect(() => { fetchChapter(); setReadTriggered(false); setFailedPages({}); }, [fetchChapter]);
    
    // Reset TTS on unmount or chapter change
    useEffect(() => {
        return () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, [chapterId]);

    useEffect(() => {
        if (!data?.series?.id) return;
        fetch(`/api/series/${data.series.id}`).then(r => r.json()).then(d => { if (d.chapters) setAllChapters(d.chapters); }).catch(() => {});
    }, [data?.series?.id]);

    useEffect(() => {
        if (!data?.series || !data?.chapter) return;
        const slug = data.series.slug || data.series.id;
        const chNum = data.chapter.chapter_number;
        window.history.replaceState(null, '', `/series/${slug}/chapter/${chNum}`);
    }, [data]);

    // 3. SCROLL PROGRESS (WEBTOON & NOVEL)
    useEffect(() => {
        if (isMangaMode) return;
        let scrollTimeout;
        function handleScroll() {
            const currentY = window.scrollY;
            // Hide HUD on scroll down, show on scroll up
            if (currentY > lastScrollY.current + 15 && currentY > 100) {
                setHudVisible(false);
                setActivePanel(null);
            } else if (currentY < lastScrollY.current - 15 || currentY < 100) {
                setHudVisible(true);
            }
            lastScrollY.current = currentY;

            const totalHeight = document.body.scrollHeight - window.innerHeight;
            const progress = totalHeight > 0 ? (currentY / totalHeight) * 100 : 0;
            setReadingProgress(Math.min(100, Math.max(0, progress)));
            
            // Save scroll position for novel bookmark
            if (isNovelMode) {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    localStorage.setItem(`yt_novel_scroll_${chapterId}`, currentY);
                }, 500);
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isMangaMode, isNovelMode, chapterId]);

    // MANGA PROGRESS
    useEffect(() => {
        if (!isMangaMode || !data?.pages) return;
        const total = data.pages.length;
        if (total === 0) return;
        setReadingProgress(Math.min(100, ((currentPageIndex + 1) / total) * 100));
    }, [isMangaMode, currentPageIndex, data]);

    // 4. NAVIGATION LOGIC
    function buildReadUrl(chapter) { return chapter ? `/read/${chapter.id}` : null; }
    
    const navigateTo = useCallback((chapter) => {
        if (!chapter) return;
        window.scrollTo({ top: 0, behavior: 'instant' });
        setHudVisible(true);
        setActivePanel(null);
        router.push(buildReadUrl(chapter));
    }, [router]);

    const goNextPage = useCallback(() => {
        if (!data?.pages) return;
        if (currentPageIndex < data.pages.length) {
            setCurrentPageIndex(prev => prev + 1);
        }
    }, [currentPageIndex, data]);

    const goPrevPage = useCallback(() => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
        } else if (data?.prevChapter) {
            navigateTo(data.prevChapter);
        }
    }, [currentPageIndex, data, navigateTo]);

    // 5. KEYBOARD SHORTCUTS
    useEffect(() => {
        if (!data) return;
        function handleKeyDown(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (isMangaMode) {
                if (e.key === 'ArrowRight') {
                    mangaDirection === 'rtl' ? goPrevPage() : goNextPage();
                } else if (e.key === 'ArrowLeft') {
                    mangaDirection === 'rtl' ? goNextPage() : goPrevPage();
                }
            } else {
                if (e.key === 'ArrowLeft' && data.prevChapter) navigateTo(data.prevChapter);
                else if (e.key === 'ArrowRight' && data.nextChapter) navigateTo(data.nextChapter);
                else if (e.key === 'w' || e.key === 'W') {
                    window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' });
                } else if (e.key === 's' || e.key === 'S' || e.key === ' ') {
                    if (e.key === ' ') e.preventDefault();
                    window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data, isMangaMode, mangaDirection, goNextPage, goPrevPage, navigateTo]);

    // 6. INTERACTIONS (TAPS & CLICKS)
    function handleReaderTap(e) {
        if (e.target.closest('button, a, input, select, textarea, .rh-topbar, .rh-bottombar, .rh-panel, #comments-section')) return;
        setHudVisible(v => !v);
        if (activePanel) setActivePanel(null);
    }

    function togglePanel(panelName) {
        if (activePanel === panelName) setActivePanel(null);
        else setActivePanel(panelName);
    }

    // 7. SETTINGS CHANGERS
    const updateSetting = (key, value, setter) => {
        setter(value);
        localStorage.setItem(`yt_${key}`, String(value));
    };

    // 8. POINTS GAMIFICATION
    useEffect(() => {
        if (!user || !authFetch || readTriggered) return;
        if (readingProgress > 70) {
            authFetch('/api/users/read-chapter', { method: 'POST', body: JSON.stringify({ chapterId }) })
              .then(() => { if (refreshUser) refreshUser(); })
              .catch(() => {});
            setReadTriggered(true);
        }
    }, [readingProgress, user, authFetch, chapterId, readTriggered, refreshUser]);

    // Selection Tooltip
    const [tooltipStyle, setTooltipStyle] = useState({ display: 'none', top: 0, left: 0, text: '' });
    
    useEffect(() => {
        if (!isNovelMode) return;
        const handleSelection = () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            if (text && text.length > 0 && text.length < 150) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                setTooltipStyle({
                    display: 'flex',
                    top: rect.top - 40 + window.scrollY,
                    left: rect.left + rect.width / 2,
                    text
                });
            } else {
                setTooltipStyle({ display: 'none' });
            }
        };
        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
    }, [isNovelMode]);


    if (loading) return <div className="page-loading"><div className="spinner" /></div>;
    if (!data || !data.chapter) {
        return (
            <div className="page-container page-section" style={{ textAlign: 'center' }}>
                <h2>{appSettings.lang_chapter_not_found || 'Bölüm bulunamadı'}</h2>
                <Link href="/series" className="btn btn-ghost" style={{ marginTop: 16 }}>{appSettings.lang_back_to_browse || 'Kataloğa Dön'}</Link>
            </div>
        );
    }

    const { chapter, series, pages, prevChapter, nextChapter } = data;
    const seriesSlug = series.slug || series.id;
    const showEndCard = isMangaMode && currentPageIndex >= (pages?.length || 0);

    // TTS functions
    const toggleTts = () => {
        if (!window.speechSynthesis) return;
        
        if (ttsPlaying && !ttsPaused) {
            window.speechSynthesis.pause();
            setTtsPaused(true);
        } else if (ttsPlaying && ttsPaused) {
            window.speechSynthesis.resume();
            setTtsPaused(false);
        } else {
            const textToSpeak = chapter?.content?.replace(/<[^>]+>/g, '') || '';
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.rate = ttsRate;
            utterance.lang = 'tr-TR';
            utterance.onend = () => { setTtsPlaying(false); setTtsPaused(false); };
            
            window.speechSynthesis.speak(utterance);
            setTtsPlaying(true);
            setTtsPaused(false);
        }
    };
    
    const stopTts = () => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        setTtsPlaying(false);
        setTtsPaused(false);
    };

    const getRootBackground = () => {
        if (isNovelMode) {
            if (novelTheme === 'light') return '#f5f5f5';
            if (novelTheme === 'sepia') return '#f4ecd8';
            return '#121212';
        }
        return theaterMode ? '#000' : 'var(--bg-primary)';
    };

    const paragraphs = isNovelMode ? (chapter?.content || '').split('\n').filter(p => p.trim() !== '') : [];

    return (
        <div className={theaterMode && !isNovelMode ? 'theater-mode' : ''} style={{ background: getRootBackground(), minHeight: '100vh', transition: 'background-color 0.3s ease' }}>
            
            {/* Selection Tooltip */}
            {tooltipStyle.display !== 'none' && (
                <div style={{
                    position: 'absolute',
                    top: tooltipStyle.top,
                    left: tooltipStyle.left,
                    transform: 'translateX(-50%)',
                    background: '#1a1a1a',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    fontSize: '0.85rem'
                }}>
                    <a href={`https://translate.google.com/?sl=auto&tl=tr&text=${encodeURIComponent(tooltipStyle.text)}&op=translate`} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>Çevir</a>
                    <span style={{ width: 1, background: '#444' }} />
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(tooltipStyle.text)}`} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>Ara</a>
                </div>
            )}

            {/* ── HUD (Heads-Up Display) ── */}
            {mounted && createPortal(
                <div className={`reader-hud ${hudVisible ? 'visible' : 'hidden'}`}>
                    
                    {/* Top Bar */}
                    <div className="rh-topbar">
                        <div className="rh-title-group">
                            <Link href={`/series/${seriesSlug}`} className="rh-back-btn" title="Seriye Dön">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                            </Link>
                            <div>
                                <h1 className="rh-series-title">{series.title}</h1>
                                <h2 className="rh-chapter-title">
                                    {appSettings.lang_chapter_prefix || 'Bölüm'} {chapter.chapter_number}
                                    {chapter.title && !isDefaultTitle(chapter.title, chapter.chapter_number) ? ` — ${chapter.title}` : ''}
                                </h2>
                            </div>
                        </div>
                        <div className="rh-nav-group">
                            <button className={`rh-btn ${activePanel === 'settings' ? 'active' : ''}`} onClick={() => togglePanel('settings')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                                <span>Ayarlar</span>
                            </button>
                        </div>
                    </div>

                    {/* Panels */}
                    <div className={`rh-panel ${activePanel === 'settings' ? 'open' : ''}`}>
                        <div className="rh-panel-title">Okuyucu Ayarları</div>

                        {isNovelMode ? (
                            <>
                                <div className="rh-setting-row">
                                    <span className="rh-setting-label">Tema</span>
                                    <div className="rh-mode-toggle">
                                        <button className={`rh-mode-btn ${novelTheme === 'dark' ? 'active' : ''}`} onClick={() => updateSetting('novel_theme', 'dark', setNovelTheme)}>Koyu</button>
                                        <button className={`rh-mode-btn ${novelTheme === 'light' ? 'active' : ''}`} onClick={() => updateSetting('novel_theme', 'light', setNovelTheme)}>Açık</button>
                                        <button className={`rh-mode-btn ${novelTheme === 'sepia' ? 'active' : ''}`} onClick={() => updateSetting('novel_theme', 'sepia', setNovelTheme)}>Sepya</button>
                                    </div>
                                </div>
                                <div className="rh-setting-row">
                                    <span className="rh-setting-label">Yazı Tipi</span>
                                    <div className="rh-mode-toggle">
                                        <button className={`rh-mode-btn ${novelFontFamily === 'sans-serif' ? 'active' : ''}`} onClick={() => updateSetting('novel_font', 'sans-serif', setNovelFontFamily)}>Sans-Serif</button>
                                        <button className={`rh-mode-btn ${novelFontFamily === 'serif' ? 'active' : ''}`} onClick={() => updateSetting('novel_font', 'serif', setNovelFontFamily)}>Serif</button>
                                    </div>
                                </div>
                                <div className="rh-setting-row">
                                    <span className="rh-setting-label">Metin Boyutu</span>
                                    <div className="rh-setting-control">
                                        <input type="range" min="14" max="36" step="1" value={novelFontSize} onChange={e => updateSetting('novel_fontsize', Number(e.target.value), setNovelFontSize)} className="rh-slider" />
                                        <span style={{ fontSize: '0.8rem', color: '#fff', width: 30 }}>{novelFontSize}px</span>
                                    </div>
                                </div>
                                <div className="rh-setting-row">
                                    <span className="rh-setting-label">Hizalama</span>
                                    <div className="rh-mode-toggle">
                                        <button className={`rh-mode-btn ${novelTextAlign === 'left' ? 'active' : ''}`} onClick={() => updateSetting('novel_textalign', 'left', setNovelTextAlign)}>Sola</button>
                                        <button className={`rh-mode-btn ${novelTextAlign === 'justify' ? 'active' : ''}`} onClick={() => updateSetting('novel_textalign', 'justify', setNovelTextAlign)}>İki Yana</button>
                                    </div>
                                </div>
                                <div className="rh-setting-row">
                                    <span className="rh-setting-label">Satır Aralığı</span>
                                    <div className="rh-mode-toggle">
                                        <button className={`rh-mode-btn ${novelLineHeight === 1.5 ? 'active' : ''}`} onClick={() => updateSetting('novel_lineheight', 1.5, setNovelLineHeight)}>Dar</button>
                                        <button className={`rh-mode-btn ${novelLineHeight === 1.8 ? 'active' : ''}`} onClick={() => updateSetting('novel_lineheight', 1.8, setNovelLineHeight)}>Normal</button>
                                        <button className={`rh-mode-btn ${novelLineHeight === 2.2 ? 'active' : ''}`} onClick={() => updateSetting('novel_lineheight', 2.2, setNovelLineHeight)}>Geniş</button>
                                    </div>
                                </div>
                                <div className="rh-setting-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                                    <span className="rh-setting-label">Sesli Okuma (TTS)</span>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button className="btn btn-sm btn-primary" onClick={toggleTts}>
                                            {ttsPlaying && !ttsPaused ? 'Duraklat' : 'Oynat'}
                                        </button>
                                        <button className="btn btn-sm btn-ghost" onClick={stopTts} disabled={!ttsPlaying}>Durdur</button>
                                    </div>
                                </div>
                                <div className="rh-setting-row">
                                    <span className="rh-setting-label">Okuma Hızı</span>
                                    <div className="rh-setting-control">
                                        <input type="range" min="0.5" max="2" step="0.1" value={ttsRate} onChange={e => updateSetting('tts_rate', Number(e.target.value), setTtsRate)} className="rh-slider" />
                                        <span style={{ fontSize: '0.8rem', color: '#fff', width: 30 }}>{ttsRate}x</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="rh-setting-row">
                                    <span className="rh-setting-label">Okuma Modu</span>
                                    <div className="rh-mode-toggle">
                                        <button className={`rh-mode-btn ${!isMangaMode ? 'active' : ''}`} onClick={() => updateSetting('reading_mode', 'webtoon', setReadingMode)}>Webtoon</button>
                                        <button className={`rh-mode-btn ${isMangaMode ? 'active' : ''}`} onClick={() => updateSetting('reading_mode', 'manga', setReadingMode)}>Manga</button>
                                    </div>
                                </div>

                        {isMangaMode && (
                            <div className="rh-setting-row">
                                <span className="rh-setting-label">Yön</span>
                                <div className="rh-mode-toggle">
                                    <button className={`rh-mode-btn ${mangaDirection === 'rtl' ? 'active' : ''}`} onClick={() => updateSetting('manga_dir', 'rtl', setMangaDirection)}>Sağdan Sola</button>
                                    <button className={`rh-mode-btn ${mangaDirection === 'ltr' ? 'active' : ''}`} onClick={() => updateSetting('manga_dir', 'ltr', setMangaDirection)}>Soldan Sağa</button>
                                </div>
                            </div>
                        )}

                        <div className="rh-setting-row">
                            <span className="rh-setting-label">Resim Genişliği</span>
                            <div className="rh-setting-control">
                                <input type="range" min="50" max="100" step="5" value={fontSize} onChange={e => updateSetting('font_size', Number(e.target.value), setFontSize)} className="rh-slider" />
                                <span style={{ fontSize: '0.8rem', color: '#fff', width: 30 }}>{fontSize}%</span>
                            </div>
                        </div>

                        <div className="rh-setting-row">
                            <span className="rh-setting-label">Parlaklık</span>
                            <div className="rh-setting-control">
                                <input type="range" min="30" max="100" step="5" value={brightness} onChange={e => updateSetting('brightness', Number(e.target.value), setBrightness)} className="rh-slider" />
                                <span style={{ fontSize: '0.8rem', color: '#fff', width: 30 }}>{brightness}%</span>
                            </div>
                        </div>

                                {!isMangaMode && (
                                    <div className="rh-setting-row">
                                        <span className="rh-setting-label">Boşluksuz Mod</span>
                                        <button className={`rsp-toggle ${seamlessMode ? 'on' : ''}`} onClick={() => updateSetting('seamless_mode', !seamlessMode, setSeamlessMode)}>
                                            <span className="rsp-toggle-knob" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="rh-setting-row">
                            <span className="rh-setting-label">Sinema Modu (Koyu)</span>
                            <button className={`rsp-toggle ${theaterMode ? 'on' : ''}`} onClick={() => updateSetting('theater_mode', !theaterMode, setTheaterMode)}>
                                <span className="rsp-toggle-knob" />
                            </button>
                        </div>
                    </div>

                    <div className={`rh-panel ${activePanel === 'chapters' ? 'open' : ''}`}>
                        <div className="rh-panel-title">Bölüm Seçici</div>
                        <div className="rh-chapter-list">
                            {[...allChapters].sort((a,b) => b.chapter_number - a.chapter_number).map(ch => (
                                <button key={ch.id} className={`rh-chapter-item ${String(ch.id) === String(chapterId) ? 'current' : ''}`} onClick={() => navigateTo(ch)}>
                                    {appSettings.lang_chapter_prefix || 'Bölüm'} {ch.chapter_number}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div style={{ position: 'relative' }}>
                        <div className="hud-progress-container">
                            <div className="hud-progress-bar" style={{ width: `${readingProgress}%` }} />
                        </div>
                        <div className="rh-bottombar">
                            <button className="rh-btn" onClick={() => navigateTo(prevChapter)} disabled={!prevChapter} title="Önceki Bölüm">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                                <span>Önceki</span>
                            </button>
                            
                            <button className="rh-chapter-selector" onClick={() => togglePanel('chapters')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                                Bölüm {chapter.chapter_number}
                                {isMangaMode && <span style={{ opacity: 0.5, fontSize: '0.8rem', marginLeft: 4 }}>({currentPageIndex + 1}/{pages.length})</span>}
                            </button>

                            <button className="rh-btn" onClick={() => navigateTo(nextChapter)} disabled={!nextChapter} title="Sonraki Bölüm">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                                <span>Sonraki</span>
                            </button>
                        </div>
                    </div>

                </div>,
                document.body
            )}


            {/* ── OKUYUCU MODLARI ── */}
            {isNovelMode ? (
                <div 
                    className={`novel-mode-container novel-theme-${novelTheme}`}
                    style={{ 
                        fontFamily: novelFontFamily === 'serif' ? 'Georgia, serif' : 'Inter, system-ui, sans-serif',
                        fontSize: `${novelFontSize}px`,
                        lineHeight: novelLineHeight,
                        textAlign: novelTextAlign,
                        filter: brightness < 100 ? `brightness(${brightness}%)` : undefined,
                        minHeight: '100vh',
                        paddingBottom: 100,
                    }}
                >
                    <div className="novel-content" onClick={handleReaderTap}>
                        {paragraphs.map((pText, i) => (
                            <div key={i} id={`p-${i}`} className="novel-paragraph" style={{ position: 'relative' }}>
                                <div dangerouslySetInnerHTML={{ __html: pText }} />
                                <button 
                                    className="inline-comment-btn" 
                                    title="Bu paragrafa yorum yap"
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        window.dispatchEvent(new CustomEvent('inline-comment', { detail: { paragraphIndex: i } }));
                                        const sec = document.getElementById('comments-section');
                                        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    💬
                                </button>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 60, padding: '0 20px', maxWidth: 800, margin: '60px auto 0' }}>
                        <EndChapterCard series={series} seriesSlug={seriesSlug} nextChapter={nextChapter} navigateTo={navigateTo} appSettings={appSettings} />
                    </div>
                    <div id="comments-section" className="page-container" style={{ marginTop: 40, maxWidth: 800, margin: '40px auto 0', paddingBottom: 120 }}>
                        <CommentSection chapterId={chapterId} seriesId={series.id} />
                    </div>
                </div>
            ) : isMangaMode ? (
                <div className="manga-mode-container" style={{ filter: brightness < 100 ? `brightness(${brightness}%)` : undefined }}>
                    {showEndCard ? (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                            <EndChapterCard series={series} seriesSlug={seriesSlug} nextChapter={nextChapter} navigateTo={navigateTo} appSettings={appSettings} goPrevPage={goPrevPage} />
                        </div>
                    ) : (
                        <div className="manga-viewport" onClick={handleReaderTap}>
                            {/* Navigation Touch Zones */}
                            <div className="manga-nav-area left" onClick={(e) => { e.stopPropagation(); mangaDirection === 'rtl' ? goNextPage() : goPrevPage(); }} />
                            <div className="manga-nav-area right" onClick={(e) => { e.stopPropagation(); mangaDirection === 'rtl' ? goPrevPage() : goNextPage(); }} />
                            <div className="manga-nav-area center" onClick={handleReaderTap} />
                            
                            {pages[currentPageIndex] && (
                                <img
                                    className="manga-page-img"
                                    src={pages[currentPageIndex].image_url || pages[currentPageIndex].display_image}
                                    alt={`Sayfa ${pages[currentPageIndex].page_number}`}
                                    style={{ maxWidth: `${fontSize}%` }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            )}
                        </div>
                    )}
                </div>
            ) : (

            /* ── WEBTOON MODE (DİKEY OKUMA) ── */
                <div 
                    className="reader-container" 
                    style={{ filter: brightness < 100 ? `brightness(${brightness}%)` : undefined, display: 'flex', flexDirection: 'column', gap: seamlessMode ? 0 : 4, paddingBottom: 100 }}
                    onClick={handleReaderTap}
                >
                    {pages.map((page, index) => (
                        <div key={page.id} style={{ maxWidth: `${fontSize}%`, margin: seamlessMode ? '0 auto' : '0 auto 4px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            {failedPages[page.id] ? (
                                <div className="reader-error-placeholder" style={{ margin: seamlessMode ? 0 : undefined }}>
                                    <svg className="reader-error-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    <span style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Resim Yüklenemedi</span>
                                    <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); setFailedPages(prev => ({...prev, [page.id]: false, [`${page.id}_retry`]: Date.now()})); }}>Tekrar Dene</button>
                                </div>
                            ) : (
                                <img
                                    src={failedPages[`${page.id}_retry`] ? `${page.image_url || page.display_image}?retry=${failedPages[`${page.id}_retry`]}` : (page.image_url || page.display_image)}
                                    alt={`Sayfa ${page.page_number}`}
                                    loading={index < 3 ? 'eager' : 'lazy'}
                                    style={{ width: '100%', display: 'block' }}
                                    onError={() => setFailedPages(prev => ({...prev, [page.id]: true}))}
                                />
                            )}
                        </div>
                    ))}

                    <div style={{ marginTop: 60, padding: '0 20px' }}>
                        <EndChapterCard series={series} seriesSlug={seriesSlug} nextChapter={nextChapter} navigateTo={navigateTo} appSettings={appSettings} />
                    </div>

                    <div id="comments-section" className="page-container" style={{ marginTop: 40, paddingBottom: 120 }}>
                        <CommentSection chapterId={chapterId} seriesId={series.id} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── BÖLÜM SONU KARTI (Next Chapter) ──
function EndChapterCard({ series, seriesSlug, nextChapter, navigateTo, appSettings, goPrevPage }) {
    const [navigating, setNavigating] = useState(false);

    return (
        <div className="reader-end-card">
            <div className="rec-bg" style={{ backgroundImage: `url(${series.cover_url || '/demo/cover1.jpg'})` }} />
            <div className="rec-content">
                {nextChapter ? (
                    <>
                        <div className="rec-label">{appSettings.lang_next_up || 'SIRADAKİ BÖLÜM'}</div>
                        <div className="rec-title">{appSettings.lang_chapter_prefix || 'Bölüm'} {nextChapter.chapter_number}</div>
                        <button 
                            className="rec-btn" 
                            disabled={navigating}
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setNavigating(true);
                                navigateTo(nextChapter); 
                            }}
                        >
                            {navigating ? (
                                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                            ) : (
                                <>
                                    {appSettings.lang_read_chapter || 'Hemen Oku'}
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="rec-label" style={{ color: 'var(--success)' }}>{appSettings.lang_up_to_date || 'GÜNCELSİNİZ'}</div>
                        <div className="rec-title">{appSettings.lang_no_more_chapters || 'Şimdilik Başka Bölüm Yok'}</div>
                        <Link href={`/series/${seriesSlug}`} className="rec-btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={e => e.stopPropagation()}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                            {appSettings.lang_back_to_series || 'Seriye Dön'}
                        </Link>
                    </>
                )}
                {goPrevPage && (
                    <button className="btn btn-ghost" style={{ marginTop: 20, color: 'rgba(255,255,255,0.5)' }} onClick={(e) => { e.stopPropagation(); goPrevPage(); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg> Önceki Sayfaya Dön
                    </button>
                )}
            </div>
        </div>
    );
}

export default function ReaderPage({ chapterId } = {}) {
    return (
        <Suspense fallback={<div className="page-loading"><div className="spinner" /></div>}>
            <ReaderContent chapterId={chapterId} />
        </Suspense>
    );
}
