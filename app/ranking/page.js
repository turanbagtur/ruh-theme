'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { getCultivationData } from '@/lib/gamification';

// SVG Icons
const GiftIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
        <line x1="12" y1="22" x2="12" y2="7"/>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

const MapPinIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
);

const TrophyIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
);

const ZapIcon = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
);

// Crown for 1st place
const CrownIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M2 19h20l-2-10-5 5-3-8-3 8-5-5L2 19z"/>
        <rect x="2" y="20" width="20" height="2" rx="1"/>
    </svg>
);

// Medal for 2nd / 3rd
const MedalIcon = ({ size = 20, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0.5">
        <path d="M8 2h8l2 5H6L8 2z" opacity="0.7"/>
        <circle cx="12" cy="16" r="6" fill={color} stroke="none"/>
        <path d="M9 3h6M8.5 7l3.5 2 3.5-2" stroke="white" strokeWidth="1" fill="none" opacity="0.5"/>
        <text x="12" y="20" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" stroke="none">
            {color === '#9ca3af' ? '2' : '3'}
        </text>
    </svg>
);

export default function RankingPage() {
    const { user, authFetch, refreshUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [toast, setToast] = useState(null);
    const [dailyClaimed, setDailyClaimed] = useState(false);
    const [rewardAnimation, setRewardAnimation] = useState(null);

    useEffect(() => {
        fetchRanking();
    }, []);

    async function fetchRanking() {
        try {
            const res = await fetch('/api/users/ranking?limit=100');
            const data = await res.json();
            if (data.ranking) setUsers(data.ranking);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function showToast(msg, type = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }

    async function handleDailyLogin() {
        if (!user) {
            showToast('You must be logged in to claim daily points!', 'error');
            return;
        }
        setClaiming(true);
        try {
            const res = await authFetch('/api/users/daily-login', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to claim', 'error');
            } else {
                setDailyClaimed(true);
                setRewardAnimation(`+${data.reward} YP`);
                setTimeout(() => setRewardAnimation(null), 3000);
                showToast(`${data.message}`, 'success');
                await fetchRanking();
                if (refreshUser) await refreshUser();
            }
        } catch (err) {
            showToast('Error claiming points.', 'error');
        } finally {
            setClaiming(false);
        }
    }

    function getInitial(username) {
        return username?.[0]?.toUpperCase() || '?';
    }

    function renderAvatar(u, size = 40) {
        if (u.avatar_url && u.avatar_url !== '/default-avatar.png') {
            return <img src={u.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
        }
        return (
            <div style={{
                width: size, height: size, borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-primary)', fontWeight: 800, fontSize: size * 0.42,
                flexShrink: 0,
            }}>
                {getInitial(u.username)}
            </div>
        );
    }

    if (loading) return <div className="page-loading"><div className="spinner" /></div>;

    const top3 = users.slice(0, 3);
    const rest = users.slice(3);
    const myRank = user ? users.findIndex(u => u.id === user.id) + 1 : null;

    return (
        <div className="page-container page-section fade-in" style={{ maxWidth: 860, margin: '0 auto' }}>
            {toast && (
                <div className={`toast ${toast.type}`}>{toast.msg}</div>
            )}

            {/* Reward animation popup */}
            {rewardAnimation && (
                <div style={{
                    position: 'fixed', bottom: '40px', right: '20px',
                    background: 'rgba(0,0,0,0.92)', border: '2px solid var(--accent)',
                    borderRadius: 16, padding: '24px 40px', zIndex: 1000,
                    textAlign: 'center', animation: 'toastSlideIn 0.4s ease',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: '#f59e0b' }}>
                        <GiftIcon />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-light)', letterSpacing: 1 }}>{rewardAnimation}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.82rem' }}>Daily Login Reward Claimed!</div>
                </div>
            )}

            {/* Header */}
            <div className="ranking-header">
                <div>
                    <h1 className="ranking-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TrophyIcon size={28} />
                        Hall of Fame
                    </h1>
                    <p className="ranking-subtitle">The most dedicated readers across the realms — ranked by Yomi Points.</p>
                    {myRank && myRank > 0 && (
                        <p style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 8, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPinIcon />
                            Your Rank: #{myRank} — {user.yomi_points || 0} YP
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <button
                        className={`btn ${dailyClaimed ? 'btn-ghost' : 'btn-primary'} btn-lg daily-login-btn`}
                        onClick={handleDailyLogin}
                        disabled={claiming || dailyClaimed}
                        style={dailyClaimed ? { borderColor: '#22c55e', color: '#22c55e' } : {}}
                    >
                        {claiming ? (
                            <>
                                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                Claiming...
                            </>
                        ) : dailyClaimed ? (
                            <><CheckIcon /> Claimed Today</>
                        ) : (
                            <><GiftIcon /> Claim Daily Reward (+10 YP)</>
                        )}
                    </button>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Log in daily to earn free Yomi Points!</span>
                </div>
            </div>

            {/* Top 3 Podium */}
            {top3.length > 0 && (
                <div className="podium-container">
                    {/* Position 2 */}
                    {top3[1] && (
                        <div className="podium-item pos-2">
                            <div className="podium-avatar">
                                <span className="podium-rank" style={{ background: 'transparent', border: 'none', color: '#9ca3af' }}>
                                    <MedalIcon size={22} color="#9ca3af" />
                                </span>
                                {renderAvatar(top3[1], 56)}
                            </div>
                            <div className="podium-name">{top3[1].username}</div>
                            <div className="podium-points">
                                <ZapIcon size={12} /> {top3[1].yomi_points} YP
                            </div>
                        </div>
                    )}
                    {/* Position 1 */}
                    <div className="podium-item pos-1">
                        {/* Floating crown above avatar */}
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: -8 }}>
                            <span style={{ color: '#f59e0b', filter: 'drop-shadow(0 2px 6px #f59e0b88)', marginBottom: -4, zIndex: 3 }}>
                                <CrownIcon size={28} />
                            </span>
                        </div>
                        <div className="podium-avatar" style={{ border: '3px solid #f59e0b', boxShadow: '0 0 20px #f59e0b55' }}>
                            <span className="podium-rank crown" style={{ background: '#f59e0b', border: 'none' }}>1</span>
                            {renderAvatar(top3[0], 72)}
                        </div>
                        <div className="podium-name" style={{ fontSize: '1.1rem' }}>{top3[0].username}</div>
                        <div className="podium-points" style={{ color: '#f59e0b', fontWeight: 900 }}>
                            <ZapIcon size={13} /> {top3[0].yomi_points} YP
                        </div>
                    </div>
                    {/* Position 3 */}
                    {top3[2] && (
                        <div className="podium-item pos-3">
                            <div className="podium-avatar">
                                <span className="podium-rank" style={{ background: 'transparent', border: 'none', color: '#cd7c38' }}>
                                    <MedalIcon size={22} color="#cd7c38" />
                                </span>
                                {renderAvatar(top3[2], 56)}
                            </div>
                            <div className="podium-name">{top3[2].username}</div>
                            <div className="podium-points">
                                <ZapIcon size={12} /> {top3[2].yomi_points} YP
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Ranking List */}
            <div className="ranking-list">
                {rest.map((rUser, index) => {
                    const cult = getCultivationData(rUser.yomi_points);
                    const isMe = user && rUser.id === user.id;
                    return (
                        <div key={rUser.id} className="ranking-row" style={isMe ? { border: '1px solid var(--primary)', background: 'rgba(220,38,38,0.05)' } : {}}>
                            <div className="ranking-row-rank" style={{ fontVariantNumeric: 'tabular-nums' }}>#{index + 4}</div>
                            <div className="ranking-row-user">
                                {renderAvatar(rUser, 34)}
                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                    <span className="ranking-row-name">
                                        {rUser.username}
                                        {isMe && <span style={{ color: 'var(--primary)', fontSize: '0.7rem', marginLeft: 6 }}>(You)</span>}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: cult.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <ZapIcon size={10} /> {cult.title}
                                    </span>
                                </div>
                            </div>
                            <div className="ranking-row-points" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-light)', fontVariantNumeric: 'tabular-nums' }}>
                                <ZapIcon size={12} />
                                {rUser.yomi_points} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>YP</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {users.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    <TrophyIcon size={48} />
                    <p style={{ marginTop: 16 }}>No users found yet. Be the first to start earning Yomi Points!</p>
                    <Link href="/" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>Start Reading</Link>
                </div>
            )}
        </div>
    );
}
