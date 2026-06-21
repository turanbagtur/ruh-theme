import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = requireAuth(request);
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = getDb();
    const logs = db.prepare(`
      SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 200
    `).all();
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('GET /api/admin/logs error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = requireAuth(request);
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { action, details } = await request.json();
    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }
    const db = getDb();
    db.prepare(`
      INSERT INTO admin_logs (admin_id, admin_username, action, details)
      VALUES (?, ?, ?, ?)
    `).run(user.id, user.username, action, details || null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/admin/logs error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
