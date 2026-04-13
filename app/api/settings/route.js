import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        const rows = db.prepare('SELECT setting_key, setting_value FROM app_settings').all();
        const settings = {};
        rows.forEach(r => { settings[r.setting_key] = r.setting_value });
        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
    }
}
