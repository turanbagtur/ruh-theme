import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { optimizeProfileCover } from '@/lib/imageOptimizer';

export async function POST(request) {
    try {
        const userData = getUserFromRequest(request);
        if (!userData) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userData.id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 24-hour cooldown check with 2 changes per 24h limit
        const msInDay = 24 * 60 * 60 * 1000;
        if (user.last_cover_update) {
            const lastUpdate = new Date(user.last_cover_update + 'Z').getTime();
            const timeSinceLastUpdate = Date.now() - lastUpdate;
            if (timeSinceLastUpdate < msInDay) {
                const changesUsed = user.cover_changes_today || 0;
                if (changesUsed >= 2) {
                    const hoursLeft = Math.ceil((msInDay - timeSinceLastUpdate) / (1000 * 60 * 60));
                    return NextResponse.json({ error: `Kapak resmi 24 saatte en fazla 2 kez değiştirilebilir. ${hoursLeft} saat sonra tekrar deneyin.` }, { status: 400 });
                }
            }
        }

        const formData = await request.formData();
        const file = formData.get('cover');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 });
        }

        // Validate file size (max 5MB for covers)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
        }

        // Prepare file path
        const filename = `${user.id}_cover_${Date.now()}.webp`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers');

        // Create directory if it doesn't exist
        await mkdir(uploadDir, { recursive: true });

        // Get raw buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Canvas tabanlı kırpma parametrelerini al
        const cropX = parseFloat(formData.get('cropX')) || 0;
        const cropY = parseFloat(formData.get('cropY')) || 0;
        const cropScale = parseFloat(formData.get('cropScale')) || 1;
        const cropApplied = formData.get('cropApplied') === 'true';
        const viewportWidth = parseInt(formData.get('viewportWidth')) || 800;
        const viewportHeight = parseInt(formData.get('viewportHeight')) || 180;
        const outputWidth = parseInt(formData.get('outputWidth')) || 1200;
        const outputHeight = parseInt(formData.get('outputHeight')) || 400;

        // Optimize & save via Sharp (1200x400 WebP); fallback to original on error
        try {
            const cropOptions = {
                cropX,
                cropY,
                cropScale,
                cropApplied,
                viewportWidth,
                viewportHeight,
                outputWidth,
                outputHeight
            };
            await optimizeProfileCover(buffer, path.join(uploadDir, filename), cropOptions);
        } catch (sharpErr) {
            console.error('Sharp cover optimization failed, saving original:', sharpErr.message);
            await writeFile(path.join(uploadDir, filename), buffer);
        }

        // Update database - increment change counter
        const coverUrl = `/uploads/covers/${filename}`;

        // Reset counter if more than 24 hours since last update
        const lastUpdateMs = user.last_cover_update ? new Date(user.last_cover_update + 'Z').getTime() : 0;
        const shouldReset = (Date.now() - lastUpdateMs) > msInDay;

        if (shouldReset) {
            db.prepare('UPDATE users SET cover_url = ?, last_cover_update = CURRENT_TIMESTAMP, cover_changes_today = 1 WHERE id = ?').run(coverUrl, user.id);
        } else {
            db.prepare('UPDATE users SET cover_url = ?, last_cover_update = CURRENT_TIMESTAMP, cover_changes_today = COALESCE(cover_changes_today, 0) + 1 WHERE id = ?').run(coverUrl, user.id);
        }

        // Return updated user
        const updated = db.prepare('SELECT id, username, email, avatar_url, cover_url, role, yomi_points, last_daily_login, last_avatar_update, last_cover_update, cover_changes_today, created_at FROM users WHERE id = ?').get(user.id);
        return NextResponse.json({ user: updated, message: 'Cover updated successfully', cover_url: coverUrl });

    } catch (error) {
        console.error('POST /api/auth/profile/cover error:', error);
        return NextResponse.json({ error: 'Failed to upload cover' }, { status: 500 });
    }
}
