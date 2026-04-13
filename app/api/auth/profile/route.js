import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request) {
    try {
        const userData = getUserFromRequest(request);
        if (!userData) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { username, email, currentPassword, newPassword, avatar_url } = await request.json();
        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userData.id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update username
        if (username && username !== user.username) {
            const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, user.id);
            if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
            db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, user.id);
        }

        // Update email
        if (email && email !== user.email) {
            const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, user.id);
            if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
            db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, user.id);
        }

        // Update password
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
            }
            const valid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!valid) {
                return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
            }
            if (newPassword.length < 6) {
                return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
            }
            const hash = await bcrypt.hash(newPassword, 12);
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
        }

        // Update Avatar with 24-hour limit
        if (avatar_url && avatar_url !== user.avatar_url) {
            if (user.last_avatar_update) {
                const msInDay = 24 * 60 * 60 * 1000;
                // Treat last_avatar_update as UTC to compare with Date.now()
                // Replace ' ' with 'T' and add 'Z' to make it ISO 8601 if SQLite stores it without timezone
                const lastUpdate = new Date(user.last_avatar_update + 'Z').getTime();
                if (Date.now() - lastUpdate < msInDay) {
                    return NextResponse.json({ error: 'Profile picture can only be changed once every 24 hours.' }, { status: 400 });
                }
            }
            db.prepare('UPDATE users SET avatar_url = ?, last_avatar_update = CURRENT_TIMESTAMP WHERE id = ?').run(avatar_url, user.id);
        }

        // Return updated user
        const updated = db.prepare('SELECT id, username, email, avatar_url, role, yomi_points, last_daily_login, last_avatar_update, created_at FROM users WHERE id = ?').get(user.id);
        return NextResponse.json({ user: updated, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('PUT /api/auth/profile error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
