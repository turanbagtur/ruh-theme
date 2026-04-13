import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ favorites: [] });

        const db = getDb();
        const favorites = db.prepare(`
            SELECT s.id, s.title, s.cover_url, s.status, s.rating, s.views
            FROM favorites f
            JOIN series s ON f.series_id = s.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `).all(user.id);

        return NextResponse.json({ favorites });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
