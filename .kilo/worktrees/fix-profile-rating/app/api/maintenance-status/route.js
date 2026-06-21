import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Cache-Control: no-store to always return fresh data
export async function GET() {
    try {
        const db = getDb();
        const row = db.prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'maintenance_mode'").get();
        const maintenance = row?.setting_value === '1';
        return NextResponse.json({ maintenance }, {
            headers: { 'Cache-Control': 'no-store' }
        });
    } catch {
        return NextResponse.json({ maintenance: false }, {
            headers: { 'Cache-Control': 'no-store' }
        });
    }
}