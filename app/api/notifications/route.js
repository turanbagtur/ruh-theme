import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const db = getDb();
        const notifications = db.prepare(`
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 30
        `).all(user.id);

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('GET /api/notifications error:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// Mark all as read
export async function PUT(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const db = getDb();
        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PUT /api/notifications error:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
