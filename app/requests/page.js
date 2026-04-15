'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const STATUS_LABELS = {
    pending:   { label: 'Pending',   color: '#f59e0b', icon: '⏳' },
    reviewing: { label: 'Reviewing', color: '#6366f1', icon: '🔍' },
    approved:  { label: 'Approved',  color: '#22c55e', icon: '✅' },
    rejected:  { label: 'Rejected',  color: '#ef4444', icon: '❌' },
    added:     { label: 'Added',     color: '#14b8a6', icon: '📖' },
};

const TYPE_LABELS = {
    manga: 'Manga', manhwa: 'Manhwa', manhua: 'Manhua', novel: 'Novel', other: 'Other',
};

export default function RequestsPage() {
    const { user, authFetch } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState('all');
    const [votedIds, setVotedIds] = useState(new Set());
    const [expandedId, setExpandedId] = useState(null);

    // Form state
    const [form, setForm] = useState({
        series_title: '',
        series_type: 'manga',
        author: '',
        description: '',
        source_url: '',
        reason: '',
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        try {
            setLoading(true);
            const res = await fetch('/api/series-requests');
            const data = await res.json();
            setRequests(data.requests || []);
        } catch {
            setError('Failed to load requests.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.series_title.trim()) { setError('Series title is required.'); return; }
        setSubmitting(true);
        setError('');
        try {
            const res = await authFetch('/api/series-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to submit.'); return; }
            setSuccess('Your request has been submitted! It will be reviewed by our team.');
            setShowForm(false);
            setForm({ series_title: '', series_type: 'manga', author: '', description: '', source_url: '', reason: '' });
            fetchRequests();
        } catch {
            setError('Failed to submit request.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleUpvote(id) {
        if (!user) { setError('Please login to upvote.'); return; }
        try {
            const res = await authFetch('/api/series-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'upvote', id }),
            });
            const data = await res.json();
            if (res.ok) {
                setVotedIds(prev => {
                    const next = new Set(prev);
                    data.voted ? next.add(id) : next.delete(id);
                    return next;
                });
                setRequests(prev => prev.map(r =>
                    r.id === id ? { ...r, upvotes: data.voted ? r.upvotes + 1 : r.upvotes - 1 } : r
                ));
            }
        } catch {}
    }

    const filteredRequests = requests.filter(r =>
        filter === 'all' ? true : r.status === filter
    );

    const statusCounts = requests.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="page-container" style={{ maxWidth: 900, padding: '24px 16px' }}>
            {/* Header */}
            <div className="requests-header">
                <div>
                    <h1 className="requests-title">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="12" y1="18" x2="12" y2="12"/>
                            <line x1="9" y1="15" x2="15" y2="15"/>
                        </svg>
                        Series Requests
                    </h1>
                    <p className="requests-subtitle">
                        Request a manga/manhwa series to be added. Upvote others&apos; requests to help prioritize them.
                    </p>
                </div>
                {user ? (
                    <button className="btn btn-primary" onClick={() => { setShowForm(v => !v); setError(''); setSuccess(''); }}>
                        {showForm ? 'Cancel' : '+ Request a Series'}
                    </button>
                ) : (
                    <Link href="/login" className="btn btn-primary">Login to Request</Link>
                )}
            </div>

            {/* Success banner */}
            {success && (
                <div className="requests-banner success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {success}
                </div>
            )}

            {/* Error banner */}
            {error && (
                <div className="requests-banner error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                    {error}
                </div>
            )}

            {/* Request form */}
            {showForm && (
                <form className="requests-form" onSubmit={handleSubmit}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem' }}>Submit a Series Request</h3>

                    <div className="rform-row">
                        <div className="rform-field">
                            <label>Series Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input
                                type="text"
                                placeholder="e.g. Solo Leveling"
                                value={form.series_title}
                                onChange={e => setForm(f => ({ ...f, series_title: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="rform-field" style={{ maxWidth: 160 }}>
                            <label>Type</label>
                            <select value={form.series_type} onChange={e => setForm(f => ({ ...f, series_type: e.target.value }))}>
                                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="rform-field">
                        <label>Author / Artist</label>
                        <input
                            type="text"
                            placeholder="Author name (optional)"
                            value={form.author}
                            onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                        />
                    </div>

                    <div className="rform-field">
                        <label>Description</label>
                        <textarea
                            placeholder="Brief description of the series (optional)"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={3}
                        />
                    </div>

                    <div className="rform-field">
                        <label>Source / Reference URL</label>
                        <input
                            type="url"
                            placeholder="https://myanimelist.net/... or similar"
                            value={form.source_url}
                            onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
                        />
                    </div>

                    <div className="rform-field">
                        <label>Why should we add this?</label>
                        <textarea
                            placeholder="Tell us why this series would be a great addition..."
                            value={form.reason}
                            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                            rows={2}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                </form>
            )}

            {/* Filter tabs */}
            <div className="requests-filters">
                {[
                    { key: 'all', label: `All (${requests.length})` },
                    { key: 'pending', label: `Pending (${statusCounts.pending || 0})` },
                    { key: 'reviewing', label: `Reviewing (${statusCounts.reviewing || 0})` },
                    { key: 'approved', label: `Approved (${statusCounts.approved || 0})` },
                    { key: 'added', label: `Added (${statusCounts.added || 0})` },
                ].map(f => (
                    <button
                        key={f.key}
                        className={`rfilter-btn ${filter === f.key ? 'active' : ''}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Requests list */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <div className="spinner" />
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="empty-state">
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
                    <p>No requests found.</p>
                    {user && <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 12 }}>Be the first to request!</button>}
                </div>
            ) : (
                <div className="requests-list">
                    {filteredRequests.map(req => {
                        const st = STATUS_LABELS[req.status] || STATUS_LABELS.pending;
                        const voted = votedIds.has(req.id);
                        const isExpanded = expandedId === req.id;
                        return (
                            <div key={req.id} className={`request-card ${isExpanded ? 'expanded' : ''}`}>
                                {/* Left: upvote */}
                                <div className="req-vote">
                                    <button
                                        className={`req-vote-btn ${voted ? 'voted' : ''}`}
                                        onClick={() => handleUpvote(req.id)}
                                        title={user ? 'Upvote' : 'Login to upvote'}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill={voted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                                            <path d="m18 15-6-6-6 6"/>
                                        </svg>
                                    </button>
                                    <span className="req-vote-count">{req.upvotes}</span>
                                </div>

                                {/* Main content */}
                                <div className="req-body" onClick={() => setExpandedId(isExpanded ? null : req.id)} style={{ cursor: 'pointer' }}>
                                    <div className="req-top">
                                        <div className="req-title-row">
                                            <span className="req-title">{req.series_title}</span>
                                            <span className="req-type-badge">{TYPE_LABELS[req.series_type] || req.series_type}</span>
                                        </div>
                                        <span className="req-status-badge" style={{ background: st.color + '22', color: st.color, border: `1px solid ${st.color}55` }}>
                                            {st.icon} {st.label}
                                        </span>
                                    </div>

                                    <div className="req-meta">
                                        {req.author && <span>by {req.author}</span>}
                                        <span>requested by <strong>{req.username}</strong></span>
                                        <span>{new Date(req.created_at + 'Z').toLocaleDateString()}</span>
                                    </div>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="req-details">
                                            {req.description && (
                                                <div className="req-detail-block">
                                                    <strong>Description:</strong>
                                                    <p>{req.description}</p>
                                                </div>
                                            )}
                                            {req.reason && (
                                                <div className="req-detail-block">
                                                    <strong>Why add it:</strong>
                                                    <p>{req.reason}</p>
                                                </div>
                                            )}
                                            {req.source_url && (
                                                <div className="req-detail-block">
                                                    <strong>Reference:</strong>
                                                    <a href={req.source_url} target="_blank" rel="noopener noreferrer" className="req-link">
                                                        {req.source_url.replace(/^https?:\/\//, '')}
                                                    </a>
                                                </div>
                                            )}
                                            {req.admin_note && (
                                                <div className="req-detail-block req-admin-note">
                                                    <strong>📝 Admin note:</strong>
                                                    <p>{req.admin_note}</p>
                                                </div>
                                            )}
                                            <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '4px 12px' }} onClick={e => { e.stopPropagation(); setExpandedId(null); }}>
                                                Collapse ↑
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* My requests note */}
            {user && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 24 }}>
                    Your requests are marked with your username. Requests stay visible to the community.
                </p>
            )}
        </div>
    );
}