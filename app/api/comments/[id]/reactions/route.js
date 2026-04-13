import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request, { params }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id } = await params;
        const { emoji } = await request.json();

        if (!emoji) {
            return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
        }

        const db = getDb();

        // Toggle reaction — enforce 1 reaction per user per comment
        const existingAll = db.prepare(
            'SELECT id, emoji FROM reactions WHERE user_id = ? AND comment_id = ?'
        ).all(user.id, id);

        const exactMatch = existingAll.find(r => r.emoji === emoji);

        if (existingAll.length > 0) {
            db.prepare('DELETE FROM reactions WHERE user_id = ? AND comment_id = ?').run(user.id, id);
        }

        if (!exactMatch) {
            db.prepare(
                'INSERT INTO reactions (user_id, comment_id, emoji) VALUES (?, ?, ?)'
            ).run(user.id, id, emoji);
        }

        // Return updated reactions
        const reactions = db.prepare(`
      SELECT emoji, COUNT(*) as count, GROUP_CONCAT(user_id) as user_ids
      FROM reactions WHERE comment_id = ? GROUP BY emoji
    `).all(id);

        return NextResponse.json({ reactions });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
