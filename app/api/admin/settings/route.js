import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
    try {
        const user = requireAuth(request);
        if (!user || !['admin', 'manager'].includes(user.role)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const db = getDb();
        const stmt = db.prepare('INSERT OR REPLACE INTO app_settings (setting_key, setting_value) VALUES (?, ?)');
        
        db.transaction((settingsObj) => {
            for (const [key, value] of Object.entries(settingsObj)) {
                stmt.run(key, String(value));
            }
        })(body);

        try {
            db.prepare('INSERT INTO admin_logs (admin_id, admin_username, action, details) VALUES (?, ?, ?, ?)').run(
                user.id, user.username, 'update_settings', JSON.stringify(body).substring(0, 200)
            );
        } catch (e) { /* log hatası ana işlemi etkilemesin */ }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings save error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
    }
}
