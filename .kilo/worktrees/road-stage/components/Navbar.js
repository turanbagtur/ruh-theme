'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function Navbar({ siteSettings = {} }) {
    const { user, logout, loading, authFetch } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [liveResults, setLiveResults] = useState([]);
    const [liveLoading, setLiveLoading] = useState(false);
    const [hidden, setHidden] = useState(false);
    const debounceRef = useRef(null);
    const lastScrollY = useRef(0);

    // Notification state
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notifRef = useRef(null);
    const userMenuRef = useRef(null);

    // Custom roles for admin panel visibility check
    const [customRoles, setCustomRoles] = useState([]);

    // Fetch custom roles (only when user is logged in)
    useEffect(() => {
        if (!user) return;
        async function fetchCustomRoles() {
            try {
                const res = await authFetch('/api/admin/users?action=list-custom-roles');
                const data = await res.json();
                if (data.roles) setCustomRoles(data.roles);
            } catch {}
        }
        fetchCustomRoles();
    }, [user, authFetch]);

    // Fetch notifications
    useEffect(() => {
        if (!user) return;
        async function fetchNotifs() {
            try {
                const res = await authFetch('/api/notifications');
                const data = await res.json();
                if (data.notifications) {
                    setNotifications(data.notifications);
                    setUnreadCount(data.notifications.filter(n => !n.is_read).length);
                }
            } catch {}
        }
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 60000);
        return () => clearInterval(interval);
    }, [user, authFetch]);

    // Okuma geçmişi artık ayrı /gecmis sayfasında gösteriliyor

    useEffect(() => {
        function handleScroll() {
            if (window.scrollY > lastScrollY.current && window.scrollY > 100) {
                // Scrolling down past 100px
                setHidden(true);
            } else if (window.scrollY < lastScrollY.current || window.scrollY <= 100) {
                // Scrolling up or at the top
                setHidden(false);
            }
            lastScrollY.current = window.scrollY;
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Close mobile menu on logout; never force-close user dropdown on refreshUser()
    useEffect(() => {
        setMobileMenuOpen(false);
        if (!user) setUserMenuOpen(false);
    }, [user]);

    async function markAllRead() {
        try {
            await authFetch('/api/notifications', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        } catch {}
    }

    async function markAsRead(e, id) {
        e.preventDefault();
        e.stopPropagation();
        try {
            await authFetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {}
    }

    async function deleteNotification(e, id) {
        e.preventDefault();
        e.stopPropagation();
        try {
            await authFetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => {
                const isUnread = notifications.find(n => n.id === id)?.is_read === 0;
                return isUnread ? Math.max(0, prev - 1) : prev;
            });
        } catch {}
    }

    async function deleteAllNotifications() {
        if (!confirm('Tüm bildirimleri silmek istediğinize emin misiniz?')) return;
        try {
            await authFetch(`/api/notifications`, { method: 'DELETE' });
            setNotifications([]);
            setUnreadCount(0);
        } catch {}
    }

    // Live search with debounce
    function handleSearchChange(e) {
        const val = e.target.value;
        setSearchQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!val.trim()) { setLiveResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setLiveLoading(true);
            try {
                const res = await fetch(`/api/series?search=${encodeURIComponent(val.trim())}&limit=5`);
                const data = await res.json();
                setLiveResults(data.series || []);
            } catch { setLiveResults([]); }
            finally { setLiveLoading(false); }
        }, 300);
    }

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/seri?search=${encodeURIComponent(searchQuery.trim())}`;
            setSearchOpen(false);
            setLiveResults([]);
        }
    };

    function timeAgo(d) {
        if (!d) return '';
        const utcStr = typeof d === 'string' && !d.endsWith('Z') ? d + 'Z' : d;
        const m = Math.floor((Date.now() - new Date(utcStr).getTime()) / 60000);
        if (m < 60) return `${Math.max(1, m)} dk önce`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h} sa önce`;
        return `${Math.floor(h / 24)} gün önce`;
    }

    function parseGenres(g) {
        try { return Array.isArray(g) ? g : JSON.parse(g || '[]'); } catch { return []; }
    }

    function closeMobileMenu() {
        setMobileMenuOpen(false);
    }

    return (
        <>
            <nav className={`navbar ${hidden ? 'hidden' : ''}`}>
                <div className="navbar-inner">
                    <Link href="/" className="navbar-logo">
                        {siteSettings.logo_url ? (
                            <img
                                src={`${siteSettings.logo_url}${siteSettings.logo_url.includes('?') ? '&' : '?'}v=${Date.now()}`}
                                alt={siteSettings.site_name || 'Logo'}
                                style={{ height: 44, maxWidth: 220, width: 'auto', objectFit: 'contain', display: 'block' }}
                            />
                        ) : (
                            <>
                                <span className="logo-icon">読</span>
                                <span className="logo-text">{siteSettings.site_name ? siteSettings.site_name.split(' ')[0] : 'Yomi'}</span>
                                {siteSettings.site_name && siteSettings.site_name.includes(' ') ? (
                                    <span className="logo-sub">{siteSettings.site_name.split(' ').slice(1).join(' ').toUpperCase()}</span>
                                ) : !siteSettings.site_name ? (
                                    <span className="logo-sub">TRANSLATE</span>
                                ) : null}
                            </>
                        )}
                    </Link>

                    <div className="navbar-links">
                        {(siteSettings.navbar_menu || [
                            { label: 'Ana Sayfa', url: '/' },
                            { label: 'Göz At', url: '/series' },
                            { label: 'Sıralama', url: '/ranking' },
                            { label: 'İstekler', url: '/requests' },
                        ]).map((item, i) => (
                            <Link key={i} href={item.url || '#'} className="nav-link">{item.label}</Link>
                        ))}
                    </div>

                    <div className="navbar-actions">
                        <button className="nav-icon-btn" onClick={() => { setSearchOpen(!searchOpen); setLiveResults([]); }} aria-label="Search">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        </button>

                        {/* Notification Bell – only when logged in */}
                        {!loading && user && (
                            <div className="notif-bell-wrapper" ref={notifRef}>
                                <button className="nav-icon-btn" onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markAllRead(); }} aria-label="Notifications">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                    {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                                </button>
                                {notifOpen && (
                                    <div className="notif-dropdown">
                                        <div className="notif-dropdown-header">
                                            <span>Bildirimler</span>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {unreadCount > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Tümünü okundu işaretle</button>}
                                                {notifications.length > 0 && <button onClick={deleteAllNotifications} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Tümünü Sil</button>}
                                            </div>
                                        </div>
                                        {notifications.length === 0 ? (
                                            <div className="notif-empty">Henüz bildiriminiz yok</div>
                                        ) : (
                                            notifications.slice(0, 15).map(n => (
                                                <div key={n.id} style={{ position: 'relative', display: 'flex' }} className={`notif-item-wrap ${!n.is_read ? 'unread' : ''}`}>
                                                    <a href={n.link || '#'} className={`notif-item`} onClick={() => setNotifOpen(false)} style={{ flex: 1 }}>
                                                        <div className="notif-icon">
                                                            {n.type === 'reply' ? (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                            ) : n.type === 'new_chapter' ? (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="12" y1="6" x2="12" y2="12" /><line x1="9" y1="9" x2="15" y2="9" /></svg>
                                                            ) : n.type === 'comment_reported' ? (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                            ) : n.type === 'comment_report_resolved' ? (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><polyline points="20 6 9 17 4 12" /></svg>
                                                            ) : n.type === 'comment_report_rejected' ? (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="15" y1="12" x2="9" y2="12" /></svg>
                                                            ) : n.type.startsWith('bug_report') ? (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                                            ) : (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                                            )}
                                                        </div>
                                                        <div className="notif-text">
                                                            <span>{n.message}</span>
                                                            <span className="notif-time">{timeAgo(n.created_at)}</span>
                                                        </div>
                                                    </a>
                                                    <div className="notif-actions" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4, background: 'var(--surface-color)', paddingLeft: 4, opacity: 0, transition: 'opacity 0.2s' }}>
                                                        {!n.is_read && (
                                                            <button onClick={(e) => markAsRead(e, n.id)} title="Okundu İşaretle" style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: 4 }}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => deleteNotification(e, n.id)} title="Sil" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {!loading && (
                            user ? (
                                /* Logged-in: show avatar (with photo if set) — no hamburger */
                                <div className="user-menu" ref={userMenuRef}>
                                    <button className="user-avatar-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-label="User menu">
                                        {user.avatar_url && user.avatar_url !== '/default-avatar.png' ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.username}
                                                className="avatar-img-sm"
                                            />
                                        ) : (
                                            <div className="avatar-circle">{user.username[0].toUpperCase()}</div>
                                        )}
                                    </button>
                                    {userMenuOpen && (
                                        <div className="dropdown-menu" onClick={() => setUserMenuOpen(false)}>
                                            <div className="dropdown-header">
                                                <div className="dropdown-avatar-preview">
                                                    {user.avatar_url && user.avatar_url !== '/default-avatar.png' ? (
                                                        <img src={user.avatar_url} alt={user.username} />
                                                    ) : (
                                                        user.username[0].toUpperCase()
                                                    )}
                                                </div>
                                                <div className="dropdown-header-text">
                                                    <strong>{user.username}</strong>
                                                    <span>{user.email}</span>
                                                </div>
                                            </div>
                                            {/* Mobile-only nav links */}
                                            <Link href="/" className="dropdown-item mobile-only-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                                Ana Sayfa
                                            </Link>
                                            <Link href="/seri" className="dropdown-item mobile-only-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                                Göz At
                                            </Link>
                                            <Link href="/ranking" className="dropdown-item mobile-only-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                                Sıralama
                                            </Link>
                                            <Link href="/requests" className="dropdown-item mobile-only-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                                                İstekler
                                            </Link>
                                            <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                                            <Link href="/profile" className="dropdown-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                Profil
                                            </Link>
                                            <Link href="/ranking" className="dropdown-item desktop-only-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                                Sıralama
                                            </Link>
                                            {(function() {
                                                const builtinRoles = ['admin', 'manager', 'moderator', 'team_member'];
                                                const customRoleNames = customRoles.map(r => r.name);
                                                return [...builtinRoles, ...customRoleNames].includes(user.role);
                                            })() && (
                                                <Link href="/admin-panel" className="dropdown-item">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    Yönetim Paneli
                                                </Link>
                                            )}

                                            <Link href="/gecmis" className="dropdown-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                                Okuma Geçmişi
                                            </Link>
                                            <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                                            <button onClick={logout} className="dropdown-item danger">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                                Çıkış Yap
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Not logged-in: show auth buttons on desktop + hamburger on mobile */
                                <>
                                    <div className="auth-buttons">
                                        <Link href="/login" className="btn btn-ghost">Giriş Yap</Link>
                                        <Link href="/register" className="btn btn-primary">Kayıt Ol</Link>
                                    </div>
                                    <button
                                        className="nav-icon-btn mobile-menu-btn"
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                        aria-label="Menu"
                                        aria-expanded={mobileMenuOpen}
                                    >
                                        {mobileMenuOpen ? (
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                        ) : (
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                                        )}
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </div>

                {searchOpen && (
                    <div className="search-overlay">
                        <div className="search-bar-container">
                            <form onSubmit={handleSearch} className="search-bar-expanded">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                <input
                                    type="text"
                                    placeholder="Manga serisi ara..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    autoFocus
                                />
                                <button type="button" onClick={() => { setSearchOpen(false); setLiveResults([]); }} className="search-close">✕</button>
                            </form>
                            {liveResults.length > 0 && (
                                <div className="live-search-dropdown">
                                    {liveResults.map(s => (
                                        <Link key={s.id} href={`/seri/${s.slug || s.id}`} className="live-search-item" onClick={() => { setSearchOpen(false); setLiveResults([]); }}>
                                            <img src={s.cover_url || '/demo/cover1.jpg'} alt="" />
                                            <div className="ls-info">
                                                <span className="ls-title">{s.title}</span>
                                                <span className="ls-meta">{parseGenres(s.genres).slice(0, 2).join(', ')} · {s.chapterCount || 0} bölüm</span>
                                            </div>
                                        </Link>
                                    ))}
                                    <Link href={`/seri?search=${encodeURIComponent(searchQuery)}`} className="live-search-item" style={{ justifyContent: 'center', fontWeight: 600, color: 'var(--primary)' }} onClick={() => { setSearchOpen(false); setLiveResults([]); }}>
                                        Tüm sonuçları görüntüle →
                                    </Link>
                                </div>
                            )}
                            {liveLoading && searchQuery.trim() && (
                                <div className="live-search-dropdown" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Aranıyor...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Mobile nav panel – only for non-logged-in users */}
            {mobileMenuOpen && !user && !loading && (
                <>
                    <div className="mobile-nav-overlay" onClick={closeMobileMenu} />
                    <div className="mobile-nav-panel">
                        <Link href="/" className="mobile-nav-item" onClick={closeMobileMenu}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                            Ana Sayfa
                        </Link>
                        <Link href="/seri" className="mobile-nav-item" onClick={closeMobileMenu}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            Göz At
                        </Link>
                        <Link href="/ranking" className="mobile-nav-item" onClick={closeMobileMenu}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                            Sıralama
                        </Link>
                        <Link href="/requests" className="mobile-nav-item" onClick={closeMobileMenu}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                            İstekler
                        </Link>
                        <div className="mobile-nav-divider" />
                        <Link href="/login" className="mobile-nav-item" onClick={closeMobileMenu}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                            Giriş Yap
                        </Link>
                        <Link href="/register" className="mobile-nav-item mobile-nav-signup" onClick={closeMobileMenu}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                            Kayıt Ol
                        </Link>
                    </div>
                </>
            )}
        </>
    );
}
