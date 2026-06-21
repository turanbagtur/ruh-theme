import { NextResponse } from 'next/server';
import { requireAuth, hasAdminPanelAccess } from '@/lib/auth';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

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
        const file = formData.get('chapter_end_image');

        if (!file || typeof file.arrayBuffer !== 'function') {
            return NextResponse.json({ error: 'GÃ¶rsel dosyasÄ± gerekli' }, { status: 400 });
        }

        const allowedTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Sadece PNG, WebP veya JPEG dosyalarÄ± kabul edilir' }, { status: 400 });
        }

        const imgDir = path.join(process.cwd(), 'public', 'uploads', 'chapter-end-image');
        if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

        const existing = fs.readdirSync(imgDir);
        for (const f of existing) {
            try { fs.unlinkSync(path.join(imgDir, f)); } catch {}
        }

        const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
        const fileName = `end-image${ext}`;
        const filePath = path.join(imgDir, fileName);
        const publicPath = `/uploads/chapter-end-image/${fileName}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES (?, ?)').run('chapter_end_image_path', publicPath);
        db.prepare('INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES (?, ?)').run('chapter_end_image_abs_path', filePath);

        return NextResponse.json({ path: publicPath, message: 'BÃ¶lÃ¼m sonu gÃ¶rseli baÅŸarÄ±yla yÃ¼klendi' });
    } catch (err) {
        console.error('BÃ¶lÃ¼m sonu gÃ¶rseli yÃ¼kleme hatasÄ±:', err);
        return NextResponse.json({ error: 'GÃ¶rsel yÃ¼klenemedi: ' + err.message }, { status: 500 });
    }
}

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
        const absPath = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get('chapter_end_image_abs_path');

        if (absPath?.setting_value && fs.existsSync(absPath.setting_value)) {
            fs.unlinkSync(absPath.setting_value);
        }

        db.prepare("DELETE FROM app_settings WHERE setting_key IN ('chapter_end_image_path', 'chapter_end_image_abs_path')").run();

        return NextResponse.json({ message: 'BÃ¶lÃ¼m sonu gÃ¶rseli silindi' });
    } catch (err) {
        return NextResponse.json({ error: 'GÃ¶rsel silinemedi: ' + err.message }, { status: 500 });
    }
}
