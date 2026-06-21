import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ isFavorite: false });

        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');

        if (!seriesId) return NextResponse.json({ isFavorite: false });

        const db = getDb();
        const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND series_id = ?').get(user.id, seriesId);
        return NextResponse.json({ isFavorite: !!fav });
    } catch (error) {
        console.error('GET /api/favorites error:', error);
        return NextResponse.json({ error: 'Failed to fetch favorite status' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

        const { seriesId } = await request.json();
        if (!seriesId) return NextResponse.json({ error: 'seriesId is required' }, { status: 400 });

        const db = getDb();
        const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND series_id = ?').get(user.id, seriesId);

        if (existing) {
            db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
            return NextResponse.json({ isFavorite: false });
        } else {
            db.prepare('INSERT INTO favorites (user_id, series_id) VALUES (?, ?)').run(user.id, seriesId);
            return NextResponse.json({ isFavorite: true });
        }
    } catch (error) {
        console.error('POST /api/favorites error:', error);
        return NextResponse.json({ error: 'Failed to update favorites' }, { status: 500 });
    }
}
