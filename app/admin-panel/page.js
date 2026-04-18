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

const NAVS = [
    { id: 'announcements', label: 'Announcements', icon: MegaphoneIcon },
    { id: 'overview', label: 'Dashboard', icon: DashIcon },
    { id: 'series', label: 'Series', icon: BookIcon },
    { id: 'scraper', label: 'Scraper', icon: DownloadIcon },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'api-key', label: 'API Key', icon: KeyIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'comments', label: 'Comments', icon: MsgIcon },
    { id: 'requests', label: 'Requests', icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
    { id: 'settings', label: 'Settings', icon: GearIcon },
];

const REQ_STATUSES = [
    { value: 'pending',   label: 'Pending',   color: '#f59e0b' },
    { value: 'reviewing', label: 'Reviewing', color: '#6366f1' },
    { value: 'approved',  label: 'Approved',  color: '#22c55e' },
    { value: 'rejected',  label: 'Rejected',  color: '#ef4444' },
    { value: 'added',     label: 'Added ✓',   color: '#14b8a6' },
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

    // Chapter add
    const [cNum, setCNum] = useState('');
    const [cTitle, setCTitle] = useState('');

    // Upload pages
    const [uploadChapterId, setUploadChapterId] = useState(null);
    const [uFiles, setUFiles] = useState(null);

    // Edit chapter
    const [editingChapterId, setEditingChapterId] = useState(null);
    const [editChapNum, setEditChapNum] = useState('');
    const [editChapTitle, setEditChapTitle] = useState('');
    
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
    const [apiKeyName, setApiKeyName] = useState('');
    const [apiKeyVal, setApiKeyVal] = useState('');

    // Turnstile
    const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
    const [turnstileSecretKey, setTurnstileSecretKey] = useState('');
    const [turnstileLoaded, setTurnstileLoaded] = useState(false);

    // Global Settings (Donations + Maintenance)
    const [settings, setSettings] = useState({ donation_enabled: '0', donation_text: '', paypal_url: '', kofi_url: '', maintenance_mode: '0', maintenance_message: '' });

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== 'admin') { router.push('/login'); return; }
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
                 });
                 setTurnstileSiteKey(sData.settings.turnstile_site_key || '');
                 // We never pre-fill the secret key for security
                 setTurnstileLoaded(true);
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
                if (confirmModal.onDone) confirmModal.onDone();
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
                show('Settings saved successfully!');
            } else {
                show(data.error || 'Failed to save settings', 'error');
            }
        } catch (err) {
            show('Server error', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    // ── Series detail ──
    async function openSeriesDetail(id) {
        try {
            const r = await authFetch(`/api/admin?seriesId=${id}`);
            const d = await r.json();
            setDetailSeries(d.series);
            setDetailChapters(d.chapters || []);
            setSubView('detail');
            setEditMode(false);
            populateForm(d.series);
            // Load scraper data for this series
            loadScraperData(id);
        } catch (e) { show(e.message, 'error'); }
    }

    function populateForm(s) {
        setSTitle(s.title); setSDesc(s.description || ''); setSAuthor(s.author || ''); setSArtist(s.artist || '');
        setSStatus(s.status || 'ongoing'); setSType(s.type || 'manga'); setSGenres(tryParseGenres(s.genres)); setSRating(String(s.rating || 0));
        setSCover(null); setSCoverPreview(s.cover_url || '');
    }

    function resetForm() {
        setSTitle(''); setSDesc(''); setSAuthor(''); setSArtist(''); setSStatus('ongoing'); setSType('manga');
        setSGenres(''); setSRating('0'); setSCover(null); setSCoverPreview('');
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
        if (!bulkFiles || !bulkFiles.length) return show('Select a folder first', 'error');

        // Filter for images only — also check extension because Windows often reports f.type="" for JPGs from folder picker
        const IMAGE_EXTS = /\.(jpe?g|jpg|png|webp|gif|avif|bmp)$/i;
        const imageFiles = Array.from(bulkFiles).filter(f =>
            (f.type && f.type.startsWith('image/')) || IMAGE_EXTS.test(f.name || '')
        );
        if (imageFiles.length === 0) return show('No images found in the selected folder.', 'error');
        if (!window.confirm(`Found ${imageFiles.length} image files. Group into chapters and upload?`)) return;

        setSubmitting(true);
        setBulkStatus('Analyzing files...');

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
            if(folders.length === 0) throw new Error('No valid chapter folders found. Make sure you select a folder containing chapter folders (e.g. Manga/Chapter 1/img.jpg or Chapter 1/img.jpg)');

            // Sort folders naturally
            folders.sort((a,b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));

            let successCount = 0;
            for(let i=0; i<folders.length; i++) {
                const folderName = folders[i];
                const files = chapterGroups[folderName];
                
                const numMatch = folderName.match(/(\d+(\.\d+)?)/);
                const chapNum = numMatch ? parseFloat(numMatch[1]) : (i + 1);

                setBulkStatus(`Uploading Ch ${chapNum} (${i+1}/${folders.length})...`);

                const r1 = await doAction('add-chapter', { seriesId: detailSeries.id, chapterNumber: chapNum, title: folderName });
                const newChapId = r1.chapterId;
                
                if(!newChapId) throw new Error(`Could not create chapter ${chapNum}`);

                // Upload chunks of 1 image at a time to prevent Vercel/NextJS Payload sizes timeouts (especially for large JPGs)
                const chunkSize = 1;
                for (let k = 0; k < files.length; k += chunkSize) {
                    const chunkFiles = files.slice(k, k + chunkSize);
                    const fd = new FormData(); 
                    fd.append('action', 'upload-pages'); 
                    fd.append('chapterId', newChapId);
                    for(const f of chunkFiles) fd.append('pages', f);

                    const r3 = await fetch('/api/admin', { method: 'POST', body: fd, headers: authHeaders() });
                    if(!r3.ok) throw new Error(`Failed to upload images for Chapter ${chapNum} (Chunk ${Math.floor(k/chunkSize) + 1})`);
                }
                
                successCount++;
            }

            show(`Bulk upload complete! ${successCount} chapters added.`);
            setBulkFiles(null);
            setBulkStatus('');
            openSeriesDetail(detailSeries.id); fetchStats();
        } catch(e) {
            show(e.message, 'error');
            setBulkStatus('Error. Check console.');
            setTimeout(() => setBulkStatus(''), 3000);
            openSeriesDetail(detailSeries.id); fetchStats();
        } finally {
            setSubmitting(false);
            if (document.getElementById('bulk-folder-input')) document.getElementById('bulk-folder-input').value = "";
        }
    }

    async function handleAddChapter() {
        if (!cNum) return show('Chapter number is required', 'error');
        setSubmitting(true);
        try {
            await doAction('add-chapter', { seriesId: detailSeries.id, chapterNumber: cNum, title: cTitle || `Chapter ${cNum}` });
            show('Chapter added'); setCNum(''); setCTitle('');
            openSeriesDetail(detailSeries.id); fetchStats();
        } catch (e) { show(e.message, 'error'); }
        finally { setSubmitting(false); }
    }

    async function handleUpdateChapter() {
        if (!editChapNum) return show('Chapter number is required', 'error');
        setSubmitting(true);
        try {
            await doAction('update-chapter', { chapterId: editingChapterId, chapterNumber: editChapNum, title: editChapTitle });
            show('Chapter updated'); setEditingChapterId(null); setEditChapNum(''); setEditChapTitle('');
            openSeriesDetail(detailSeries.id); fetchStats();
        } catch (e) { show(e.message, 'error'); }
        finally { setSubmitting(false); }
    }

    async function handleUploadPages(e) {
        e.preventDefault();
        if (!uploadChapterId || !uFiles?.length) return show('Select files', 'error');
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
                    errors.push(d.error || `Chunk ${Math.floor(k/chunkSize) + 1} failed`);
                } else {
                    totalUploaded += (d.uploaded ? d.uploaded.length : 0);
                }
            }
            if (errors.length > 0) {
                show(`Uploaded ${totalUploaded} pages but had errors: ${errors[0]}`, 'error');
            } else {
                show(`${totalUploaded} pages uploaded successfully`);
            }
            setUFiles(null); setUploadChapterId(null);
            openSeriesDetail(detailSeries.id); fetchStats();
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
    if (!user || user.role !== 'admin') return null;

    const allSeries = stats?.allSeries || [];

    return (
        <div className="admin-layout fade-in">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header"><h2><GearIcon /> Admin</h2></div>
                {NAVS.map(n => (
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
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 20 }}>Dashboard</h2>
                        <div className="stat-grid">
                            {[{ v: stats?.totalSeries || 0, l: 'Series' }, { v: stats?.totalChapters || 0, l: 'Chapters' },
                            { v: stats?.totalPages || 0, l: 'Pages' }, { v: stats?.totalTranslations || 0, l: 'Translations' },
                            { v: stats?.totalUsers || 0, l: 'Users' }, { v: stats?.totalComments || 0, l: 'Comments' }].map(s => (
                                <div key={s.l} className="stat-card"><div className="stat-value">{s.v}</div><div className="stat-label">{s.l}</div></div>
                            ))}
                        </div>
                        {/* Storage Info */}
                        {stats?.storage && (
                            <div className="admin-card" style={{ marginBottom: 16 }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                                    Storage Usage
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                    {[
                                        { label: 'Uploaded Pages', value: stats.storage.uploads.formatted, icon: '🖼️' },
                                        { label: 'Translations', value: stats.storage.translations.formatted, icon: '🌐' },
                                        { label: 'Database', value: stats.storage.database.formatted, icon: '💾' },
                                        { label: 'Total', value: stats.storage.total.formatted, icon: '📦', bold: true },
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
                                <h3><RocketIcon /> Quick Start</h3>
                                <ol style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', paddingLeft: 20, lineHeight: 2.2 }}>
                                    <li>Set Torii API key in <strong>API Key</strong></li>
                                    <li>Go to <strong>Series</strong> → <strong>Create New</strong></li>
                                    <li>Fill info & <strong>Publish</strong> (or save as Draft)</li>
                                    <li>Click on the series → <strong>Add Chapters</strong></li>
                                    <li>Upload pages to each chapter</li>
                                    <li>Users can now read & translate!</li>
                                </ol>
                            </div>
                            <div className="admin-card">
                                <h3><ShieldIcon /> Security</h3>
                                <ul style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', paddingLeft: 20, lineHeight: 2.2, listStyle: 'none' }}>
                                    <li>• API keys: AES-256-GCM encrypted</li>
                                    <li>• Passwords: bcrypt (12 rounds)</li>
                                    <li>• Auth: JWT tokens (7-day expiry)</li>
                                    <li>• Translations: Cached per language</li>
                                    <li>• Status: {stats?.hasApiKey ? <span style={{ color: 'var(--success)' }}>✓ Key Active</span> : <span style={{ color: 'var(--warning)' }}>No Key Set</span>}</li>
                                </ul>
                            </div>
                            <div className="admin-card">
                                <h3><GlobeIcon /> Languages ({stats?.supportedLanguages?.length || 0})</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6, maxHeight: 120, overflowY: 'auto' }}>
                                    {(stats?.supportedLanguages || []).map(l => <span key={l.code} className="genre-tag" style={{ padding: '3px 9px' }}>{l.flag} {l.name}</span>)}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══════════════ ANNOUNCEMENTS ═══════════════ */}
                {tab === 'announcements' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MegaphoneIcon /> Announcements
                            </h2>
                        </div>
                        <div className="admin-card" style={{ marginBottom: 20 }}>
                            <h3>Create New Announcement</h3>
                            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexDirection: 'column' }}>
                                <input type="text" className="form-input" placeholder="Announcement message... (e.g. Join our discord!)" value={annMsg} onChange={(e) => setAnnMsg(e.target.value)} />
                                <input type="url" className="form-input" placeholder="Optional URL Link..." value={annLink} onChange={(e) => setAnnLink(e.target.value)} />
                                <button className="btn btn-primary" onClick={addAnnouncement} style={{ width: 120 }}>Publish</button>
                            </div>
                        </div>
                        <div className="admin-card">
                            <h3>Active & Past Announcements</h3>
                            <table className="admin-table" style={{ marginTop: 15 }}>
                                <thead><tr><th>Message</th><th>Link</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {announcements.map(a => (
                                        <tr key={a.id}>
                                            <td>{a.message}</td>
                                            <td>{a.link_url ? <a href={a.link_url} target="_blank" style={{color: 'var(--accent-light)'}}>Link</a> : '-'}</td>
                                            <td>{a.is_active ? <span style={{color: 'var(--success)'}}>Active</span> : 'Hidden'}</td>
                                            <td>
                                                <button className="btn btn-ghost btn-sm" onClick={() => toggleAnn(a.id, !a.is_active)}>
                                                    {a.is_active ? 'Hide' : 'Show'}
                                                </button>
                                                <button className="btn btn-ghost btn-sm" style={{color: 'var(--danger)'}} onClick={() => deleteAnn(a.id)}>Del</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {announcements.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', color: 'var(--text-muted)'}}>No announcements yet</td></tr>}
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
                                <h3 style={{ margin: 0 }}>Chapters ({detailChapters.length})</h3>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {selectedChapters.length > 0 ? (
                                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmModal({
                                            action: 'delete-selected-chapters', body: { seriesId: detailSeries.id, chapterIds: JSON.stringify(selectedChapters) },
                                            text: `Delete ${selectedChapters.length} selected chapters and their pages? THIS IS IRREVERSIBLE!`,
                                            onDone: () => { setSelectedChapters([]); openSeriesDetail(detailSeries.id); }
                                        })}>
                                            <TrashIcon /> Delete Selected ({selectedChapters.length})
                                        </button>
                                    ) : (
                                        detailChapters.length > 0 && (
                                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmModal({
                                                action: 'delete-all-chapters', body: { seriesId: detailSeries.id },
                                                text: `Delete ALL ${detailChapters.length} chapters and their pages? THIS IS IRREVERSIBLE!`,
                                                onDone: () => openSeriesDetail(detailSeries.id)
                                            })}>
                                                <TrashIcon /> Delete All
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Add chapter inline */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ margin: 0, flex: '0 0 90px' }}>
                                    <label style={{ fontSize: '0.72rem' }}>Chapter #</label>
                                    <input type="number" className="form-input" step="0.1" value={cNum} onChange={e => setCNum(e.target.value)} placeholder="1" />
                                </div>
                                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
                                    <label style={{ fontSize: '0.72rem' }}>Title (optional)</label>
                                    <input className="form-input" value={cTitle} onChange={e => setCTitle(e.target.value)} placeholder="Chapter title" />
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={handleAddChapter} disabled={submitting || !cNum}
                                    style={{ height: 38, whiteSpace: 'nowrap' }}>
                                    <PlusIcon /> Add
                                </button>
                            </div>
                            
                            {/* Bulk Upload Section */}
                            <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 16, border: '1px dashed var(--border)' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <UploadIcon /> Bulk Upload Chapters
                                </h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                                    Select a parent folder containing subfolders for each chapter (e.g. MangaFolder / Chapter 1 / 01.jpg).
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
                                        {submitting ? 'Uploading...' : 'Bulk Upload'}
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
                                                {scraperPending.filter(p => p.status === 'pending').length} chapters pending review
                                            </span>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {scraperSelectedPending.length > 0 && (
                                                    <button className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem' }}
                                                        disabled={scraperPublishing}
                                                        onClick={() => scraperPublishPending(scraperSelectedPending, detailSeries.id)}>
                                                        {scraperPublishing ? 'Publishing...' : `Publish Selected (${scraperSelectedPending.length})`}
                                                    </button>
                                                )}
                                                <button className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem', background: 'var(--success)' }}
                                                    disabled={scraperPublishing}
                                                    onClick={() => scraperPublishAllPending(detailSeries.id)}>
                                                    {scraperPublishing ? 'Publishing...' : 'Publish All'}
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
                                                    <span style={{ color: 'var(--accent-light)', fontWeight: 700, minWidth: 40 }}>Ch.{p.chapter_number}</span>
                                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{p.chapter_title}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {detailChapters.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
                                    No chapters yet. Add your first chapter above.
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
                                                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                                                        <input 
                                                            type="number" 
                                                            step="any" 
                                                            value={editChapNum} 
                                                            onChange={e => setEditChapNum(e.target.value)} 
                                                            className="form-input" 
                                                            style={{ width: 80, padding: '4px 8px' }} 
                                                            placeholder="Num"
                                                        />
                                                        <input 
                                                            type="text" 
                                                            value={editChapTitle} 
                                                            onChange={e => setEditChapTitle(e.target.value)} 
                                                            className="form-input" 
                                                            style={{ flex: 1, padding: '4px 8px' }} 
                                                            placeholder="Chapter Title"
                                                        />
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
                                                <span className="admin-badge user-role">{ch.page_count || 0} pages</span>
                                                {ch.translation_count > 0 && <span className="admin-badge admin-role">{ch.translation_count} lang</span>}

                                                {editingChapterId === ch.id ? (
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button className="btn btn-primary btn-sm" onClick={handleUpdateChapter} disabled={submitting}>
                                                            <CheckIcon /> Save
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingChapterId(null)}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => {
                                                            setEditingChapterId(ch.id);
                                                            setEditChapNum(ch.chapter_number);
                                                            setEditChapTitle(ch.title || '');
                                                        }} title="Edit chapter">
                                                            <EditIcon />
                                                        </button>

                                                        {uploadChapterId === ch.id ? (
                                                            <form onSubmit={handleUploadPages} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                <input type="file" accept="image/*" multiple onChange={e => setUFiles(e.target.files)} style={{ width: 180, fontSize: '0.72rem' }} />
                                                                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                                                    {submitting ? '...' : 'Upload'}
                                                                </button>
                                                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setUploadChapterId(null); setUFiles(null); }}>✕</button>
                                                            </form>
                                                        ) : (
                                                            <button className="btn btn-ghost btn-sm" onClick={() => setUploadChapterId(ch.id)}
                                                                title="Upload pages">
                                                                <UploadIcon />
                                                            </button>
                                                        )}

                                                        <button className="btn btn-ghost btn-sm"
                                                            onClick={() => openChapterPages(ch.id)}
                                                            title="View pages"
                                                            style={viewPagesChapterId === ch.id ? { background: 'var(--accent)', color: '#fff' } : {}}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                                        </button>

                                                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmModal({
                                                            action: 'delete-chapter', body: { chapterId: ch.id },
                                                            text: `Delete Chapter ${ch.chapter_number} "${ch.title}" and all its pages?`,
                                                            onDone: () => openSeriesDetail(detailSeries.id)
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
                                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem', padding: 10 }}>No pages uploaded yet.</p>
                                                ) : (
                                                    <>
                                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10 }}>{viewPages.length} page(s) — click to preview</p>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 }}>
                                                            {viewPages.map(p => (
                                                                <div key={p.id} style={{ position: 'relative', cursor: 'pointer', borderRadius: 6, overflow: 'hidden', aspectRatio: '3/4', background: 'var(--bg-tertiary)' }}
                                                                    onClick={() => setPreviewImage({ src: p.image_path, title: `Ch.${ch.chapter_number} — Page ${p.page_number}` })}>
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

                {/* ═══════════════ API KEY ═══════════════ */}
                {tab === 'api-key' && (
                    <div className="admin-card" style={{ maxWidth: 560 }}>
                        <h3><KeyIcon /> Torii Translate API Key</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 16 }}>
                            Encrypted with AES-256-GCM. Get your key from <a href="https://toriitranslate.com" target="_blank" rel="noopener" style={{ color: 'var(--accent-light)' }}>toriitranslate.com</a>
                            {stats?.hasApiKey && <span style={{ color: 'var(--success)', marginLeft: 6 }}>✓ Active key configured.</span>}
                        </p>
                        <form onSubmit={async (e) => { e.preventDefault(); try { show((await doAction('save-api-key', { keyName: apiKeyName || 'Default', apiKey: apiKeyVal })).message); setApiKeyVal(''); fetchStats(); } catch (e) { show(e.message, 'error'); } }}>
                            <div className="form-group"><label>Key Name</label><input type="text" className="form-input" placeholder="e.g. Production" value={apiKeyName} onChange={e => setApiKeyName(e.target.value)} /></div>
                            <div className="form-group"><label>API Key</label><input type="password" className="form-input" placeholder="Enter Torii API key" value={apiKeyVal} onChange={e => setApiKeyVal(e.target.value)} required /></div>
                            <button type="submit" className="btn btn-primary"><LockIcon /> Save Encrypted</button>
                        </form>
                    </div>
                )}

                {/* ═══════════════ TURNSTILE ═══════════════ */}
                {tab === 'api-key' && (
                    <div className="admin-card" style={{ maxWidth: 560, marginTop: 20 }}>
                        <h3>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Cloudflare Turnstile
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 16 }}>
                            Protects login and registration from bots. Leave blank to disable.{' '}
                            <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" rel="noopener" style={{ color: 'var(--accent-light)' }}>Get keys from Cloudflare</a>
                            {turnstileLoaded && turnstileSiteKey && <span style={{ color: 'var(--success)', marginLeft: 6 }}>✓ Active.</span>}
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
                                show('Turnstile settings saved!');
                                setTurnstileSecretKey('');
                                fetchStats();
                            } catch (e) { show(e.message, 'error'); }
                        }}>
                            <div className="form-group">
                                <label>Site Key (public)</label>
                                <input type="text" className="form-input" placeholder="0x4AAAAAAAxxxxxxxxxxxxxxxx" value={turnstileSiteKey} onChange={e => setTurnstileSiteKey(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Secret Key</label>
                                <input type="password" className="form-input" placeholder="Leave blank to keep current secret" value={turnstileSecretKey} onChange={e => setTurnstileSecretKey(e.target.value)} />
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Secret key is write-only and never shown again.</small>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" className="btn btn-primary">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                    Save Turnstile
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
                                            show('Turnstile disabled.');
                                            fetchStats();
                                        } catch (e) { show(e.message, 'error'); }
                                    }}>
                                        Disable
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* ═══════════════ USERS ═══════════════ */}
                {tab === 'users' && (
                    <>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><UsersIcon /> Users ({stats?.users?.length || 0})</h2>
                        <div className="admin-card" style={{ overflow: 'auto' }}>
                            <table className="admin-table">
                                <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>YP</th><th>Joined</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {(stats?.users || []).map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 600 }}>{u.username}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                                            <td><span className={`admin-badge ${u.role === 'admin' ? 'admin-role' : 'user-role'}`}>{u.role}</span></td>
                                            <td style={{ fontSize: '0.8rem' }}>{u.yomi_points || 0}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fDate(u.created_at)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {u.role !== 'admin' && (
                                                        <button className="btn btn-ghost btn-sm" title="Promote to Admin"
                                                            onClick={() => setConfirmModal({ action: 'change-user-role', body: { userId: u.id, role: 'admin' }, text: `Promote "${u.username}" to Admin?` })}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                                        </button>
                                                    )}
                                                    {u.role === 'admin' && (
                                                        <button className="btn btn-ghost btn-sm" title="Demote to User"
                                                            onClick={() => setConfirmModal({ action: 'change-user-role', body: { userId: u.id, role: 'user' }, text: `Demote "${u.username}" to User?` })}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="8" y1="8" x2="16" y2="16"/></svg>
                                                        </button>
                                                    )}
                                                    <button className="btn btn-ghost btn-sm" title="Reset Yomi Points"
                                                        onClick={() => setConfirmModal({ action: 'reset-user-points', body: { userId: u.id }, text: `Reset all Yomi Points for "${u.username}"?` })}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.83"/></svg>
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" title="Delete all comments"
                                                        onClick={() => setConfirmModal({ action: 'delete-all-user-comments', body: { userId: u.id }, text: `Delete ALL comments by "${u.username}"?` })}>
                                                        <MsgIcon />
                                                    </button>
                                                    {u.role !== 'admin' && (
                                                        <button className="btn btn-danger btn-sm" title="Delete user"
                                                            onClick={() => setConfirmModal({ action: 'delete-user', body: { userId: u.id }, text: `Delete user "${u.username}" permanently?` })}>
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

                {/* ═══════════════ COMMENTS ═══════════════ */}
                {tab === 'comments' && (
                    <>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><MsgIcon /> Comments ({stats?.totalComments || 0})</h2>
                        <div className="admin-card" style={{ overflow: 'auto' }}>
                            <table className="admin-table">
                                <thead><tr><th>User</th><th>Comment</th><th>Series / Chapter</th><th>Date</th><th></th></tr></thead>
                                <tbody>
                                    {(stats?.recentComments || []).map(c => (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{c.username}</td>
                                            <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{c.content}</td>
                                            <td style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--accent-light)' }}>{c.series_title || '—'}</span>{c.chapter_title && c.chapter_title !== 'Series Comment' ? ` / ${c.chapter_title}` : ''}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fDate(c.created_at)}</td>
                                            <td>
                                                <button className="btn btn-danger btn-sm" onClick={() => setConfirmModal({ action: 'delete-comment', body: { commentId: c.id }, text: 'Delete this comment?' })}>
                                                    <TrashIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(stats?.recentComments || []).length === 0 && (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No comments yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
                {/* ═══════════════ SERIES REQUESTS ═══════════════ */}
                {tab === 'requests' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                                Series Requests ({seriesRequests.length})
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
                                {reqLoading ? 'Loading...' : '↻ Refresh'}
                            </button>
                        </div>

                        {/* Filter tabs */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                            {[{ k: 'all', l: 'All' }, ...REQ_STATUSES.map(s => ({ k: s.value, l: s.label }))].map(f => (
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
                                                        {req.author && <span>Author: {req.author}</span>}
                                                        <span>By: <strong>{req.username}</strong></span>
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
                                                        {isEditing ? 'Cancel' : 'Edit'}
                                                    </button>
                                                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.75rem' }}
                                                        onClick={() => setConfirmModal({
                                                            text: `Delete request "${req.series_title}"?`,
                                                            action: async () => {
                                                                await authFetch('/api/series-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: req.id }) });
                                                                setSeriesRequests(prev => prev.filter(r => r.id !== req.id));
                                                                show('Deleted');
                                                            }
                                                        })}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Edit panel */}
                                            {isEditing && (
                                                <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</label>
                                                        <select value={editingReq.status} onChange={e => setEditingReq(r => ({ ...r, status: e.target.value }))}
                                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 8px', fontSize: '0.82rem' }}>
                                                            {REQ_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Admin Note:</label>
                                                        <textarea value={editingReq.admin_note} onChange={e => setEditingReq(r => ({ ...r, admin_note: e.target.value }))}
                                                            placeholder="Optional note for the user..."
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
                                                                show('Request updated');
                                                            }
                                                        }}>
                                                        Save Changes
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {seriesRequests.filter(r => reqFilter === 'all' || r.status === reqFilter).length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '0.9rem' }}>No requests found.</div>
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
                                <DownloadIcon /> Scraper
                            </h2>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={loadAllScraperSources} disabled={allScraperSourcesLoading}>
                                    {allScraperSourcesLoading ? 'Loading...' : <><SyncIcon /> Refresh</>}
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={scraperSyncAll} disabled={scraperSyncLoading}>
                                    {scraperSyncLoading ? 'Syncing...' : <><SyncIcon /> Sync All Sources</>}
                                </button>
                            </div>
                        </div>

                        {/* Create new series from URL */}
                        <div className="admin-card" style={{ marginBottom: 20 }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
                                <LinkIcon /> Import New Series from URL
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                                Paste a series URL from MangaDex, Comick.io, or any manga site. The scraper will fetch series info, cover, and stage all chapters for review.
                            </p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://mangadex.org/title/... or https://comick.io/comic/..."
                                    value={scrapeNewUrl}
                                    onChange={e => { setScrapeNewUrl(e.target.value); setScrapeNewPreview(null); }}
                                    style={{ flex: 1 }}
                                />
                                <select
                                    value={scrapeNewLang}
                                    onChange={e => { setScrapeNewLang(e.target.value); setScrapeNewPreview(null); }}
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
                                    {scrapeNewLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Preview'}
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
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{scrapeNewPreview.chapters_count} chapters</span>
                                            </div>
                                            {scrapeNewPreview.meta?.author && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Author: {scrapeNewPreview.meta.author}</div>}
                                            {scrapeNewPreview.meta?.genres?.length > 0 && (
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                                                    {scrapeNewPreview.meta.genres.slice(0, 6).map(g => <span key={g} className="genre-tag" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>{g}</span>)}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                <button className="btn btn-primary btn-sm" onClick={handleCreateSeriesFromScrape} disabled={scrapeNewLoading}>
                                                    {scrapeNewLoading ? 'Creating...' : `Create Series & Stage ${scrapeNewPreview.chapters_count} Chapters`}
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => { setScrapeNewPreview(null); setScrapeNewUrl(''); }}>Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* All sources */}
                        <div className="admin-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <h3 style={{ margin: 0 }}>Active Sources ({allScraperSources.length})</h3>
                                {allScraperSources.length === 0 && (
                                    <button className="btn btn-ghost btn-sm" onClick={loadAllScraperSources}>Load Sources</button>
                                )}
                            </div>
                            {allScraperSources.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
                                    No sources yet. Open a series and add a URL in the Auto Import section.
                                </p>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Series</th>
                                            <th>Site</th>
                                            <th>Source URL</th>
                                            <th>Last Checked</th>
                                            <th>Last Chapter</th>
                                            <th>Pending</th>
                                            <th>Auto Sync</th>
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
                                                    {src.last_checked ? new Date(src.last_checked).toLocaleString() : 'Never'}
                                                </td>
                                                <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {src.last_chapter_found > 0 ? `Ch. ${src.last_chapter_found}` : '-'}
                                                </td>
                                                <td>
                                                    {src.pending_count > 0 ? (
                                                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 50, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700 }}>
                                                            {src.pending_count} pending
                                                        </span>
                                                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.72rem', color: src.auto_sync ? '#22c55e' : 'var(--text-muted)' }}>
                                                        {src.auto_sync ? '✓ On' : 'Off'}
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
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ImageIcon /> Media Library</h2>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button className="btn btn-primary btn-sm" onClick={async () => {
                                setMediaLoading(true);
                                try {
                                    const res = await authFetch('/api/admin?action=list-media');
                                    const data = await res.json();
                                    setMediaFiles(data.media || []);
                                } catch (err) { console.error(err); }
                                finally { setMediaLoading(false); }
                            }}>
                                {mediaLoading ? 'Loading...' : 'Refresh'}
                            </button>
                            {['all', 'covers', 'pages', 'avatars'].map(f => (
                                <button key={f} className={`btn btn-sm ${mediaFilter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMediaFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
                            ))}
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                {mediaFiles.filter(m => mediaFilter === 'all' || m.category === mediaFilter).length} files
                            </span>
                        </div>
                        {mediaFiles.length === 0 && !mediaLoading ? (
                            <div className="admin-card" style={{ textAlign: 'center', padding: 40 }}>
                                <ImageIcon />
                                <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Click &quot;Refresh&quot; to load media files.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                                {mediaFiles.filter(m => mediaFilter === 'all' || m.category === mediaFilter).map((m, i) => (
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
                                            <button className="btn btn-danger btn-sm" style={{ width: '100%', marginTop: 6, fontSize: '0.7rem', padding: '4px 8px' }} onClick={() => setConfirmModal({ action: 'delete-media', body: { filePath: m.path }, text: `Delete "${m.name}"?` })}>
                                                <TrashIcon /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════════ SETTINGS ═══════════════ */}
                {tab === 'settings' && (
                    <div className="admin-card" style={{ maxWidth: 640 }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><GearIcon /> Site Settings</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
                            Configure global application settings and homepage widgets.
                        </p>
                        
                        <form onSubmit={saveSettings}>
                            {/* ── Maintenance Mode ── */}
                            <div style={{ padding: '16px', background: settings.maintenance_mode === '1' ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: settings.maintenance_mode === '1' ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.05)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1.05rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: settings.maintenance_mode === '1' ? '#fbbf24' : 'var(--text-primary)' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                                    Maintenance Mode
                                    {settings.maintenance_mode === '1' && <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', borderRadius: 50, padding: '2px 10px', marginLeft: 4 }}>ACTIVE</span>}
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                                    When enabled, visitors see a maintenance page. Only admins (logged in) can access the site.
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
                                        Enable Maintenance Mode
                                    </label>
                                </div>
                                <div className="form-group" style={{ marginTop: 14 }}>
                                    <label>Maintenance Message (optional)</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={settings.maintenance_message}
                                        onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                                        placeholder="We're currently performing scheduled maintenance to improve your experience. This won't take long — please check back shortly."
                                        style={{ resize: 'vertical', minHeight: 70 }}
                                    />
                                    <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>Leave empty for default message.</small>
                                </div>
                            </div>

                            {/* ── Donation Banner ── */}
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 }}>
                                <h4 style={{ fontSize: '1.05rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    Donation Banner
                                </h4>
                                
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <input 
                                        type="checkbox" 
                                        id="donEnabled"
                                        checked={settings.donation_enabled === '1'} 
                                        onChange={(e) => setSettings({...settings, donation_enabled: e.target.checked ? '1' : '0'})} 
                                        style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} 
                                    />
                                    <label htmlFor="donEnabled" style={{ marginBottom: 0, fontWeight: 500, cursor: 'pointer' }}>Show Donation Banner on Homepage</label>
                                </div>

                                <div className="form-group">
                                    <label>Encouraging Message / Title</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={settings.donation_text} 
                                        onChange={(e) => setSettings({...settings, donation_text: e.target.value})} 
                                        placeholder="e.g. Support us to keep the servers alive!"
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

                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Settings'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ═══════════════ CONFIRM MODAL (Portal) ═══════════════ */}
                {mounted && confirmModal && createPortal(
                    <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> Confirm</h3>
                            <p>{confirmModal.text}</p>
                            <div className="modal-actions">
                                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmModal(null)}>Cancel</button>
                                <button className="btn btn-danger btn-sm" onClick={confirmAction}>Confirm</button>
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
