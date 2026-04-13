import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
    try {
        const userData = getUserFromRequest(request);
        if (!userData) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { chapterId } = body;

        if (!chapterId) {
            return NextResponse.json({ error: 'Chapter ID required' }, { status: 400 });
        }

        const db = getDb();
        
        // Ensure chapter exists
        const chapter = db.prepare('SELECT id FROM chapters WHERE id = ?').get(chapterId);
        if (!chapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }

        // Check if user already read this chapter
        const existing = db.prepare('SELECT id FROM read_history WHERE user_id = ? AND chapter_id = ?').get(userData.id, chapterId);
        
        if (existing) {
            // Still update reading_history for "Continue Reading" tracking
            db.prepare('INSERT INTO reading_history (user_id, chapter_id, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id, chapter_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP').run(userData.id, chapterId);
            return NextResponse.json({ 
                success: true, 
                alreadyRead: true,
                message: 'Chapter already read, no points awarded.'
            });
        }

        const reward = 2; // 2 points per chapter read

        // Use transaction to ensure both operations succeed together
        const tx = db.transaction(() => {
            db.prepare('INSERT INTO read_history (user_id, chapter_id) VALUES (?, ?)').run(userData.id, chapterId);
            db.prepare('UPDATE users SET yomi_points = coalesce(yomi_points, 0) + ? WHERE id = ?').run(reward, userData.id);
            // Track reading progress for "Continue Reading" feature
            db.prepare('INSERT INTO reading_history (user_id, chapter_id, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id, chapter_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP').run(userData.id, chapterId);
        });
        
        tx();

        // Get latest points to return to client
        const user = db.prepare('SELECT yomi_points FROM users WHERE id = ?').get(userData.id);

        return NextResponse.json({ 
            success: true, 
            reward,
            newTotal: user.yomi_points,
            message: `Earned ${reward} Yomi Points for reading!`
        });

    } catch (error) {
        console.error('POST /api/users/read-chapter error:', error);
        return NextResponse.json({ error: 'Failed to record chapter read' }, { status: 500 });
    }
}
