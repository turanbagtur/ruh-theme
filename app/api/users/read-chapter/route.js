import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { batchQueue } from '@/lib/queue';
import { createRateLimiter } from '@/lib/ratelimit';

const rateLimiter = createRateLimiter(60, 60 * 1000); // 60 req/min

export async function POST(request) {
    const rl = rateLimiter(request);
    if (!rl.success) {
        return NextResponse.json({ error: 'Too many requests.' }, {
            status: 429,
            headers: { 'Retry-After': String(rl.retryAfter) },
        });
    }

    try {
        const db = getDb();
        const result = getVerifiedUser(request, db);
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { user } = result;

        const body = await request.json();
        const { chapterId, pageNumber } = body || {};

        if (!chapterId) {
            return NextResponse.json({ error: 'Chapter ID required' }, { status: 400 });
        }

        const chapter = db.prepare('SELECT id FROM chapters WHERE id = ?').get(chapterId);
        if (!chapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }

        // Check if user already read this chapter
        const existing = db.prepare(
            'SELECT id FROM read_history WHERE user_id = ? AND chapter_id = ?'
        ).get(user.id, chapterId);

        if (existing) {
            // Update reading position even if already read
            batchQueue.pushHistory(user.id, chapterId, pageNumber ?? 1);
            return NextResponse.json({
                success: true,
                alreadyRead: true,
                message: 'Chapter already read, no points awarded.',
            });
        }

        const reward = 2;

        const newPoints = db.transaction(() => {
            db.prepare(
                'INSERT INTO read_history (user_id, chapter_id) VALUES (?, ?)'
            ).run(user.id, chapterId);
            return db.prepare(
                'UPDATE users SET yomi_points = COALESCE(yomi_points, 0) + ? WHERE id = ? RETURNING yomi_points'
            ).get(reward, user.id)?.yomi_points;
        })();

        batchQueue.pushHistory(user.id, chapterId, pageNumber ?? 1);

        return NextResponse.json({
            success: true,
            reward,
            newTotal: newPoints,
            message: `Earned ${reward} Yomi Points for reading!`,
        });

    } catch (error) {
        console.error('POST /api/users/read-chapter error:', error);
        return NextResponse.json({ error: 'Failed to record chapter read' }, { status: 500 });
    }
}