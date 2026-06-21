import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { optimizeAvatar } from '@/lib/imageOptimizer';

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
        if (user.last_avatar_update) {
            const lastUpdate = new Date(user.last_avatar_update + 'Z').getTime();
            const timeSinceLastUpdate = Date.now() - lastUpdate;
            if (timeSinceLastUpdate < msInDay) {
                // Count changes within the last 24 hours
                // For simplicity: use avatar_changes_today field if available, otherwise allow if >24h since last
                const changesUsed = user.avatar_changes_today || 0;
                if (changesUsed >= 2) {
                    const hoursLeft = Math.ceil((msInDay - timeSinceLastUpdate) / (1000 * 60 * 60));
                    return NextResponse.json({ error: `Profil resmi 24 saatte en fazla 2 kez değiştirilebilir. ${hoursLeft} saat sonra tekrar deneyin.` }, { status: 400 });
                }
            }
        }

        const formData = await request.formData();
        const file = formData.get('avatar');
        const avatarCropData = {
            cropX: parseFloat(formData.get('cropX')) || 0,
            cropY: parseFloat(formData.get('cropY')) || 0,
            cropScale: Math.max(0.01, parseFloat(formData.get('cropScale')) || 1),
        };

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 });
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 2MB.' }, { status: 400 });
        }

        // Prepare file path
        const filename = `${user.id}_${Date.now()}.webp`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

        // Create directory if it doesn't exist
        await mkdir(uploadDir, { recursive: true });

        // Get raw buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Optimize & save via Sharp (200x200 WebP); fallback to original on error
        try {
            await optimizeAvatar(buffer, path.join(uploadDir, filename), avatarCropData);
        } catch (sharpErr) {
            console.error('Sharp avatar optimization failed, saving original:', sharpErr.message);
            await writeFile(path.join(uploadDir, filename), buffer);
        }

        // Update database - increment change counter
        const avatarUrl = `/uploads/avatars/${filename}`;

        // Reset counter if more than 24 hours since last update
        const lastUpdate = user.last_avatar_update ? new Date(user.last_avatar_update + 'Z').getTime() : 0;
        const shouldReset = (Date.now() - lastUpdate) > msInDay;

        if (shouldReset) {
            db.prepare('UPDATE users SET avatar_url = ?, last_avatar_update = CURRENT_TIMESTAMP, avatar_changes_today = 1 WHERE id = ?').run(avatarUrl, user.id);
        } else {
            db.prepare('UPDATE users SET avatar_url = ?, last_avatar_update = CURRENT_TIMESTAMP, avatar_changes_today = COALESCE(avatar_changes_today, 0) + 1 WHERE id = ?').run(avatarUrl, user.id);
        }

        // Return updated user
        const updated = db.prepare('SELECT id, username, email, avatar_url, role, yomi_points, last_daily_login, last_avatar_update, avatar_changes_today, created_at FROM users WHERE id = ?').get(user.id);
        return NextResponse.json({ user: updated, message: 'Avatar updated successfully', avatar_url: avatarUrl });

    } catch (error) {
        console.error('POST /api/auth/profile/avatar error:', error);
        return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }
}
