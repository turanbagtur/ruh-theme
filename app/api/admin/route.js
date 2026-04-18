import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateSlug } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { saveApiKey, getActiveApiKey, SUPPORTED_LANGUAGES } from '@/lib/torii';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
        requireAdmin(request);
        const formData = await request.formData();
        const action = formData.get('action');

        if (action === 'save-api-key') {
            const keyName = formData.get('keyName') || 'Default Key';
            const apiKey = formData.get('apiKey');
            if (!apiKey) return NextResponse.json({ error: 'API key is required' }, { status: 400 });
            saveApiKey(keyName, apiKey, 'torii');
            return NextResponse.json({ message: 'API key saved securely' });
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

            let coverUrl = '/demo/cover1.jpg';
            const coverFile = formData.get('cover');
            if (coverFile && coverFile.size > 0) {
                try {
                    const coverDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
                    if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });
                    const rawBuffer = Buffer.from(await coverFile.arrayBuffer());
                    let fileBuffer, fileName;
                    try {
                        fileBuffer = await toWebP(rawBuffer, 90);
                        fileName = `cover_${uuidv4()}.webp`;
                    } catch {
                        fileBuffer = rawBuffer;
                        const ext = path.extname(coverFile.name || '') || '.jpg';
                        fileName = `cover_${uuidv4()}${ext}`;
                    }
                    fs.writeFileSync(path.join(coverDir, fileName), fileBuffer);
                    coverUrl = `/uploads/covers/${fileName}`;
                } catch (coverErr) {
                    console.error('Cover upload error:', coverErr.message);
                }
            }

            const slug = makeUniqueSlug(db, title);
            const result = db.prepare(
                'INSERT INTO series (title, slug, description, cover_url, author, artist, status, type, genres, rating, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).run(title, slug, description, coverUrl, author, artist, status, type, genres, rating, published);

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

            let coverUrl = null;
            const coverFile = formData.get('cover');
            if (coverFile && coverFile.size > 0) {
                try {
                    const coverDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
                    if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });
                    const rawBuffer = Buffer.from(await coverFile.arrayBuffer());
                    let fileBuffer, fileName;
                    try {
                        fileBuffer = await toWebP(rawBuffer, 90);
                        fileName = `cover_${uuidv4()}.webp`;
                    } catch {
                        fileBuffer = rawBuffer;
                        const ext = path.extname(coverFile.name || '') || '.jpg';
                        fileName = `cover_${uuidv4()}${ext}`;
                    }
                    fs.writeFileSync(path.join(coverDir, fileName), fileBuffer);
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

            if (coverUrl) {
                db.prepare('UPDATE series SET title=?, slug=?, description=?, cover_url=?, author=?, artist=?, status=?, type=?, genres=?, rating=?, published=? WHERE id=?')
                    .run(title, slug, description, coverUrl, author, artist, status, type, genres, rating, published, seriesId);
            } else {
                db.prepare('UPDATE series SET title=?, slug=?, description=?, author=?, artist=?, status=?, type=?, genres=?, rating=?, published=? WHERE id=?')
                    .run(title, slug, description, author, artist, status, type, genres, rating, published, seriesId);
            }

            return NextResponse.json({ message: 'Series updated', slug });
        }

        if (action === 'add-chapter') {
            const db = getDb();
            const seriesId = formData.get('seriesId');
            const chapterNumber = formData.get('chapterNumber');
            const title = formData.get('title') || `Chapter ${chapterNumber}`;

            const result = db.prepare(
                'INSERT INTO chapters (series_id, chapter_number, title) VALUES (?, ?, ?)'
            ).run(seriesId, chapterNumber, title);

            return NextResponse.json({ chapterId: result.lastInsertRowid, message: 'Chapter created' }, { status: 201 });
        }

        if (action === 'delete-chapter') {
            const db = getDb();
            const chapterId = formData.get('chapterId');
            // Delete associated pages files
            const pages = db.prepare('SELECT image_path FROM pages WHERE chapter_id = ?').all(chapterId);
            for (const p of pages) {
                const filePath = path.join(process.cwd(), 'public', p.image_path);
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
                    const filePath = path.join(process.cwd(), 'public', p.image_path);
                    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
                }
                const chapterDir = path.join(process.cwd(), 'public', 'uploads', 'pages', ch.id.toString());
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
                    const filePath = path.join(process.cwd(), 'public', p.image_path);
                    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
                }
                const chapterDir = path.join(process.cwd(), 'public', 'uploads', 'pages', chId.toString());
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

            const pagesDir = path.join(process.cwd(), 'public', 'uploads', 'pages', chapterId.toString());
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
                const filePath = path.join(process.cwd(), 'public', page.image_path);
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
            if (!['user', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
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
                    const filePath = path.join(process.cwd(), 'public', p.image_path);
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
            return NextResponse.json({ message: 'Series deleted' });
        }

        if (action === 'delete-media') {
            const filePath = formData.get('filePath');
            if (!filePath) return NextResponse.json({ error: 'filePath required' }, { status: 400 });
            // Security: only allow deleting from /uploads/ directory
            if (!filePath.startsWith('/uploads/')) {
                return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
            }
            const fullPath = path.join(process.cwd(), 'public', filePath);
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
        requireAdmin(request);
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');
        const action = searchParams.get('action');

        // Media listing
        if (action === 'list-media') {
            const mediaFiles = [];
            const uploadsBase = path.join(process.cwd(), 'public', 'uploads');
            const scanDir = (dirPath, category) => {
                if (!fs.existsSync(dirPath)) return;
                try {
                    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
                        const full = path.join(dirPath, entry.name);
                        if (entry.isDirectory()) {
                            scanDir(full, category);
                        } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(entry.name)) {
                            try {
                                const stat = fs.statSync(full);
                                const relativePath = full.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/');
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
            return NextResponse.json({ media: mediaFiles, total: mediaFiles.length });
        }

        // If requesting a specific series detail for admin
        if (seriesId) {
            const series = db.prepare('SELECT * FROM series WHERE id = ?').get(seriesId);
            if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

            const chapters = db.prepare(`
                SELECT ch.*, 
                    (SELECT COUNT(*) FROM pages WHERE chapter_id = ch.id) as page_count,
                    (SELECT COUNT(DISTINCT t.language_code) FROM translations t JOIN pages p ON t.page_id = p.id WHERE p.chapter_id = ch.id) as translation_count
                FROM chapters ch 
                WHERE ch.series_id = ? 
                ORDER BY ch.chapter_number ASC
            `).all(seriesId);

            return NextResponse.json({ series, chapters });
        }

        const users = db.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC').all();
        const recentComments = db.prepare(`
      SELECT c.id, c.content, c.created_at, u.username,
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

        const uploadsSize = getDirSize(path.join(process.cwd(), 'public', 'uploads'));
        const translationsSize = getDirSize(path.join(process.cwd(), 'public', 'translations'));
        const dbPath = process.env.DATABASE_PATH || './data/manga.db';
        let dbSize = 0;
        try { dbSize = fs.statSync(path.join(process.cwd(), dbPath)).size; } catch {}

        const stats = {
            totalSeries: db.prepare('SELECT COUNT(*) as count FROM series').get().count,
            totalChapters: db.prepare('SELECT COUNT(*) as count FROM chapters').get().count,
            totalPages: db.prepare('SELECT COUNT(*) as count FROM pages').get().count,
            totalTranslations: db.prepare('SELECT COUNT(*) as count FROM translations').get().count,
            totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
            totalComments: db.prepare('SELECT COUNT(*) as count FROM comments').get().count,
            hasApiKey: !!getActiveApiKey(),
            supportedLanguages: SUPPORTED_LANGUAGES,
            users,
            recentComments,
            allSeries,
            storage: {
                uploads: { bytes: uploadsSize, formatted: formatBytes(uploadsSize) },
                translations: { bytes: translationsSize, formatted: formatBytes(translationsSize) },
                database: { bytes: dbSize, formatted: formatBytes(dbSize) },
                total: { bytes: uploadsSize + translationsSize + dbSize, formatted: formatBytes(uploadsSize + translationsSize + dbSize) },
            },
        };
        return NextResponse.json(stats);
    } catch (error) {
        console.error('GET /api/admin error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
    }
}
