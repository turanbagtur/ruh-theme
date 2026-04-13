import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

// Username: 3-30 chars, alphanumeric + underscore only
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
// Basic email format check
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
        const body = await request.json();
        const username = typeof body.username === 'string' ? body.username.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const turnstileToken = body.turnstileToken || '';

        if (!username || !email || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (!USERNAME_REGEX.test(username)) {
            return NextResponse.json(
                { error: 'Username must be 3-30 characters and contain only letters, numbers, or underscores' },
                { status: 400 }
            );
        }

        if (!EMAIL_REGEX.test(email)) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        if (password.length > 128) {
            return NextResponse.json({ error: 'Password is too long (max 128 characters)' }, { status: 400 });
        }

        // Verify Turnstile if configured
        const turnstile = await verifyTurnstile(turnstileToken);
        if (!turnstile.ok) {
            return NextResponse.json({ error: turnstile.error }, { status: 400 });
        }

        const db = getDb();

        const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
        if (existing) {
            return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
        }

        const passwordHash = hashPassword(password);
        const result = db.prepare(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        ).run(username, email, passwordHash);

        const user = { id: result.lastInsertRowid, username, email, role: 'user' };
        const token = generateToken(user);

        return NextResponse.json({ user, token }, { status: 201 });
    } catch (error) {
        console.error('POST /api/auth/register error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
