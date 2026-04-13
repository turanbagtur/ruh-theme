import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

// Maintenance mode cookie max-age: 30 days
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

async function verifyTurnstile(token) {
    const db = getDb();
    const secretRow = db.prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'turnstile_secret_key'").get();
    const secret = secretRow?.setting_value;
    if (!secret || secret === '') return { ok: true }; // Turnstile not configured → skip
    if (!token) return { ok: false, error: 'Human verification required' };

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: token }),
    });
    const data = await res.json();
    if (!data.success) return { ok: false, error: 'Human verification failed. Please try again.' };
    return { ok: true };
}

export async function POST(request) {
    try {
        const { email, password, turnstileToken } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Verify Turnstile if configured
        const turnstile = await verifyTurnstile(turnstileToken);
        if (!turnstile.ok) {
            return NextResponse.json({ error: turnstile.error }, { status: 400 });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user || !verifyPassword(password, user.password_hash)) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const token = generateToken(user);
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
        };

        const response = NextResponse.json({ user: userData, token });
        // Set httpOnly cookie so server components (layout) can read role for maintenance mode
        response.cookies.set('yomi_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: COOKIE_MAX_AGE,
            secure: process.env.NODE_ENV === 'production',
        });
        return response;
    } catch (error) {
        console.error('POST /api/auth/login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
