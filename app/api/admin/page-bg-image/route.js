import { NextResponse } from 'next/server';
import { requireAuth, hasAdminPanelAccess } from '@/lib/auth';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Sayfa arka plan görseli yükle
// POST /api/admin/page-bg-image?page=home   (page = home|archive|requests|profile|ranking|global)
export async function POST(request) {
    try {
        const user = requireAuth(request);
        const db = getDb();
        if (!hasAdminPanelAccess(user, db)) throw new Error('Forbidden');
    } catch {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || 'global';

        const allowed = ['home', 'archive', 'requests', 'profile', 'ranking', 'global'];
        if (!allowed.includes(page)) {
            return NextResponse.json({ error: 'Geçersiz sayfa tipi' }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get('image');

        if (!file || typeof file.arrayBuffer !== 'function') {
            return NextResponse.json({ error: 'Görsel dosyası gerekli' }, { status: 400 });
        }

        const allowedTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Sadece PNG, WebP, JPEG veya GIF kabul edilir' }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'Dosya boyutu en fazla 10MB olabilir' }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'page-bg');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        // Aynı sayfaya ait eski görseli temizle
        try {
            const existing = fs.readdirSync(uploadDir);
            for (const f of existing) {
                if (f.startsWith(`${page}-`)) {
                    try { fs.unlinkSync(path.join(uploadDir, f)); } catch {}
                }
            }
        } catch {}

        const ext = file.type === 'image/png' ? '.png'
            : file.type === 'image/webp' ? '.webp'
            : file.type === 'image/gif' ? '.gif'
            : '.jpg';
        const fileName = `${page}-${Date.now()}${ext}`;
        const filePath = path.join(uploadDir, fileName);
        const publicPath = `/uploads/page-bg/${fileName}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        // Ayarı veritabanına kaydet — mutlak yolu ayrı key'e sakla (silme için)
        const db = getDb();
        const settingKey    = `page_bg_${page}_image`;
        const absSettingKey = `page_bg_${page}_image_abs`;
        db.prepare('INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES (?, ?)').run(settingKey, publicPath);
        db.prepare('INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES (?, ?)').run(absSettingKey, filePath);

        return NextResponse.json({ path: publicPath, message: 'Görsel başarıyla yüklendi' });
    } catch (err) {
        console.error('Sayfa arka plan görseli yükleme hatası:', err);
        return NextResponse.json({ error: 'Görsel yüklenemedi: ' + err.message }, { status: 500 });
    }
}

// Sayfa arka plan görselini sil
export async function DELETE(request) {
    try {
        const user = requireAuth(request);
        const db = getDb();
        if (!hasAdminPanelAccess(user, db)) throw new Error('Forbidden');
    } catch {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || 'global';

        const db = getDb();
        const settingKey    = `page_bg_${page}_image`;
        const absSettingKey = `page_bg_${page}_image_abs`;

        // Mutlak yol DB'de saklı — process.cwd() dinamik birleşimi yok
        const absRow = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get(absSettingKey);
        if (absRow?.setting_value) {
            try { if (fs.existsSync(absRow.setting_value)) fs.unlinkSync(absRow.setting_value); } catch {}
        }
        db.prepare('DELETE FROM app_settings WHERE setting_key IN (?, ?)').run(settingKey, absSettingKey);

        return NextResponse.json({ message: 'Görsel silindi' });
    } catch (err) {
        return NextResponse.json({ error: 'Görsel silinemedi: ' + err.message }, { status: 500 });
    }
}