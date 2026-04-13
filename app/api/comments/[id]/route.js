import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(request, { params }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id } = await params;
        const { content } = await request.json();

        if (!content || !String(content).trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const trimmed = String(content).trim();
        if (trimmed.length > 2000) {
            return NextResponse.json({ error: 'Comment too long (max 2000 characters)' }, { status: 400 });
        }

        const db = getDb();
        const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        if (comment.user_id !== user.id && user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        db.prepare('UPDATE comments SET content = ? WHERE id = ?').run(trimmed, id);

        return NextResponse.json({ message: 'Comment updated', content: trimmed });
    } catch (error) {
        console.error('PATCH /api/comments/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id } = await params;
        const db = getDb();

        const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        // Only owner or admin can delete
        if (comment.user_id !== user.id && user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        db.prepare('DELETE FROM comments WHERE id = ?').run(id);

        return NextResponse.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('DELETE /api/comments/[id] error:', error);
        return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }
}