import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

        // 24-hour cooldown check
        if (user.last_avatar_update) {
            const msInDay = 24 * 60 * 60 * 1000;
            const lastUpdate = new Date(user.last_avatar_update + 'Z').getTime();
            if (Date.now() - lastUpdate < msInDay) {
                return NextResponse.json({ error: 'Profile picture can only be changed once every 24 hours.' }, { status: 400 });
            }
        }

        const formData = await request.formData();
        const file = formData.get('avatar');

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
        const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
        const filename = `${user.id}_${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        
        // Create directory if it doesn't exist
        await mkdir(uploadDir, { recursive: true });

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(path.join(uploadDir, filename), buffer);

        // Update database
        const avatarUrl = `/uploads/avatars/${filename}`;
        db.prepare('UPDATE users SET avatar_url = ?, last_avatar_update = CURRENT_TIMESTAMP WHERE id = ?').run(avatarUrl, user.id);

        // Return updated user
        const updated = db.prepare('SELECT id, username, email, avatar_url, role, yomi_points, last_daily_login, last_avatar_update, created_at FROM users WHERE id = ?').get(user.id);
        return NextResponse.json({ user: updated, message: 'Avatar updated successfully', avatar_url: avatarUrl });

    } catch (error) {
        console.error('POST /api/auth/profile/avatar error:', error);
        return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }
}
