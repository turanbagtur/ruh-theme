import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const user = getUserFromRequest(request);
        if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
        }

        const { id } = await params;
        const db = getDb();

        const comment = db.prepare('SELECT is_pinned FROM comments WHERE id = ?').get(id);
        if (!comment) {
            return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
        }

        const newPinState = comment.is_pinned ? 0 : 1;
        db.prepare('UPDATE comments SET is_pinned = ? WHERE id = ?').run(newPinState, id);

        return NextResponse.json({ success: true, is_pinned: newPinState });
    } catch (error) {
        console.error('PUT /api/comments/[id]/pin error:', error);
        return NextResponse.json({ error: 'İşlem başarısız oldu.' }, { status: 500 });
    }
}
