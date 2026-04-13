import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
    try {
        const userData = getUserFromRequest(request);
        if (!userData) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const db = getDb();
        const user = db.prepare('SELECT id, username, email, avatar_url, role, yomi_points, last_daily_login, last_avatar_update, created_at FROM users WHERE id = ?').get(userData.id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('GET /api/auth/me error:', error);
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
}
