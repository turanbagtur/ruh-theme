import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
    try {
        const db = getDb();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const genre = searchParams.get('genre') || '';
        const status = searchParams.get('status') || '';
        const type = searchParams.get('type') || '';
        const sort = searchParams.get('sort') || 'latest';
        const limit = parseInt(searchParams.get('limit')) || 0;

        // Build base query with chapter count via JOIN (eliminates N+1)
        let query = `
            SELECT s.*, COUNT(ch.id) as chapterCount
            FROM series s
            LEFT JOIN chapters ch ON s.id = ch.series_id
            WHERE s.published = 1
        `;
        const params = [];

        if (search) {
            query += ' AND (s.title LIKE ? OR s.author LIKE ? OR s.artist LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (genre) {
            query += ' AND s.genres LIKE ?';
            params.push(`%${genre}%`);
        }

        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }

        if (type) {
            query += ' AND s.type = ?';
            params.push(type);
        }

        query += ' GROUP BY s.id';

        switch (sort) {
            case 'popular':
                query += ' ORDER BY s.views DESC';
                break;
            case 'rating':
                query += ' ORDER BY s.rating DESC';
                break;
            case 'title':
                query += ' ORDER BY s.title ASC';
                break;
            default:
                query += ' ORDER BY s.created_at DESC';
        }

        if (limit > 0) {
            query += ' LIMIT ?';
            params.push(limit);
        }

        const series = db.prepare(query).all(...params);

        const withParsedGenres = series.map(s => ({
            ...s,
            genres: JSON.parse(s.genres || '[]'),
        }));

        return NextResponse.json({ series: withParsedGenres });
    } catch (error) {
        console.error('GET /api/series error:', error);
        return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        requireAdmin(request);
        const { title, description, cover_url, author, artist, status, genres } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const db = getDb();
        const result = db.prepare(
            'INSERT INTO series (title, description, cover_url, author, artist, status, genres) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(title, description, cover_url || '/demo/cover1.jpg', author, artist, status || 'ongoing', JSON.stringify(genres || []));

        const series = db.prepare('SELECT * FROM series WHERE id = ?').get(result.lastInsertRowid);
        return NextResponse.json({ series }, { status: 201 });
    } catch (error) {
        console.error('POST /api/series error:', error);
        return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
    }
}
