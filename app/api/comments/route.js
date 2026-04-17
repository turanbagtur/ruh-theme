import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Escape HTML special characters to prevent XSS
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get('chapterId');
        const seriesId = searchParams.get('seriesId');

        const db = getDb();

        if (!chapterId && !seriesId) {
            // If no chapterId or seriesId, return all comments (for admin)
            const all = db.prepare(`
                SELECT c.*, u.username, u.avatar_url, u.yomi_points,
                    (SELECT rank FROM (SELECT id, DENSE_RANK() OVER (ORDER BY yomi_points DESC) as rank FROM users) WHERE id = c.user_id) as leaderboard_rank,
                    ch.title as chapter_title, s.title as series_title
                FROM comments c
                JOIN users u ON c.user_id = u.id
                LEFT JOIN chapters ch ON c.chapter_id = ch.id
                LEFT JOIN series s ON (ch.series_id = s.id OR c.series_id = s.id)
                WHERE c.parent_id IS NULL
                ORDER BY c.created_at DESC
                LIMIT 50
            `).all();
            return NextResponse.json({ comments: all });
        }

        let whereClause, whereParam;
        if (chapterId) {
            whereClause = 'c.chapter_id = ?';
            whereParam = chapterId;
        } else {
            whereClause = 'c.series_id = ?';
            whereParam = seriesId;
        }

        const comments = db.prepare(`
            SELECT c.*, u.username, u.avatar_url, u.yomi_points,
                (SELECT rank FROM (SELECT id, DENSE_RANK() OVER (ORDER BY yomi_points DESC) as rank FROM users) WHERE id = c.user_id) as leaderboard_rank,
                (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id) as reply_count
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE ${whereClause} AND c.parent_id IS NULL
            ORDER BY c.created_at DESC
        `).all(whereParam);

        const commentsWithReactions = comments.map(comment => {
            const reactions = db.prepare(`
                SELECT emoji, COUNT(*) as count, GROUP_CONCAT(user_id) as user_ids
                FROM reactions WHERE comment_id = ? GROUP BY emoji
            `).all(comment.id);

            const replies = db.prepare(`
                SELECT c.*, u.username, u.avatar_url, u.yomi_points,
                (SELECT rank FROM (SELECT id, DENSE_RANK() OVER (ORDER BY yomi_points DESC) as rank FROM users) WHERE id = c.user_id) as leaderboard_rank
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.parent_id = ? ORDER BY c.created_at ASC
            `).all(comment.id);

            const repliesWithReactions = replies.map(reply => {
                const rReactions = db.prepare(`
                    SELECT emoji, COUNT(*) as count, GROUP_CONCAT(user_id) as user_ids
                    FROM reactions WHERE comment_id = ? GROUP BY emoji
                `).all(reply.id);
                return { ...reply, reactions: rReactions };
            });

            return { ...comment, reactions, replies: repliesWithReactions };
        });

        return NextResponse.json({ comments: commentsWithReactions });
    } catch (error) {
        console.error('GET /api/comments error:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { chapterId, seriesId, content, parentId, isSpoiler } = await request.json();

        if (!content || (!chapterId && !seriesId)) {
            return NextResponse.json({ error: 'Content and either chapterId or seriesId are required' }, { status: 400 });
        }

        const trimmedContent = String(content).trim();

        if (trimmedContent.length === 0) {
            return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
        }

        if (trimmedContent.length > 2000) {
            return NextResponse.json({ error: 'Comment too long (max 2000 characters)' }, { status: 400 });
        }

        // Do NOT pre-escape HTML here — the client's renderMarkdown handles escaping
        // before applying markdown transforms, preventing XSS without double-encoding.
        const db = getDb();
        const result = db.prepare(
            'INSERT INTO comments (user_id, chapter_id, series_id, content, parent_id, is_spoiler) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(user.id, chapterId || null, seriesId || null, trimmedContent, parentId || null, isSpoiler ? 1 : 0);

        const comment = db.prepare(`
            SELECT c.*, u.username, u.avatar_url, u.yomi_points,
            (SELECT rank FROM (SELECT id, DENSE_RANK() OVER (ORDER BY yomi_points DESC) as rank FROM users) WHERE id = c.user_id) as leaderboard_rank
            FROM comments c
            JOIN users u ON c.user_id = u.id WHERE c.id = ?
        `).get(result.lastInsertRowid);

        // Create notification for reply target
        if (parentId) {
            const parentComment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(parentId);
            if (parentComment && parentComment.user_id !== user.id) {
                const link = chapterId ? `/read/${chapterId}` : (seriesId ? `/series/${seriesId}` : null);
                db.prepare('INSERT INTO notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)').run(
                    parentComment.user_id,
                    'reply',
                    `${user.username} replied to your comment`,
                    link
                );
            }
        }

        return NextResponse.json({ comment: { ...comment, reactions: [], replies: [] } }, { status: 201 });
    } catch (error) {
        console.error('POST /api/comments error:', error);
        return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }
}
