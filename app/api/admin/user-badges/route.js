import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser, hasAdminPanelAccess } from '@/lib/auth';
import { getAllBadges } from '@/lib/badges';

function getDeletedBuiltinIds(db) {
    try {
        const row = db.prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'deleted_builtin_badges'").get();
        if (!row?.setting_value) return [];
        return JSON.parse(row.setting_value);
    } catch { return []; }
}

function getAllActiveBadges(db) {
    const deleted = getDeletedBuiltinIds(db);
    return getAllBadges(db).filter(b => !deleted.includes(b.id));
}

// GET: Fetch badges for a user (?userId=xxx)
// Also returns all badge options (built-in + custom) if no userId provided
export async function GET(request) {
    try {
        const db = getDb();
        const result = getVerifiedUser(request, db);
        if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
        const { user: adminUser } = result;
        if (!hasAdminPanelAccess(adminUser, db)) {
            return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const allBadges = getAllActiveBadges(db);

        if (!userId) {
            return NextResponse.json({ success: true, badgeOptions: allBadges });
        }

        const badges = db.prepare(
            'SELECT badge_id, earned_at FROM user_badges WHERE user_id = ? ORDER BY earned_at ASC'
        ).all(userId);

        return NextResponse.json({ success: true, badges, badgeOptions: allBadges });
    } catch (error) {
        console.error('user-badges GET error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// POST: Add a badge to a user
// Body: { action: 'add', userId, badgeId }
export async function POST(request) {
    try {
        const db = getDb();
        const result = getVerifiedUser(request, db);
        if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
        const { user: adminUser } = result;
        if (!hasAdminPanelAccess(adminUser, db)) {
            return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const { action, userId, badgeId } = body;

        if (!userId || !badgeId) {
            return NextResponse.json({ error: 'userId ve badgeId gerekli' }, { status: 400 });
        }

        const validBadge = getAllActiveBadges(db).find(b => b.id === badgeId);
        if (!validBadge) {
            return NextResponse.json({ error: 'Geçersiz rozet ID' }, { status: 400 });
        }

        const targetUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId);
        if (!targetUser) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        // Managers cannot assign badges to admin accounts
        if (adminUser.role === 'manager' && targetUser.role === 'admin') {
            return NextResponse.json({ error: 'Yetkisiz: Admin kullanıcıları yönetemezsiniz' }, { status: 403 });
        }

        if (action === 'add') {
            db.prepare(
                'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)'
            ).run(userId, badgeId);

            return NextResponse.json({ success: true, message: `"${validBadge.label}" rozeti "${targetUser.username}" kullanıcısına eklendi` });
        }

        return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
    } catch (error) {
        console.error('user-badges POST error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// DELETE: Remove a badge from a user (?userId=xxx&badgeId=xxx)
export async function DELETE(request) {
    try {
        const db = getDb();
        const result = getVerifiedUser(request, db);
        if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
        const { user: adminUser } = result;
        if (!hasAdminPanelAccess(adminUser, db)) {
            return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const badgeId = searchParams.get('badgeId');

        if (!userId || !badgeId) {
            return NextResponse.json({ error: 'userId ve badgeId gerekli' }, { status: 400 });
        }

        const targetUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId);
        if (!targetUser) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        // Managers cannot remove badges from admin accounts
        if (adminUser.role === 'manager' && targetUser.role === 'admin') {
            return NextResponse.json({ error: 'Yetkisiz: Admin kullanıcıları yönetemezsiniz' }, { status: 403 });
        }

        db.prepare('DELETE FROM user_badges WHERE user_id = ? AND badge_id = ?').run(userId, badgeId);

        return NextResponse.json({ success: true, message: 'Rozet kaldırıldı' });
    } catch (error) {
        console.error('user-badges DELETE error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}