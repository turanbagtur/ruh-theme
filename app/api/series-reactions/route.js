import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');

        if (!seriesId) return NextResponse.json({ error: 'seriesId is required' }, { status: 400 });

        const db = getDb();
        
        // Get all reaction counts for this series
        const reactionsQuery = db.prepare(`
            SELECT emoji, COUNT(*) as count 
            FROM series_reactions 
            WHERE series_id = ? 
            GROUP BY emoji
        `).all(seriesId);

        let userReacted = null;
        
        // If user is authenticated, see which emoji they picked
        const user = getUserFromRequest(request);
        if (user) {
            const userReactionList = db.prepare('SELECT emoji FROM series_reactions WHERE series_id = ? AND user_id = ?').all(seriesId, user.id);
            if (userReactionList.length > 0) {
                // Return an array of emojis the user reacted with
                userReacted = userReactionList.map(r => r.emoji);
            }
        }

        const counts = {};
        reactionsQuery.forEach(r => counts[r.emoji] = r.count);

        return NextResponse.json({ success: true, counts, userReactions: userReacted || [] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

        const { seriesId, emoji } = await request.json();
        if (!seriesId || !emoji) return NextResponse.json({ error: 'seriesId and emoji are required' }, { status: 400 });

        const db = getDb();
        
        // Find existing reactions for THIS series + user regardless of emoji
        const existingAll = db.prepare('SELECT id, emoji FROM series_reactions WHERE series_id = ? AND user_id = ?').all(seriesId, user.id);
        
        // If the exact emoji exists, they are toggling it OFF
        const exactMatch = existingAll.find(r => r.emoji === emoji);
        
        // Either way, delete all existing reactions to enforce singularity
        if (existingAll.length > 0) {
            db.prepare('DELETE FROM series_reactions WHERE series_id = ? AND user_id = ?').run(seriesId, user.id);
        }

        if (exactMatch) {
            return NextResponse.json({ success: true, toggledOff: true });
        } else {
            db.prepare('INSERT INTO series_reactions (series_id, user_id, emoji) VALUES (?, ?, ?)').run(seriesId, user.id, emoji);
            return NextResponse.json({ success: true, toggledOn: true });
        }
        
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
