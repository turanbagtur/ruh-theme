export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/users/[username] — Herkes tarafından görüntülenebilir
// Kullanıcı profil bilgilerini getirir (özet görünüm)
export async function GET(request, { params }) {
    try {
        const { username } = await params;
        if (!username) {
            return NextResponse.json({ error: 'Kullanıcı adı gerekli' }, { status: 400 });
        }

        const db = getDb();

        // Kullanıcıyı bul
        const targetUser = db.prepare(`
            SELECT id, username, avatar_url, role, yomi_points, created_at
            FROM users
            WHERE username = ?
        `).get(username);

        if (!targetUser) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        // İstatistikler - tek sorguda birleştir
        const stats = db.prepare(`
            SELECT
                (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as favoriteCount,
                (SELECT COUNT(*) FROM comments WHERE user_id = ?) as commentCount,
                (SELECT COUNT(*) FROM user_badges WHERE user_id = ?) as badgeCount
        `).get(targetUser.id, targetUser.id, targetUser.id);

        // En son aktiviteler
        const recentComments = db.prepare(`
            SELECT c.id, c.content, c.created_at, s.title as series_title, ch.chapter_number
            FROM comments c
            LEFT JOIN series s ON c.series_id = s.id
            LEFT JOIN chapters ch ON c.chapter_id = ch.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
            LIMIT 5
        `).all(targetUser.id);

        return NextResponse.json({
            success: true,
            user: {
                ...targetUser,
                favoriteCount: stats?.favoriteCount || 0,
                commentCount: stats?.commentCount || 0,
                badgeCount: stats?.badgeCount || 0,
            },
            recentComments,
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Profil yüklenemedi' }, { status: 500 });
    }
}