'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/components/SettingsProvider';
import { useAuth } from '@/components/AuthProvider';

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username;
    const { settings: siteSettings } = useSettings() || {};
    const { user: currentUser, loading: authLoading } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const pointsName = siteSettings?.points_name || 'Yomi Puanı';

    useEffect(() => {
        if (!username) return;

        async function fetchProfile() {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || 'Profil yüklenemedi');
                    setLoading(false);
                    return;
                }

                setProfile(data.user);
                setLoading(false);
            } catch {
                setError('Profil yüklenemedi');
                setLoading(false);
            }
        }

        fetchProfile();
    }, [username]);

    // Redirect to own profile if viewing own profile
    useEffect(() => {
        if (!authLoading && profile && currentUser) {
            if (currentUser.username === username || currentUser.username === profile.username) {
                router.replace('/profile');
            }
        }
    }, [profile, currentUser, authLoading, username, router]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ marginBottom: '20px' }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                <h2 style={{ marginBottom: '12px' }}>{error}</h2>
                <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                    Ana sayfaya dön
                </Link>
            </div>
        );
    }

    if (!profile) return null;

    const rankColors = {
        'user': '#9ca3af',
        'team_member': '#3b82f6',
        'moderator': '#8b5cf6',
        'manager': '#f59e0b',
        'admin': '#ef4444',
    };
    const roleLabels = {
        'user': 'Üye',
        'team_member': 'Çevirmen',
        'moderator': 'Moderatör',
        'manager': 'Yönetici',
        'admin': 'Admin',
    };
    const roleColor = rankColors[profile.role] || '#9ca3af';

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            {/* Profil Kartı */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '40px',
                marginBottom: '40px',
                textAlign: 'center',
            }}>
                {/* Avatar */}
                <div style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    margin: '0 auto 24px',
                    overflow: 'hidden',
                    border: `4px solid ${roleColor}`,
                    boxShadow: `0 0 30px ${roleColor}40`,
                }}>
                    {profile.avatar_url && profile.avatar_url !== '/default-avatar.png' ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.username}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3.5rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                        }}>
                            {profile.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Kullanıcı Adı */}
                <h1 style={{ fontSize: '2.5rem', marginBottom: '12px', fontWeight: 800 }}>
                    {profile.username}
                </h1>

                {/* Rol */}
                <div style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    background: `${roleColor}20`,
                    border: `1px solid ${roleColor}50`,
                    color: roleColor,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    marginBottom: '20px',
                }}>
                    {roleLabels[profile.role] || 'Üye'}
                </div>

                {/* İstatistikler */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '40px',
                    marginTop: '20px',
                    flexWrap: 'wrap',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
                            {profile.yomi_points || 0}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {pointsName}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
                            {profile.favoriteCount || 0}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Favori
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
                            {profile.commentCount || 0}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Yorum
                        </div>
                    </div>
                </div>

                {/* Katılım Tarihi */}
                <div style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {profile.created_at && new Date(profile.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }) + ' tarihinden beri üye'}
                </div>
            </div>

            {/* Geri Dön Butonu */}
            <div style={{ marginBottom: '24px' }}>
                <Link
                    href="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Ana sayfaya dön
                </Link>
            </div>
        </div>
    );
}
