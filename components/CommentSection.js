'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { getCultivationData } from '@/lib/gamification';

const SERIES_EMOJIS = [
    { icon: '👍', label: 'Upvote' },
    { icon: '😂', label: 'Funny' },
    { icon: '❤️', label: 'Love' },
    { icon: '😲', label: 'Surprised' },
    { icon: '😠', label: 'Angry' },
    { icon: '😢', label: 'Sad' },
];
const COMMENT_EMOJIS = ['😂', '❤️', '😲', '😠', '😢'];
const REPORT_REASONS = ['Spam or misleading', 'Harassment or bullying', 'Hate speech', 'Inappropriate content', 'Spoilers without warning', 'Other'];

const ThumbUpIcon = ({ filled }) => <svg viewBox="0 0 24 24" width="16" height="16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>;
const ThumbDownIcon = ({ filled }) => <svg viewBox="0 0 24 24" width="16" height="16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M17 14V2M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" /></svg>;
const ReplyIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>;
const MoreIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>;
const EditIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const FlagIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>;
const BoldIcon = () => <span style={{fontWeight:'900', fontFamily:'serif'}}>B</span>;
const ItalicIcon = () => <span style={{fontStyle:'italic', fontFamily:'serif'}}>I</span>;
const StrikeIcon = () => <span style={{textDecoration:'line-through'}}>A</span>;

export default function CommentSection({ chapterId, seriesId }) {
    const contextId = chapterId || seriesId;
    const { user, authFetch } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [openMenu, setOpenMenu] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [sortBy, setSortBy] = useState('best');
    const [deleteModal, setDeleteModal] = useState(null);
    const [reportModal, setReportModal] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [toast, setToast] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(null);
    const [imageUrlModal, setImageUrlModal] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    
    // Series Reactions Widget
    const [seriesReactCounts, setSeriesReactCounts] = useState({});
    const [activeReaction, setActiveReaction] = useState(null);
    const [hiddenReplies, setHiddenReplies] = useState(new Set());
    
    const menuRef = useRef(null);

    useEffect(() => {
        fetchComments();
        if (seriesId) fetchSeriesReactions();
        // Load localStorage reaction for guests
        if (seriesId && typeof window !== 'undefined') {
            const stored = localStorage.getItem(`series_reaction_${seriesId}`);
            if (stored && !user) setActiveReaction(stored);
        }
    }, [contextId, seriesId]);

    useEffect(() => {
        const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    async function fetchSeriesReactions() {
        if (!seriesId) return;
        try {
            const res = await authFetch(`/api/series-reactions?seriesId=${seriesId}`);
            if (!res) return;
            const data = await res.json();
            if (data.success) {
                setSeriesReactCounts(data.counts || {});
                if (data.userReactions && data.userReactions.length > 0) {
                    setActiveReaction(data.userReactions[0]);
                }
            }
        } catch(err) { console.error(err); }
    }

    async function toggleSeriesReaction(emoji) {
        const currentlyActive = activeReaction === emoji;
        const previousReaction = activeReaction;

        // Guest users: use localStorage for 1-reaction-per-series limit
        if (!user) {
            const storageKey = `series_reaction_${seriesId}`;
            if (currentlyActive) {
                setActiveReaction(null);
                localStorage.removeItem(storageKey);
                setSeriesReactCounts(prev => ({
                    ...prev,
                    [emoji]: Math.max(0, (prev[emoji] || 0) - 1)
                }));
            } else {
                setActiveReaction(emoji);
                localStorage.setItem(storageKey, emoji);
                setSeriesReactCounts(prev => {
                    const next = { ...prev };
                    if (previousReaction) next[previousReaction] = Math.max(0, (next[previousReaction] || 0) - 1);
                    next[emoji] = (next[emoji] || 0) + 1;
                    return next;
                });
            }
            return; // Guest reactions are local only
        }

        // Logged-in users: optimistic update + API call
        if (currentlyActive) {
            setActiveReaction(null);
            setSeriesReactCounts(prev => ({
                ...prev,
                [emoji]: Math.max(0, (prev[emoji] || 0) - 1)
            }));
        } else {
            setActiveReaction(emoji);
            setSeriesReactCounts(prev => {
                const next = { ...prev };
                if (previousReaction) next[previousReaction] = Math.max(0, (next[previousReaction] || 0) - 1);
                next[emoji] = (next[emoji] || 0) + 1;
                return next;
            });
        }

        try {
            await authFetch('/api/series-reactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seriesId, emoji, removeOld: previousReaction && previousReaction !== emoji })
            });
        } catch(err) { console.error(err); }
    }

    async function fetchComments() {
        try {
            const param = chapterId ? `chapterId=${chapterId}` : `seriesId=${seriesId}`;
            const res = await fetch(`/api/comments?${param}`);
            const data = await res.json();
            if (data.comments) setComments(data.comments);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        try {
            const body = { content: newComment.trim() };
            if (chapterId) body.chapterId = chapterId; else body.seriesId = seriesId;
            const res = await authFetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (data.comment) { setComments([data.comment, ...comments]); setNewComment(''); }
        } catch (err) { console.error(err); }
    }

    async function handleReply(parentId) {
        if (!replyContent.trim() || !user) return;
        try {
            const body = { content: replyContent.trim(), parentId };
            if (chapterId) body.chapterId = chapterId; else body.seriesId = seriesId;
            const res = await authFetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (data.comment) {
                setComments(comments.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), { ...data.comment, reactions: [] }] } : c));
                setReplyTo(null); setReplyContent('');
            }
        } catch (err) { console.error(err); }
    }

    async function handleReaction(commentId, emoji) {
        if (!user) { showToast('Please login to react to comments'); return; }
        try {
            const res = await authFetch(`/api/comments/${commentId}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji }) });
            const data = await res.json();
            if (data.reactions !== undefined) {
                setComments(comments.map(c => {
                    if (c.id === commentId) return { ...c, reactions: data.reactions };
                    if (c.replies) return { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, reactions: data.reactions } : r) };
                    return c;
                }));
            }
        } catch (err) { console.error(err); }
    }

    async function saveEdit(commentId) {
        if (!editContent.trim()) return;
        try {
            await authFetch(`/api/comments/${commentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent.trim() }),
            });
            setComments(comments.map(x => {
                if (x.id === commentId) return { ...x, content: editContent.trim() };
                if (x.replies) return { ...x, replies: x.replies.map(r => r.id === commentId ? { ...r, content: editContent.trim() } : r) };
                return x;
            }));
            setEditingComment(null);
            showToast('Comment updated.');
        } catch (err) {
            showToast('Failed to save edit.');
            console.error(err);
        }
    }

    async function handleDeleteConfirm() {
        if (!deleteModal) return;
        try {
            await authFetch(`/api/comments/${deleteModal}`, { method: 'DELETE' });
        } catch (err) { console.error('Delete failed:', err); }
        setComments(comments.filter(c => c.id !== deleteModal).map(c => ({ ...c, replies: c.replies ? c.replies.filter(r => r.id !== deleteModal) : [] })));
        setDeleteModal(null); showToast('Comment deleted.');
    }

    function handleReportSubmit() {
        if (!reportReason) return;
        setReportModal(null); setReportReason(''); setReportDetails('');
        showToast('Report submitted. Thank you.');
    }

    function timeAgo(d) {
        if (!d) return '';
        const utcStr = typeof d === 'string' && !d.endsWith('Z') ? d + 'Z' : d;
        const m = Math.floor((Date.now() - new Date(utcStr).getTime()) / 60000); 
        if (m < 60) return `${Math.max(1,m)}m ago`; 
        const h = Math.floor(m / 60); 
        if (h < 24) return `${h}h ago`; 
        return `${Math.floor(h / 24)}d ago`; 
    }
    function getCount(c, emoji) { const r = (c.reactions || []).find(x => x.emoji === emoji); return r ? r.count : 0; }
    function isActive(c, emoji) { const r = (c.reactions || []).find(x => x.emoji === emoji); return r && user && r.user_ids?.split(',').includes(String(user.id)); }

    const sortedComments = [...comments].sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortBy === 'best') return (getCount(b, '👍') - getCount(b, '👎')) - (getCount(a, '👍') - getCount(a, '👎'));
        return new Date(b.created_at) - new Date(a.created_at);
    });

    function insertFormat(prefix, suffix = '') {
        setNewComment(prev => prev + prefix + 'text' + suffix);
    }

    function renderMarkdown(rawText) {
        if (!rawText) return null;
        let html = rawText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/\|\|(.*?)\|\|/g, '<span class="spoiler-text" onclick="this.classList.toggle(\'revealed\')">$1</span>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:4px; margin-top:8px;" />')
            .replace(/\n/g, '<br />');
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }

    function getRankBadgeParams(rank) {
        if (!rank) return null;
        if (rank === 1) return { class: 'asura-badge-1', label: '1' };
        if (rank <= 10) return { class: 'asura-badge-top', label: 'T' };
        if (rank <= 50) return { class: 'asura-badge-mid', label: 'M' };
        return { class: 'asura-badge-base', label: 'R' };
    }

    function toggleReplies(commentId) {
        const newSet = new Set(hiddenReplies);
        if (newSet.has(commentId)) newSet.delete(commentId);
        else newSet.add(commentId);
        setHiddenReplies(newSet);
    }

    function renderComment(c, isReply = false) {
        const isOwner = user && c.user_id === user.id;
        const isAdmin = user && user.role === 'admin';
        const badge = getRankBadgeParams(c.leaderboard_rank);
        const replyCount = c.replies ? c.replies.length : c.reply_count;
        const isHidden = hiddenReplies.has(c.id);
        const cultivation = getCultivationData(c.yomi_points || 0);
        const userAvatar = (!c.avatar_url || c.avatar_url === '/default-avatar.png') ? null : c.avatar_url;

        return (
            <div key={c.id} className={isReply ? "asura-reply-row" : "asura-comment-row"}>
                <div className="asura-comment-avatar-wrapper">
                    {/* Render User Avatar or CSS Initial */}
                    {userAvatar ? (
                        <img src={userAvatar} alt={c.username} className="asura-comment-avatar" />
                    ) : (
                        <div className="asura-comment-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem' }}>
                            {c.username?.[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                    {/* Render Rank Badge if present */}
                    {badge && <div className={`asura-avatar-badge ${badge.class}`}>{badge.label}</div>}
                </div>

                <div className="asura-comment-content">
                    <div className="asura-comment-meta" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="asura-comment-username">{c.username}</span>
                            <span className="asura-comment-time">{timeAgo(c.created_at)}</span>
                        </div>
                        <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 800, 
                            color: cultivation.color, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.5px' 
                        }}>
                            {cultivation.title}
                        </span>
                    </div>

                    {editingComment === c.id ? (
                        <div style={{ marginBottom: 12 }}>
                            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                                className="asura-comment-textarea"
                                style={{ minHeight: 60, padding: '8px', border: '1px solid #444', borderRadius: '4px' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(c.id); }
                                    if (e.key === 'Escape') setEditingComment(null);
                                }}
                                autoFocus />
                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                <button className="asura-btn-post" onClick={() => saveEdit(c.id)}>Save</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingComment(null)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="asura-comment-text">{renderMarkdown(c.content)}</div>
                    )}

                    <div className="asura-comment-actions">
                        <button className={`asura-action-btn ${isActive(c, '👍') ? 'active' : ''}`} onClick={() => handleReaction(c.id, '👍')} title="Upvote">
                            <ThumbUpIcon filled={isActive(c, '👍')} /> {getCount(c, '👍') > 0 && <span>{getCount(c, '👍')}</span>}
                        </button>
                        <button className={`asura-action-btn ${isActive(c, '👎') ? 'active' : ''}`} onClick={() => handleReaction(c.id, '👎')} title="Downvote">
                            <ThumbDownIcon filled={isActive(c, '👎')} /> {getCount(c, '👎') > 0 && <span>{getCount(c, '👎')}</span>}
                        </button>


                        {!isReply && user && (
                            <button className="asura-action-btn" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
                                <ReplyIcon /> Reply
                            </button>
                        )}
                        {user && (
                            <div style={{position: 'relative'}} ref={openMenu === c.id ? menuRef : null}>
                                <button className="asura-action-btn" onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}><MoreIcon /></button>
                                {openMenu === c.id && (
                                    <div className="comment-menu">
                                        {(isOwner || isAdmin) && (
                                            <>
                                                <button className="comment-menu-item" onClick={() => { setEditingComment(c.id); setEditContent(c.content); setOpenMenu(null); }}><EditIcon /> Edit</button>
                                                <button className="comment-menu-item danger" onClick={() => { setDeleteModal(c.id); setOpenMenu(null); }}><TrashIcon /> Delete</button>
                                            </>
                                        )}
                                        {!isOwner && <button className="comment-menu-item danger" onClick={() => { setReportModal(c.id); setOpenMenu(null); }}><FlagIcon /> Report</button>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {replyTo === c.id && (
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className="asura-comment-avatar-wrapper" style={{ flexShrink: 0, width: 32, height: 32 }}>
                                    {(!user.avatar_url || user.avatar_url === '/default-avatar.png') ? (
                                        <div className="asura-comment-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.9rem', width: 32, height: 32 }}>
                                            {user.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    ) : (
                                        <img src={user.avatar_url} alt={user.username} className="asura-comment-avatar" style={{ width: 32, height: 32 }} />
                                    )}
                                </div>
                                <div className="asura-comment-input-container" style={{ flexGrow: 1 }}>
                                    <textarea className="asura-comment-textarea" placeholder={`Reply to ${c.username}...`} value={replyContent} onChange={(e) => setReplyContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(c.id)} autoFocus />
                                <div className="asura-comment-toolbar" style={{ justifyContent: 'flex-end', borderTop: 'none', background: 'transparent' }}>
                                    <div className="asura-toolbar-right">
                                        <button onClick={() => handleReply(c.id)} className="asura-btn-post" disabled={!replyContent.trim()}>Reply</button>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>
                    )}

                    {/* Replies Section */}
                    {replyCount > 0 && !isReply && (
                        <>
                            <button className="asura-replies-toggle" onClick={() => toggleReplies(c.id)}>
                                {isHidden ? (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg> Show {replyCount} replies</>
                                ) : (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg> Hide {replyCount} replies</>
                                )}
                            </button>
                            {!isHidden && c.replies && c.replies.length > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                    {c.replies.map(r => renderComment(r, true))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '40px' }}>
            {/* 1. Series Reaction Bar Widget */}
            {seriesId && (
                <div className="series-reaction-widget">
                    <div className="series-reaction-title">What did you think of this series?</div>
                    <div className="series-reaction-subtitle">
                        {Object.values(seriesReactCounts).reduce((a,b)=>a+b, 0)} reactions
                    </div>
                    <div className="reaction-emoji-row">
                        {SERIES_EMOJIS.map(se => (
                            <button 
                                key={se.label} 
                                className={`reaction-emoji-btn ${activeReaction === se.icon ? 'active' : ''}`}
                                onClick={() => toggleSeriesReaction(se.icon)}
                            >
                                <span className="emoji-icon">{se.icon}</span>
                                <span className="emoji-count">{seriesReactCounts[se.icon] || 0}</span>
                                <span className="emoji-label">{se.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Comments Header & Sorters */}
            <div className="asura-comment-header">
                <div className="asura-comment-title">{comments.length} Comments</div>
                <div className="asura-comment-sort">
                    <button className={sortBy === 'best' ? 'active' : ''} onClick={() => setSortBy('best')}>Best</button>
                    <button className={sortBy === 'newest' ? 'active' : ''} onClick={() => setSortBy('newest')}>Newest</button>
                    <button className={sortBy === 'oldest' ? 'active' : ''} onClick={() => setSortBy('oldest')}>Oldest</button>
                </div>
            </div>

            {toast && <div className="alert alert-success" style={{ marginBottom: 14 }}>{toast}</div>}

            {/* 3. Global Comment Input */}
            {user ? (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div className="asura-comment-avatar-wrapper" style={{ flexShrink: 0 }}>
                        {(!user.avatar_url || user.avatar_url === '/default-avatar.png') ? (
                            <div className="asura-comment-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem' }}>
                                {user.username?.[0]?.toUpperCase() || '?'}
                            </div>
                        ) : (
                            <img src={user.avatar_url} alt={user.username} className="asura-comment-avatar" />
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="asura-comment-input-container" style={{ flexGrow: 1, margin: 0 }}>
                        <textarea 
                            className="asura-comment-textarea"
                            placeholder="Write a comment..." 
                            value={newComment} 
                            onChange={(e) => setNewComment(e.target.value)} 
                            maxLength={2000} 
                        />
                    <div className="asura-comment-toolbar">
                        <div className="asura-toolbar-left">
                            <button type="button" className="asura-toolbar-btn" title="Bold" onClick={() => insertFormat('**', '**')}><BoldIcon/></button>
                            <button type="button" className="asura-toolbar-btn" title="Italic" onClick={() => insertFormat('*', '*')}><ItalicIcon/></button>
                            <button type="button" className="asura-toolbar-btn" title="Strikethrough" onClick={() => insertFormat('~~', '~~')}><StrikeIcon/></button>
                            <button type="button" className="asura-toolbar-btn" title="Spoiler" onClick={() => insertFormat('||', '||')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 18 18M10.5 10.67a2 2 0 0 0 2.83 2.83"/></svg></button>
                        </div>
                        <div className="asura-toolbar-right">
                            <span className="asura-char-count">{newComment.length}/2000</span>
                            <button type="submit" className="asura-btn-post" disabled={!newComment.trim()}>Post</button>
                        </div>
                    </div>
                </form>
            </div>
            ) : (
                <div className="login-prompt">Please <a href="/login">login</a> to comment.</div>
            )}

            {/* 4. Comments Loop */}
            {loading ? (
                <div className="comments-loading"><div className="skeleton-comment" /><div className="skeleton-comment" /></div>
            ) : comments.length === 0 ? (
                <div className="empty-comments">No comments yet. Be the first!</div>
            ) : (
                <div>{sortedComments.map(c => renderComment(c))}</div>
            )}

            {/* Utility Modals */}
            {deleteModal && (
                <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3><TrashIcon /> Delete Comment</h3>
                        <p>Are you sure? This cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteModal(null)}>Cancel</button>
                            <button className="btn btn-danger btn-sm" onClick={handleDeleteConfirm}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {reportModal && (
                <div className="modal-overlay" onClick={() => setReportModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3><FlagIcon /> Report Comment</h3>
                        <p>Why are you reporting this?</p>
                        <div className="form-group">
                            <select className="form-input" value={reportReason} onChange={e => setReportReason(e.target.value)}>
                                <option value="">Select a reason...</option>
                                {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Details (optional)</label>
                            <textarea className="form-input" rows={2} placeholder="More details..." value={reportDetails} onChange={e => setReportDetails(e.target.value)} style={{ resize: 'vertical' }} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => setReportModal(null)}>Cancel</button>
                            <button className="btn btn-danger btn-sm" onClick={handleReportSubmit} disabled={!reportReason}>Submit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image URL Modal */}
            {imageUrlModal && (
                <div className="modal-overlay" onClick={() => setImageUrlModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            Insert Image
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '8px 0 16px' }}>Paste an image URL (png, jpg, gif, webp)</p>
                        <div className="form-group">
                            <input 
                                type="url" 
                                className="form-input" 
                                placeholder="https://example.com/image.png" 
                                value={imageUrl} 
                                onChange={e => setImageUrl(e.target.value)}
                                autoFocus
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && imageUrl.trim()) {
                                        setNewComment(prev => prev + `\n![image](${imageUrl.trim()})`);
                                        setImageUrl('');
                                        setImageUrlModal(false);
                                    }
                                }}
                            />
                        </div>
                        {imageUrl.trim() && /\.(png|jpg|jpeg|gif|webp)/i.test(imageUrl) && (
                            <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', maxHeight: 200 }}>
                                <img src={imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
                            </div>
                        )}
                        <div className="modal-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => { setImageUrl(''); setImageUrlModal(false); }}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={() => {
                                if (imageUrl.trim()) {
                                    setNewComment(prev => prev + `\n![image](${imageUrl.trim()})`);
                                    setImageUrl('');
                                    setImageUrlModal(false);
                                }
                            }} disabled={!imageUrl.trim()}>Insert</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
