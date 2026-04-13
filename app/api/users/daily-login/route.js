import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
    try {
        const userData = getUserFromRequest(request);
        if (!userData) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const db = getDb();
        const user = db.prepare('SELECT id, yomi_points, last_daily_login FROM users WHERE id = ?').get(userData.id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastLogin = user.last_daily_login ? new Date(user.last_daily_login + 'Z') : null;
        const lastLoginDate = lastLogin ? lastLogin.toISOString().split('T')[0] : null;

        // Check if already claimed today (per-day, not 24h rolling)
        if (lastLoginDate === today) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const msLeft = tomorrow.getTime() - now.getTime();
            const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
            return NextResponse.json({ 
                error: `Already claimed today! Come back tomorrow (${hoursLeft}h left).`,
                alreadyClaimed: true,
                nextClaim: tomorrow.toISOString()
            }, { status: 400 });
        }

        // Grant Daily Login Reward: 10 Yomi Points
        const reward = 10;
        
        db.prepare(`
            UPDATE users 
            SET yomi_points = COALESCE(yomi_points, 0) + ?, last_daily_login = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(reward, user.id);

        const updatedUser = db.prepare('SELECT yomi_points FROM users WHERE id = ?').get(user.id);

        return NextResponse.json({ 
            success: true, 
            reward, 
            newTotal: updatedUser.yomi_points,
            message: `+${reward} Yomi Points! Daily reward claimed successfully.`
        });

    } catch (error) {
        console.error('POST /api/users/daily-login error:', error);
        return NextResponse.json({ error: 'Failed to claim daily reward' }, { status: 500 });
    }
}
