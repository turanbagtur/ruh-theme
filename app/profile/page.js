'use client';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SeriesCard from '@/components/SeriesCard';
import { getCultivationData } from '@/lib/gamification';

// Quest icon mapper
function QuestIcon({ icon, size = 18 }) {
    if (icon === 'sun') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
    );
    if (icon === 'book') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
    );
    if (icon === 'chat') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
    );
    // fallback check icon
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    );
}

function CheckCircleIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
    );
}

export default function ProfilePage() {
    const { user, loading, logout, authFetch, updateUser, refreshUser } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState('overview');
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('success');

    // Profile form
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [saving, setSaving] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Favorites
    const [favorites, setFavorites] = useState([]);
    const [loadingFavs, setLoadingFavs] = useState(true);

    // Stats
    const [userStats, setUserStats] = useState({ favoriteCount: 0, commentCount: 0 });
    const [detailedStats, setDetailedStats] = useState(null);

    // Quests
    const [quests, setQuests] = useState([]);
    const [questLoading, setQuestLoading] = useState(false);
    const [claimingQuest, setClaimingQuest] = useState(null);

    // Reading List
    const [readingList, setReadingList] = useState([]);
    const [readingListStatus, setReadingListStatus] = useState('reading');
    const [loadingReadingList, setLoadingReadingList] = useState(false);

    // Badges
    const [badges, setBadges] = useState([]);
    const [loadingBadges, setLoadingBadges] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
            setAvatarUrl(user.avatar_url || '');
            fetchFavorites();
            fetchQuests();
            fetchDetailedStats();
            fetchReadingList();
            fetchBadges();
        }
    }, [user]);

    async function fetchFavorites() {
        try {
            const res = await authFetch('/api/favorites/list');
            const data = await res.json();
            const favs = data.favorites || [];
            setFavorites(favs);
            setUserStats(prev => ({ ...prev, favoriteCount: favs.length }));
        } catch { }
        finally { setLoadingFavs(false); }
    }

    async function fetchQuests() {
        try {
            const res = await authFetch('/api/users/quests');
            const data = await res.json();
            setQuests(data.quests || []);
        } catch {}
    }

    async function fetchDetailedStats() {
        try {
            const res = await authFetch('/api/users/stats');
            if (!res) return;
            const data = await res.json();
            if (!data.error) setDetailedStats(data);
        } catch {}
    }

    async function fetchReadingList() {
        setLoadingReadingList(true);
        try {
            const res = await authFetch('/api/reading-list');
            if (!res) return;
            const data = await res.json();
            setReadingList(data.list || []);
        } catch {}
        finally { setLoadingReadingList(false); }
    }

    async function fetchBadges() {
        setLoadingBadges(true);
        try {
            const res = await authFetch('/api/users/badges');
            if (!res) return;
            const data = await res.json();
            setBadges(data.badges || []);
        } catch {}
        finally { setLoadingBadges(false); }
    }

    async function removeFromReadingList(seriesId) {
        try {
            await authFetch(`/api/reading-list?seriesId=${seriesId}`, { method: 'DELETE' });
            setReadingList(prev => prev.filter(item => item.series_id !== seriesId));
        } catch {}
    }

    async function claimQuest(questId) {
        setClaimingQuest(questId);
        try {
            const res = await authFetch('/api/users/quests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questId })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                show(`🎉 ${data.message}`, 'success');
                await fetchQuests();
                if (refreshUser) await refreshUser();
            } else {
                show(data.error || 'Failed', 'error');
            }
        } catch (err) { show(err.message, 'error'); }
        finally { setClaimingQuest(null); }
    }

    function show(text, type = 'success') {
        setMsg(text); setMsgType(type);
        setTimeout(() => setMsg(''), 4000);
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await authFetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, avatar_url: avatarUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            updateUser(data.user);
            show(data.message);
        } catch (err) { show(err.message, 'error'); }
        finally { setSaving(false); }
    }

    async function handlePasswordChange(e) {
        e.preventDefault();
        if (newPassword !== confirmPassword) return show('Passwords do not match', 'error');
        if (newPassword.length < 6) return show('Password must be at least 6 characters', 'error');
        setSaving(true);
        try {
            const res = await authFetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            show('Password changed successfully');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) { show(err.message, 'error'); }
        finally { setSaving(false); }
    }

    function getMemberDays() {
        if (!user?.created_at) return 0;
        return Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000);
    }

    function canUpdateAvatar() {
        if (!user?.last_avatar_update) return { canUpdate: true, remainingHours: 0 };
        const msInDay = 24 * 60 * 60 * 1000;
        const lastUpdate = new Date(user.last_avatar_update + 'Z').getTime();
        const diff = Date.now() - lastUpdate;
        if (diff > msInDay) return { canUpdate: true, remainingHours: 0 };
        return { canUpdate: false, remainingHours: Math.ceil((msInDay - diff) / (1000 * 60 * 60)) };
    }

    if (loading || !user) return <div className="page-loading"><div className="spinner" /></div>;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
        { id: 'favorites', label: 'Library', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> },
        { id: 'reading-list', label: 'Reading List', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
        { id: 'stats', label: 'Stats', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
        { id: 'badges', label: 'Badges', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg> },
        { id: 'settings', label: 'Settings', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
        { id: 'security', label: 'Security', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> },
    ];

    const cultivation = getCultivationData(user.yomi_points);
    const avatarStatus = canUpdateAvatar();

    return (
        <div className="page-container page-section fade-in">
            {/* Gamified RPG Profile Header */}
            <div className="profile-header rpg-profile-header" style={{
                background: 'linear-gradient(180deg, rgba(15,15,17,0.8), var(--bg-card))',
                border: `1px solid ${cultivation.color}`,
                boxShadow: `0 8px 32px ${cultivation.color}40`
            }}>
                <div className="rpg-profile-img-wrap">
                    {(!user.avatar_url || user.avatar_url === '/default-avatar.png') ? (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `4px solid ${cultivation.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '3rem', fontWeight: 800 }}>
                            {user.username?.[0]?.toUpperCase()}
                        </div>
                    ) : (
                        <img 
                            src={user.avatar_url} 
                            alt="Avatar" 
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: `4px solid ${cultivation.color}` }} 
                        />
                    )}
                </div>
                
                <div style={{ flex: 1, zIndex: 1, width: '100%' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{user.username}</h1>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }} className="rpg-title-badges">
                        <span style={{ 
                            background: `${cultivation.color}20`, 
                            color: cultivation.color, 
                            padding: '6px 14px', 
                            borderRadius: '20px', 
                            fontWeight: 800,
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            fontSize: '0.9rem',
                            border: `1px solid ${cultivation.color}50`
                        }}>
                            {cultivation.title}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{getMemberDays()} Days Active</span>
                    </div>

                    <div style={{ width: '100%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                            <span style={{ color: 'var(--text-primary)' }}>{user.yomi_points || 0} Yomi Point</span>
                            <span style={{ color: 'var(--text-muted)' }}>
                                {cultivation.nextRank ? `Next Rank: ${cultivation.nextRank.title} (${cultivation.nextRank.minPoints} YP)` : 'Max Rank Reached'}
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${cultivation.progressPercent}%`, 
                                height: '100%', 
                                background: cultivation.progressColor,
                                borderRadius: '4px',
                                transition: 'width 1s ease-out'
                            }} />
                        </div>
                    </div>
                </div>
                
                {/* Decorative background element based on rank */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '300px',
                    height: '300px',
                    background: `radial-gradient(circle, ${cultivation.color}20 0%, transparent 70%)`,
                    filter: 'blur(40px)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />
            </div>

            {/* Quick Stats */}
            <div className="profile-stats-row" style={{ marginTop: '24px' }}>
                <div className="profile-stat-card">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    <span className="profile-stat-number">{favorites.length}</span>
                    <span className="profile-stat-label">Favorites</span>
                </div>
                <div className="profile-stat-card">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    <span className="profile-stat-number">{user.yomi_points || 0}</span>
                    <span className="profile-stat-label">Total Yomi Points</span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="profile-tabs">
                {tabs.map(t => (
                    <button key={t.id} className={`profile-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {msg && <div className={`alert ${msgType === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>{msg}</div>}

            {/* Overview */}
            {tab === 'overview' && (
                <div className="admin-grid">
                    <div className="admin-card" style={{ cursor: 'pointer' }} onClick={() => setTab('favorites')}>
                        <h3>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                            My Library ({favorites.length})
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            {favorites.length > 0 ? `${favorites.length} series in your library` : 'Start reading and build your library!'}
                        </p>
                        {favorites.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                                {favorites.slice(0, 4).map(f => (
                                    <div key={f.id} style={{ width: 36, height: 48, borderRadius: 4, overflow: 'hidden' }}>
                                        <img src={f.cover_url || '/demo/cover1.jpg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                                {favorites.length > 4 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>+{favorites.length - 4}</span>}
                            </div>
                        )}
                    </div>

                    {/* Daily Quests Card */}
                    <div className="admin-card">
                        <h3>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            Daily Quests
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 4, marginBottom: 16 }}>
                            Complete quests to earn Yomi Points!
                        </p>
                        <div className="quest-board">
                            {quests.map(q => (
                                <div key={q.id} className={`quest-card ${q.claimed ? 'completed' : ''}`}>
                                    <div className="quest-icon" style={{ background: q.claimed ? '#22c55e20' : 'var(--bg-tertiary)', color: q.claimed ? '#22c55e' : 'var(--text-muted)' }}>
                                        {q.claimed ? <CheckCircleIcon /> : <QuestIcon icon={q.icon} />}
                                    </div>
                                    <div className="quest-info">
                                        <div className="quest-title">{q.title}</div>
                                        <div className="quest-desc">{q.desc}</div>
                                        <div className="quest-progress">
                                            <div className="quest-progress-fill" style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%`, background: q.claimed ? '#22c55e' : undefined }} />
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{q.progress}/{q.target}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <span className="quest-reward">+{q.reward} YP</span>
                                        {q.completed && !q.claimed ? (
                                            <button className="btn btn-primary btn-sm" onClick={() => claimQuest(q.id)} disabled={claimingQuest === q.id} style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                                                {claimingQuest === q.id ? '...' : 'Claim'}
                                            </button>
                                        ) : q.claimed ? (
                                            <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>Claimed</span>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                            {quests.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Loading quests...</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Library/Favorites */}
            {tab === 'favorites' && (
                <div>
                    {loadingFavs ? (
                        <div className="series-grid">{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '3/5' }} />)}</div>
                    ) : favorites.length === 0 ? (
                        <div className="admin-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: 12 }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Your library is empty</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 16 }}>Add series to your library by clicking the heart icon on any manga page.</p>
                            <Link href="/series" className="btn btn-primary btn-sm">Browse Manga</Link>
                        </div>
                    ) : (
                        <div className="series-grid">
                            {favorites.map(s => <SeriesCard key={s.id} series={s} />)}
                        </div>
                    )}
                </div>
            )}

            {/* Reading List */}
            {tab === 'reading-list' && (
                <div>
                    <div className="reading-list-tabs">
                        {[
                            { value: 'reading', label: '📖 Reading' },
                            { value: 'completed', label: '✅ Completed' },
                            { value: 'plan', label: '📌 Plan to Read' },
                            { value: 'dropped', label: '🚫 Dropped' },
                        ].map(opt => (
                            <button key={opt.value} className={`reading-list-tab ${readingListStatus === opt.value ? 'active' : ''}`}
                                onClick={() => setReadingListStatus(opt.value)}>
                                {opt.label} ({readingList.filter(i => i.status === opt.value).length})
                            </button>
                        ))}
                    </div>
                    {loadingReadingList ? (
                        <div className="series-grid">{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '3/5' }} />)}</div>
                    ) : (() => {
                        const filtered = readingList.filter(i => i.status === readingListStatus);
                        if (filtered.length === 0) return (
                            <div className="admin-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No series in this category</p>
                                <Link href="/series" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Browse Manga</Link>
                            </div>
                        );
                        return (
                            <div className="series-grid">
                                {filtered.map(item => (
                                    <div key={item.id} style={{ position: 'relative' }}>
                                        <Link href={`/series/${item.slug || item.series_id}`}>
                                            <div style={{ background: 'var(--bg-card)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                <img src={item.cover_image || '/demo/cover1.jpg'} alt={item.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
                                                <div style={{ padding: '10px 12px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                                                    {item.last_read_chapter && (
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last read: Ch. {item.last_read_chapter}</div>
                                                    )}
                                                    {item.latest_chapter && (
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Latest: Ch. {item.latest_chapter}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                        <button onClick={() => removeFromReadingList(item.series_id)}
                                            style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                                            title="Remove from list">✕</button>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Stats */}
            {tab === 'stats' && (
                <div>
                    {detailedStats ? (
                        <>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-card-value">{detailedStats.totalChapters}</div>
                                    <div className="stat-card-label">Chapters Read</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-value">{detailedStats.thisWeek}</div>
                                    <div className="stat-card-label">This Week</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-value">{detailedStats.thisMonth}</div>
                                    <div className="stat-card-label">This Month</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-value">{detailedStats.totalComments}</div>
                                    <div className="stat-card-label">Comments</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-value">{detailedStats.listStats.completed}</div>
                                    <div className="stat-card-label">Completed</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card-value">{detailedStats.listStats.reading}</div>
                                    <div className="stat-card-label">Reading</div>
                                </div>
                            </div>
                            {detailedStats.topGenre && (
                                <div style={{ marginBottom: 24, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Favourite Genre: <strong style={{ color: 'var(--accent-light)' }}>{detailedStats.topGenre}</strong>
                                </div>
                            )}
                            {detailedStats.dailyActivity.length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Last 30 Days Activity</div>
                                    <div className="activity-chart">
                                        {detailedStats.dailyActivity.map(d => {
                                            const max = Math.max(...detailedStats.dailyActivity.map(x => x.count), 1);
                                            return <div key={d.date} className="activity-bar" style={{ height: `${(d.count / max) * 100}%` }} title={`${d.date}: ${d.count} chapters`} />;
                                        })}
                                    </div>
                                </div>
                            )}
                            {detailedStats.recentReads.length > 0 && (
                                <div>
                                    <h4 style={{ marginBottom: 12 }}>Recent Activity</h4>
                                    {detailedStats.recentReads.map(r => (
                                        <Link key={r.id} href={`/read/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                                            <img src={r.cover_image || '/demo/cover1.jpg'} alt={r.series_title} style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.series_title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chapter {r.chapter_number}</div>
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
                    )}
                </div>
            )}

            {/* Badges */}
            {tab === 'badges' && (
                <div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.88rem' }}>
                        Earn badges by reading chapters, making comments, and completing series.
                    </p>
                    {loadingBadges ? (
                        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
                    ) : (
                        <div className="badges-grid">
                            {badges.map(b => {
                                const iconMap = { book: '📚', chat: '💬', heart: '❤️', sun: '☀️', star: '⭐', crown: '👑', check: '✅' };
                                return (
                                    <div key={b.id} className={`badge-card ${b.earned ? 'earned' : 'locked'}`} title={b.description}>
                                        {b.is_new && <div className="badge-new-dot" />}
                                        <div className="badge-card-icon" style={{ filter: b.earned ? 'none' : 'grayscale(1)', opacity: b.earned ? 1 : 0.4 }}>
                                            {iconMap[b.icon] || '🏅'}
                                        </div>
                                        <div className="badge-card-name" style={{ color: b.earned ? b.color : 'var(--text-muted)' }}>{b.name}</div>
                                        <div className="badge-card-desc">{b.description}</div>
                                        {b.earned && b.earned_at && (
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                {new Date(b.earned_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Settings */}
            {tab === 'settings' && (
                <div className="admin-card" style={{ maxWidth: 600 }}>
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        Edit Profile
                    </h3>
                    <form onSubmit={handleProfileUpdate} style={{ marginTop: 24 }}>
                        <div className="form-group">
                            <label>Username</label>
                            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required minLength={3} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        
                        {/* Avatar Upload UI */}
                        <div className="form-group" style={{ 
                            background: 'rgba(0,0,0,0.2)', 
                            padding: '16px', 
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            marginTop: '24px' 
                        }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Profile Picture</span>
                                {!avatarStatus.canUpdate && (
                                    <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        Cooldown: {avatarStatus.remainingHours}h remaining
                                    </span>
                                )}
                            </label>
                            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
                                To prevent abuse, profile pictures can only be changed once every 24 hours. Max 2MB.
                            </small>

                            {/* Avatar Preview */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                                <div style={{ 
                                    width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', 
                                    border: '2px solid var(--border-color)', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'var(--bg-tertiary)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)'
                                }}>
                                    {(user.avatar_url && user.avatar_url !== '/default-avatar.png') ? (
                                        <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        user.username?.[0]?.toUpperCase() || '?'
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>{user.username}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {user.avatar_url && user.avatar_url !== '/default-avatar.png' ? 'Custom avatar set' : 'Using default avatar'}
                                    </div>
                                </div>
                            </div>

                            {/* File Upload */}
                            {avatarStatus.canUpdate && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                                        <label style={{ 
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            background: 'var(--bg-glass)', border: '1px dashed var(--border-color)', 
                                            borderRadius: '8px', padding: '14px', cursor: 'pointer',
                                            fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)',
                                            transition: 'all 0.2s', marginBottom: 0
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-light)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                            Upload from device
                                            <input 
                                                type="file" 
                                                accept="image/jpeg,image/png,image/webp,image/gif" 
                                                style={{ display: 'none' }}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    if (file.size > 2 * 1024 * 1024) {
                                                        show('File too large. Maximum 2MB.', 'error');
                                                        return;
                                                    }
                                                    setSaving(true);
                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('avatar', file);
                                                        const res = await authFetch('/api/auth/profile/avatar', {
                                                            method: 'POST',
                                                            body: formData,
                                                        });
                                                        const data = await res.json();
                                                        if (!res.ok) throw new Error(data.error);
                                                        updateUser(data.user);
                                                        show('Avatar updated successfully!');
                                                        if (refreshUser) await refreshUser();
                                                    } catch (err) { show(err.message, 'error'); }
                                                    finally { setSaving(false); e.target.value = ''; }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    
                                    {/* URL Input */}
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>or</span>
                                        <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                                    </div>
                                    <input 
                                        type="url" 
                                        className="form-input" 
                                        placeholder="Paste image URL (https://...)"
                                        value={avatarUrl} 
                                        onChange={e => setAvatarUrl(e.target.value)} 
                                    />
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            )}

            {/* Security */}
            {tab === 'security' && (
                <div className="admin-card" style={{ maxWidth: 500 }}>
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        Change Password
                    </h3>
                    <form onSubmit={handlePasswordChange} style={{ marginTop: 16 }}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                        </div>
                        <button type="submit" className="btn btn-danger" disabled={saving}>
                            {saving ? 'Processing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
