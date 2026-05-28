import { NextResponse } from 'next/server';

const TENOR_API_KEY = process.env.TENOR_API_KEY || 'AIzaSyAyimkuEcduhJ3EP7XnIn7XVs0L2Os9M3g';
const TENOR_BASE = 'https://tenor.googleapis.com/v2';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    try {
        const endpoint = q.trim()
            ? `${TENOR_BASE}/search?q=${encodeURIComponent(q.trim())}&key=${TENOR_API_KEY}&limit=${limit}&media_filter=gif,tinygif,nanogif`
            : `${TENOR_BASE}/featured?key=${TENOR_API_KEY}&limit=${limit}&media_filter=gif,tinygif,nanogif`;

        const res = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({ results: [], error: text }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({ results: data.results || [] });
    } catch (e) {
        return NextResponse.json({ results: [], error: e.message }, { status: 500 });
    }
}