import { NextResponse } from 'next/server';
import { requireAuth, hasAdminPanelAccess } from '@/lib/auth';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Watermark gÃ¶rseli yÃ¼kle
export async function POST(request) {
    try {
        const user = requireAuth(request);
        const db = getDb();
        if (!hasAdminPanelAccess(user, db)) throw new Error('Forbidden');
    } catch {
        return NextResponse.json({ error: 'Yetkisiz eriÅŸim' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('watermark');

        if (!file || typeof file.arrayBuffer !== 'function') {
            return NextResponse.json({ error: 'Watermark dosyasÄ± gerekli' }, { status: 400 });
        }

        const allowedTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Sadece PNG, WebP veya JPEG dosyalarÄ± kabul edilir (PNG/WebP ÅŸeffaflÄ±k iÃ§in Ã¶nerilir)' }, { status: 400 });
        }

        const wmDir = path.join(process.cwd(), 'public', 'uploads', 'watermark');
        if (!fs.existsSync(wmDir)) fs.mkdirSync(wmDir, { recursive: true });

        // Eski watermark dosyasÄ±nÄ± temizle
        const existing = fs.readdirSync(wmDir);
        for (const f of existing) {
            try { fs.unlinkSync(path.join(wmDir, f)); } catch {}
        }

        const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
        const fileName = `watermark${ext}`;
        const filePath = path.join(wmDir, fileName);
        const publicPath = `/uploads/watermark/${fileName}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        // Watermark path'ini veritabanÄ±na kaydet
        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES (?, ?)').run('watermark_path', publicPath);
        db.prepare('INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES (?, ?)').run('watermark_abs_path', filePath);

        return NextResponse.json({ path: publicPath, message: 'Watermark baÅŸarÄ±yla yÃ¼klendi' });
    } catch (err) {
        console.error('Watermark yÃ¼kleme hatasÄ±:', err);
        return NextResponse.json({ error: 'Watermark yÃ¼klenemedi: ' + err.message }, { status: 500 });
    }
}

// Watermark sil
export async function DELETE(request) {
    try {
        const user = requireAuth(request);
        const db2 = getDb();
        if (!hasAdminPanelAccess(user, db2)) throw new Error('Forbidden');
    } catch {
        return NextResponse.json({ error: 'Yetkisiz eriÅŸim' }, { status: 401 });
    }

    try {
        const db = getDb();
        const absPath = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get('watermark_abs_path');

        if (absPath?.setting_value && fs.existsSync(absPath.setting_value)) {
            fs.unlinkSync(absPath.setting_value);
        }

        db.prepare("DELETE FROM app_settings WHERE setting_key IN ('watermark_path', 'watermark_abs_path')").run();

        return NextResponse.json({ message: 'Watermark silindi' });
    } catch (err) {
        return NextResponse.json({ error: 'Watermark silinemedi: ' + err.message }, { status: 500 });
    }
}
