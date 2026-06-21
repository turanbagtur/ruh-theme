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

        // Get user current streak info
        const userRow = db.prepare('SELECT last_daily_login, last_streak_date, login_streak, yomi_points FROM users WHERE id = ?').get(user.id);
        const lastLogin = userRow?.last_daily_login ? userRow.last_daily_login.split('T')[0].split(' ')[0] : null;
        const lastStreakDate = userRow?.last_streak_date || null;
        const currentStreak = userRow?.login_streak || 0;

        // Already claimed today check
        if (lastLogin === today) {
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

        // Calculate new streak: if last streak date was yesterday, increment; otherwise reset to 1
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const newStreak = (lastStreakDate === yesterdayStr || lastStreakDate === today) ? currentStreak + 1 : 1;

        // Atomic update with streak tracking
        db.prepare(`
            UPDATE users
            SET yomi_points      = COALESCE(yomi_points, 0) + ?,
                last_daily_login = CURRENT_TIMESTAMP,
                login_streak     = ?,
                last_streak_date = ?
            WHERE id = ?
        `).run(reward, newStreak, today, user.id);

        const changed = true;

        const updated = db.prepare('SELECT yomi_points, login_streak FROM users WHERE id = ?').get(user.id);

        return NextResponse.json({
            success: true,
            reward,
            newTotal: updated?.yomi_points,
            streak: updated?.login_streak || 1,
            message: `+${reward} Yomi Puan! Günlük ödül alındı. ${updated?.login_streak > 1 ? `🔥 ${updated.login_streak} günlük seri!` : ''}`,
        });

    } catch (error) {
        console.error('POST /api/users/daily-login error:', error);
        return NextResponse.json({ error: 'Failed to claim daily reward' }, { status: 500 });
    }
}