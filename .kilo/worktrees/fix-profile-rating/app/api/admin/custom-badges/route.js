import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { BADGE_OPTIONS } from '@/lib/badges';

export function getCustomBadgesFromDb(db) {
    const row = db.prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'custom_badges'").get();
    if (!row?.setting_value) return [];
    try { return JSON.parse(row.setting_value); } catch { return []; }
}

function getDeletedBuiltinIds(db) {
    const row = db.prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'deleted_builtin_badges'").get();
    if (!row?.setting_value) return [];
    try { return JSON.parse(row.setting_value); } catch { return []; }
}

function saveDeletedBuiltinIds(db, ids) {
    db.prepare(
        "INSERT INTO app_settings (setting_key, setting_value) VALUES ('deleted_builtin_badges', ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value"
    ).run(JSON.stringify(ids));
}

function saveCustomBadges(db, badges) {
    db.prepare(
        "INSERT INTO app_settings (setting_key, setting_value) VALUES ('custom_badges', ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value"
    ).run(JSON.stringify(badges));
}

function requireAdmin(request, db) {
    const result = getVerifiedUser(request, db);
    if (result.error) return { error: result.error, status: result.status };
    if (!['admin', 'manager'].includes(result.user.role)) return { error: 'Yetkisiz', status: 403 };
    return { user: result.user };
}

// GET: list all custom badge definitions
export async function GET(request) {
    try {
        const db = getDb();
        const auth = requireAdmin(request, db);
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
        const deletedBuiltins = getDeletedBuiltinIds(db);
        const customBadges = getCustomBadgesFromDb(db);
        return NextResponse.json({
            success: true,
            badges: customBadges,
            deletedBuiltinIds: deletedBuiltins,
        });
    } catch (err) {
        console.error('custom-badges GET error:', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// POST: create a new custom badge definition
// Body: { id?, label, icon, color }
export async function POST(request) {
    try {
        const db = getDb();
        const auth = requireAdmin(request, db);
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

        const body = await request.json();
        const { id: providedId, label, icon, color } = body;

        if (!label?.trim() || !icon?.trim() || !color?.trim()) {
            return NextResponse.json({ error: 'label, icon ve color gerekli' }, { status: 400 });
        }

        const badges = getCustomBadgesFromDb(db);

        // Prevent duplicate labels
        if (badges.some(b => b.label.toLowerCase() === label.trim().toLowerCase())) {
            return NextResponse.json({ error: 'Bu isimde bir rozet zaten mevcut' }, { status: 400 });
        }

        // Use provided id (sanitized) or auto-generate one
        let newId;
        if (providedId?.trim()) {
            newId = providedId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
            if (!newId) return NextResponse.json({ error: 'Geçersiz ID formatı' }, { status: 400 });
            if (badges.some(b => b.id === newId) || BADGE_OPTIONS.some(b => b.id === newId)) {
                return NextResponse.json({ error: 'Bu ID zaten kullanılıyor' }, { status: 400 });
            }
        } else {
            newId = 'custom_' + label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now();
        }

        const newBadge = { id: newId, label: label.trim(), icon: icon.trim(), color: color.trim(), custom: true };
        badges.push(newBadge);
        saveCustomBadges(db, badges);

        return NextResponse.json({ success: true, message: `"${newBadge.label}" rozeti oluşturuldu`, badge: newBadge, badges });
    } catch (err) {
        console.error('custom-badges POST error:', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// DELETE: delete a custom OR built-in badge definition
// ?id=xxx          → custom badge
// ?id=xxx&builtin=1 → mark a built-in badge as deleted
export async function DELETE(request) {
    try {
        const db = getDb();
        const auth = requireAdmin(request, db);
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const isBuiltin = searchParams.get('builtin') === '1';
        if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

        if (isBuiltin) {
            // Mark a built-in badge as deleted
            const builtin = BADGE_OPTIONS.find(b => b.id === id);
            if (!builtin) return NextResponse.json({ error: 'Yerleşik rozet bulunamadı' }, { status: 404 });
            const deletedIds = getDeletedBuiltinIds(db);
            if (!deletedIds.includes(id)) deletedIds.push(id);
            saveDeletedBuiltinIds(db, deletedIds);
            // Remove from all users
            try {
                db.prepare("DELETE FROM user_badges WHERE badge_id = ?").run(id);
            } catch {}
            return NextResponse.json({ success: true, message: `"${builtin.label}" yerleşik rozeti silindi` });
        }

        const badges = getCustomBadgesFromDb(db);
        const filtered = badges.filter(b => b.id !== id);
        if (filtered.length === badges.length) {
            return NextResponse.json({ error: 'Rozet bulunamadı' }, { status: 404 });
        }
        saveCustomBadges(db, filtered);
        // Remove from all users
        try {
            db.prepare("DELETE FROM user_badges WHERE badge_id = ?").run(id);
        } catch {}
        return NextResponse.json({ success: true, message: 'Rozet silindi ve kullanıcılardan kaldırıldı', badges: filtered });
    } catch (err) {
        console.error('custom-badges DELETE error:', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}