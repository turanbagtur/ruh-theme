import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// In-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function getRateLimitKey(request, userId) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return userId ? `user:${userId}` : `ip:${ip}`;
}

function checkRateLimit(key) {
    const now = Date.now();
    const record = rateLimitMap.get(key);
    if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(key, { count: 1, windowStart: now });
        return { allowed: true };
    }
    if (record.count >= RATE_LIMIT_MAX) {
        const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.windowStart)) / 1000);
        return { allowed: false, retryAfter: retryAfterSec };
    }
    record.count += 1;
    return { allowed: true };
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { commentId, reason, details, chapterId, seriesId } = body;

        if (!commentId) {
            return NextResponse.json({ success: false, error: 'Yorum ID zorunludur' }, { status: 400 });
        }
        if (!reason || !reason.trim()) {
            return NextResponse.json({ success: false, error: 'Sebep alanı zorunludur' }, { status: 400 });
        }

        const user = getUserFromRequest(request);
        const userId = user ? user.id : null;

        const rlKey = getRateLimitKey(request, userId);
        const rl = checkRateLimit(rlKey);
        if (!rl.allowed) {
            return NextResponse.json({
                success: false,
                error: `Çok fazla bildirim gönderdiniz. Lütfen ${rl.retryAfter} saniye sonra tekrar deneyin.`
            }, { status: 429 });
        }

        const db = getDb();

        // Ensure bug_reports table has a type column
        try {
            db.prepare("ALTER TABLE bug_reports ADD COLUMN type TEXT DEFAULT 'bug'").run();
        } catch { /* column already exists */ }

        // Build description from reason + optional details
        const description = details?.trim()
            ? `${reason} — ${details.trim()}`
            : reason;

        // Fetch comment info for the title
        let title = 'Yorum Bildirimi';
        let resolvedSeriesId = seriesId || null;
        let resolvedChapterId = chapterId || null;
        try {
            const comment = db.prepare(`
                SELECT cm.content, cm.chapter_id, cm.series_id,
                       u.username as author,
                       c.chapter_number,
                       s.title as series_title
                FROM comments cm
                LEFT JOIN users u ON cm.user_id = u.id
                LEFT JOIN chapters c ON cm.chapter_id = c.id
                LEFT JOIN series s ON COALESCE(cm.series_id, c.series_id) = s.id
                WHERE cm.id = ?
            `).get(commentId);
            if (comment) {
                const snippet = comment.content ? comment.content.substring(0, 60) : '';
                title = `Yorum Bildirimi${comment.author ? ' — @' + comment.author : ''}${snippet ? ': "' + snippet + (comment.content?.length > 60 ? '…' : '') + '"' : ''}`;
                if (!resolvedChapterId) resolvedChapterId = comment.chapter_id || null;
                if (!resolvedSeriesId) resolvedSeriesId = comment.series_id || null;
            }
        } catch { /* use default title */ }

        db.prepare(
            'INSERT INTO bug_reports (user_id, chapter_id, series_id, title, description, type) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(userId, resolvedChapterId, resolvedSeriesId, title, description, 'comment');

        return NextResponse.json({ success: true, message: 'Yorum bildirimi başarıyla gönderildi' });
    } catch (error) {
        console.error('Error submitting comment report:', error);
        return NextResponse.json({ success: false, error: 'Bildirim gönderilemedi' }, { status: 500 });
    }
}