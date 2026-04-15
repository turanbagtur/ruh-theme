import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Ensure series_requests table exists
function ensureTable(db) {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS series_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            series_title TEXT NOT NULL,
            series_type TEXT DEFAULT 'manga',
            author TEXT DEFAULT '',
            description TEXT DEFAULT '',
            source_url TEXT DEFAULT '',
            reason TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            admin_note TEXT DEFAULT '',
            upvotes INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS series_request_votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(request_id, user_id)
        )
    `).run();
}

// GET — list requests
export async function GET(request) {
    try {
        const db = getDb();
        ensureTable(db);

        const { searchParams } = new URL(request.url);
        const adminView = searchParams.get('admin') === '1';
        const userId = searchParams.get('userId');
        const myRequests = searchParams.get('mine') === '1';

        if (adminView) {
            const user = getUserFromRequest(request);
            if (!user || user.role !== 'admin') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const rows = db.prepare(`
                SELECT * FROM series_requests ORDER BY
                    CASE status WHEN 'pending' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,
                    created_at DESC
            `).all();
            return NextResponse.json({ requests: rows });
        }

        if (myRequests && userId) {
            const rows = db.prepare(`
                SELECT * FROM series_requests WHERE user_id = ? ORDER BY created_at DESC
            `).all(userId);
            return NextResponse.json({ requests: rows });
        }

        // Public listing — all requests visible
        const rows = db.prepare(`
            SELECT * FROM series_requests ORDER BY
                CASE status
                    WHEN 'reviewing' THEN 0
                    WHEN 'pending' THEN 1
                    WHEN 'approved' THEN 2
                    WHEN 'added' THEN 3
                    ELSE 4
                END,
                upvotes DESC, created_at DESC
        `).all();

        return NextResponse.json({ requests: rows });
    } catch (error) {
        console.error('GET series-requests error:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

// POST — create / admin actions / upvote
export async function POST(request) {
    try {
        const db = getDb();
        ensureTable(db);

        const body = await request.json();
        const { action } = body;
        const currentUser = getUserFromRequest(request);

        // ── Admin: update status ────────────────────────────────
        if (action === 'update-status') {
            if (!currentUser || currentUser.role !== 'admin') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const { id, status, admin_note } = body;
            if (!id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

            db.prepare(`
                UPDATE series_requests SET status = ?, admin_note = ?, updated_at = datetime('now') WHERE id = ?
            `).run(status, admin_note ?? '', id);

            return NextResponse.json({ ok: true });
        }

        // ── Admin: delete ───────────────────────────────────────
        if (action === 'delete') {
            if (!currentUser || currentUser.role !== 'admin') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            db.prepare('DELETE FROM series_requests WHERE id = ?').run(body.id);
            db.prepare('DELETE FROM series_request_votes WHERE request_id = ?').run(body.id);
            return NextResponse.json({ ok: true });
        }

        // ── Upvote toggle ───────────────────────────────────────
        if (action === 'upvote') {
            if (!currentUser) return NextResponse.json({ error: 'Login required' }, { status: 401 });

            const { id } = body;
            const existing = db.prepare(
                'SELECT id FROM series_request_votes WHERE request_id = ? AND user_id = ?'
            ).get(id, currentUser.id);

            if (existing) {
                db.prepare('DELETE FROM series_request_votes WHERE request_id = ? AND user_id = ?').run(id, currentUser.id);
                db.prepare('UPDATE series_requests SET upvotes = MAX(0, upvotes - 1) WHERE id = ?').run(id);
                return NextResponse.json({ voted: false });
            } else {
                db.prepare('INSERT INTO series_request_votes (request_id, user_id) VALUES (?, ?)').run(id, currentUser.id);
                db.prepare('UPDATE series_requests SET upvotes = upvotes + 1 WHERE id = ?').run(id);
                return NextResponse.json({ voted: true });
            }
        }

        // ── Create new request ──────────────────────────────────
        if (!currentUser) {
            return NextResponse.json({ error: 'Login required to submit a request' }, { status: 401 });
        }

        const { series_title, series_type, author, description, source_url, reason } = body;
        if (!series_title?.trim()) {
            return NextResponse.json({ error: 'Series title is required' }, { status: 400 });
        }

        // Prevent duplicates: same user + same title within 7 days
        const dup = db.prepare(`
            SELECT id FROM series_requests
            WHERE user_id = ? AND LOWER(series_title) = LOWER(?) AND created_at >= datetime('now', '-7 days')
        `).get(currentUser.id, series_title.trim());

        if (dup) {
            return NextResponse.json({ error: 'You already requested this series recently.' }, { status: 409 });
        }

        const result = db.prepare(`
            INSERT INTO series_requests (user_id, username, series_title, series_type, author, description, source_url, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            currentUser.id,
            currentUser.username,
            series_title.trim(),
            series_type || 'manga',
            (author || '').trim(),
            (description || '').trim(),
            (source_url || '').trim(),
            (reason || '').trim()
        );

        return NextResponse.json({ ok: true, id: result.lastInsertRowid });
    } catch (error) {
        console.error('POST series-requests error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}