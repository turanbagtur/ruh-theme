import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateSlug } from '@/lib/db';
import { requireAdmin, requireAuth, hasPermission } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { optimizeCoverImage } from '@/lib/imageOptimizer';

// ── Convert any image buffer to WebP (dynamic import to avoid Next.js bundling sharp) ──
async function toWebP(buffer, quality = 85) {
    const sharp = (await import('sharp')).default;
    return sharp(buffer).webp({ quality }).toBuffer();
}

// Recursively calculate directory size in bytes
function getDirSize(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;
    let total = 0;
    try {
        for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
            const full = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                total += getDirSize(full);
            } else {
                try { total += fs.statSync(full).size; } catch {}
            }
        }
    } catch {}
    return total;
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Generate a unique slug for a series
function makeUniqueSlug(db, title, excludeId = null) {
    let base = generateSlug(title);
    if (!base) base = `series-${Date.now()}`;
    let slug = base;
    let counter = 1;
    while (true) {
        const query = excludeId
            ? 'SELECT id FROM series WHERE slug = ? AND id != ?'
            : 'SELECT id FROM series WHERE slug = ?';
        const args = excludeId ? [slug, excludeId] : [slug];
        const existing = db.prepare(query).get(...args);
        if (!existing) break;
        slug = `${base}-${counter++}`;
    }
    return slug;
}

export async function POST(request) {
    try {
        const user = requireAuth(request);
        const formData = await request.formData();
        const action = formData.get('action');

        // Check basic permissions based on action category
        let requiredPerm = 'admin';
        if (['add-series', 'update-series', 'delete-series', 'delete-media'].includes(action)) requiredPerm = 'manage_series';
        else if (['add-chapter', 'update-chapter', 'delete-chapter', 'delete-all-chapters', 'delete-selected-chapters', 'upload-pages', 'delete-page'].includes(action)) requiredPerm = 'upload_chapters';
        else if (['delete-comment', 'delete-all-user-comments'].includes(action)) requiredPerm = 'manage_comments';
        else if (['delete-user', 'change-user-role', 'reset-user-points', 'add-user-points', 'ban_user'].includes(action)) requiredPerm = 'manage_users';

        if (!hasPermission(user, requiredPerm) && !['admin', 'manager'].includes(user.role) && user.role !== 'manager') {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions for this action' }, { status: 403 });
        }

        // Manager specific restrictions on user management
        if (['delete-user', 'change-user-role', 'ban_user'].includes(action) && user.role === 'manager') {
            const db = getDb();
            const targetUserId = formData.get('userId');
            const targetUser = db.prepare('SELECT role FROM users WHERE id = ?').get(targetUserId);
            if (targetUser && targetUser.role === 'admin') {
                return NextResponse.json({ error: 'Forbidden: Managers cannot modify admin users' }, { status: 403 });
            }
            if (action === 'change-user-role' && formData.get('role') === 'admin') {
                return NextResponse.json({ error: 'Forbidden: Managers cannot assign admin role' }, { status: 403 });
            }
        }

        if (action === 'add-series') {
            const db = getDb();
            const title = formData.get('title');
            const description = formData.get('description') || '';
            const author = formData.get('author') || '';
            const artist = formData.get('artist') || '';
            const status = formData.get('status') || 'ongoing';
            const type = formData.get('type') || 'manga';
            const genres = formData.get('genres') || '[]';
            const rating = parseFloat(formData.get('rating')) || 0;
            const published = parseInt(formData.get('published')) || 0;
            const altNames = formData.get('alt_names') || '';

            let coverUrl = '/demo/cover1.jpg';
            const coverFile = formData.get('cover');
            if (coverFile && coverFile.size > 0) {
                try {
                    const coverDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', 'covers');
                    if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });
                    const rawBuffer = Buffer.from(await coverFile.arrayBuffer());
                    let fileName = `cover_${uuidv4()}.webp`;
                    const coverFilePath = path.join(coverDir, fileName);
                    try {
                        await optimizeCoverImage(rawBuffer, coverFilePath);
                    } catch (coverOptErr) {
                        console.error('Cover image optimization failed, saving original:', coverOptErr.message);
                        const ext = path.extname(coverFile.name || '') || '.jpg';
                        fileName = `cover_${uuidv4()}${ext}`;
                        fs.writeFileSync(path.join(coverDir, fileName), rawBuffer);
                    }
                    coverUrl = `/uploads/covers/${fileName}`;
                } catch (coverErr) {
                    console.error('Cover upload error:', coverErr.message);
                }
            }

            const slug = makeUniqueSlug(db, title);
            // Ensure alt_names column exists
            try { db.prepare('ALTER TABLE series ADD COLUMN alt_names TEXT DEFAULT ""').run(); } catch(e) {}
            const result = db.prepare(
                'INSERT INTO series (title, slug, description, cover_url, author, artist, status, type, genres, rating, published, alt_names) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).run(title, slug, description, coverUrl, author, artist, status, type, genres, rating, published, altNames);

            return NextResponse.json({ seriesId: result.lastInsertRowid, slug, message: published ? 'Series published!' : 'Series saved as draft' }, { status: 201 });
        }

        if (action === 'update-series') {
            const db = getDb();
            const seriesId = formData.get('seriesId');
            const title = formData.get('title');
            const description = formData.get('description') || '';
            const author = formData.get('author') || '';
            const artist = formData.get('artist') || '';
            const status = formData.get('status') || 'ongoing';
            const type = formData.get('type') || 'manga';
            const genres = formData.get('genres') || '[]';
            const rating = parseFloat(formData.get('rating')) || 0;
            const published = parseInt(formData.get('published')) || 0;
            const altNames = formData.get('alt_names') || '';

            let coverUrl = null;
            const coverFile = formData.get('cover');
            if (coverFile && coverFile.size > 0) {
                try {
                    const coverDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', 'covers');
                    if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });
                    const rawBuffer = Buffer.from(await coverFile.arrayBuffer());
                    let fileName = `cover_${uuidv4()}.webp`;
                    const coverFilePath = path.join(coverDir, fileName);
                    try {
                        await optimizeCoverImage(rawBuffer, coverFilePath);
                    } catch (coverOptErr) {
                        console.error('Cover image optimization failed, saving original:', coverOptErr.message);
                        const ext = path.extname(coverFile.name || '') || '.jpg';
                        fileName = `cover_${uuidv4()}${ext}`;
                        fs.writeFileSync(path.join(coverDir, fileName), rawBuffer);
                    }
                    coverUrl = `/uploads/covers/${fileName}`;
                } catch (coverErr) {
                    console.error('Cover update error:', coverErr.message);
                }
            }

            // Regenerate slug if title changed
            const existing = db.prepare('SELECT slug, title FROM series WHERE id = ?').get(seriesId);
            let slug = existing?.slug;
            if (!slug || (existing?.title !== title)) {
                slug = makeUniqueSlug(db, title, seriesId);
            }

            // Ensure alt_names column exists
            try { db.prepare('ALTER TABLE series ADD COLUMN alt_names TEXT DEFAULT ""').run(); } catch(e) {}
            if (coverUrl) {
                db.prepare('UPDATE series SET title=?, slug=?, description=?, cover_url=?, author=?, artist=?, status=?, type=?, genres=?, rating=?, published=?, alt_names=? WHERE id=?')
                    .run(title, slug, description, coverUrl, author, artist, status, type, genres, rating, published, altNames, seriesId);
            } else {
                db.prepare('UPDATE series SET title=?, slug=?, description=?, author=?, artist=?, status=?, type=?, genres=?, rating=?, published=?, alt_names=? WHERE id=?')
                    .run(title, slug, description, author, artist, status, type, genres, rating, published, altNames, seriesId);
            }

            return NextResponse.json({ message: 'Series updated', slug });
        }

        if (action === 'update-chapter') {
            const db = getDb();
            const chapterId = formData.get('chapterId');
            const chapterNumber = formData.get('chapterNumber');
            const title = formData.get('title') || `Chapter ${chapterNumber}`;
            const content = formData.get('content') || null;

            db.prepare(
                'UPDATE chapters SET chapter_number = ?, title = ?, content = ? WHERE id = ?'
            ).run(chapterNumber, title, content, chapterId);

            return NextResponse.json({ message: 'Chapter updated' });
        }

        if (action === 'add-chapter') {
            const db = getDb();
            const seriesId = formData.get('seriesId');
            const chapterNumber = formData.get('chapterNumber');
            const title = formData.get('title') || `Chapter ${chapterNumber}`;
            const content = formData.get('content') || null;

            const result = db.prepare(
                'INSERT INTO chapters (series_id, chapter_number, title, content) VALUES (?, ?, ?, ?)'
            ).run(seriesId, chapterNumber, title, content);

            // Trigger Google Indexing in the background
            try {
                const series = db.prepare('SELECT slug, id FROM series WHERE id = ?').get(seriesId);
                if (series) {
                    const slug = series.slug || series.id;
                    const chUrl = `${BASE_URL}/series/${slug}/chapter/${chapterNumber}`;
                    import('@/lib/googleIndexing').then(({ notifyGoogleIndexing }) => {
                        notifyGoogleIndexing(chUrl);
                    }).catch(() => {});
                }
            } catch (indexingErr) {
                console.error('Google Indexing API trigger error:', indexingErr);
            }

            return NextResponse.json({ chapterId: result.lastInsertRowid, message: 'Chapter created' }, { status: 201 });
        }

        if (action === 'delete-chapter') {
            const db = getDb();
            const chapterId = formData.get('chapterId');
            // Delete associated pages files
            const pages = db.prepare('SELECT image_path FROM pages WHERE chapter_id = ?').all(chapterId);
            for (const p of pages) {
                const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', p.image_path);
                try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
            }
            db.prepare('DELETE FROM pages WHERE chapter_id = ?').run(chapterId);
            db.prepare('DELETE FROM chapters WHERE id = ?').run(chapterId);
            return NextResponse.json({ message: 'Chapter deleted' });
        }

        if (action === 'delete-all-chapters') {
            const db = getDb();
            const seriesId = formData.get('seriesId');
            const chapters = db.prepare('SELECT id FROM chapters WHERE series_id = ?').all(seriesId);
            for (const ch of chapters) {
                const pages = db.prepare('SELECT image_path FROM pages WHERE chapter_id = ?').all(ch.id);
                for (const p of pages) {
                    const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', p.image_path);
                    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
                }
                const chapterDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', 'pages', ch.id.toString());
                try { if (fs.existsSync(chapterDir)) fs.rmSync(chapterDir, { recursive: true, force: true }); } catch { }
            }
            db.prepare('DELETE FROM chapters WHERE series_id = ?').run(seriesId);
            return NextResponse.json({ message: `Deleted all ${chapters.length} chapters successfully` });
        }

        if (action === 'delete-selected-chapters') {
            const db = getDb();
            const chapterIds = JSON.parse(formData.get('chapterIds') || '[]');
            for (const chId of chapterIds) {
                const pages = db.prepare('SELECT image_path FROM pages WHERE chapter_id = ?').all(chId);
                for (const p of pages) {
                    const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', p.image_path);
                    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
                }
                const chapterDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', 'pages', chId.toString());
                try { if (fs.existsSync(chapterDir)) fs.rmSync(chapterDir, { recursive: true, force: true }); } catch { }
                db.prepare('DELETE FROM chapters WHERE id = ?').run(chId);
            }
            return NextResponse.json({ message: `Deleted ${chapterIds.length} selected chapters successfully` });
        }

        if (action === 'upload-pages') {
            const db = getDb();
            const chapterId = formData.get('chapterId');
            const files = formData.getAll('pages');

            if (!files || files.length === 0) return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });

            // Filter to only actual image files — also match by extension since Windows folder
            // picker often sends files with f.type="" even for valid JPGs
            const IMAGE_EXT = /\.(jpe?g|jpg|png|webp|gif|avif|bmp)$/i;
            const imageFiles = files.filter(f =>
                f && typeof f.arrayBuffer === 'function' && f.size > 0 &&
                (
                    (f.type && f.type.startsWith('image/')) ||
                    IMAGE_EXT.test(f.name || '')
                )
            );

            if (imageFiles.length === 0) return NextResponse.json({ error: 'No valid image files found' }, { status: 400 });

            // Get the current max page number for this chapter
            const maxPage = db.prepare('SELECT MAX(page_number) as max FROM pages WHERE chapter_id = ?').get(chapterId);
            const startNum = (maxPage?.max || 0) + 1;

            const pagesDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', 'pages', chapterId.toString());
            if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

            const uploaded = [];
            const errors = [];
            let pageNum = startNum;

            for (const file of imageFiles) {
                try {
                    const rawBuffer = Buffer.from(await file.arrayBuffer());
                    let savedFileName;
                    try {
                        // Try to convert to WebP
                        const webpBuffer = await toWebP(rawBuffer, 85);
                        savedFileName = `page_${String(pageNum).padStart(3, '0')}.webp`;
                        fs.writeFileSync(path.join(pagesDir, savedFileName), webpBuffer);
                    } catch (convErr) {
                        // Fallback: save with original extension if WebP conversion fails
                        console.warn(`WebP conversion failed for ${file.name}, saving original:`, convErr.message);
                        const origExt = (path.extname(file.name || '') || '.jpg').toLowerCase().replace('.jpeg', '.jpg');
                        savedFileName = `page_${String(pageNum).padStart(3, '0')}${origExt}`;
                        fs.writeFileSync(path.join(pagesDir, savedFileName), rawBuffer);
                    }
                    const imagePath = `/uploads/pages/${chapterId}/${savedFileName}`;
                    db.prepare('INSERT INTO pages (chapter_id, page_number, image_path) VALUES (?, ?, ?)').run(chapterId, pageNum, imagePath);
                    uploaded.push(imagePath);
                    pageNum++;
                } catch (fileErr) {
                    console.error(`Failed to process file ${file.name}:`, fileErr.message);
                    errors.push(file.name || `file-${pageNum}`);
                }
            }

            return NextResponse.json({
                uploaded,
                errors,
                message: `${uploaded.length} pages uploaded${errors.length ? `, ${errors.length} failed` : ''}`
            }, { status: 201 });
        }

        if (action === 'delete-page') {
            const db = getDb();
            const pageId = formData.get('pageId');
            const page = db.prepare('SELECT image_path FROM pages WHERE id = ?').get(pageId);
            if (page) {
                const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', page.image_path);
                try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
            }
            db.prepare('DELETE FROM pages WHERE id = ?').run(pageId);
            return NextResponse.json({ message: 'Page deleted' });
        }

        if (action === 'delete-user') {
            const db = getDb();
            const userId = formData.get('userId');
            db.prepare('DELETE FROM users WHERE id = ? AND role != ?').run(userId, 'admin');
            return NextResponse.json({ message: 'User deleted' });
        }

        if (action === 'change-user-role') {
            const db = getDb();
            const userId = formData.get('userId');
            const role = formData.get('role');
            if (!['user', 'team_member', 'moderator', 'manager', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
            db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
            return NextResponse.json({ message: `User role updated to ${role}` });
        }

        if (action === 'reset-user-points') {
            const db = getDb();
            const userId = formData.get('userId');
            db.prepare('UPDATE users SET yomi_points = 0 WHERE id = ?').run(userId);
            return NextResponse.json({ message: 'User points reset' });
        }

        if (action === 'add-user-points') {
            const db = getDb();
            const userId = formData.get('userId');
            const points = parseInt(formData.get('points')) || 0;
            db.prepare('UPDATE users SET yomi_points = yomi_points + ? WHERE id = ?').run(points, userId);
            return NextResponse.json({ message: `Added ${points} Yomi Points to user` });
        }

        if (action === 'delete-comment') {
            const db = getDb();
            const commentId = formData.get('commentId');
            db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
            return NextResponse.json({ message: 'Comment deleted' });
        }

        if (action === 'delete-all-user-comments') {
            const db = getDb();
            const userId = formData.get('userId');
            db.prepare('DELETE FROM comments WHERE user_id = ?').run(userId);
            return NextResponse.json({ message: 'All user comments deleted' });
        }

        if (action === 'delete-series') {
            const db = getDb();
            const seriesId = formData.get('seriesId');
            // Clean up chapter page files
            const chapters = db.prepare('SELECT id FROM chapters WHERE series_id = ?').all(seriesId);
            for (const ch of chapters) {
                const pages = db.prepare('SELECT image_path FROM pages WHERE chapter_id = ?').all(ch.id);
                for (const p of pages) {
                    const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', p.image_path);
                    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
                }
                // Delete translations for pages in this chapter
                db.prepare('DELETE FROM translations WHERE page_id IN (SELECT id FROM pages WHERE chapter_id = ?)').run(ch.id);
                db.prepare('DELETE FROM pages WHERE chapter_id = ?').run(ch.id);
            }
            // Delete associated comments, chapters, favorites, then the series
            db.prepare('DELETE FROM comments WHERE series_id = ?').run(seriesId);
            db.prepare('DELETE FROM comments WHERE chapter_id IN (SELECT id FROM chapters WHERE series_id = ?)').run(seriesId);
            db.prepare('DELETE FROM favorites WHERE series_id = ?').run(seriesId);
            db.prepare('DELETE FROM chapters WHERE series_id = ?').run(seriesId);
            db.prepare('DELETE FROM series WHERE id = ?').run(seriesId);
            // Aktivite logu
            db.prepare('INSERT INTO admin_logs (admin_id, admin_username, action, details) VALUES (?, ?, ?, ?)').run(
                user.id, user.username, 'delete_series', `Deleted series ID: ${seriesId}`
            );
            return NextResponse.json({ message: 'Series deleted' });
        }

        if (action === 'ban_user') {
            const db = getDb();
            const userId = formData.get('userId');
            const days = formData.get('days') ? parseInt(formData.get('days')) : null;
            if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

            let bannedUntil = null;
            if (days && days > 0) {
                const date = new Date();
                date.setDate(date.getDate() + days);
                bannedUntil = date.toISOString();
            }

            db.prepare('UPDATE users SET banned_until = ? WHERE id = ?').run(bannedUntil, userId);

            // Aktivite logu
            const actionText = days && days > 0
                ? `Banned user ID ${userId} for ${days} days`
                : `Unbanned user ID ${userId}`;
            db.prepare('INSERT INTO admin_logs (admin_id, admin_username, action, details) VALUES (?, ?, ?, ?)').run(
                user.id, user.username, days && days > 0 ? 'ban_user' : 'unban_user', actionText
            );

            return NextResponse.json({ success: true, bannedUntil });
        }

        if (action === 'delete-media') {
            const filePath = formData.get('filePath');
            if (!filePath) return NextResponse.json({ error: 'filePath required' }, { status: 400 });
            // Security: only allow deleting from /uploads/ directory
            if (!filePath.startsWith('/uploads/')) {
                return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
            }
            const fullPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', filePath);
            try {
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    return NextResponse.json({ message: 'File deleted' });
                }
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            } catch (err) {
                return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('POST /api/admin error:', error);
        return NextResponse.json({ error: 'Admin action failed' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const user = requireAuth(request);
        if (!['admin', 'manager', 'moderator', 'team_member'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');
        const action = searchParams.get('action');

        // Media listing
        if (action === 'list-media') {
            const page = parseInt(searchParams.get('page')) || 1;
            const limit = parseInt(searchParams.get('limit')) || 50;
            const categoryFilter = searchParams.get('category') || 'all';
            
            const mediaFiles = [];
            const uploadsBase = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads');
            const scanDir = (dirPath, category) => {
                if (!fs.existsSync(dirPath)) return;
                try {
                    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
                        const full = path.join(dirPath, entry.name);
                        if (entry.isDirectory()) {
                            scanDir(full, category);
                        } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(entry.name)) {
                            // Apply category filter instantly if requested 
                            if (categoryFilter !== 'all' && categoryFilter !== category) continue;
                            
                            try {
                                const stat = fs.statSync(full);
                                const relativePath = full.replace(path.join(/*turbopackIgnore: true*/ process.cwd(), 'public'), '').replace(/\\/g, '/');
                                mediaFiles.push({
                                    name: entry.name,
                                    path: relativePath,
                                    category,
                                    size: stat.size,
                                    sizeFormatted: formatBytes(stat.size),
                                    modified: stat.mtime.toISOString(),
                                });
                            } catch {}
                        }
                    }
                } catch {}
            };
            scanDir(path.join(uploadsBase, 'covers'), 'covers');
            scanDir(path.join(uploadsBase, 'avatars'), 'avatars');
            scanDir(path.join(uploadsBase, 'pages'), 'pages');
            
            mediaFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
            
            const total = mediaFiles.length;
            const offset = (page - 1) * limit;
            const paginatedMedia = mediaFiles.slice(offset, offset + limit);
            const hasMore = offset + limit < total;

            return NextResponse.json({ media: paginatedMedia, total, hasMore });
        }

        // Paginated users list
        if (action === 'list_users') {
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '20');
            const offset = (page - 1) * limit;

            const totalCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
            const totalPages = Math.ceil(totalCount / limit);
            const users = db.prepare('SELECT id, username, email, role, created_at, banned_until FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);

            return NextResponse.json({ users, pagination: { page, limit, totalPages, totalCount } });
        }

        // Paginated series list
        if (action === 'list_series') {
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '20');
            const offset = (page - 1) * limit;

            const totalCount = db.prepare('SELECT COUNT(*) as count FROM series').get().count;
            const totalPages = Math.ceil(totalCount / limit);
            const series = db.prepare(`
                SELECT s.id, s.title, s.slug, s.status, s.views, s.rating, s.published, s.cover_url, s.created_at,
                    (SELECT COUNT(*) FROM chapters WHERE series_id = s.id) as chapter_count
                FROM series s ORDER BY s.created_at DESC LIMIT ? OFFSET ?
            `).all(limit, offset);

            return NextResponse.json({ series, pagination: { page, limit, totalPages, totalCount } });
        }

        // Son 7 günlük okuma istatistikleri
        if (action === 'reading_stats') {
            let dailyStats = [];
            try {
                dailyStats = db.prepare(`
                    SELECT date(created_at) as date, COUNT(*) as count
                    FROM read_history
                    WHERE created_at >= date('now', '-7 days')
                    GROUP BY date(created_at)
                    ORDER BY date ASC
                `).all();
            } catch (e) {
                // read_chapters tablosu yoksa boş dön
            }
            return NextResponse.json({ dailyStats });
        }

        // If requesting a specific series detail for admin
        if (seriesId) {
            const series = db.prepare('SELECT * FROM series WHERE id = ?').get(seriesId);
            if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

            const chapters = db.prepare(`
                SELECT ch.*,
                    (SELECT COUNT(*) FROM pages WHERE chapter_id = ch.id) as page_count
                FROM chapters ch
                WHERE ch.series_id = ?
                ORDER BY ch.chapter_number ASC
            `).all(seriesId);

            return NextResponse.json({ series, chapters });
        }

        const users = db.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC').all();
        const recentComments = db.prepare(`
      SELECT c.id, c.content, c.created_at, u.username, c.user_id, u.banned_until,
        COALESCE(ch.title, 'Series Comment') as chapter_title,
        COALESCE(s.title, s2.title) as series_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN chapters ch ON c.chapter_id = ch.id
      LEFT JOIN series s ON ch.series_id = s.id
      LEFT JOIN series s2 ON c.series_id = s2.id
      WHERE c.parent_id IS NULL
      ORDER BY c.created_at DESC LIMIT 20
    `).all();
        const allSeries = db.prepare(`
            SELECT s.id, s.title, s.slug, s.status, s.views, s.rating, s.published, s.cover_url, s.created_at,
                (SELECT COUNT(*) FROM chapters WHERE series_id = s.id) as chapter_count
            FROM series s ORDER BY s.created_at DESC
        `).all();

        const uploadsBase = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads');
        const coversSize = getDirSize(path.join(uploadsBase, 'covers'));
        const avatarsSize = getDirSize(path.join(uploadsBase, 'avatars'));
        const pagesSize = getDirSize(path.join(uploadsBase, 'pages'));
        const uploadsSize = coversSize + avatarsSize + pagesSize;
        const dbPath = process.env.DATABASE_PATH || './data/manga.db';
        let dbSize = 0;
        try { dbSize = fs.statSync(path.join(/*turbopackIgnore: true*/ process.cwd(), dbPath)).size; } catch {}
        const totalStorageBytes = uploadsSize + dbSize;

        let totalTranslations = 0;
        try { totalTranslations = db.prepare('SELECT COUNT(*) as count FROM translated_pages').get()?.count || 0; } catch {}
        let totalViews = 0;
        try { totalViews = db.prepare('SELECT COALESCE(SUM(views),0) as total FROM series').get()?.total || 0; } catch {}
        let totalFavorites = 0;
        try { totalFavorites = db.prepare('SELECT COUNT(*) as count FROM favorites').get()?.count || 0; } catch {}
        let totalReadingList = 0;
        try { totalReadingList = db.prepare('SELECT COUNT(*) as count FROM reading_list').get()?.count || 0; } catch {}

        const stats = {
            totalSeries: db.prepare('SELECT COUNT(*) as count FROM series').get().count,
            totalPublished: db.prepare("SELECT COUNT(*) as count FROM series WHERE published=1").get().count,
            totalChapters: db.prepare('SELECT COUNT(*) as count FROM chapters').get().count,
            totalPages: db.prepare('SELECT COUNT(*) as count FROM pages').get().count,
            totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
            totalComments: db.prepare('SELECT COUNT(*) as count FROM comments').get().count,
            totalTranslations,
            totalViews,
            totalFavorites,
            totalReadingList,
            users,
            recentComments,
            allSeries,
            storage: {
                uploads: { bytes: uploadsSize, formatted: formatBytes(uploadsSize) },
                covers: { bytes: coversSize, formatted: formatBytes(coversSize), pct: totalStorageBytes > 0 ? Math.round(coversSize / totalStorageBytes * 100) : 0 },
                avatars: { bytes: avatarsSize, formatted: formatBytes(avatarsSize), pct: totalStorageBytes > 0 ? Math.round(avatarsSize / totalStorageBytes * 100) : 0 },
                pages: { bytes: pagesSize, formatted: formatBytes(pagesSize), pct: totalStorageBytes > 0 ? Math.round(pagesSize / totalStorageBytes * 100) : 0 },
                translations: { bytes: 0, formatted: formatBytes(0), pct: 0 },
                database: { bytes: dbSize, formatted: formatBytes(dbSize), pct: totalStorageBytes > 0 ? Math.round(dbSize / totalStorageBytes * 100) : 0 },
                total: { bytes: totalStorageBytes, formatted: formatBytes(totalStorageBytes) },
            },
        };
        return NextResponse.json(stats);
    } catch (error) {
        console.error('GET /api/admin error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
    }
}
