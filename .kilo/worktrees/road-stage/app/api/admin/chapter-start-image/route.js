import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
    try {
        requireAdmin(request);
    } catch {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('chapter_start_image');

        if (!file || typeof file.arrayBuffer !== 'function') {
            return NextResponse.json({ error: 'Görsel dosyası gerekli' }, { status: 400 });
        }

        const allowedTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Sadece PNG, WebP veya JPEG dosyaları kabul edilir' }, { status: 400 });
        }

        const imgDir = path.join(process.cwd(), 'public', 'uploads', 'chapter-start-image');
        if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

        const existing = fs.readdirSync(imgDir);
        for (const f of existing) {
            try { fs.unlinkSync(path.join(imgDir, f)); } catch {}
        }

        const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
        const fileName = `start-image${ext}`;
        const filePath = path.join(imgDir, fileName);
        const publicPath = `/uploads/chapter-start-image/${fileName}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        const db = getDb();
        db.prepare('INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES (?, ?)').run('chapter_start_image_path', publicPath);
        db.prepare('INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES (?, ?)').run('chapter_start_image_abs_path', filePath);

        return NextResponse.json({ path: publicPath, message: 'Bölüm başı görseli başarıyla yüklendi' });
    } catch (err) {
        console.error('Bölüm başı görseli yükleme hatası:', err);
        return NextResponse.json({ error: 'Görsel yüklenemedi: ' + err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        requireAdmin(request);
    } catch {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const db = getDb();
        const absPath = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get('chapter_start_image_abs_path');

        if (absPath?.setting_value && fs.existsSync(absPath.setting_value)) {
            fs.unlinkSync(absPath.setting_value);
        }

        db.prepare("DELETE FROM app_settings WHERE setting_key IN ('chapter_start_image_path', 'chapter_start_image_abs_path')").run();

        return NextResponse.json({ message: 'Bölüm başı görseli silindi' });
    } catch (err) {
        return NextResponse.json({ error: 'Görsel silinemedi: ' + err.message }, { status: 500 });
    }
}