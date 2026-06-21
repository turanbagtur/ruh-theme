import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const db = getDb();
        const rows = db.prepare('SELECT setting_key, setting_value FROM app_settings').all();
        const settings = {};
        rows.forEach(r => { settings[r.setting_key] = r.setting_value });
        return NextResponse.json({ success: true, settings }, {
            headers: {
                // 30 saniyelik client cache — admin kaydettiğinde zaten sayfayı yeniler
                // no-store yerine kısa TTL: her mount'ta network isteği yapmak yerine
                // tarayıcı cache'i kullanılır, gereksiz DB sorgusu azalır
                'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
    }
}
