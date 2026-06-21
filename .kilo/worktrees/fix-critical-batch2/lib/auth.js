import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required but not set.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '7d';

export function hashPassword(password) {
    return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

export function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

/** Reads token from Authorization header OR httpOnly cookie */
export function getUserFromRequest(request) {
    // 1. Try Authorization: Bearer header (API calls from AuthProvider)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        return verifyToken(token);
    }
    // 2. Fallback: httpOnly cookie (server components / direct browser requests)
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)yomi_token=([^;]+)/);
    if (match) {
        return verifyToken(decodeURIComponent(match[1]));
    }
    return null;
}

/**
 * Like getUserFromRequest but also checks banned_until and role freshness from DB.
 * Returns { user: dbRow } or { error, status }.
 */
export function getVerifiedUser(request, db) {
    const payload = getUserFromRequest(request);
    if (!payload) return { error: 'Not authenticated', status: 401 };

    const user = db.prepare(
        'SELECT id, username, email, role, avatar_url, yomi_points, banned_until FROM users WHERE id = ?'
    ).get(payload.id);

    if (!user) return { error: 'User not found', status: 401 };

    if (user.banned_until) {
        const until = new Date(user.banned_until + (user.banned_until.includes('T') ? '' : 'Z'));
        if (until > new Date()) {
            return { error: 'Account suspended', bannedUntil: user.banned_until, status: 403 };
        }
    }

    return { user };
}

export function requireAuth(request) {
    const payload = getUserFromRequest(request);
    if (!payload) throw new Error('Unauthorized');

    const db = getDb();
    const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(payload.id);
    
    if (!user) throw new Error('Unauthorized');
    return user;
}

export function hasPermission(user, requiredPermission) {
    if (!user || !user.role) return false;
    if (user.role === 'admin') return true;

    if (user.role === 'manager') {
        // manager has all permissions EXCEPT managing admins
        return requiredPermission !== 'manage_admins';
    }

    if (user.role === 'moderator') {
        return requiredPermission === 'manage_comments';
    }

    if (user.role === 'team_member') {
        return ['manage_series', 'upload_chapters'].includes(requiredPermission);
    }

    return false;
}

export function requirePermission(request, requiredPermission) {
    const user = requireAuth(request);
    if (!hasPermission(user, requiredPermission)) {
        throw new Error('Forbidden');
    }
    return user;
}

export function requireAdmin(request) {
    const user = requireAuth(request);
    if (user.role !== 'admin') throw new Error('Forbidden');
    return user;
}