import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') {
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Settings save error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
    }
}
