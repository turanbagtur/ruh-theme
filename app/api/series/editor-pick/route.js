import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
    try {
        const db = getDb();
        
        // Get all published series IDs
        const ids = db.prepare('SELECT id FROM series WHERE published = 1 ORDER BY id ASC').all();
        
        if (ids.length === 0) {
             return NextResponse.json({ series: null });
        }

        // Use today's date string as a seed to pick one id (changes every day)
        const today = new Date().toISOString().split('T')[0];
        let hash = 0;
        for (let i = 0; i < today.length; i++) {
            hash = today.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const index = Math.abs(hash) % ids.length;
        const pickedId = ids[index].id;

        const series = db.prepare(`
            SELECT s.*, COUNT(ch.id) as chapterCount
            FROM series s
            LEFT JOIN chapters ch ON s.id = ch.series_id
            WHERE s.id = ?
            GROUP BY s.id
        `).get(pickedId);

        const finalSeries = {
            ...series,
            genres: JSON.parse(series.genres || '[]'),
        };

        return NextResponse.json({ series: finalSeries });
    } catch (error) {
        console.error('Error fetching editor pick:', error);
        return NextResponse.json({ error: 'Failed to fetch editor pick' }, { status: 500 });
    }
}
