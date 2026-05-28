import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { createRateLimiter } from '@/lib/ratelimit';

const rateLimiter = createRateLimiter(10, 60 * 1000); // 10 req/min

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

        const today = new Date().toISOString().split('T')[0];
        const reward = 10;

        // Atomic: only update if last_daily_login is NOT already today
        const changed = db.prepare(`
            UPDATE users
            SET yomi_points     = COALESCE(yomi_points, 0) + ?,
                last_daily_login = CURRENT_TIMESTAMP
            WHERE id = ?
              AND (last_daily_login IS NULL OR DATE(last_daily_login) != ?)
        `).run(reward, user.id, today).changes;

        if (!changed) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const hoursLeft = Math.ceil((tomorrow.getTime() - Date.now()) / (1000 * 60 * 60));
            return NextResponse.json({
                error: `Already claimed today! Come back tomorrow (${hoursLeft}h left).`,
                alreadyClaimed: true,
                nextClaim: tomorrow.toISOString(),
            }, { status: 400 });
        }

        const updated = db.prepare('SELECT yomi_points FROM users WHERE id = ?').get(user.id);

        return NextResponse.json({
            success: true,
            reward,
            newTotal: updated.yomi_points,
            message: `+${reward} Yomi Points! Daily reward claimed successfully.`,
        });

    } catch (error) {
        console.error('POST /api/users/daily-login error:', error);
        return NextResponse.json({ error: 'Failed to claim daily reward' }, { status: 500 });
    }
}