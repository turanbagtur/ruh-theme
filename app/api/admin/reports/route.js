import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = requireAuth(request);
        if (!user || !['admin', 'manager'].includes(user.role)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const reports = db.prepare(`
            SELECT r.*, u.username as username, u.email as email
            FROM bug_reports r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `).all();

        return NextResponse.json({ success: true, reports });
    } catch (error) {
        console.error('Error fetching bug reports:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch bug reports' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = requireAuth(request);
        if (!user || !['admin', 'manager'].includes(user.role)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ success: false, error: 'Id and status are required' }, { status: 400 });
        }

        const db = getDb();
        db.prepare('UPDATE bug_reports SET status = ? WHERE id = ?').run(status, id);

        return NextResponse.json({ success: true, message: 'Rapor durumu güncellendi' });
    } catch (error) {
        console.error('Error updating bug report:', error);
        return NextResponse.json({ success: false, error: 'Failed to update bug report' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const user = requireAuth(request);
        if (!user || !['admin', 'manager'].includes(user.role)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Id is required' }, { status: 400 });
        }

        const db = getDb();
        db.prepare('DELETE FROM bug_reports WHERE id = ?').run(id);

        return NextResponse.json({ success: true, message: 'Rapor silindi' });
    } catch (error) {
        console.error('Error deleting bug report:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete bug report' }, { status: 500 });
    }
}
