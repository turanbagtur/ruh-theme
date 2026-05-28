import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
    try {
        const db = getDb();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const genreParam = searchParams.get('genre') || '';
        const status = searchParams.get('status') || '';
        const type = searchParams.get('type') || '';
        const sort = searchParams.get('sort') || 'latest';
        const limit = Math.min(parseInt(searchParams.get('limit')) || 24, 100);
        const page = Math.max(parseInt(searchParams.get('page')) || 1, 1);
        const offset = (page - 1) * limit;

        // Multi-genre: comma-separated list for AND filtering
        const genres = genreParam ? genreParam.split(',').map(g => g.trim()).filter(Boolean) : [];

        let whereClause = 'WHERE s.published = 1';
        const params = [];

        if (search) {
            whereClause += ' AND (s.title LIKE ? OR s.author LIKE ? OR s.artist LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Server-side AND filter for every selected genre
        for (const g of genres) {
            whereClause += ' AND s.genres LIKE ?';
            params.push(`%${g}%`);
        }

        if (status) {
            whereClause += ' AND s.status = ?';
            params.push(status);
        }

        if (type) {
            whereClause += ' AND s.type = ?';
            params.push(type);
        }

        const baseQuery = `
            SELECT s.*, COUNT(ch.id) as chapterCount
            FROM series s
            LEFT JOIN chapters ch ON s.id = ch.series_id
            ${whereClause}
            GROUP BY s.id
        `;

        let orderClause;
        switch (sort) {
            case 'popular': orderClause = 'ORDER BY s.views DESC'; break;
            case 'rating':  orderClause = 'ORDER BY s.rating DESC'; break;
            case 'title':   orderClause = 'ORDER BY s.title ASC';  break;
            default:        orderClause = 'ORDER BY s.created_at DESC';
        }

        // Get total count for pagination
        const countRow = db.prepare(
            `SELECT COUNT(*) as cnt FROM (${baseQuery})`
        ).get(...params);
        const total = countRow?.cnt || 0;

        const series = db.prepare(
            `${baseQuery} ${orderClause} LIMIT ? OFFSET ?`
        ).all(...params, limit, offset);

        const withParsedGenres = series.map(s => ({
            ...s,
            genres: JSON.parse(s.genres || '[]'),
        }));

        return NextResponse.json({
            series: withParsedGenres,
            total,
            page,
            hasMore: offset + series.length < total,
        });
    } catch (error) {
        console.error('GET /api/series error:', error);
        return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { requireAuth, hasPermission } = require('@/lib/auth');
        const user = requireAuth(request);
        if (!hasPermission(user, 'manage_series') && user.role !== 'admin' && user.role !== 'manager') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
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
