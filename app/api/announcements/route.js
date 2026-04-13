import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';
        const db = getDb();
        
        let query = 'SELECT * FROM announcements ORDER BY created_at DESC';
        if (activeOnly) {
            query = 'SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC';
        }
        
        const announcements = db.prepare(query).all();
        return NextResponse.json({ announcements });
    } catch(e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request) {
    try {
        let user;
        try {
            user = requireAdmin(request);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const db = getDb();

        if (body.action === 'toggle') {
             db.prepare('UPDATE announcements SET is_active = ? WHERE id = ?').run(body.is_active ? 1 : 0, body.id);
             return NextResponse.json({ success: true });
        }
        if (body.action === 'delete') {
             db.prepare('DELETE FROM announcements WHERE id = ?').run(body.id);
             return NextResponse.json({ success: true });
        }

        db.prepare('INSERT INTO announcements (message, link_url, is_active) VALUES (?, ?, ?)').run(
            body.message, body.link_url || null, body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1
        );
        return NextResponse.json({ success: true });
    } catch(e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
