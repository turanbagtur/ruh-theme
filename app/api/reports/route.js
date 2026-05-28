import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const { title, description } = body;

        if (!title || !description) {
            return NextResponse.json({ success: false, error: 'Başlık ve açıklama alanları zorunludur' }, { status: 400 });
        }

        const user = getUserFromRequest(request);
        const userId = user ? user.id : null;

        const db = getDb();
        db.prepare('INSERT INTO bug_reports (user_id, title, description) VALUES (?, ?, ?)').run(
            userId, title, description
        );

        return NextResponse.json({ success: true, message: 'Hata bildirimi başarıyla gönderildi' });
    } catch (error) {
        console.error('Error submitting bug report:', error);
        return NextResponse.json({ success: false, error: 'Hata bildirimi gönderilemedi' }, { status: 500 });
    }
}
