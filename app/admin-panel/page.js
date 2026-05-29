'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

/* ── Icons ───────────────────────────────────────────────────── */
const I = { w: 16, h: 16 };
const DashIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>;
const KeyIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>;
const BookIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
const UsersIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const MsgIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const GearIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const ShieldIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const GlobeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const LockIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const RocketIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /></svg>;
const PlusIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const BackIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>;
const UploadIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const EyeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const ImageIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
const MegaphoneIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 6h4l5-4v14l-5-4h-4v7h-2z" /><path d="M4 8h2v8H4z" /></svg>;

const DownloadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const SyncIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>;
const LinkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;

const PaletteIcon = () => <svg width={I.w} height={I.h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;

const NAVS = [
    { id: 'announcements', label: 'Duyurular', icon: MegaphoneIcon },
    { id: 'overview', label: 'Genel Bakış', icon: DashIcon },
    { id: 'series', label: 'Seriler', icon: BookIcon },
    { id: 'scraper', label: 'Bot (Scraper)', icon: DownloadIcon },
    { id: 'media', label: 'Medya', icon: ImageIcon },
    { id: 'api-key', label: 'Güvenlik', icon: KeyIcon },
    { id: 'users', label: 'Kullanıcılar', icon: UsersIcon },
    { id: 'comments', label: 'Yorumlar', icon: MsgIcon },
    { id: 'requests', label: 'İstekler', icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
    { id: 'bug-reports', label: 'Hata Bildirimleri', icon: ShieldIcon },
    { id: 'settings', label: 'Ayarlar', icon: GearIcon },
    { id: 'customize', label: 'Özelleştirme', icon: PaletteIcon },
];

const REQ_STATUSES = [
    { value: 'pending',   label: 'Beklemede',   color: '#f59e0b' },
    { value: 'reviewing', label: 'İnceleniyor', color: '#6366f1' },
    { value: 'approved',  label: 'Onaylandı',  color: '#22c55e' },
    { value: 'rejected',  label: 'Reddedildi',  color: '#ef4444' },
    { value: 'added',     label: 'Eklendi ✓',   color: '#14b8a6' },
];

export default function AdminPanelPage() {
    const { user, loading: authLoading, authFetch, token } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('success');
    const [confirmModal, setConfirmModal] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [previewImage, setPreviewImage] = useState(null); // { src, title }
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Media management
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [mediaFilter, setMediaFilter] = useState('all');
    const [mediaPage, setMediaPage] = useState(1);
    const [mediaTotal, setMediaTotal] = useState(0);
    const [mediaHasMore, setMediaHasMore] = useState(false);
    
    async function loadMedia(pageNum = 1, append = false, category = mediaFilter) {
        setMediaLoading(true);
        try {
            const res = await authFetch(`/api/admin?action=list-media&page=${pageNum}&limit=50&category=${category}`);
            const data = await res.json();
            if (append) {
                setMediaFiles(prev => [...prev, ...(data.media || [])]);
            } else {
                setMediaFiles(data.media || []);
            }
            setMediaTotal(data.total || 0);
            setMediaHasMore(data.hasMore || false);
            setMediaPage(pageNum);
        } catch (err) { console.error(err); }
        finally { setMediaLoading(false); }
    }

    // Announcements
    const [announcements, setAnnouncements] = useState([]);
    const [annMsg, setAnnMsg] = useState('');
    const [annLink, setAnnLink] = useState('');

    // Series Requests
    const [seriesRequests, setSeriesRequests] = useState([]);
    const [reqLoading, setReqLoading] = useState(false);
    const [reqFilter, setReqFilter] = useState('all');
    const [editingReq, setEditingReq] = useState(null); // { id, status, admin_note }

    // Sub-views
    const [subView, setSubView] = useState(null); // 'create' | 'detail' | null
    const [detailSeries, setDetailSeries] = useState(null);
    const [detailChapters, setDetailChapters] = useState([]);
    const [editMode, setEditMode] = useState(false);

    // Series form
    const [sTitle, setSTitle] = useState('');
    const [sDesc, setSDesc] = useState('');
    const [sAuthor, setSAuthor] = useState('');
    const [sArtist, setSArtist] = useState('');
    const [sStatus, setSStatus] = useState('ongoing');
    const [sType, setSType] = useState('manga');
    const [sGenres, setSGenres] = useState('');
    const [sCover, setSCover] = useState(null);
    const [sCoverPreview, setSCoverPreview] = useState('');
    const [sRating, setSRating] = useState('0');
    const [sAltNames, setSAltNames] = useState('');

    // Chapter add
    const [cNum, setCNum] = useState('');
    const [cTitle, setCTitle] = useState('');
    const [cFiles, setCFiles] = useState(null);
    const cFileInputRef = useRef(null);

    // Upload pages
    const [uploadChapterId, setUploadChapterId] = useState(null);
    const [uFiles, setUFiles] = useState(null);

    // Edit chapter
    const [editingChapterId, setEditingChapterId] = useState(null);
    const [editChapNum, setEditChapNum] = useState('');
    const [editChapTitle, setEditChapTitle] = useState('');
    const [cContent, setCContent] = useState('');
    const [editChapContent, setEditChapContent] = useState('');
    
    // ── Rich Text Helpers ────────────────────────────────────────────────────
    const insertFormat = (tag, stateSetter, stateValue, textareaId) => {
        const textarea = document.getElementById(textareaId);
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const sel = stateValue.substring(start, end);
        let replacement = '';
        if (tag === 'bold') replacement = `<b>${sel || 'Kalın Metin'}</b>`;
        else if (tag === 'italic') replacement = `<i>${sel || 'Eğik Metin'}</i>`;
        else if (tag === 'h2') replacement = `<h2>${sel || 'Başlık'}</h2>`;
        else if (tag === 'h3') replacement = `<h3>${sel || 'Alt Başlık'}</h3>`;
        else if (tag === 'quote') replacement = `<blockquote>${sel || 'Alıntı'}</blockquote>`;
        else if (tag === 'br') replacement = `${sel}<br />`;
        
        const newText = stateValue.substring(0, start) + replacement + stateValue.substring(end);
        stateSetter(newText);
        setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + replacement.length, start + replacement.length); }, 0);
    };

    const FormatToolbar = ({ stateSetter, stateValue, textareaId }) => (
        <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', background: 'var(--bg-tertiary)', padding: '5px', borderRadius: '4px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }} onClick={() => insertFormat('bold', stateSetter, stateValue, textareaId)}><b>B</b></button>
            <button type="button" className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }} onClick={() => insertFormat('italic', stateSetter, stateValue, textareaId)}><i>I</i></button>
            <button type="button" className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }} onClick={() => insertFormat('h2', stateSetter, stateValue, textareaId)}><b>H2</b></button>
            <button type="button" className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }} onClick={() => insertFormat('h3', stateSetter, stateValue, textareaId)}><b>H3</b></button>
            <button type="button" className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }} onClick={() => insertFormat('quote', stateSetter, stateValue, textareaId)}>" "</button>
            <button type="button" className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }} onClick={() => insertFormat('br', stateSetter, stateValue, textareaId)}>Satır</button>
        </div>
    );
    
    // Bulk chapter upload
    const [bulkFiles, setBulkFiles] = useState(null);
    const [bulkStatus, setBulkStatus] = useState('');

    // ── Scraper state ────────────────────────────────────────────────────────
    const [scraperUrl, setScraperUrl] = useState('');
    const [scraperLang, setScraperLang] = useState('en');
    const [scraperFetchLoading, setScraperFetchLoading] = useState(false);
    const [scraperFetchResult, setScraperFetchResult] = useState(null);
    const [scraperImporting, setScraperImporting] = useState(false);
    const [scraperPublishMode, setScraperPublishMode] = useState('stage'); // 'stage' | 'publish'
    const [scraperSources, setScraperSources] = useState([]);
    const [scraperPending, setScraperPending] = useState([]);
    const [scraperJobs, setScraperJobs] = useState([]);
    const [scraperSourcesLoading, setScraperSourcesLoading] = useState(false);
    const [scraperSelectedPending, setScraperSelectedPending] = useState([]);
    const [scraperPublishing, setScraperPublishing] = useState(false);
    const [scraperSyncLoading, setScraperSyncLoading] = useState(false);
    // For the global Scraper tab
    const [allScraperSources, setAllScraperSources] = useState([]);
    const [allScraperSourcesLoading, setAllScraperSourcesLoading] = useState(false);
    // Create series from scratch via scrape
    const [scrapeNewUrl, setScrapeNewUrl] = useState('');
    const [scrapeNewLang, setScrapeNewLang] = useState('en');
    const [scrapeNewLoading, setScrapeNewLoading] = useState(false);
    const [scrapeNewPreview, setScrapeNewPreview] = useState(null);

    // View pages panel
    const [viewPagesChapterId, setViewPagesChapterId] = useState(null);
    const [viewPages, setViewPages] = useState([]);
    const [viewPagesLoading, setViewPagesLoading] = useState(false);

    async function openChapterPages(chapterId) {
        if (viewPagesChapterId === chapterId) { setViewPagesChapterId(null); setViewPages([]); return; }
        setViewPagesChapterId(chapterId);
        setViewPagesLoading(true);
        try {
            const res = await fetch(`/api/chapters/${chapterId}`);
            const data = await res.json();
            setViewPages(data.pages || []);
        } catch {}
        setViewPagesLoading(false);
    }

    // API Key


    // Turnstile
    const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
    const [turnstileSecretKey, setTurnstileSecretKey] = useState('');
    const [turnstileLoaded, setTurnstileLoaded] = useState(false);

    // Global Settings (Donations + Maintenance + Discord + Bug Reports)
    const [settings, setSettings] = useState({ 
        donation_enabled: '0', 
        donation_text: '', 
        paypal_url: '', 
        kofi_url: '', 
        maintenance_mode: '0', 
        maintenance_message: '',
        discord_enabled: '0',
        discord_url: '',
        bug_report_enabled: '0',
        show_new_chapter_badge: '1'
    });

    // Customization / Tema Ayarları
    const [customize, setCustomize] = useState({
        site_name: '',
        site_description: '',
        logo_url: '',
        favicon_url: '',
        accent_color: '#6366f1',
        button_color: '',
        button_hover_color: '',
        button_text_color: '',
        link_color: '',
        link_hover_color: '',
        navbar_bg_color: '',
        reader_bg_color: '',
        announcement_bg_color: '',
        footer_text: '',
        contact_email: '',
        discord_url: '',
        reddit_url: '',
        twitter_url: '',
        instagram_url: '',
        tiktok_url: '',
        youtube_url: '',
        facebook_url: '',
        og_image_url: '',
        google_analytics_id: '',
        custom_css: '',
        custom_head_scripts: '',
        seo_title_home: '',
        seo_desc_home: '',
        seo_title_series: '',
        seo_title_chapter: '',
        latest_updates_design: 'style4',
        comment_design: 'comment_style1',
    });
    const [customizeSubmitting, setCustomizeSubmitting] = useState(false);

    // Comment Settings (Emojis & Report Reasons)
    const [commentEmojis, setCommentEmojis] = useState([]);
    const [reportReasons, setReportReasons] = useState([]);
    const [newEmojiIcon, setNewEmojiIcon] = useState('');
    const [newEmojiLabel, setNewEmojiLabel] = useState('');
    const [newReasonText, setNewReasonText] = useState('');

    // Bug Reports State
    const [bugReports, setBugReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user || !['admin', 'manager', 'moderator', 'team_member'].includes(user.role)) { router.push('/login'); return; }
        if (token) fetchStats();
    }, [user, authLoading, token]);

    // Load series requests when switching to requests tab
    useEffect(() => {
        if (tab !== 'requests' || !token) return;
        setReqLoading(true);
        authFetch('/api/series-requests?admin=1')
            .then(r => r.json())
            .then(d => setSeriesRequests(d.requests || []))
            .catch(() => {})
            .finally(() => setReqLoading(false));
    }, [tab, token]);

    // Load bug reports when switching to bug-reports tab
    useEffect(() => {
        if (tab !== 'bug-reports' || !token) return;
        setReportsLoading(true);
        authFetch('/api/admin/reports')
            .then(r => r.json())
            .then(d => { if (d.success) setBugReports(d.reports || []); })
            .catch(() => {})
            .finally(() => setReportsLoading(false));
    }, [tab, token]);

    async function updateReportStatus(id, status) {
        try {
            const res = await authFetch('/api/admin/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            const data = await res.json();
            if (data.success) {
                setBugReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
                show('Bildirim durumu güncellendi');
            }
        } catch { show('İşlem başarısız', 'error'); }
    }

    async function deleteReport(id) {
        if (!window.confirm('Bu bildirim raporunu kalıcı olarak silmek istediğinize emin misiniz?')) return;
        try {
            const res = await authFetch(`/api/admin/reports?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setBugReports(prev => prev.filter(r => r.id !== id));
                show('Bildirim silindi');
            }
        } catch { show('Silme işlemi başarısız', 'error'); }
    }

    function show(text, type = 'success') { setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 4000); }

    async function fetchStats() {
        try {
            const r = await authFetch('/api/admin');
            if (r.ok) setStats(await r.json());
            const a = await authFetch('/api/announcements');
            const aData = await a.json();
            setAnnouncements(aData.announcements || []);

            const s = await fetch('/api/settings');
            const sData = await s.json();
            if (sData.success) {
                 setSettings({
                      donation_enabled: sData.settings.donation_enabled || '0',
                      donation_text: sData.settings.donation_text || '',
                      paypal_url: sData.settings.paypal_url || '',
                      kofi_url: sData.settings.kofi_url || '',
                      maintenance_mode: sData.settings.maintenance_mode || '0',
                      maintenance_message: sData.settings.maintenance_message || '',
                      discord_enabled: sData.settings.discord_enabled || '0',
                      discord_url: sData.settings.discord_url || '',
                      bug_report_enabled: sData.settings.bug_report_enabled || '0',
                      show_new_chapter_badge: sData.settings.show_new_chapter_badge || '1',
                 });
                 setTurnstileSiteKey(sData.settings.turnstile_site_key || '');
                 // We never pre-fill the secret key for security
                 setTurnstileLoaded(true);

                 // Load customization settings
                 setCustomize({
                     site_name: sData.settings.site_name || '',
                     site_description: sData.settings.site_description || '',
                     logo_url: sData.settings.logo_url || '',
                     favicon_url: sData.settings.favicon_url || '',
                     accent_color: sData.settings.accent_color || '#6366f1',
                     button_color: sData.settings.button_color || '',
                     button_hover_color: sData.settings.button_hover_color || '',
                     button_text_color: sData.settings.button_text_color || '',
                     link_color: sData.settings.link_color || '',
                     link_hover_color: sData.settings.link_hover_color || '',
                     navbar_bg_color: sData.settings.navbar_bg_color || '',
                     reader_bg_color: sData.settings.reader_bg_color || '',
                     announcement_bg_color: sData.settings.announcement_bg_color || '',
                     footer_text: sData.settings.footer_text || '',
                     contact_email: sData.settings.contact_email || '',
                     discord_url: sData.settings.discord_url || '',
                     reddit_url: sData.settings.reddit_url || '',
                     twitter_url: sData.settings.twitter_url || '',
                     instagram_url: sData.settings.instagram_url || '',
                     tiktok_url: sData.settings.tiktok_url || '',
                     youtube_url: sData.settings.youtube_url || '',
                     facebook_url: sData.settings.facebook_url || '',
                     og_image_url: sData.settings.og_image_url || '',
                     google_analytics_id: sData.settings.google_analytics_id || '',
                     custom_css: sData.settings.custom_css || '',
                     custom_head_scripts: sData.settings.custom_head_scripts || '',
                     seo_title_home: sData.settings.seo_title_home || '',
                     seo_desc_home: sData.settings.seo_desc_home || '',
                     seo_title_series: sData.settings.seo_title_series || '',
                     seo_title_chapter: sData.settings.seo_title_chapter || '',
                     latest_updates_design: sData.settings.latest_updates_design || 'style4',
                     most_read_design: sData.settings.most_read_design || 'mr_style1',
                     trending_design: sData.settings.trending_design || 'trend_style1',
                     hero_slider_design: sData.settings.hero_slider_design || 'hero_style1',
                     series_detail_design: sData.settings.series_detail_design || 'detail_style1',
                     comment_design: sData.settings.comment_design || 'comment_style1',
                 });

                 let em = [];
                 try { em = sData.settings.comment_emojis ? JSON.parse(sData.settings.comment_emojis) : []; } catch(e) {}
                 if (!em || em.length === 0) {
                     em = [
                         { icon: '👍', label: 'Beğen' },
                         { icon: '😂', label: 'Komik' },
                         { icon: '❤️', label: 'Sevgi' },
                         { icon: '😲', label: 'Şaşkın' },
                         { icon: '😠', label: 'Kızgın' },
                         { icon: '😢', label: 'Üzgün' }
                     ];
                 }
                 setCommentEmojis(em);

                 let re = [];
                 try { re = sData.settings.comment_report_reasons ? JSON.parse(sData.settings.comment_report_reasons) : []; } catch(e) {}
                 if (!re || re.length === 0) {
                     re = ['Spam veya yanıltıcı', 'Taciz veya zorbalık', 'Nefret söylemi', 'Uygunsuz içerik', 'Uyarısız spoiler', 'Diğer'];
                 }
                 setReportReasons(re);
            }
        }
        catch (e) { console.error(e); } finally { setLoading(false); }
    }

    async function addAnnouncement() {
        if (!annMsg.trim()) return;
        try {
            await authFetch('/api/announcements', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: annMsg, link_url: annLink })
            });
            setAnnMsg(''); setAnnLink(''); fetchStats();
        } catch (e) { console.error(e); }
    }
    
    async function toggleAnn(id, is_active) {
        await authFetch('/api/announcements', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle', id, is_active })
        });
        fetchStats();
    }
    
    async function deleteAnn(id) {
        await authFetch('/api/announcements', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });
        fetchStats();
    }

    function authHeaders() {
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async function doAction(action, body = {}) {
        const fd = new FormData(); fd.append('action', action);
        Object.entries(body).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v); });
        const r = await fetch('/api/admin', { method: 'POST', body: fd, headers: authHeaders() }); const d = await r.json();
        if (!r.ok) throw new Error(d.error); return d;
    }

    async function confirmAction() {
        if (!confirmModal) return;
        try {
            // If action is a function (custom async), call it directly
            if (typeof confirmModal.action === 'function') {
                await confirmModal.action();
            } else {
                show((await doAction(confirmModal.action, confirmModal.body)).message);
                fetchStats();
                if (confirmModal.onDone) await confirmModal.onDone();
            }
        } catch (e) { show(e.message, 'error'); }
        setConfirmModal(null);
    }

    async function saveSettings(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await authFetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                show('Ayarlar başarıyla kaydedildi!');
            } else {
                show(data.error || 'Ayarlar kaydedilemedi', 'error');
            }
        } catch (err) {
            show('Sunucu hatası', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    async function saveCustomize(e) {
        e.preventDefault();
        setCustomizeSubmitting(true);
        try {
            const res = await authFetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customize)
            });
            const data = await res.json();
            if (data.success) {
                show('Özelleştirme ayarları kaydedildi!');
            } else {
                show(data.error || 'Kaydedilemedi', 'error');
            }
        } catch (err) {
            show('Sunucu hatası', 'error');
        } finally {
            setCustomizeSubmitting(false);
        }
    }

    async function handleSaveEmojis(updatedEmojis) {
        setSubmitting(true);
        try {
            const res = await authFetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment_emojis: JSON.stringify(updatedEmojis) })
            });
            const data = await res.json();
            if (data.success) {
                setCommentEmojis(updatedEmojis);
                show('Tepki emojileri başarıyla kaydedildi!');
            } else {
                show(data.error || 'Ayarlar kaydedilemedi', 'error');
            }
        } catch (err) {
            show('Sunucu hatası', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSaveReportReasons(updatedReasons) {
        setSubmitting(true);
        try {
            const res = await authFetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment_report_reasons: JSON.stringify(updatedReasons) })
            });
            const data = await res.json();
            if (data.success) {
                setReportReasons(updatedReasons);
                show('Bildirim nedenleri başarıyla kaydedildi!');
            } else {
                show(data.error || 'Ayarlar kaydedilemedi', 'error');
            }
        } catch (err) {
            show('Sunucu hatası', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    function addEmoji() {
        if (!newEmojiIcon.trim() || !newEmojiLabel.trim()) return;
        const nextEmojis = [...commentEmojis, { icon: newEmojiIcon.trim(), label: newEmojiLabel.trim() }];
        setCommentEmojis(nextEmojis);
        setNewEmojiIcon('');
        setNewEmojiLabel('');
    }

    function removeEmoji(index) {
        const nextEmojis = commentEmojis.filter((_, i) => i !== index);
        setCommentEmojis(nextEmojis);
    }

    function updateEmojiField(index, field, value) {
        const nextEmojis = commentEmojis.map((em, i) => {
            if (i === index) {
                return { ...em, [field]: value };
            }
            return em;
        });
        setCommentEmojis(nextEmojis);
    }

    function addReason() {
        if (!newReasonText.trim()) return;
        const nextReasons = [...reportReasons, newReasonText.trim()];
        setReportReasons(nextReasons);
        setNewReasonText('');
    }

    function removeReason(index) {
        const nextReasons = reportReasons.filter((_, i) => i !== index);
        setReportReasons(nextReasons);
    }

    function updateReasonText(index, value) {
        const nextReasons = reportReasons.map((re, i) => {
            if (i === index) return value;
            return re;
        });
        setReportReasons(nextReasons);
    }

    // ── Series detail ──
    async function openSeriesDetail(id) {
        try {
            const r = await authFetch(`/api/admin?seriesId=${id}`);
            const d = await r.json();
            setDetailSeries(d.series);
            const chs = d.chapters || [];
            setDetailChapters(chs);
            setSubView('detail');
            setEditMode(false);
            populateForm(d.series);
            // Load scraper data for this series
            loadScraperData(id);

            // Calculate next chapter number
            let nextNum = 1;
            if (chs.length > 0) {
                const maxNum = Math.max(...chs.map(c => Number(c.chapter_number) || 0));
                nextNum = maxNum >= 0 ? maxNum + 1 : 1;
            }
            setCNum(String(nextNum));
        } catch (e) { show(e.message, 'error'); }
    }

    function populateForm(s) {
        setSTitle(s.title); setSDesc(s.description || ''); setSAuthor(s.author || ''); setSArtist(s.artist || '');
        setSStatus(s.status || 'ongoing'); setSType(s.type || 'manga'); setSGenres(tryParseGenres(s.genres)); setSRating(String(s.rating || 0));
        setSCover(null); setSCoverPreview(s.cover_url || ''); setSAltNames(s.alt_names || '');
    }

    function resetForm() {
        setSTitle(''); setSDesc(''); setSAuthor(''); setSArtist(''); setSStatus('ongoing'); setSType('manga');
        setSGenres(''); setSRating('0'); setSCover(null); setSCoverPreview(''); setSAltNames('');
    }

    function tryParseGenres(g) { try { return JSON.parse(g || '[]').join(', '); } catch { return g || ''; } }
    function fDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

    function handleCoverSelect(e) {
        const file = e.target.files[0];
        if (file) { setSCover(file); setSCoverPreview(URL.createObjectURL(file)); }
    }

    async function handleCreateSeries(published) {
        if (!sTitle.trim()) return show('Title is required', 'error');
        setSubmitting(true);
        try {
            const fd = new FormData(); fd.append('action', 'add-series');
            fd.append('title', sTitle); fd.append('description', sDesc); fd.append('author', sAuthor);
            fd.append('artist', sArtist); fd.append('status', sStatus); fd.append('rating', sRating);
            fd.append('type', sType);
            fd.append('genres', JSON.stringify(sGenres.split(',').map(g => g.trim()).filter(Boolean)));
            fd.append('published', published ? '1' : '0');
            fd.append('alt_names', sAltNames);
            if (sCover) fd.append('cover', sCover);
            const r = await fetch('/api/admin', { method: 'POST', body: fd, headers: authHeaders() });
            const d = await r.json(); if (!r.ok) throw new Error(d.error);
            show(d.message); fetchStats();
            openSeriesDetail(d.seriesId);
        } catch (e) { show(e.message, 'error'); }
        finally { setSubmitting(false); }
    }

    async function handleUpdateSeries(published) {
        if (!sTitle.trim()) return show('Title is required', 'error');
        setSubmitting(true);
        try {
            const fd = new FormData(); fd.append('action', 'update-series');
            fd.append('seriesId', detailSeries.id); fd.append('title', sTitle); fd.append('description', sDesc);
            fd.append('author', sAuthor); fd.append('artist', sArtist); fd.append('status', sStatus);
            fd.append('type', sType);
            fd.append('rating', sRating); fd.append('published', published !== undefined ? (published ? '1' : '0') : String(detailSeries.published));
            fd.append('genres', JSON.stringify(sGenres.split(',').map(g => g.trim()).filter(Boolean)));
            fd.append('alt_names', sAltNames);
            if (sCover) fd.append('cover', sCover);
            const r = await fetch('/api/admin', { method: 'POST', body: fd, headers: authHeaders() });
            const d = await r.json(); if (!r.ok) throw new Error(d.error);
            show(d.message); fetchStats(); openSeriesDetail(detailSeries.id);
        } catch (e) { show(e.message, 'error'); }
        finally { setSubmitting(false); }
    }

    const [selectedChapters, setSelectedChapters] = useState([]);

    async function handleBulkUpload(e) {
        e.preventDefault();
        if (!bulkFiles || !bulkFiles.length) return show('Öncelikle bir klasör seçin', 'error');

        // Filter for images only — also check extension because Windows often reports f.type="" for JPGs from folder picker
        const IMAGE_EXTS = /\.(jpe?g|jpg|png|webp|gif|avif|bmp)$/i;
        const imageFiles = Array.from(bulkFiles).filter(f =>
            (f.type && f.type.startsWith('image/')) || IMAGE_EXTS.test(f.name || '')
        );
        if (imageFiles.length === 0) return show('Seçilen klasörde görsel bulunamadı.', 'error');
        if (!window.confirm(`${imageFiles.length} görsel dosyası bulundu. Bölümlere gruplayıp yüklemek istiyor musunuz?`)) return;

        setSubmitting(true);
        setBulkStatus('Dosyalar analiz ediliyor...');

        try {
            const chapterGroups = {};
            for(let i=0; i<imageFiles.length; i++) {
                const f = imageFiles[i];
                const pathParts = f.webkitRelativePath.split('/');
                if(pathParts.length < 2) continue; // Must be inside some folder e.g. Chapter 1/page.jpg
                const chapFolderName = pathParts[pathParts.length - 2]; 
                if(!chapterGroups[chapFolderName]) chapterGroups[chapFolderName] = [];
                chapterGroups[chapFolderName].push(f);
            }

            const folders = Object.keys(chapterGroups);
            if(folders.length === 0) throw new Error('Geçerli bölüm klasörleri bulunamadı. Bölüm klasörleri içeren bir klasör seçtiğinizden emin olun (Örn: MangaKlasor / Bölüm 1 / 01.jpg)');

            // Sort folders naturally
            folders.sort((a,b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));

            let successCount = 0;
            for(let i=0; i<folders.length; i++) {
                const folderName = folders[i];
                const files = chapterGroups[folderName];
                
                const numMatch = folderName.match(/(\d+(\.\d+)?)/);
                const chapNum = numMatch ? parseFloat(numMatch[1]) : (i + 1);

                setBulkStatus(`Bölüm ${chapNum} yükleniyor (${i+1}/${folders.length})...`);

                const r1 = await doAction('add-chapter', { seriesId: detailSeries.id, chapterNumber: chapNum, title: folderName });
                const newChapId = r1.chapterId;
                
                if(!newChapId) throw new Error(`Bölüm ${chapNum} oluşturulamadı`);

                // Upload chunks of 1 image at a time to prevent Vercel/NextJS Payload sizes timeouts (especially for large JPGs)
                const chunkSize = 1;
                for (let k = 0; k < files.length; k += chunkSize) {
                    const chunkFiles = files.slice(k, k + chunkSize);
                    const fd = new FormData(); 
                    fd.append('action', 'upload-pages'); 
                    fd.append('chapterId', newChapId);
                    for(const f of chunkFiles) fd.append('pages', f);

                    const r3 = await fetch('/api/admin', { method: 'POST', body: fd, headers: authHeaders() });
                    if(!r3.ok) throw new Error(`Bölüm ${chapNum} için görseller yüklenemedi (Parça ${Math.floor(k/chunkSize) + 1})`);
                }
                
                successCount++;
            }

            show(`Toplu yükleme tamamlandı! ${successCount} bölüm eklendi.`);
            setBulkFiles(null);
            setBulkStatus('');
            await openSeriesDetail(detailSeries.id); fetchStats();
        } catch(e) {
            show(e.message, 'error');
            setBulkStatus('Hata. Konsolu kontrol edin.');
            setTimeout(() => setBulkStatus(''), 3000);
            await openSeriesDetail(detailSeries.id); fetchStats();
        } finally {
            setSubmitting(false);
            if (document.getElementById('bulk-folder-input')) document.getElementById('bulk-folder-input').value = "";
        }
    }

    async function handleAddChapter() {
        if (!cNum) return show('Bölüm numarası gerekli', 'error');
        setSubmitting(true);
        try {
            const r1 = await doAction('add-chapter', { seriesId: detailSeries.id, chapterNumber: cNum, title: cTitle || `Bölüm ${cNum}`, content: cContent });
            const newChapId = r1.chapterId;

            // Upload images if any were selected
            if (cFiles && cFiles.length > 0 && newChapId && detailSeries?.type !== 'novel') {
                const filesArr = Array.from(cFiles);
                for (let k = 0; k < filesArr.length; k++) {
                    const fd = new FormData();
                    fd.append('action', 'upload-pages');
                    fd.append('chapterId', newChapId);
                    fd.append('pages', filesArr[k]);
                    const r = await fetch('/api/admin', { method: 'POST', body: fd, headers: authHeaders() });
                    if (!r.ok) { const d = await r.json(); throw new Error(d.error || `Sayfa ${k + 1} yüklenemedi`); }
                }
                show(`Bölüm ${cNum} eklendi ve ${filesArr.length} sayfa yüklendi`);
            } else {
                show('Bölüm eklendi');
            }

            setCNum(''); setCTitle(''); setCFiles(null); setCContent('');
            if (cFileInputRef.current) cFileInputRef.current.value = '';
            await openSeriesDetail(detailSeries.id); fetchStats();
        } catch (e) { show(e.message, 'error'); }
        finally { setSubmitting(false); }
    }

    async function handleUpdateChapter() {
        if (!editChapNum) return show('Bölüm numarası gerekli', 'error');
        setSubmitting(true);
        try {
            await doAction('update-chapter', { chapterId: editingChapterId, chapterNumber: editChapNum, title: editChapTitle, content: editChapContent });
            show('Bölüm güncellendi'); setEditingChapterId(null); setEditChapNum(''); setEditChapTitle(''); setEditChapContent('');
            await openSeriesDetail(detailSeries.id); fetchStats();
        } catch (e) { show(e.message, 'error'); }
        finally { setSubmitting(false); }
    }

    async function handleUploadPages(e) {
        e.preventDefault();
        if (!uploadChapterId || !uFiles?.length) return show('Dosya seçin', 'error');
        setSubmitting(true);
        try {
            const chunkSize = 1; // Process 1 file at a time to prevent Payload limits
            let errors = [];
            let totalUploaded = 0;
            const uFilesArray = Array.from(uFiles);
            for (let k = 0; k < uFilesArray.length; k += chunkSize) {
                const chunkFiles = uFilesArray.slice(k, k + chunkSize);
                const fd = new FormData(); 
                fd.append('action', 'upload-pages'); 
                fd.append('chapterId', uploadChapterId);
                for (const f of chunkFiles) fd.append('pages', f);
                
                const r = await fetch('/api/admin', { method: 'POST', body: fd, headers: authHeaders() });
                const d = await r.json(); 
                if (!r.ok) {
                    errors.push(d.error || `Parça ${Math.floor(k/chunkSize) + 1} yüklenemedi`);
                } else {
                    totalUploaded += (d.uploaded ? d.uploaded.length : 0);
                }
            }
            if (errors.length > 0) {
                show(`Yüklenen sayfa sayısı: ${totalUploaded}. Bazı hatalar oluştu: ${errors[0]}`, 'error');
            } else {
                show(`${totalUploaded} sayfa başarıyla yüklendi`);
            }
            setUFiles(null); setUploadChapterId(null);
            await openSeriesDetail(detailSeries.id); fetchStats();
        } catch (e) { show(e.message, 'error'); }
        finally { setSubmitting(false); }
    }

    // ── Scraper helpers ──────────────────────────────────────────────────────

    async function scraperFetch() {
        if (!scraperUrl.trim()) return show('Enter a URL first', 'error');
        setScraperFetchLoading(true);
        setScraperFetchResult(null);
        try {
            const res = await authFetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetch-info', url: scraperUrl.trim(), language: scraperLang }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setScraperFetchResult(data);
        } catch (e) { show(e.message, 'error'); }
        finally { setScraperFetchLoading(false); }
    }

    async function scraperAddSource(seriesId, url) {
        try {
            const res = await authFetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add-source', series_id: seriesId, url, language: scraperLang }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            show('Source linked ✓');
            await loadScraperData(seriesId);
        } catch (e) { show(e.message, 'error'); }
    }

    async function scraperDeleteSource(sourceId, seriesId) {
        try {
            const res = await authFetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete-source', source_id: sourceId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            show('Source removed');
            await loadScraperData(seriesId);
        } catch (e) { show(e.message, 'error'); }
    }

    async function scraperImport(seriesId, url) {
        setScraperImporting(true);
        try {
            const res = await authFetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'import-chapters',
                    series_id: seriesId,
                    url,
                    language: scraperLang,
                    publish_immediately: scraperPublishMode === 'publish',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            show(data.message);
            await loadScraperData(seriesId);
            fetchStats();
        } catch (e) { show(e.message, 'error'); }
        finally { setScraperImporting(false); }
    }

    async function scraperPublishPending(pendingIds, seriesId) {
        setScraperPublishing(true);
        try {
            const res = await authFetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'publish-pending', pending_ids: pendingIds }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            show(data.message);
            setScraperSelectedPending([]);
            await loadScraperData(seriesId);
            fetchStats();
        } catch (e) { show(e.message, 'error'); }
        finally { setScraperPublishing(false); }
    }

    async function scraperPublishAllPending(seriesId) {
        setScraperPublishing(true);
        try {
            const res = await authFetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'publish-pending', series_id: seriesId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            show(data.message);
            setScraperSelectedPending([]);
            await loadScraperData(seriesId);
            fetchStats();
        } catch (e) { show(e.message, 'error'); }
        finally { setScraperPublishing(false); }
    }

    async function loadScraperData(seriesId) {
        setScraperSourcesLoading(true);
        try {
            const res = await authFetch(`/api/admin/scrape?seriesId=${seriesId}`);
            const data = await res.json();
            setScraperSources(data.sources || []);
            setScraperPending(data.pending || []);
            setScraperJobs(data.jobs || []);
        } catch {}
        finally { setScraperSourcesLoading(false); }
    }

    async function loadAllScraperSources() {
        setAllScraperSourcesLoading(true);
        try {
            const res = await authFetch('/api/admin/scrape?action=all');
            const data = await res.json();
            setAllScraperSources(data.sources || []);
        } catch {}
        finally { setAllScraperSourcesLoading(false); }
    }

    async function scraperSyncAll() {
        setScraperSyncLoading(true);
        try {
            const res = await authFetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync-all' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            show(`Sync complete: ${data.total_new} new chapters found across ${data.synced} sources`);
            await loadAllScraperSources();
            fetchStats();
        } catch (e) { show(e.message, 'error'); }
        finally { setScraperSyncLoading(false); }
    }

    async function handleCreateSeriesFromScrape() {
        if (!scrapeNewUrl.trim()) return show('Enter a URL', 'error');
        setScrapeNewLoading(true);
        try {
            const res = await authFetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create-series-from-scrape', url: scrapeNewUrl.trim(), language: scrapeNewLang, publish_series: false }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            show(`"${data.title}" created with ${data.chapters_staged} chapters staged`);
            setScrapeNewUrl('');
            setScrapeNewPreview(null);
            fetchStats();
            await loadAllScraperSources();
        } catch (e) { show(e.message, 'error'); }
        finally { setScrapeNewLoading(false); }
    }

    if (authLoading || loading) return <div className="page-loading"><div className="spinner" /></div>;
    if (!user || !['admin', 'manager', 'moderator', 'team_member'].includes(user.role)) return null;

    const allSeries = stats?.allSeries || [];

    return (
        <div className="admin-layout fade-in">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header"><h2><GearIcon /> Admin</h2></div>
                {NAVS.filter(n => {
                    if (user.role === 'admin' || user.role === 'manager') return true;
                    if (user.role === 'moderator' && (n.id === 'comments' || n.id === 'overview')) return true;
                    if (user.role === 'team_member' && ['series', 'scraper', 'media', 'overview'].includes(n.id)) return true;
                    return false;
                }).map(n => (
                    <button key={n.id} className={`admin-nav-item ${tab === n.id ? 'active' : ''}`}
                        onClick={() => { setTab(n.id); setSubView(null); setEditMode(false); }}>
                        <n.icon /> {n.label}
                    </button>
                ))}
            </aside>

            {/* Content */}
            <main className="admin-content">
                {msg && <div className={`alert ${msgType === 'error' ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

                {/* ═══════════════ DASHBOARD ═══════════════ */}
                {tab === 'overview' && (
                    <>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20 }}>Genel Bakış</h2>
                        <div className="stat-grid">
                            {[{ v: stats?.totalSeries || 0, l: 'Seri' }, { v: stats?.totalChapters || 0, l: 'Bölüm' },
                            { v: stats?.totalPages || 0, l: 'Sayfa' },
                            { v: stats?.totalUsers || 0, l: 'Kullanıcı' }, { v: stats?.totalComments || 0, l: 'Yorum' }].map(s => (
                                <div key={s.l} className="stat-card"><div className="stat-value">{s.v}</div><div className="stat-label">{s.l}</div></div>
                            ))}
                        </div>
                        {/* Depolama Bilgisi */}
                        {stats?.storage && (
                            <div className="admin-card" style={{ marginBottom: 16 }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                                    Depolama Kullanımı
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                    {[
                                        { label: 'Yüklenen Bölüm Sayfaları', value: stats.storage?.uploads?.formatted || '0 B', icon: '🖼️' },
                                        { label: 'Veritabanı', value: stats.storage?.database?.formatted || '0 B', icon: '💾' },
                                        { label: 'Toplam', value: stats.storage?.total?.formatted || '0 B', icon: '📦', bold: true },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px', border: s.bold ? '1px solid var(--accent)' : '1px solid transparent' }}>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', color: s.bold ? 'var(--accent-light)' : 'var(--text-primary)' }}>{s.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="admin-grid">
                            <div className="admin-card">
                                <h3><ShieldIcon /> Güvenlik</h3>
                                <ul style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', paddingLeft: 20, lineHeight: 2.2, listStyle: 'none' }}>
                                    <li>• Şifreler: bcrypt (12 turlu)</li>
                                    <li>• Yetkilendirme: JWT jetonları (7 günlük geçerlilik)</li>
                                    <li>• Oturumlar: HttpOnly SameSite cookie</li>
                                </ul>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══════════════ DUYURULAR ═══════════════ */}
                {tab === 'announcements' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MegaphoneIcon /> Duyurular
                            </h2>
                        </div>
                        <div className="admin-card" style={{ marginBottom: 20 }}>
                            <h3>Yeni Duyuru Oluştur</h3>
                            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexDirection: 'column' }}>
                                <input type="text" className="form-input" placeholder="Duyuru mesajı... (örn. Discord sunucumuza katılın!)" value={annMsg} onChange={(e) => setAnnMsg(e.target.value)} />
                                <input type="url" className="form-input" placeholder="İsteğe Bağlı URL Bağlantısı..." value={annLink} onChange={(e) => setAnnLink(e.target.value)} />
                                <button className="btn btn-primary" onClick={addAnnouncement} style={{ width: 120 }}>Yayınla</button>
                            </div>
                        </div>
                        <div className="admin-card">
                            <h3>Aktif ve Geçmiş Duyurular</h3>
                            <table className="admin-table" style={{ marginTop: 15 }}>
                                <thead><tr><th>Mesaj</th><th>Bağlantı</th><th>Durum</th><th>İşlemler</th></tr></thead>
                                <tbody>
                                    {announcements.map(a => (
                                        <tr key={a.id}>
                                            <td>{a.message}</td>
                                            <td>{a.link_url ? <a href={a.link_url} target="_blank" style={{color: 'var(--accent-light)'}}>Bağlantı</a> : '-'}</td>
                                            <td>{a.is_active ? <span style={{color: 'var(--success)'}}>Aktif</span> : 'Gizli'}</td>
                                            <td>
                                                <button className="btn btn-ghost btn-sm" onClick={() => toggleAnn(a.id, !a.is_active)}>
                                                    {a.is_active ? 'Gizle' : 'Göster'}
                                                </button>
                                                <button className="btn btn-ghost btn-sm" style={{color: 'var(--danger)'}} onClick={() => deleteAnn(a.id)}>Sil</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {announcements.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', color: 'var(--text-muted)'}}>Henüz duyuru yayınlanmamış</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ═══════════════ SERIES MANAGEMENT ═══════════════ */}
                {tab === 'series' && !subView && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BookIcon /> Series ({allSeries.length})
                            </h2>
                            <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setSubView('create'); }}>
                                <PlusIcon /> New Series
                            </button>
                        </div>
                        {allSeries.length === 0 ? (
                            <div className="admin-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>No series yet. Create your first manga series!</p>
                                <button className="btn btn-primary" onClick={() => { resetForm(); setSubView('create'); }}>
                                    <PlusIcon /> Create First Series
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                {allSeries.map(s => (
                                    <div key={s.id} className="admin-card" style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
                                        onClick={() => openSeriesDetail(s.id)}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <div style={{ width: 60, height: 85, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-tertiary)' }}>
                                                <img src={s.cover_url || '/demo/cover1.jpg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</h3>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                                                    <span className={`admin-badge ${s.published ? 'admin-role' : 'user-role'}`}>{s.published ? 'Published' : 'Draft'}</span>
                                                    <span className="admin-badge user-role">{s.status}</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {s.chapter_count || 0} chapters · {(s.views || 0).toLocaleString()} views · ★ {s.rating?.toFixed(1)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════════ CREATE SERIES ═══════════════ */}
                {tab === 'series' && subView === 'create' && (
                    <>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSubView(null)} style={{ marginBottom: 16 }}>
                            <BackIcon /> Back to Series
                        </button>
                        <div className="admin-card" style={{ maxWidth: 620 }}>
                            <h3><PlusIcon /> Create New Series</h3>
                            {renderSeriesForm()}
                            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                                <button className="btn btn-primary" onClick={() => handleCreateSeries(true)} disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Publish'}
                                </button>
                                <button className="btn btn-ghost" onClick={() => handleCreateSeries(false)} disabled={submitting}>
                                    Save as Draft
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══════════════ SERIES DETAIL ═══════════════ */}
                {tab === 'series' && subView === 'detail' && detailSeries && (
                    <>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setSubView(null); setEditMode(false); }} style={{ marginBottom: 16 }}>
                            <BackIcon /> Back to Series
                        </button>

                        {/* Series info card */}
                        <div className="admin-card" style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <div style={{ width: 120, height: 170, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-tertiary)', cursor: 'pointer', position: 'relative' }}
                                    onClick={() => setPreviewImage({ src: sCoverPreview || detailSeries.cover_url || '/demo/cover1.jpg', title: `${detailSeries.title} — Cover` })}
                                    title="Click to preview">
                                    <img src={sCoverPreview || detailSeries.cover_url || '/demo/cover1.jpg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ opacity: 0, transition: 'opacity 0.15s' }}
                                            onMouseOver={e => { e.currentTarget.style.opacity = '1'; }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    {!editMode ? (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                                <div>
                                                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{detailSeries.title}</h2>
                                                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                                        <span className={`admin-badge ${detailSeries.published ? 'admin-role' : 'user-role'}`}>{detailSeries.published ? 'Published' : 'Draft'}</span>
                                                        <span className="admin-badge user-role">{detailSeries.status}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {detailSeries.id}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)}><EditIcon /> Edit</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => window.open(`/series/${detailSeries.slug || detailSeries.id}`, '_blank')}><EyeIcon /> View</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmModal({
                                                        action: 'delete-series', body: { seriesId: detailSeries.id },
                                                        text: `Delete "${detailSeries.title}" and all its chapters & pages?`,
                                                        onDone: () => { setSubView(null); }
                                                    })}><TrashIcon /></button>
                                                </div>
                                            </div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8 }}>{detailSeries.description || 'No description'}</p>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                                {detailSeries.author && <span>Author: <strong>{detailSeries.author}</strong></span>}
                                                {detailSeries.artist && <span>Artist: <strong>{detailSeries.artist}</strong></span>}
                                                <span>Rating: <strong>★ {(detailSeries.rating || 0).toFixed(1)}</strong></span>
                                                <span>Views: <strong>{(detailSeries.views || 0).toLocaleString()}</strong></span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {renderSeriesForm()}
                                            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                                                <button className="btn btn-primary" onClick={() => handleUpdateSeries()} disabled={submitting}>
                                                    {submitting ? 'Saving...' : 'Save Changes'}
                                                </button>
                                                {!detailSeries.published && (
                                                    <button className="btn btn-ghost" onClick={() => handleUpdateSeries(true)} disabled={submitting}>Publish Now</button>
                                                )}
                                                {detailSeries.published === 1 && (
                                                    <button className="btn btn-ghost" onClick={() => handleUpdateSeries(false)} disabled={submitting}>Unpublish</button>
                                                )}
                                                <button className="btn btn-ghost" onClick={() => { setEditMode(false); populateForm(detailSeries); }}>Cancel</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Chapters Section */}
                        <div className="admin-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ margin: 0 }}>Bölümler ({detailChapters.length})</h3>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {selectedChapters.length > 0 ? (
                                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmModal({
                                            action: 'delete-selected-chapters', body: { seriesId: detailSeries.id, chapterIds: JSON.stringify(selectedChapters) },
                                            text: `Seçili ${selectedChapters.length} bölümü ve sayfalarını silmek istediğinize emin misiniz? BU İŞLEM GERİ ALINAMAZ!`,
                                            onDone: async () => { setSelectedChapters([]); await openSeriesDetail(detailSeries.id); }
                                        })}>
                                            <TrashIcon /> Seçilenleri Sil ({selectedChapters.length})
                                        </button>
                                    ) : (
                                        detailChapters.length > 0 && (
                                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmModal({
                                                action: 'delete-all-chapters', body: { seriesId: detailSeries.id },
                                                text: `Tüm ${detailChapters.length} bölümü ve sayfalarını silmek istediğinize emin misiniz? BU İŞLEM GERİ ALINAMAZ!`,
                                                onDone: async () => { await openSeriesDetail(detailSeries.id); }
                                            })}>
                                                <TrashIcon /> Tümünü Sil
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Add chapter inline */}
                            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 16, border: '1px solid var(--border-color)' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <PlusIcon /> Tekli Bölüm Ekle
                                </h4>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ margin: 0, flex: '0 0 90px' }}>
                                        <label style={{ fontSize: '0.72rem' }}>Bölüm No</label>
                                        <input type="number" className="form-input" step="0.1" value={cNum} onChange={e => setCNum(e.target.value)} placeholder="1" />
                                    </div>
                                    <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
                                        <label style={{ fontSize: '0.72rem' }}>Başlık (isteğe bağlı)</label>
                                        <input className="form-input" value={cTitle} onChange={e => setCTitle(e.target.value)} placeholder="Bölüm başlığı" />
                                    </div>
                                    {detailSeries?.type === 'novel' ? (
                                        <div className="form-group" style={{ margin: 0, flex: '1 1 100%' }}>
                                            <label style={{ fontSize: '0.72rem' }}>Bölüm Metni</label>
                                            <FormatToolbar stateSetter={setCContent} stateValue={cContent} textareaId="add-novel-content" />
                                            <textarea id="add-novel-content" className="form-input" rows="4" value={cContent} onChange={e => setCContent(e.target.value)} placeholder="Novel bölüm metnini buraya yapıştırın..." style={{ resize: 'vertical' }} />
                                        </div>
                                    ) : (
                                        <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
                                            <label style={{ fontSize: '0.72rem' }}>
                                                Görseller (isteğe bağlı)
                                                {cFiles && cFiles.length > 0 && (
                                                    <span style={{ color: 'var(--accent-light)', marginLeft: 6 }}>
                                                        {cFiles.length} dosya seçildi
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                ref={cFileInputRef}
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="form-input"
                                                style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                                                onChange={e => setCFiles(e.target.files)}
                                            />
                                        </div>
                                    )}
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleAddChapter}
                                        disabled={submitting || !cNum}
                                        style={{ height: 38, whiteSpace: 'nowrap', flexShrink: 0 }}
                                    >
                                        {submitting ? '...' : <><PlusIcon /> Ekle</>}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Bulk Upload Section */}
                            <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 16, border: '1px dashed var(--border)' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <UploadIcon /> Toplu Bölüm Yükle
                                </h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                                    Her bölüm için alt klasörler barındıran bir ana klasör seçin (Örn: MangaKlasor / Bölüm 1 / 01.jpg).
                                </p>
                                <form onSubmit={handleBulkUpload} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input
                                        type="file"
                                        id="bulk-folder-input"
                                        webkitdirectory=""
                                        multiple
                                        onChange={e => setBulkFiles(e.target.files)}
                                        style={{ fontSize: '0.75rem', maxWidth: '300px' }}
                                    />
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !bulkFiles}>
                                        {submitting ? 'Yükleniyor...' : 'Toplu Yükle'}
                                    </button>
                                    {bulkStatus && <span style={{ fontSize: '0.75rem', color: 'var(--accent-light)' }}>{bulkStatus}</span>}
                                </form>
                            </div>

                            {/* ── Auto Import (Scraper) Section ── */}
                            <div style={{ padding: 14, background: 'rgba(99,102,241,0.06)', borderRadius: 8, marginBottom: 16, border: '1px solid rgba(99,102,241,0.25)' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-light)' }}>
                                    <DownloadIcon /> Auto Import (Scraper)
                                    {scraperSources.length > 0 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 50, background: 'rgba(99,102,241,0.2)', color: 'var(--accent-light)' }}>
                                        {scraperSources.length} source{scraperSources.length !== 1 ? 's' : ''}
                                    </span>}
                                </h4>

                                {/* Existing sources */}
                                {scraperSources.map(src => (
                                    <div key={src.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 6 }}>
                                        <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{src.source_site}</span>
                                        <span style={{ fontSize: '0.78rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }} title={src.source_url}>{src.source_url}</span>
                                        {src.last_checked && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>checked {new Date(src.last_checked).toLocaleDateString()}</span>}
                                        {src.last_chapter_found > 0 && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>last: ch.{src.last_chapter_found}</span>}
                                        <button className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                                            disabled={scraperImporting}
                                            onClick={() => scraperImport(detailSeries.id, src.source_url)}>
                                            {scraperImporting ? <span className="spinner" style={{ width: 10, height: 10 }} /> : <><SyncIcon /> Check New</>}
                                        </button>
                                        <button className="btn btn-danger btn-sm" style={{ fontSize: '0.7rem' }}
                                            onClick={() => setConfirmModal({ text: 'Remove this scraper source?', action: async () => { await scraperDeleteSource(src.id, detailSeries.id); show('Source removed'); } })}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}

                                {/* Add new source */}
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                                    <input
                                        type="url"
                                        className="form-input"
                                        placeholder="Paste series URL (MangaDex, Comick, etc.)"
                                        value={scraperUrl}
                                        onChange={e => { setScraperUrl(e.target.value); setScraperFetchResult(null); }}
                                        style={{ flex: 1, fontSize: '0.8rem' }}
                                    />
                                    <select
                                        value={scraperLang}
                                        onChange={e => { setScraperLang(e.target.value); setScraperFetchResult(null); }}
                                        title="Language (MangaDex / Comick only)"
                                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem', flexShrink: 0 }}>
                                        <option value="en">🇬🇧 English</option>
                                        <option value="tr">🇹🇷 Turkish</option>
                                        <option value="pt-br">🇧🇷 Portuguese (BR)</option>
                                        <option value="es">🇪🇸 Spanish</option>
                                        <option value="es-la">🇲🇽 Spanish (LA)</option>
                                        <option value="fr">🇫🇷 French</option>
                                        <option value="de">🇩🇪 German</option>
                                        <option value="it">🇮🇹 Italian</option>
                                        <option value="id">🇮🇩 Indonesian</option>
                                        <option value="ru">🇷🇺 Russian</option>
                                        <option value="ar">🇸🇦 Arabic</option>
                                        <option value="ja">🇯🇵 Japanese</option>
                                        <option value="ko">🇰🇷 Korean</option>
                                        <option value="zh">🇨🇳 Chinese (Simp.)</option>
                                        <option value="zh-hk">🇹🇼 Chinese (Trad.)</option>
                                    </select>
                                    <button className="btn btn-ghost btn-sm" onClick={scraperFetch} disabled={scraperFetchLoading || !scraperUrl}>
                                        {scraperFetchLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Preview'}
                                    </button>
                                </div>

                                {/* Preview result */}
                                {scraperFetchResult && (
                                    <div style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 10, fontSize: '0.8rem' }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                                            <strong style={{ color: 'var(--accent-light)' }}>{scraperFetchResult.meta?.title}</strong>
                                            <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>{scraperFetchResult.site}</span>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{scraperFetchResult.chapters_count} chapters found</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                            <select value={scraperPublishMode} onChange={e => setScraperPublishMode(e.target.value)}
                                                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem' }}>
                                                <option value="stage">Stage for review (publish manually)</option>
                                                <option value="publish">Download &amp; publish immediately</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }}
                                                onClick={async () => { await scraperAddSource(detailSeries.id, scraperUrl); await scraperImport(detailSeries.id, scraperUrl); setScraperUrl(''); setScraperFetchResult(null); }}
                                                disabled={scraperImporting}>
                                                {scraperImporting ? 'Importing...' : `Link & Import ${scraperFetchResult.chapters_count} Chapters`}
                                            </button>
                                            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }} onClick={() => setScraperFetchResult(null)}>Cancel</button>
                                        </div>
                                    </div>
                                )}

                                {/* Pending chapters list */}
                                {scraperPending.filter(p => p.status === 'pending').length > 0 && (
                                    <div style={{ marginTop: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                {scraperPending.filter(p => p.status === 'pending').length} bölüm inceleme bekliyor
                                            </span>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {scraperSelectedPending.length > 0 && (
                                                    <button className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem' }}
                                                        disabled={scraperPublishing}
                                                        onClick={() => scraperPublishPending(scraperSelectedPending, detailSeries.id)}>
                                                        {scraperPublishing ? 'Yayınlanıyor...' : `Seçilenleri Yayınla (${scraperSelectedPending.length})`}
                                                    </button>
                                                )}
                                                <button className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem', background: 'var(--success)' }}
                                                    disabled={scraperPublishing}
                                                    onClick={() => scraperPublishAllPending(detailSeries.id)}>
                                                    {scraperPublishing ? 'Yayınlanıyor...' : 'Tümünü Yayınla'}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {scraperPending.filter(p => p.status === 'pending').map(p => (
                                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'var(--bg-tertiary)', borderRadius: 5, cursor: 'pointer', fontSize: '0.78rem' }}>
                                                    <input type="checkbox"
                                                        checked={scraperSelectedPending.includes(p.id)}
                                                        onChange={e => {
                                                            if (e.target.checked) setScraperSelectedPending(prev => [...prev, p.id]);
                                                            else setScraperSelectedPending(prev => prev.filter(id => id !== p.id));
                                                        }}
                                                        style={{ width: 14, height: 14 }} />
                                                    <span style={{ color: 'var(--accent-light)', fontWeight: 700, minWidth: 40 }}>Bölüm {p.chapter_number}</span>
                                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{p.chapter_title}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {detailChapters.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
                                    Henüz bölüm yok. Yukarıdan ilk bölümü ekleyin.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {detailChapters.map(ch => (
                                        <div key={ch.id}>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8, gap: 8, flexWrap: 'wrap'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedChapters.includes(ch.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedChapters(prev => [...prev, ch.id]);
                                                        else setSelectedChapters(prev => prev.filter(id => ch.id !== id));
                                                    }}
                                                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                                                />
                                                {editingChapterId === ch.id ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <input 
                                                                type="number" 
                                                                step="any" 
                                                                value={editChapNum} 
                                                                onChange={e => setEditChapNum(e.target.value)} 
                                                                className="form-input" 
                                                                style={{ width: 80, padding: '4px 8px' }} 
                                                                placeholder="No"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                value={editChapTitle} 
                                                                onChange={e => setEditChapTitle(e.target.value)} 
                                                                className="form-input" 
                                                                style={{ flex: 1, padding: '4px 8px' }} 
                                                                placeholder="Bölüm Başlığı"
                                                            />
                                                        </div>
                                                        {detailSeries?.type === 'novel' && (
                                                            <>
                                                                <FormatToolbar stateSetter={setEditChapContent} stateValue={editChapContent} textareaId="edit-novel-content" />
                                                                <textarea 
                                                                    id="edit-novel-content"
                                                                    className="form-input" 
                                                                    rows="5" 
                                                                    value={editChapContent} 
                                                                    onChange={e => setEditChapContent(e.target.value)} 
                                                                    placeholder="Novel bölüm metni..." 
                                                                    style={{ padding: '8px', resize: 'vertical' }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-light)', minWidth: 40 }}>
                                                            #{ch.chapter_number}
                                                        </span>
                                                        <span style={{ fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {ch.title}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                                <span className="admin-badge user-role">{ch.page_count || 0} sayfa</span>
                                                {ch.translation_count > 0 && <span className="admin-badge admin-role">{ch.translation_count} dil</span>}

                                                {editingChapterId === ch.id ? (
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button className="btn btn-primary btn-sm" onClick={handleUpdateChapter} disabled={submitting}>
                                                            <CheckIcon /> Kaydet
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingChapterId(null)}>
                                                            İptal
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => {
                                                            setEditingChapterId(ch.id);
                                                            setEditChapNum(ch.chapter_number);
                                                            setEditChapTitle(ch.title || '');
                                                            setEditChapContent(ch.content || '');
                                                        }} title="Bölümü düzenle">
                                                            <EditIcon />
                                                        </button>

                                                        {uploadChapterId === ch.id ? (
                                                            <form onSubmit={handleUploadPages} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                <input type="file" accept="image/*" multiple onChange={e => setUFiles(e.target.files)} style={{ width: 180, fontSize: '0.72rem' }} />
                                                                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                                                    {submitting ? '...' : 'Yükle'}
                                                                </button>
                                                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setUploadChapterId(null); setUFiles(null); }}>✕</button>
                                                            </form>
                                                        ) : (
                                                            <button className="btn btn-ghost btn-sm" onClick={() => setUploadChapterId(ch.id)}
                                                                title="Sayfa yükle">
                                                                <UploadIcon />
                                                            </button>
                                                        )}

                                                        <button className="btn btn-ghost btn-sm"
                                                            onClick={() => openChapterPages(ch.id)}
                                                            title="Sayfaları görüntüle"
                                                            style={viewPagesChapterId === ch.id ? { background: 'var(--accent)', color: '#fff' } : {}}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                                        </button>

                                                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmModal({
                                                            action: 'delete-chapter', body: { chapterId: ch.id },
                                                            text: `Bölüm ${ch.chapter_number} "${ch.title}" ve tüm sayfaları silinsin mi?`,
                                                            onDone: async () => { await openSeriesDetail(detailSeries.id); }
                                                        })}><TrashIcon /></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Inline pages thumbnail panel */}
                                        {viewPagesChapterId === ch.id && (
                                            <div style={{ marginTop: 8, padding: '12px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                                {viewPagesLoading ? (
                                                    <div style={{ textAlign: 'center', padding: 16 }}><div className="spinner" /></div>
                                                ) : viewPages.length === 0 ? (
                                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem', padding: 10 }}>Henüz sayfa yüklenmemiş.</p>
                                                ) : (
                                                    <>
                                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10 }}>{viewPages.length} sayfa — önizleme için tıklayın</p>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 }}>
                                                            {viewPages.map(p => (
                                                                <div key={p.id} style={{ position: 'relative', cursor: 'pointer', borderRadius: 6, overflow: 'hidden', aspectRatio: '3/4', background: 'var(--bg-tertiary)' }}
                                                                    onClick={() => setPreviewImage({ src: p.image_path, title: `Bölüm ${ch.chapter_number} — Sayfa ${p.page_number}` })}>
                                                                    <img src={p.image_path} alt={`Page ${p.page_number}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', fontSize: '0.6rem', color: '#fff', textAlign: 'center', padding: '2px 0' }}>
                                                                        {p.page_number}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ═══════════════ TURNSTILE ═══════════════ */}
                {tab === 'api-key' && (
                    <div className="admin-card" style={{ maxWidth: 560, marginTop: 20 }}>
                        <h3>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Cloudflare Turnstile
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 16 }}>
                            Giriş ve kayıt sayfalarını botlardan korur. Devre dışı bırakmak için boş bırakın.{' '}
                            <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" rel="noopener" style={{ color: 'var(--accent-light)' }}>Cloudflare'den anahtarları edinin</a>
                            {turnstileLoaded && turnstileSiteKey && <span style={{ color: 'var(--success)', marginLeft: 6 }}>✓ Aktif.</span>}
                        </p>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const res = await authFetch('/api/admin/settings', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        turnstile_site_key: turnstileSiteKey,
                                        ...(turnstileSecretKey ? { turnstile_secret_key: turnstileSecretKey } : {}),
                                    }),
                                });
                                const d = await res.json();
                                if (!d.success) throw new Error(d.error || 'Failed');
                                show('Turnstile ayarları kaydedildi!');
                                setTurnstileSecretKey('');
                                fetchStats();
                            } catch (e) { show(e.message, 'error'); }
                        }}>
                            <div className="form-group">
                                <label>Site Anahtarı (Site Key - public)</label>
                                <input type="text" className="form-input" placeholder="0x4AAAAAAAxxxxxxxxxxxxxxxx" value={turnstileSiteKey} onChange={e => setTurnstileSiteKey(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Gizli Anahtar (Secret Key)</label>
                                <input type="password" className="form-input" placeholder="Mevcut gizli anahtarı korumak için boş bırakın" value={turnstileSecretKey} onChange={e => setTurnstileSecretKey(e.target.value)} />
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Gizli anahtar sadece yazılabilir niteliktedir ve bir daha gösterilmez.</small>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" className="btn btn-primary">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                    Turnstile Kaydet
                                </button>
                                {(turnstileSiteKey) && (
                                    <button type="button" className="btn btn-ghost" onClick={async () => {
                                        try {
                                            const res = await authFetch('/api/admin/settings', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ turnstile_site_key: '', turnstile_secret_key: '' }),
                                            });
                                            const d = await res.json();
                                            if (!d.success) throw new Error(d.error);
                                            setTurnstileSiteKey('');
                                            setTurnstileSecretKey('');
                                            show('Turnstile devre dışı bırakıldı.');
                                            fetchStats();
                                        } catch (e) { show(e.message, 'error'); }
                                    }}>
                                        Devre Dışı Bırak
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* ═══════════════ USERS ═══════════════ */}
                {tab === 'users' && (
                    <>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><UsersIcon /> Kullanıcılar ({stats?.users?.length || 0})</h2>
                        <div className="admin-card" style={{ overflow: 'auto' }}>
                            <table className="admin-table">
                                <thead><tr><th>Kullanıcı Adı</th><th>E-posta</th><th>Rol</th><th>YP (Yomi Puanı)</th><th>Katılım</th><th>İşlemler</th></tr></thead>
                                <tbody>
                                    {(stats?.users || []).map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 600 }}>{u.username}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                                            <td><span className={`admin-badge ${u.role !== 'user' ? 'admin-role' : 'user-role'}`}>{
                                                {admin: 'Kurucu', manager: 'Yönetici', moderator: 'Moderatör', team_member: 'Ekip Üyesi', user: 'Kullanıcı'}[u.role] || 'Kullanıcı'
                                            }</span></td>
                                            <td style={{ fontSize: '0.8rem' }}>{u.yomi_points || 0}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fDate(u.created_at)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                                    {(user.role === 'admin' || (user.role === 'manager' && u.role !== 'admin')) ? (
                                                        <select
                                                            value={u.role}
                                                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem', cursor: 'pointer' }}
                                                            onChange={(e) => {
                                                                if (e.target.value === 'admin' && user.role !== 'admin') return show('Bu yetkiye sahip değilsiniz.', 'error');
                                                                setConfirmModal({ action: 'change-user-role', body: { userId: u.id, role: e.target.value }, text: `"${u.username}" kullanıcısının rolü "${e.target.value}" olarak değiştirilsin mi?` });
                                                            }}
                                                        >
                                                            <option value="user">Kullanıcı</option>
                                                            <option value="team_member">Ekip Üyesi</option>
                                                            <option value="moderator">Moderatör</option>
                                                            <option value="manager">Yönetici</option>
                                                            {user.role === 'admin' && <option value="admin">Kurucu</option>}
                                                        </select>
                                                    ) : null}
                                                    <button className="btn btn-ghost btn-sm" title="Yomi Puanlarını Sıfırla"
                                                        onClick={() => setConfirmModal({ action: 'reset-user-points', body: { userId: u.id }, text: `"${u.username}" için tüm Yomi Puanları sıfırlansın mı?` })}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.83"/></svg>
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" title="Tüm Yorumları Sil"
                                                        onClick={() => setConfirmModal({ action: 'delete-all-user-comments', body: { userId: u.id }, text: `"${u.username}" tarafından yapılan TÜM yorumlar silinsin mi?` })}>
                                                        <MsgIcon />
                                                    </button>
                                                    {(user.role === 'admin' || (user.role === 'manager' && u.role !== 'admin')) && (
                                                        <button className="btn btn-danger btn-sm" title="Kullanıcıyı Sil"
                                                            onClick={() => setConfirmModal({ action: 'delete-user', body: { userId: u.id }, text: `"${u.username}" kullanıcısı kalıcı olarak silinsin mi?` })}>
                                                            <TrashIcon />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ═══════════════ YORUMLAR ═══════════════ */}
                {tab === 'comments' && (
                    <>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><MsgIcon /> Yorumlar ({stats?.totalComments || 0})</h2>
                        
                        <div className="admin-grid-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
                            {/* Sol Kolon: Son Yorumlar */}
                            <div className="admin-card" style={{ overflow: 'auto', margin: 0 }}>
                                <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: '1rem' }}>Son Yorumlar</h3>
                                <table className="admin-table">
                                    <thead><tr><th>Kullanıcı</th><th>Yorum</th><th>Seri / Bölüm</th><th>Tarih</th><th></th></tr></thead>
                                    <tbody>
                                        {(stats?.recentComments || []).map(c => (
                                            <tr key={c.id}>
                                                <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{c.username}</td>
                                                <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{c.content}</td>
                                                <td style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--accent-light)' }}>{c.series_title || '—'}</span>{c.chapter_title && c.chapter_title !== 'Series Comment' ? ` / ${c.chapter_title}` : ''}</td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fDate(c.created_at)}</td>
                                                <td>
                                                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmModal({ action: 'delete-comment', body: { commentId: c.id }, text: 'Bu yorumu silmek istediğinize emin misiniz?' })}>
                                                        <TrashIcon />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(stats?.recentComments || []).length === 0 && (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Henüz yorum yapılmamış</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Sağ Kolon: Yorum Ayarları */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Tepki Emojileri */}
                                <div className="admin-card" style={{ margin: 0 }}>
                                    <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        🎯 Tepki Emojileri
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: 12 }}>
                                        Yorumlarda kullanılabilecek tepki emojilerini ve etiketlerini düzenleyin.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                        {commentEmojis.map((em, index) => (
                                            <div key={index} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={em.icon} 
                                                    onChange={e => updateEmojiField(index, 'icon', e.target.value)} 
                                                    style={{ width: 45, textAlign: 'center', padding: '4px 6px', fontSize: '1rem' }} 
                                                    placeholder="👍"
                                                />
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={em.label} 
                                                    onChange={e => updateEmojiField(index, 'label', e.target.value)} 
                                                    style={{ flex: 1, padding: '4px 8px', fontSize: '0.82rem' }} 
                                                    placeholder="Etiket"
                                                />
                                                <button className="btn btn-danger btn-sm" onClick={() => removeEmoji(index)} style={{ padding: '6px 8px' }}>
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 12, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Yeni Emoji Ekle</div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                value={newEmojiIcon} 
                                                onChange={e => setNewEmojiIcon(e.target.value)} 
                                                style={{ width: 45, textAlign: 'center', padding: '4px 6px' }} 
                                                placeholder="👍"
                                            />
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                value={newEmojiLabel} 
                                                onChange={e => setNewEmojiLabel(e.target.value)} 
                                                style={{ flex: 1, padding: '4px 8px', fontSize: '0.82rem' }} 
                                                placeholder="İsim (örn. Beğen)"
                                            />
                                            <button className="btn btn-primary btn-sm" onClick={addEmoji}>Ekle</button>
                                        </div>
                                    </div>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => handleSaveEmojis(commentEmojis)} 
                                        disabled={submitting}
                                        style={{ width: '100%', fontSize: '0.85rem' }}
                                    >
                                        {submitting ? 'Kaydediliyor...' : 'Emojileri Kaydet'}
                                    </button>
                                </div>

                                {/* Bildirim Nedenleri */}
                                <div className="admin-card" style={{ margin: 0 }}>
                                    <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        🚩 Bildirim Nedenleri
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: 12 }}>
                                        Yorum raporlamalarında kullanıcılara sunulan seçenekleri düzenleyin.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                        {reportReasons.map((re, index) => (
                                            <div key={index} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={re} 
                                                    onChange={e => updateReasonText(index, e.target.value)} 
                                                    style={{ flex: 1, padding: '4px 8px', fontSize: '0.82rem' }} 
                                                />
                                                <button className="btn btn-danger btn-sm" onClick={() => removeReason(index)} style={{ padding: '6px 8px' }}>
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 12, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Yeni Neden Ekle</div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                value={newReasonText} 
                                                onChange={e => setNewReasonText(e.target.value)} 
                                                style={{ flex: 1, padding: '4px 8px', fontSize: '0.82rem' }} 
                                                placeholder="Neden (örn. Nefret Söylemi)"
                                            />
                                            <button className="btn btn-primary btn-sm" onClick={addReason}>Ekle</button>
                                        </div>
                                    </div>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => handleSaveReportReasons(reportReasons)} 
                                        disabled={submitting}
                                        style={{ width: '100%', fontSize: '0.85rem' }}
                                    >
                                        {submitting ? 'Kaydediliyor...' : 'Bildirim Nedenlerini Kaydet'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {/* ═══════════════ SYSTEM LOGS ═══════════════ */}
                {(user.role === 'admin' || user.role === 'manager') && tab === 'logs' && (
                    <>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Sistem Logları</h2>
                        <div className="admin-card" style={{ padding: 0 }}>
                            <div style={{ maxHeight: 500, overflowY: 'auto', padding: '12px', background: 'var(--bg-tertiary)', fontFamily: 'monospace', fontSize: '0.75rem', color: '#ccc' }}>
                                {systemLogs.map((log, i) => <div key={i} style={{ marginBottom: 4 }}>[{log.timestamp}] {log.message}</div>)}
                            </div>
                        </div>
                    </>
                )}
                {/* ═══════════════ SERIES REQUESTS ═══════════════ */}
                {tab === 'requests' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                                Seri İstekleri ({seriesRequests.length})
                            </h2>
                            <button className="btn btn-sm" style={{ background: 'var(--bg-tertiary)' }} onClick={async () => {
                                setReqLoading(true);
                                try {
                                    const res = await authFetch('/api/series-requests?admin=1');
                                    const data = await res.json();
                                    setSeriesRequests(data.requests || []);
                                } catch {}
                                setReqLoading(false);
                            }}>
                                {reqLoading ? 'Yükleniyor...' : '↻ Yenile'}
                            </button>
                        </div>

                        {/* Filtre sekmeleri */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                            {[{ k: 'all', l: 'Tümü' }, ...REQ_STATUSES.map(s => ({ k: s.value, l: s.label }))].map(f => (
                                <button key={f.k}
                                    onClick={() => setReqFilter(f.k)}
                                    style={{ padding: '5px 12px', borderRadius: 50, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', background: reqFilter === f.k ? 'var(--accent)' : 'var(--bg-tertiary)', color: reqFilter === f.k ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                    {f.l}
                                </button>
                            ))}
                        </div>

                        {reqLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}><div className="spinner" /></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {seriesRequests.filter(r => reqFilter === 'all' || r.status === reqFilter).map(req => {
                                    const st = REQ_STATUSES.find(s => s.value === req.status) || REQ_STATUSES[0];
                                    const isEditing = editingReq?.id === req.id;
                                    return (
                                        <div key={req.id} className="admin-card" style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                                        <strong style={{ fontSize: '0.95rem' }}>{req.series_title}</strong>
                                                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 50, background: st.color + '22', color: st.color, border: `1px solid ${st.color}55`, fontWeight: 700 }}>
                                                            {st.label}
                                                        </span>
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '2px 7px', background: 'var(--bg-tertiary)', borderRadius: 50, border: '1px solid var(--border-color)' }}>
                                                            {req.series_type}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                        {req.author && <span>Yazar: {req.author}</span>}
                                                        <span>Ekleyen: <strong>{req.username}</strong></span>
                                                        <span>👍 {req.upvotes}</span>
                                                        <span>{new Date(req.created_at + 'Z').toLocaleDateString()}</span>
                                                    </div>
                                                    {req.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>{req.description}</p>}
                                                    {req.reason && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0', fontStyle: 'italic' }}>"{req.reason}"</p>}
                                                    {req.source_url && <a href={req.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-light)', wordBreak: 'break-all' }}>{req.source_url}</a>}
                                                    {req.admin_note && <p style={{ fontSize: '0.78rem', color: '#a5b4fc', margin: '6px 0 0', padding: '6px 10px', background: 'rgba(99,102,241,0.1)', borderRadius: 6 }}>📝 {req.admin_note}</p>}
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                    <button className="btn btn-sm" onClick={() => setEditingReq(isEditing ? null : { id: req.id, status: req.status, admin_note: req.admin_note || '' })}
                                                        style={{ fontSize: '0.75rem' }}>
                                                        {isEditing ? 'İptal' : 'Düzenle'}
                                                    </button>
                                                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.75rem' }}
                                                        onClick={() => setConfirmModal({
                                                            text: `"${req.series_title}" isteği silinsin mi?`,
                                                            action: async () => {
                                                                await authFetch('/api/series-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: req.id }) });
                                                                setSeriesRequests(prev => prev.filter(r => r.id !== req.id));
                                                                show('Silindi');
                                                            }
                                                        })}>
                                                        Sil
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Düzenleme paneli */}
                                            {isEditing && (
                                                <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Durum:</label>
                                                        <select value={editingReq.status} onChange={e => setEditingReq(r => ({ ...r, status: e.target.value }))}
                                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 8px', fontSize: '0.82rem' }}>
                                                            {REQ_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Yönetici Notu:</label>
                                                        <textarea value={editingReq.admin_note} onChange={e => setEditingReq(r => ({ ...r, admin_note: e.target.value }))}
                                                            placeholder="Kullanıcı için isteğe bağlı not..."
                                                            rows={2} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 6, padding: '6px 10px', fontSize: '0.82rem', resize: 'vertical', fontFamily: 'inherit' }} />
                                                    </div>
                                                    <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', fontSize: '0.8rem' }}
                                                        onClick={async () => {
                                                            const res = await authFetch('/api/series-requests', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ action: 'update-status', id: editingReq.id, status: editingReq.status, admin_note: editingReq.admin_note }),
                                                            });
                                                            if (res.ok) {
                                                                setSeriesRequests(prev => prev.map(r => r.id === editingReq.id ? { ...r, status: editingReq.status, admin_note: editingReq.admin_note } : r));
                                                                setEditingReq(null);
                                                                show('İstek güncellendi');
                                                            }
                                                        }}>
                                                        Değişiklikleri Kaydet
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {seriesRequests.filter(r => reqFilter === 'all' || r.status === reqFilter).length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '0.9rem' }}>İstek bulunamadı.</div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════════ SCRAPER ═══════════════ */}
                {tab === 'scraper' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                                <DownloadIcon /> Bot (Scraper)
                            </h2>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={loadAllScraperSources} disabled={allScraperSourcesLoading}>
                                    {allScraperSourcesLoading ? 'Yükleniyor...' : <><SyncIcon /> Yenile</>}
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={scraperSyncAll} disabled={scraperSyncLoading}>
                                    {scraperSyncLoading ? 'Eşitleniyor...' : <><SyncIcon /> Tüm Kaynakları Eşitle</>}
                                </button>
                            </div>
                        </div>

                        {/* Create new series from URL */}
                        <div className="admin-card" style={{ marginBottom: 20 }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
                                <LinkIcon /> URL'den Yeni Seri Çek
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                                MangaDex, Comick.io veya desteklenen diğer sitelerden bir manga URL'si yapıştırın. Bot; seri bilgilerini ve kapağı çekecek, tüm bölümleri inceleme için hazırlayacaktır.
                            </p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://mangadex.org/title/... veya https://comick.io/comic/..."
                                    value={scrapeNewUrl}
                                    onChange={e => { setScrapeNewUrl(e.target.value); setScrapeNewPreview(null); }}
                                    style={{ flex: 1 }}
                                />
                                <select
                                    value={scrapeNewLang}
                                    onChange={e => { setScrapeNewLang(e.target.value); setScrapeNewPreview(null); }}
                                    title="Dil (Yalnızca MangaDex / Comick)"
                                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem', flexShrink: 0 }}>
                                    <option value="en">🇬🇧 English</option>
                                    <option value="tr">🇹🇷 Türkçe</option>
                                    <option value="pt-br">🇧🇷 Portuguese (BR)</option>
                                    <option value="es">🇪🇸 Spanish</option>
                                    <option value="es-la">🇲🇽 Spanish (LA)</option>
                                    <option value="fr">🇫🇷 French</option>
                                    <option value="de">🇩🇪 German</option>
                                    <option value="it">🇮🇹 Italian</option>
                                    <option value="id">🇮🇩 Indonesian</option>
                                    <option value="ru">🇷🇺 Russian</option>
                                    <option value="ar">🇸🇦 Arabic</option>
                                    <option value="ja">🇯🇵 Japanese</option>
                                    <option value="ko">🇰🇷 Korean</option>
                                    <option value="zh">🇨🇳 Chinese (Simp.)</option>
                                    <option value="zh-hk">🇹🇼 Chinese (Trad.)</option>
                                </select>
                                <button className="btn btn-ghost btn-sm" disabled={scrapeNewLoading || !scrapeNewUrl}
                                    onClick={async () => {
                                        if (!scrapeNewUrl.trim()) return;
                                        setScrapeNewLoading(true);
                                        try {
                                            const res = await authFetch('/api/admin/scrape', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ action: 'fetch-info', url: scrapeNewUrl.trim(), language: scrapeNewLang }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.error);
                                            setScrapeNewPreview(data);
                                        } catch (e) { show(e.message, 'error'); }
                                        finally { setScrapeNewLoading(false); }
                                    }}>
                                    {scrapeNewLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Önizleme'}
                                </button>
                            </div>
                            {scrapeNewPreview && (
                                <div style={{ padding: '12px 14px', background: 'var(--bg-tertiary)', borderRadius: 8, marginTop: 10 }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        {scrapeNewPreview.meta?.coverUrl && (
                                            <img src={scrapeNewPreview.meta.coverUrl} alt="" style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                                                <strong style={{ fontSize: '1rem' }}>{scrapeNewPreview.meta?.title}</strong>
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>{scrapeNewPreview.site}</span>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{scrapeNewPreview.chapters_count} bölüm bulundu</span>
                                            </div>
                                            {scrapeNewPreview.meta?.author && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Yazar: {scrapeNewPreview.meta.author}</div>}
                                            {scrapeNewPreview.meta?.genres?.length > 0 && (
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                                                    {scrapeNewPreview.meta.genres.slice(0, 6).map(g => <span key={g} className="genre-tag" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>{g}</span>)}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                <button className="btn btn-primary btn-sm" onClick={handleCreateSeriesFromScrape} disabled={scrapeNewLoading}>
                                                    {scrapeNewLoading ? 'Oluşturuluyor...' : `Seriyi Oluştur ve ${scrapeNewPreview.chapters_count} Bölümü Hazırla`}
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => { setScrapeNewPreview(null); setScrapeNewUrl(''); }}>İptal</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* All sources */}
                        <div className="admin-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <h3 style={{ margin: 0 }}>Aktif Kaynaklar ({allScraperSources.length})</h3>
                                {allScraperSources.length === 0 && (
                                    <button className="btn btn-ghost btn-sm" onClick={loadAllScraperSources}>Kaynakları Yükle</button>
                                )}
                            </div>
                            {allScraperSources.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
                                    Henüz kaynak eklenmemiş. Bir seriyi açıp "Otomatik İçerik Çekme" alanından kaynak URL'si ekleyebilirsiniz.
                                </p>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Seri</th>
                                            <th>Site</th>
                                            <th>Kaynak URL</th>
                                            <th>Son Kontrol</th>
                                            <th>Son Bölüm</th>
                                            <th>Bekleyen</th>
                                            <th>Otomatik Eşitleme</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allScraperSources.map(src => (
                                            <tr key={src.id}>
                                                <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                    <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', padding: '2px 6px' }}
                                                        onClick={() => { setTab('series'); openSeriesDetail(src.series_id); }}>
                                                        {src.series_title}
                                                    </button>
                                                </td>
                                                <td><span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: 'var(--accent-light)', textTransform: 'uppercase' }}>{src.source_site}</span></td>
                                                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                    <a href={src.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)' }}>{src.source_url}</a>
                                                </td>
                                                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    {src.last_checked ? new Date(src.last_checked).toLocaleString() : 'Hiçbir Zaman'}
                                                </td>
                                                <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {src.last_chapter_found > 0 ? `Bölüm ${src.last_chapter_found}` : '-'}
                                                </td>
                                                <td>
                                                    {src.pending_count > 0 ? (
                                                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 50, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700 }}>
                                                            {src.pending_count} bekleyen
                                                        </span>
                                                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.72rem', color: src.auto_sync ? '#22c55e' : 'var(--text-muted)' }}>
                                                        {src.auto_sync ? '✓ Açık' : 'Kapalı'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* ═══════════════ MEDIA ═══════════════ */}
                {tab === 'media' && (
                    <>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ImageIcon /> Medya Kütüphanesi</h2>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => loadMedia(1, false, mediaFilter)}>
                                {mediaLoading && mediaPage === 1 ? 'Yükleniyor...' : 'Yenile'}
                            </button>
                            {['all', 'covers', 'pages', 'avatars'].map(f => {
                                const labelsTr = { all: 'Tümü', covers: 'Kapaklar', pages: 'Sayfalar', avatars: 'Avatarlar' };
                                return (
                                    <button key={f} className={`btn btn-sm ${mediaFilter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => {
                                        setMediaFilter(f);
                                        loadMedia(1, false, f);
                                    }}>{labelsTr[f] || f}</button>
                                );
                            })}
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                {mediaFiles.length} / {mediaTotal} dosya
                            </span>
                        </div>
                        {mediaFiles.length === 0 && !mediaLoading ? (
                            <div className="admin-card" style={{ textAlign: 'center', padding: 40 }}>
                                <ImageIcon />
                                <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Medya dosyalarını yüklemek için "Yenile"ye tıklayın.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                                    {mediaFiles.map((m, i) => (
                                        <div key={i} className="admin-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                                            <div style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-tertiary)' }} onClick={() => setPreviewImage({ src: m.path, title: m.name })}>
                                                <img src={m.path} alt={m.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ padding: '8px 10px' }}>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.sizeFormatted}</span>
                                                    <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(155,44,44,0.1)', color: 'var(--accent-light)' }}>{m.category}</span>
                                                </div>
                                                <button className="btn btn-danger btn-sm" style={{ width: '100%', marginTop: 6, fontSize: '0.7rem', padding: '4px 8px' }} onClick={() => setConfirmModal({ action: 'delete-media', body: { filePath: m.path }, text: `"${m.name}" dosyasını silmek istediğinize emin misiniz?` })}>
                                                    <TrashIcon /> Sil
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {mediaHasMore && (
                                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                                        <button className="btn btn-secondary" onClick={() => loadMedia(mediaPage + 1, true, mediaFilter)} disabled={mediaLoading}>
                                            {mediaLoading ? 'Yükleniyor...' : 'Daha Fazla Medya Yükle'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ═══════════════ SETTINGS ═══════════════ */}
                {tab === 'settings' && (
                    <div className="admin-card" style={{ maxWidth: 640 }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><GearIcon /> Site Ayarları</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
                            Küresel uygulama ayarlarını ve ana sayfa bileşenlerini yapılandırın.
                        </p>
                        
                        <form onSubmit={saveSettings}>
                            {/* ── Bakım Modu (Maintenance Mode) ── */}
                            <div style={{ padding: '16px', background: settings.maintenance_mode === '1' ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: settings.maintenance_mode === '1' ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.05)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1.05rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: settings.maintenance_mode === '1' ? '#fbbf24' : 'var(--text-primary)' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                                    Bakım Modu
                                    {settings.maintenance_mode === '1' && <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', borderRadius: 50, padding: '2px 10px', marginLeft: 4 }}>AKTİF</span>}
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                                    Etkinleştirildiğinde, ziyaretçiler bir bakım sayfası görür. Siteye yalnızca yöneticiler (giriş yapmış olanlar) erişebilir.
                                </p>
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, margin: 0 }}>
                                    <input
                                        type="checkbox"
                                        id="maintenanceEnabled"
                                        checked={settings.maintenance_mode === '1'}
                                        onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked ? '1' : '0' })}
                                        style={{ width: 18, height: 18, accentColor: '#f59e0b' }}
                                    />
                                    <label htmlFor="maintenanceEnabled" style={{ marginBottom: 0, fontWeight: 500, cursor: 'pointer' }}>
                                        Bakım Modunu Etkinleştir
                                    </label>
                                </div>
                                <div className="form-group" style={{ marginTop: 14 }}>
                                    <label>Bakım Mesajı (isteğe bağlı)</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={settings.maintenance_message}
                                        onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                                        placeholder="Deneyiminizi geliştirmek için şu anda planlı bakım yapıyoruz. Bu işlem uzun sürmeyecektir - lütfen kısa süre sonra tekrar kontrol edin."
                                        style={{ resize: 'vertical', minHeight: 70 }}
                                    />
                                    <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>Varsayılan mesaj için boş bırakın.</small>
                                </div>
                            </div>

                            {/* ── Bağış Afişi (Donation Banner) ── */}
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1.05rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    Bağış Afişi
                                </h4>
                                
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <input 
                                        type="checkbox" 
                                        id="donEnabled"
                                        checked={settings.donation_enabled === '1'} 
                                        onChange={(e) => setSettings({...settings, donation_enabled: e.target.checked ? '1' : '0'})} 
                                        style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} 
                                    />
                                    <label htmlFor="donEnabled" style={{ marginBottom: 0, fontWeight: 500, cursor: 'pointer' }}>Ana Sayfada Bağış Afişini Göster</label>
                                </div>

                                <div className="form-group">
                                    <label>Teşvik Edici Mesaj / Başlık</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={settings.donation_text} 
                                        onChange={(e) => setSettings({...settings, donation_text: e.target.value})} 
                                        placeholder="örn. Sunucuları açık tutmak için bize destek olun!"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label>PayPal URL</label>
                                        <input 
                                            type="url" 
                                            className="form-input" 
                                            value={settings.paypal_url} 
                                            onChange={(e) => setSettings({...settings, paypal_url: e.target.value})} 
                                            placeholder="https://paypal.me/..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Ko-fi URL</label>
                                        <input 
                                            type="url" 
                                            className="form-input" 
                                            value={settings.kofi_url} 
                                            onChange={(e) => setSettings({...settings, kofi_url: e.target.value})} 
                                            placeholder="https://ko-fi.com/..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Discord Sunucu Afişi ── */}
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1.05rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#5865F2' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12c.5 1.5 2 2.5 4 2.5s3.5-1 4-2.5"/></svg>
                                    Discord Afişi
                                </h4>
                                
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <input 
                                        type="checkbox" 
                                        id="discEnabled"
                                        checked={settings.discord_enabled === '1'} 
                                        onChange={(e) => setSettings({...settings, discord_enabled: e.target.checked ? '1' : '0'})} 
                                        style={{ width: 18, height: 18, accentColor: '#5865F2' }} 
                                    />
                                    <label htmlFor="discEnabled" style={{ marginBottom: 0, fontWeight: 500, cursor: 'pointer' }}>Ana Sayfada Discord Afişini Göster</label>
                                </div>

                                <div className="form-group">
                                    <label>Discord Davet URL'si</label>
                                    <input 
                                        type="url" 
                                        className="form-input" 
                                        value={settings.discord_url} 
                                        onChange={(e) => setSettings({...settings, discord_url: e.target.value})} 
                                        placeholder="https://discord.gg/..."
                                    />
                                </div>
                            </div>

                            {/* ── Hata Bildirimi Ayarları ── */}
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1.05rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
                                    <ShieldIcon />
                                    Hata Bildirimi Ayarları
                                </h4>
                                
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, margin: 0 }}>
                                    <input 
                                        type="checkbox" 
                                        id="bugRepEnabled"
                                        checked={settings.bug_report_enabled === '1'} 
                                        onChange={(e) => setSettings({...settings, bug_report_enabled: e.target.checked ? '1' : '0'})} 
                                        style={{ width: 18, height: 18, accentColor: '#ef4444' }} 
                                    />
                                    <label htmlFor="bugRepEnabled" style={{ marginBottom: 0, fontWeight: 500, cursor: 'pointer' }}>Ana Sayfada Hata Bildirimi Butonunu Göster</label>
                                </div>
                            </div>

                            {/* ── Yeni Bölüm Özelleştirmesi ── */}
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1.05rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2c0 0-4.5 4.5-4.5 8.5C7.5 14.5 10.5 17 12 17s4.5-2.5 4.5-6.5C16.5 6.5 12 2 12 2zm0 12.5c-1.38 0-2.5-1.12-2.5-2.5 0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 1.38-1.12 2.5-2.5 2.5z"/></svg>
                                    Yeni Bölüm Özelleştirmesi (24 Saat)
                                </h4>
                                
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, margin: 0 }}>
                                    <input 
                                        type="checkbox" 
                                        id="newChHighlightEnabled"
                                        checked={settings.show_new_chapter_badge === '1'} 
                                        onChange={(e) => setSettings({...settings, show_new_chapter_badge: e.target.checked ? '1' : '0'})} 
                                        style={{ width: 18, height: 18, accentColor: '#f59e0b' }} 
                                    />
                                    <label htmlFor="newChHighlightEnabled" style={{ marginBottom: 0, fontWeight: 500, cursor: 'pointer' }}>Son 24 saatte yüklenen bölümleri vurgula (alev ve animasyon efekti)</label>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ═══════════════ HATA BİLDİRİMLERİ ═══════════════ */}
                {tab === 'bug-reports' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                                <ShieldIcon />
                                Hata Bildirimleri ({bugReports.length})
                            </h2>
                            <button className="btn btn-sm" style={{ background: 'var(--bg-tertiary)' }} onClick={() => {
                                setReportsLoading(true);
                                authFetch('/api/admin/reports')
                                    .then(r => r.json())
                                    .then(d => { if (d.success) setBugReports(d.reports || []); })
                                    .catch(() => {})
                                    .finally(() => setReportsLoading(false));
                            }}>
                                {reportsLoading ? 'Yükleniyor...' : '🔄 Yenile'}
                            </button>
                        </div>

                        {bugReports.length === 0 && !reportsLoading ? (
                            <div className="admin-card" style={{ textAlign: 'center', padding: 40 }}>
                                <ShieldIcon />
                                <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Henüz herhangi bir hata bildirimi alınmadı.</p>
                            </div>
                        ) : (
                            <div className="admin-card" style={{ overflow: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Başlık</th>
                                            <th>Açıklama</th>
                                            <th>Gönderen</th>
                                            <th>Tarih</th>
                                            <th>Durum</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bugReports.map(rep => (
                                            <tr key={rep.id}>
                                                <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{rep.title}</td>
                                                <td style={{ maxWidth: 300, whiteSpace: 'normal', fontSize: '0.8rem', padding: '10px 8px' }}>
                                                    {rep.description}
                                                </td>
                                                <td style={{ fontSize: '0.8rem' }}>
                                                    {rep.username ? (
                                                        <div>
                                                            <strong>{rep.username}</strong>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{rep.email}</div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>Ziyaretçi (Anonim)</span>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    {new Date(rep.created_at).toLocaleString('tr-TR')}
                                                </td>
                                                <td>
                                                    <span style={{ 
                                                        fontSize: '0.72rem', 
                                                        padding: '2px 8px', 
                                                        borderRadius: 50, 
                                                        background: rep.status === 'resolved' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', 
                                                        color: rep.status === 'resolved' ? '#22c55e' : '#f59e0b', 
                                                        fontWeight: 700 
                                                    }}>
                                                        {rep.status === 'resolved' ? 'Çözüldü' : 'Beklemede'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        {rep.status !== 'resolved' && (
                                                            <button 
                                                                className="btn btn-primary btn-sm" 
                                                                onClick={() => updateReportStatus(rep.id, 'resolved')}
                                                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                                            >
                                                                Çözüldü İşaretle
                                                            </button>
                                                        )}
                                                        <button 
                                                            className="btn btn-danger btn-sm" 
                                                            onClick={() => deleteReport(rep.id)}
                                                            style={{ padding: '6px 8px' }}
                                                            title="Raporu Sil"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════════ ÖZELLEŞTIRME ═══════════════ */}
                {tab === 'customize' && (
                    <div style={{ maxWidth: 720 }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PaletteIcon /> Tema &amp; Site Özelleştirme
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 24 }}>
                            Sitenizin görünümünü, adını, logosunu, renklerini ve sosyal medya bağlantılarını buradan özelleştirin.
                        </p>

                        <form onSubmit={saveCustomize}>

                            {/* ── Site Kimliği ── */}
                            <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                    Site Kimliği
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Site Adı</label>
                                        <input type="text" className="form-input" placeholder="örn. MangaHub" value={customize.site_name} onChange={e => setCustomize({ ...customize, site_name: e.target.value })} />
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem' }}>Başlık çubuğu ve meta etiketlerinde görünür.</small>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Site Açıklaması (SEO)</label>
                                        <input type="text" className="form-input" placeholder="örn. Türkçe Manga Okuma Sitesi" value={customize.site_description} onChange={e => setCustomize({ ...customize, site_description: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Logo URL</label>
                                        <input type="text" className="form-input" placeholder="/uploads/logo.png veya https://..." value={customize.logo_url} onChange={e => setCustomize({ ...customize, logo_url: e.target.value })} />
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem' }}>Navbar'da gösterilecek logo. Boşsa site adı gösterilir.</small>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Favicon URL</label>
                                        <input type="text" className="form-input" placeholder="/favicon.ico veya https://..." value={customize.favicon_url} onChange={e => setCustomize({ ...customize, favicon_url: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>İletişim E-postası</label>
                                        <input type="email" className="form-input" placeholder="info@siteniz.com" value={customize.contact_email} onChange={e => setCustomize({ ...customize, contact_email: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>OG / Sosyal Medya Görseli URL</label>
                                        <input type="text" className="form-input" placeholder="https://..." value={customize.og_image_url} onChange={e => setCustomize({ ...customize, og_image_url: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                                        <label>Footer Alt Metin / Telif Hakkı Notu</label>
                                        <input type="text" className="form-input" placeholder="© 2025 MangaHub — Tüm hakları saklıdır." value={customize.footer_text} onChange={e => setCustomize({ ...customize, footer_text: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* ── Görünüm ve Tasarım ── */}
                            <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <PaletteIcon /> Görünüm ve Tasarım
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Ana Sayfa Yeni Bölüm Kart Tasarımı</label>
                                        <select className="form-input" value={customize.latest_updates_design || 'style4'} onChange={e => setCustomize({ ...customize, latest_updates_design: e.target.value })}>
                                            <option value="style1">1. Klasik (Asura Style)</option>
                                            <option value="style2">2. Kozmik Yırtılma (Cosmic Tear)</option>
                                            <option value="style3">3. Yetenek Ağacı (Skill Tree)</option>
                                            <option value="style4">4. TCG Holografik (HoloCard)</option>
                                            <option value="style5">5. Sinematik Prömiyer (Cinematic)</option>
                                        </select>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem', display: 'block', marginTop: 4 }}>Ana sayfadaki Son Güncellemeler bölümünün görünümünü değiştirir.</small>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Ana Sayfa "En Çok Okunanlar" Tasarımı</label>
                                        <select className="form-input" value={customize.most_read_design || 'mr_style1'} onChange={e => setCustomize({ ...customize, most_read_design: e.target.value })}>
                                            <option value="mr_style1">1. Klasik (Mevcut Görünüm)</option>
                                            <option value="mr_style2">2. Kademeli Cam (Glass Steps)</option>
                                            <option value="mr_style3">3. Altın Taç (Golden Crown)</option>
                                            <option value="mr_style4">4. Siberpunk Neon (Cyberpunk)</option>
                                            <option value="mr_style5">5. Anime Minimalist (Hover Reveal)</option>
                                        </select>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem', display: 'block', marginTop: 4 }}>Sağ panodaki (Sidebar) En Çok Okunanlar sıralamasının görünümünü değiştirir.</small>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Ana Sayfa "Şu Anda Trend Olanlar" Tasarımı</label>
                                        <select className="form-input" value={customize.trending_design || 'trend_style1'} onChange={e => setCustomize({ ...customize, trending_design: e.target.value })}>
                                            <option value="trend_style1">1. Klasik (Yatay Kartlar)</option>
                                            <option value="trend_style2">2. Neon Yansıma (Neon Glow)</option>
                                            <option value="trend_style3">3. Geniş Pankart (Horizontal Banners)</option>
                                            <option value="trend_style4">4. Cam Küp 3D (Glass 3D)</option>
                                            <option value="trend_style5">5. Alevli Yükseliş (Flaming Rise)</option>
                                        </select>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem', display: 'block', marginTop: 4 }}>Ana sayfadaki üst yatay trend panosunun görünümünü değiştirir.</small>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Ana Sayfa "Ana Slider" (Popüler Seriler) Tasarımı</label>
                                        <select className="form-input" value={customize.hero_slider_design || 'hero_style1'} onChange={e => setCustomize({ ...customize, hero_slider_design: e.target.value })}>
                                            <option value="hero_style1">1. Klasik (Mevcut Deck Görünümü)</option>
                                            <option value="hero_style2">2. Sinematik Geniş Ekran (Netflix Stili)</option>
                                            <option value="hero_style3">3. Holografik Akış (Holo Cover Flow)</option>
                                            <option value="hero_style4">4. Kademeli Yükseliş (Cascading Steps)</option>
                                            <option value="hero_style5">5. Siberpunk Vitrin (Cyberpunk Neon)</option>
                                        </select>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem', display: 'block', marginTop: 4 }}>Ana sayfanın en üstündeki popüler seriler slider'ının görünümünü ve animasyonlarını değiştirir.</small>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Seri Detay Sayfası Tasarımı</label>
                                        <select className="form-input" value={customize.series_detail_design || 'detail_style1'} onChange={e => setCustomize({ ...customize, series_detail_design: e.target.value })}>
                                            <option value="detail_style1">1. Klasik Parallax (Mevcut Görünüm)</option>
                                            <option value="detail_style2">2. Cam Kapsül (Glass Capsule)</option>
                                            <option value="detail_style3">3. Sinematik Geniş Ekran (Netflix Stili)</option>
                                            <option value="detail_style4">4. Siberpunk Neon (Cyberpunk)</option>
                                            <option value="detail_style5">5. Minimalist Estetik (Clean & Focus)</option>
                                        </select>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem', display: 'block', marginTop: 4 }}>Seri detay sayfasının üst bilgi (Hero) kısmının görünümünü değiştirir.</small>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Yorum Bölümü Tasarımı</label>
                                        <select className="form-input" value={customize.comment_design || 'comment_style1'} onChange={e => setCustomize({ ...customize, comment_design: e.target.value })}>
                                            <option value="comment_style1">1. Klasik (Asura Style)</option>
                                            <option value="comment_style2">2. Discord Chat Tarzı</option>
                                            <option value="comment_style3">3. Modern Minimalist (Glassmorphism)</option>
                                            <option value="comment_style4">4. Siberpunk Neon (Cyberpunk)</option>
                                            <option value="comment_style5">5. Manga Konuşma Baloncuğu</option>
                                        </select>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem', display: 'block', marginTop: 4 }}>Bölüm ve seri sayfalarındaki yorum alanının görünümünü değiştirir.</small>
                                    </div>
                                </div>
                            </div>

                            {/* ── SEO Özelleştirmeleri ── */}
                            <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                    SEO ve Başlık Özelleştirmeleri
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Ana Sayfa Başlığı (Title)</label>
                                        <input type="text" className="form-input" placeholder="örn. YomiTranslate — Yapay Zeka Çevirili Çevrimiçi Manga Oku" value={customize.seo_title_home} onChange={e => setCustomize({ ...customize, seo_title_home: e.target.value })} />
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem' }}>Sitenin ana sayfasında sekmede görünecek olan başlık.</small>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Ana Sayfa Açıklaması (Description)</label>
                                        <textarea className="form-input" placeholder="Siteniz için SEO açıklaması..." value={customize.seo_desc_home} onChange={e => setCustomize({ ...customize, seo_desc_home: e.target.value })} style={{ height: 60 }} />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Seri (Bölüm Listesi) Sayfası Başlık Formatı</label>
                                        <input type="text" className="form-input" placeholder="örn. {series_name} Oku - {site_name}" value={customize.seo_title_series} onChange={e => setCustomize({ ...customize, seo_title_series: e.target.value })} />
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem' }}>Kullanabileceğiniz değişkenler: <code>{`{series_name}`}</code>, <code>{`{site_name}`}</code></small>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Okuma (Bölüm) Sayfası Başlık Formatı</label>
                                        <input type="text" className="form-input" placeholder="örn. {series_name} Bölüm {chapter_number} Türkçe Oku - {site_name}" value={customize.seo_title_chapter} onChange={e => setCustomize({ ...customize, seo_title_chapter: e.target.value })} />
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem' }}>Kullanabileceğiniz değişkenler: <code>{`{series_name}`}</code>, <code>{`{chapter_number}`}</code>, <code>{`{chapter_title}`}</code>, <code>{`{site_name}`}</code></small>
                                    </div>
                                </div>
                            </div>

                            {/* ── Renk Paleti ── */}
                            <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <PaletteIcon /> Renk Paleti
                                </h4>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                    Renk seçici veya HEX değeri girin. Boş bırakılan alanlar varsayılan tema renklerini kullanır.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                                    {[
                                        { key: 'accent_color', label: 'Ana Renk (Accent)', hint: 'Butonlar, linkler, vurgular. Diğer renkler buradan türetilir.' },
                                        { key: 'button_color', label: 'Buton Rengi', hint: 'Birincil buton arka planı' },
                                        { key: 'button_hover_color', label: 'Buton Hover Rengi', hint: 'Üzerine gelince buton rengi' },
                                        { key: 'button_text_color', label: 'Buton Metin Rengi', hint: '' },
                                        { key: 'link_color', label: 'Link Rengi', hint: '' },
                                        { key: 'link_hover_color', label: 'Link Hover Rengi', hint: '' },
                                        { key: 'navbar_bg_color', label: 'Navbar Arka Planı', hint: '' },
                                        { key: 'reader_bg_color', label: 'Okuyucu Arka Planı', hint: 'Manga okuma sayfası arka planı' },
                                        { key: 'announcement_bg_color', label: 'Duyuru Şeridi Rengi', hint: '' },
                                    ].map(({ key, label, hint }) => (
                                        <div key={key} className="form-group" style={{ margin: 0 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <input
                                                    type="color"
                                                    value={customize[key] || '#000000'}
                                                    onChange={e => setCustomize({ ...customize, [key]: e.target.value })}
                                                    style={{ width: 28, height: 28, border: '1px solid var(--border-color)', borderRadius: 6, padding: 2, cursor: 'pointer', background: 'none' }}
                                                />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{label}</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={customize[key] || ''}
                                                onChange={e => setCustomize({ ...customize, [key]: e.target.value })}
                                                placeholder="#rrggbb (boş = varsayılan)"
                                                style={{ fontSize: '0.78rem' }}
                                            />
                                            {hint && <small style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>{hint}</small>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Sosyal Medya ── */}
                            <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <GlobeIcon /> Sosyal Medya Bağlantıları
                                </h4>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>Footer'da sosyal medya ikonları olarak görünür. Boş bırakılan platformlar gösterilmez.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    {[
                                        { key: 'discord_url', label: 'Discord', placeholder: 'https://discord.gg/...' },
                                        { key: 'reddit_url', label: 'Reddit', placeholder: 'https://reddit.com/r/...' },
                                        { key: 'twitter_url', label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
                                        { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                                        { key: 'tiktok_url', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
                                        { key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/c/...' },
                                        { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/...' },
                                    ].map(({ key, label, placeholder }) => (
                                        <div key={key} className="form-group" style={{ margin: 0 }}>
                                            <label>{label}</label>
                                            <input type="url" className="form-input" placeholder={placeholder} value={customize[key] || ''} onChange={e => setCustomize({ ...customize, [key]: e.target.value })} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Analitik ── */}
                            <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <DashIcon /> Analitik
                                </h4>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>Google Analytics Ölçüm Kimliği</label>
                                    <input type="text" className="form-input" placeholder="G-XXXXXXXXXX" value={customize.google_analytics_id || ''} onChange={e => setCustomize({ ...customize, google_analytics_id: e.target.value })} />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.71rem' }}>Boş bırakırsanız devre dışı kalır.</small>
                                </div>
                            </div>

                            {/* ── Gelişmiş: Özel CSS & Script ── */}
                            <div style={{ padding: 20, background: 'rgba(99,102,241,0.04)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-light)' }}>
                                    <KeyIcon /> Gelişmiş Ayarlar
                                </h4>
                                <p style={{ fontSize: '0.78rem', color: 'var(--warning)', marginBottom: 14 }}>
                                    ⚠️ Bu alan yanlış kod girişi durumunda sitenin bozulmasına neden olabilir. Dikkatli kullanın.
                                </p>
                                <div className="form-group" style={{ margin: 0, marginBottom: 14 }}>
                                    <label>Özel CSS (Tüm sayfalara uygulanır)</label>
                                    <textarea
                                        className="form-input"
                                        rows={7}
                                        placeholder=".my-class { color: red; }&#10;/* Buraya geçerli CSS yazın */"
                                        value={customize.custom_css}
                                        onChange={e => setCustomize({ ...customize, custom_css: e.target.value })}
                                        style={{ fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical', lineHeight: 1.6 }}
                                    />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label>&lt;head&gt; İçine Özel Script / Meta Etiketleri</label>
                                    <textarea
                                        className="form-input"
                                        rows={4}
                                        placeholder='<meta name="..." content="...">&#10;<script>...</script>'
                                        value={customize.custom_head_scripts || ''}
                                        onChange={e => setCustomize({ ...customize, custom_head_scripts: e.target.value })}
                                        style={{ fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical', lineHeight: 1.6 }}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={customizeSubmitting} style={{ minWidth: 180 }}>
                                {customizeSubmitting ? 'Kaydediliyor...' : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Özelleştirmeyi Kaydet</>}
                            </button>
                        </form>
                    </div>
                )}

                {/* ═══════════════ CONFIRM MODAL (Portal) ═══════════════ */}
                {mounted && confirmModal && createPortal(
                    <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> İşlemi Onayla</h3>
                            <p>{confirmModal.text}</p>
                            <div className="modal-actions">
                                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmModal(null)}>İptal</button>
                                <button className="btn btn-danger btn-sm" onClick={confirmAction}>Onayla</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* ═══════════════ IMAGE PREVIEW MODAL (Portal) ═══════════════ */}
                {mounted && previewImage && createPortal(
                    <div className="modal-overlay" onClick={() => setPreviewImage(null)} style={{ zIndex: 1100 }}>
                        <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'rgba(0,0,0,0.8)', padding: '10px 16px', borderRadius: '8px 8px 0 0' }}>
                                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{previewImage.title}</span>
                                <button className="btn btn-ghost btn-sm" onClick={() => setPreviewImage(null)} style={{ color: '#fff' }}>✕</button>
                            </div>
                            <img src={previewImage.src} alt={previewImage.title} style={{ maxWidth: '90vw', maxHeight: 'calc(90vh - 50px)', objectFit: 'contain', borderRadius: '0 0 8px 8px', display: 'block' }} />
                        </div>
                    </div>,
                    document.body
                )}
            </main>
        </div>
    );

    /* ── Shared series form ── */
    function renderSeriesForm() {
        return (
            <div style={{ marginTop: 12 }}>
                <div className="form-group">
                    <label>Title *</label>
                    <input className="form-input" value={sTitle} onChange={e => setSTitle(e.target.value)} required placeholder="e.g. Shadow Ronin" />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-input" rows={3} value={sDesc} onChange={e => setSDesc(e.target.value)} style={{ resize: 'vertical' }} placeholder="Series synopsis..." />
                </div>
                <div className="form-group">
                    <label><ImageIcon /> Cover Image</label>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <input type="file" className="form-input" accept="image/*" onChange={handleCoverSelect} style={{ padding: 8 }} />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recommended: 300x450px (2:3 ratio)</span>
                        </div>
                        {sCoverPreview && (
                            <div style={{ width: 60, height: 85, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                                <img src={sCoverPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group"><label>Author</label><input className="form-input" value={sAuthor} onChange={e => setSAuthor(e.target.value)} placeholder="Author" /></div>
                    <div className="form-group"><label>Artist</label><input className="form-input" value={sArtist} onChange={e => setSArtist(e.target.value)} placeholder="Artist" /></div>
                </div>
                <div className="form-group">
                    <label>Alternatif İsimler (SEO — virgülle ayırın)</label>
                    <input className="form-input" placeholder="örn. Shadow Ronin, 影の浪人, 그림자 로닌" value={sAltNames} onChange={e => setSAltNames(e.target.value)} />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Arama motorları için serinin diğer adlarını ekleyin.</small>
                </div>
                <div className="form-group">
                    <label>Genres (comma separated)</label>
                    <input className="form-input" placeholder="Action, Fantasy, Drama" value={sGenres} onChange={e => setSGenres(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div className="form-group">
                        <label>Status</label>
                        <select className="form-input" value={sStatus} onChange={e => setSStatus(e.target.value)}>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="hiatus">Hiatus</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Type</label>
                        <select className="form-input" value={sType} onChange={e => setSType(e.target.value)}>
                            <option value="manga">Manga</option>
                            <option value="manhwa">Manhwa</option>
                            <option value="manhua">Manhua</option>
                            <option value="comic">Comic</option>
                            <option value="novel">Novel</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Rating (0-10)</label>
                        <input type="number" className="form-input" min="0" max="10" step="0.1" value={sRating} onChange={e => setSRating(e.target.value)} />
                    </div>
                </div>
            </div>
        );
    }
}
