import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-me';
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

export function getUserFromRequest(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    return verifyToken(token);
}

export function requireAuth(request) {
    const user = getUserFromRequest(request);
    if (!user) {
        throw new Error('Unauthorized');
    }
    return user;
}

export function requireAdmin(request) {
    const user = requireAuth(request);
    if (user.role !== 'admin') {
        throw new Error('Forbidden');
    }
    return user;
}
