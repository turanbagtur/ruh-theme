import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Badge definitions
export const BADGES = [
    // Reading count badges
    { id: 'reader_1', name: 'İlk Adım', description: '1 bölüm oku', icon: 'book', color: '#6b7280', category: 'reading', threshold: 1 },
    { id: 'reader_10', name: 'Manga Sevdalısı', description: '10 bölüm oku', icon: 'book', color: '#22c55e', category: 'reading', threshold: 10 },
    { id: 'reader_50', name: 'Bölüm Avcısı', description: '50 bölüm oku', icon: 'book', color: '#3b82f6', category: 'reading', threshold: 50 },
    { id: 'reader_100', name: 'Yüzler Kulübü', description: '100 bölüm oku', icon: 'book', color: '#a855f7', category: 'reading', threshold: 100 },
    { id: 'reader_500', name: 'Manga Efendisi', description: '500 bölüm oku', icon: 'crown', color: '#f59e0b', category: 'reading', threshold: 500 },
    { id: 'reader_1000', name: 'Efsane Okuyucu', description: '1000 bölüm oku', icon: 'star', color: '#ef4444', category: 'reading', threshold: 1000 },

    // Comment badges
    { id: 'commenter_1', name: 'İlk Yorum', description: 'İlk yorumunu yap', icon: 'chat', color: '#6b7280', category: 'social', threshold: 1 },
    { id: 'commenter_10', name: 'Sosyal Kelebek', description: '10 yorum yap', icon: 'chat', color: '#22c55e', category: 'social', threshold: 10 },
    { id: 'commenter_50', name: 'Tartışma Uzmanı', description: '50 yorum yap', icon: 'chat', color: '#a855f7', category: 'social', threshold: 50 },

    // Favorites badges
    { id: 'favorite_5', name: 'Koleksiyoncu', description: '5 seri favorile', icon: 'heart', color: '#ec4899', category: 'collection', threshold: 5 },
    { id: 'favorite_20', name: 'Kütüphaneci', description: '20 seri favorile', icon: 'heart', color: '#f43f5e', category: 'collection', threshold: 20 },

    // Streak / daily login badges
    { id: 'daily_7', name: 'Haftalık Kahraman', description: '7 gün üst üste giriş yap', icon: 'sun', color: '#f59e0b', category: 'streak', threshold: 7 },
    { id: 'daily_30', name: 'Aylık Kahraman', description: '30 gün üst üste giriş yap', icon: 'sun', color: '#f97316', category: 'streak', threshold: 30 },

    // Special badges
    { id: 'early_adopter', name: 'Kurucu Üye', description: 'İlk 100 kullanıcıdan biri', icon: 'star', color: '#eab308', category: 'special', threshold: null },
    { id: 'completed_1', name: 'Seri Bitirici', description: '1 seri tamamla (okuma listesinde)', icon: 'check', color: '#10b981', category: 'collection', threshold: 1 },
    { id: 'completed_5', name: 'Seri Uzmanı', description: '5 seri tamamla', icon: 'check', color: '#059669', category: 'collection', threshold: 5 },
];

function getUser(request) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '');
    if (!token) return null;
    try { return verifyToken(token); } catch { return null; }
}

// Check and award new badges for a user
export function checkAndAwardBadges(db, userId) {
    const awarded = [];
    try {
        // Get current stats
        const readCount = db.prepare('SELECT COUNT(*) as c FROM read_history WHERE user_id = ?').get(userId)?.c || 0;
        const commentCount = db.prepare('SELECT COUNT(*) as c FROM comments WHERE user_id = ?').get(userId)?.c || 0;
        const favCount = db.prepare('SELECT COUNT(*) as c FROM favorites WHERE user_id = ?').get(userId)?.c || 0;
        const completedCount = db.prepare("SELECT COUNT(*) as c FROM reading_lists WHERE user_id = ? AND status = 'completed'").get(userId)?.c || 0;
        const existingBadges = new Set(db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(userId).map(b => b.badge_id));

        const tryAward = (badgeId) => {
            if (!existingBadges.has(badgeId)) {
                db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, badgeId);
                awarded.push(badgeId);
                existingBadges.add(badgeId);
            }
        };

        // Reading badges
        for (const b of BADGES.filter(b => b.category === 'reading')) {
            if (readCount >= b.threshold) tryAward(b.id);
        }
        // Comment badges
        for (const b of BADGES.filter(b => b.category === 'social')) {
            if (commentCount >= b.threshold) tryAward(b.id);
        }
        // Favorite badges
        if (favCount >= 5) tryAward('favorite_5');
        if (favCount >= 20) tryAward('favorite_20');
        // Completed series badges
        if (completedCount >= 1) tryAward('completed_1');
        if (completedCount >= 5) tryAward('completed_5');

        // Early adopter: first 100 users
        const userNum = db.prepare('SELECT COUNT(*) as c FROM users WHERE id <= ?').get(userId)?.c || 0;
        if (userNum <= 100) tryAward('early_adopter');

    } catch (e) { /* silent */ }
    return awarded;
}

// GET /api/users/badges — get user's badges
export async function GET(request) {
    const user = getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    try {
        // Auto-check and award new badges
        const newBadges = checkAndAwardBadges(db, user.id);

        const earned = db.prepare('SELECT badge_id, earned_at FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC').all(user.id);
        const earnedIds = new Set(earned.map(b => b.badge_id));
        const earnedMap = Object.fromEntries(earned.map(b => [b.badge_id, b.earned_at]));

        const result = BADGES.map(b => ({
            ...b,
            earned: earnedIds.has(b.id),
            earned_at: earnedMap[b.id] || null,
            is_new: newBadges.includes(b.id),
        }));

        return NextResponse.json({ badges: result, newBadges });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}