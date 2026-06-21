import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateSlug } from '@/lib/db';
import { requireAdmin, requireAuth, hasPermission } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { optimizeCoverImage, optimizeChapterPage } from '@/lib/imageOptimizer';

// ── Convert any image buffer to WebP (dynamic import to avoid Next.js bundling sharp) ──
async function toWebP(buffer, quality = 85) {
    const sharp = (await import('sharp')).default;
    return sharp(buffer).webp({ quality }).toBuffer();
}

// Paylaşılan bölüm başı/sonu görsellerini kazara silmekten korur
// Bu yollar her bölüm için tek bir fiziksel dosyaya referans verir; silinmemeli.
function isSharedChapterImage(imagePath) {
    return typeof imagePath === 'string' && (
        imagePath.includes('/uploads/chapter-start-image/') ||
        imagePath.includes('/uploads/chapter-end-image/')
    );
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

            const isAdult = parseInt(formData.get('is_adult')) === 1 ? 1 : 0;
            const slug = makeUniqueSlug(db, title);
            // Ensure alt_names column exists
            try { db.prepare('ALTER TABLE series ADD COLUMN alt_names TEXT DEFAULT ""').run(); } catch(e) {}
            // Ensure is_adult column exists
            try { db.prepare('ALTER TABLE series ADD COLUMN is_adult INTEGER DEFAULT 0').run(); } catch(e) {}
            const result = db.prepare(
                'INSERT INTO series (title, slug, description, cover_url, author, artist, status, type, genres, rating, published, alt_names, is_adult) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).run(title, slug, description, coverUrl, author, artist, status, type, genres, rating, published, altNames, isAdult);

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

            const isAdult = parseInt(formData.get('is_adult')) === 1 ? 1 : 0;
            // Ensure alt_names column exists
            try { db.prepare('ALTER TABLE series ADD COLUMN alt_names TEXT DEFAULT ""').run(); } catch(e) {}
            // Ensure is_adult column exists
            try { db.prepare('ALTER TABLE series ADD COLUMN is_adult INTEGER DEFAULT 0').run(); } catch(e) {}
            if (coverUrl) {
                db.prepare('UPDATE series SET title=?, slug=?, description=?, cover_url=?, author=?, artist=?, status=?, type=?, genres=?, rating=?, published=?, alt_names=?, is_adult=? WHERE id=?')
                    .run(title, slug, description, coverUrl, author, artist, status, type, genres, rating, published, altNames, isAdult, seriesId);
            } else {
                db.prepare('UPDATE series SET title=?, slug=?, description=?, author=?, artist=?, status=?, type=?, genres=?, rating=?, published=?, alt_names=?, is_adult=? WHERE id=?')
                    .run(title, slug, description, author, artist, status, type, genres, rating, published, altNames, isAdult, seriesId);
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
            const publishAt = formData.get('publishAt') || null;

            const result = db.prepare(
                'INSERT INTO chapters (series_id, chapter_number, title, content, publish_at) VALUES (?, ?, ?, ?, ?)'
            ).run(seriesId, chapterNumber, title, content, publishAt);

            // Trigger Google Indexing in the background
            try {
                const series = db.prepare('SELECT slug, id FROM series WHERE id = ?').get(seriesId);
                if (series) {
                    const slug = series.slug || series.id;
                    const chUrl = `${BASE_URL}/seri/${slug}/bolum/${chapterNumber}`;
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
            // Delete associated pages files (paylaşılan görseller korunur)
            const pages = db.prepare('SELECT image_path FROM pages WHERE chapter_id = ?').all(chapterId);
            for (const p of pages) {
                if (isSharedChapterImage(p.image_path)) continue;
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
                    if (isSharedChapterImage(p.image_path)) continue;
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
                    if (isSharedChapterImage(p.image_path)) continue;
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
            const isLastChunk = formData.get('isLastChunk') === '1';
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

            // Watermark ayarlarını veritabanından oku
            const wmKeys = ['watermark_enabled', 'watermark_abs_path', 'watermark_position', 'watermark_opacity', 'watermark_scale'];
            const wmRows = db.prepare(`SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN (${wmKeys.map(() => '?').join(',')})`)
                .all(...wmKeys);
            const wmSettings = Object.fromEntries(wmRows.map(r => [r.setting_key, r.setting_value]));
            const watermarkOptions = {
                enabled: wmSettings.watermark_enabled || '0',
                path: wmSettings.watermark_abs_path || '',
                position: wmSettings.watermark_position || 'bottom-right',
                opacity: wmSettings.watermark_opacity || '60',
                scale: wmSettings.watermark_scale || '15'
            };

            // Get the current max page number for this chapter
            const maxPage = db.prepare('SELECT MAX(page_number) as max FROM pages WHERE chapter_id = ?').get(chapterId);
            const startNum = (maxPage?.max || 0) + 1;

            const pagesDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', 'pages', chapterId.toString());
            if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

            const uploaded = [];
            const errors = [];
            let pageNum = startNum;

            // ── Bölüm başı görseli ekle (sadece ilk yüklemede, etkinse) ──
            // Dosya kopyalanmaz — paylaşılan tek görsel yoluna referans eklenir
            if (startNum === 1) {
                const csiRows = db.prepare(
                    "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('chapter_start_image_enabled', 'chapter_start_image_abs_path', 'chapter_start_image_path')"
                ).all();
                const csiSettings = Object.fromEntries(csiRows.map(r => [r.setting_key, r.setting_value]));

                if (
                    csiSettings.chapter_start_image_enabled === '1' &&
                    csiSettings.chapter_start_image_path &&
                    csiSettings.chapter_start_image_abs_path &&
                    fs.existsSync(csiSettings.chapter_start_image_abs_path)
                ) {
                    try {
                        // Dosyayı kopyalamak yerine paylaşılan görselin yolunu doğrudan kaydet
                        db.prepare('INSERT INTO pages (chapter_id, page_number, image_path) VALUES (?, ?, ?)').run(chapterId, pageNum, csiSettings.chapter_start_image_path);
                        uploaded.push(csiSettings.chapter_start_image_path);
                        pageNum++;
                    } catch (startErr) {
                        console.warn('Bölüm başı görseli eklenemedi:', startErr.message);
                    }
                }
            }

            for (const file of imageFiles) {
                try {
                    const rawBuffer = Buffer.from(await file.arrayBuffer());
                    let savedFileName;
                    // Use indirection to prevent Turbopack from statically tracing the uploads path
                    const joinPath = (...args) => path.join(...args);
                    try {
                        // Try to convert to WebP and resize (with optional watermark)
                        savedFileName = `page_${String(pageNum).padStart(3, '0')}.webp`;
                        const pageFilePath = joinPath(pagesDir, savedFileName);
                        await optimizeChapterPage(rawBuffer, pageFilePath, watermarkOptions);
                    } catch (convErr) {
                        // Fallback: save with original extension if WebP conversion fails
                        console.warn(`WebP conversion failed for ${file.name}, saving original:`, convErr.message);
                        const origExt = (path.extname(file.name || '') || '.jpg').toLowerCase().replace('.jpeg', '.jpg');
                        savedFileName = `page_${String(pageNum).padStart(3, '0')}${origExt}`;
                        fs.writeFileSync(joinPath(pagesDir, savedFileName), rawBuffer);
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

            // ── Bölüm sonu görseli ekle (sadece son chunk'ta, etkinse ve dosya varsa) ──
            if (!isLastChunk) {
                return NextResponse.json({
                    uploaded,
                    errors,
                    message: `${uploaded.length} pages uploaded${errors.length ? `, ${errors.length} failed` : ''}`
                }, { status: 201 });
            }

            const ceiRows = db.prepare(
                "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('chapter_end_image_enabled', 'chapter_end_image_abs_path', 'chapter_end_image_path')"
            ).all();
            const ceiSettings = Object.fromEntries(ceiRows.map(r => [r.setting_key, r.setting_value]));

            // ── Bölüm sonu görseli ekle ──
            // Dosya kopyalanmaz — paylaşılan tek görsel yoluna referans eklenir
            if (
                ceiSettings.chapter_end_image_enabled === '1' &&
                ceiSettings.chapter_end_image_path &&
                ceiSettings.chapter_end_image_abs_path &&
                fs.existsSync(ceiSettings.chapter_end_image_abs_path)
            ) {
                try {
                    // Dosyayı kopyalamak yerine paylaşılan görselin yolunu doğrudan kaydet
                    db.prepare('INSERT INTO pages (chapter_id, page_number, image_path) VALUES (?, ?, ?)').run(chapterId, pageNum, ceiSettings.chapter_end_image_path);
                    uploaded.push(ceiSettings.chapter_end_image_path);
                } catch (endErr) {
                    console.warn('Bölüm sonu görseli eklenemedi:', endErr.message);
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
                // Paylaşılan bölüm başı/sonu görseliyse dosyayı silme — sadece DB kaydını kaldır
                if (!isSharedChapterImage(page.image_path)) {
                    const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', page.image_path);
                    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
                }
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
            // Clean up chapter page files (paylaşılan görseller korunur)
            const chapters = db.prepare('SELECT id FROM chapters WHERE series_id = ?').all(seriesId);
            for (const ch of chapters) {
                const pages = db.prepare('SELECT image_path FROM pages WHERE chapter_id = ?').all(ch.id);
                for (const p of pages) {
                    if (isSharedChapterImage(p.image_path)) continue;
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

            // Sistem varsayılan görselleri fiziksel olarak silinmemeli
            const PROTECTED_PATHS = new Set([
                '/default-avatar.png', '/avatar.png',
                '/default-cover.png', '/default-cover.jpg',
                '/demo/cover1.jpg',
            ]);
            if (PROTECTED_PATHS.has(filePath)) {
                return NextResponse.json({ success: true, message: 'Sistem varsayılan görseli korundu' });
            }

            // External URLs — only DB cleanup, no physical delete
            const isExternal = filePath.startsWith('http://') || filePath.startsWith('https://');

            // Normalize relative path: strip leading slash, check it's under public/
            const normalizedPath = filePath.replace(/\\/g, '/').replace(/\/+/g, '/');

            // Accept any path that resolves inside /public/ — not just /uploads/
            // This handles /avatars/, /uploads/, /demo/, etc. stored in DB
            const isRelative = !isExternal && (
                normalizedPath.startsWith('/uploads/') ||
                normalizedPath.startsWith('/avatars/') ||
                normalizedPath.startsWith('/demo/')
            );

            if (!isExternal && !isRelative) {
                // Last-resort: attempt to treat as relative if no path traversal chars present
                const clean = normalizedPath.replace(/\.\./g, '');
                if (!clean || clean.includes('..') || (!clean.startsWith('/') && !clean.startsWith('uploads/'))) {
                    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
                }
            }

            const db = getDb();
            let fileDeleted = false;

            // Delete physical file for local paths
            if (!isExternal) {
                try {
                    // Resolve from public/ directory
                    const relativePart = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
                    // Path traversal protection
                    if (relativePart.includes('..')) {
                        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
                    }
                    const fullPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', relativePart);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        fileDeleted = true;
                    }
                } catch (err) {
                    console.error('delete-media file error:', err.message);
                    // File delete failed but continue with DB cleanup
                }
            }

            // Clean up DB references (avatar_url / cover_url)
            try {
                const userWithAvatar = db.prepare('SELECT id FROM users WHERE avatar_url = ?').get(filePath);
                if (userWithAvatar) {
                    db.prepare("UPDATE users SET avatar_url = NULL WHERE id = ?").run(userWithAvatar.id);
                }
                const userWithCover = db.prepare('SELECT id FROM users WHERE cover_url = ?').get(filePath);
                if (userWithCover) {
                    db.prepare("UPDATE users SET cover_url = NULL WHERE id = ?").run(userWithCover.id);
                }
            } catch {}

            return NextResponse.json({ success: true, message: fileDeleted ? 'Dosya silindi' : 'Referans kaldırıldı' });
        }

        // ── Medya kütüphanesine görsel yükleme ──
        if (action === 'upload-media') {
            if (!['admin', 'manager'].includes(user.role)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            const file = formData.get('file');
            const category = formData.get('category') || 'covers'; // covers | pages | avatars
            if (!file || typeof file === 'string') {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }
            const validCategories = ['covers', 'pages', 'avatars'];
            const safeCategory = validCategories.includes(category) ? category : 'covers';
            const ext = file.name.split('.').pop().toLowerCase();
            const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
            if (!allowed.includes(ext)) {
                return NextResponse.json({ error: 'Sadece resim dosyaları yüklenebilir' }, { status: 400 });
            }
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${uuidv4()}.webp`;
            const uploadDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', safeCategory);
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            const filePath = path.join(/*turbopackIgnore: true*/ uploadDir, fileName);
            try {
                // SVG dosyaları dönüştürme gerektirmez
                if (ext === 'svg') {
                    const svgName = `${uuidv4()}.svg`;
                    fs.writeFileSync(path.join(/*turbopackIgnore: true*/ uploadDir, svgName), buffer);
                    return NextResponse.json({ success: true, path: `/uploads/${safeCategory}/${svgName}` });
                }
                const webpBuffer = await toWebP(buffer, 85);
                fs.writeFileSync(filePath, webpBuffer);
                return NextResponse.json({ success: true, path: `/uploads/${safeCategory}/${fileName}` });
            } catch (err) {
                return NextResponse.json({ error: 'Dosya yüklenemedi: ' + err.message }, { status: 500 });
            }
        }

        // ── Site görseli yükleme (logo, favicon, og-image) ──
        if (action === 'upload-site-asset') {
            if (!['admin', 'manager'].includes(user.role)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            const file = formData.get('file');
            const assetType = formData.get('assetType') || 'logo'; // logo | favicon | og-image
            if (!file || typeof file === 'string') {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }
            const ext = file.name.split('.').pop().toLowerCase();
            const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'];
            if (!allowed.includes(ext)) {
                return NextResponse.json({ error: 'Desteklenmeyen dosya türü' }, { status: 400 });
            }
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploadDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', 'site');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            // ico ve svg dönüştürme gerekmez
            // Favicon için PNG kullan (WebP tarayıcı favicon olarak desteklenmeyebilir)
            let fileName, finalBuffer;
            if (['ico', 'svg'].includes(ext)) {
                fileName = `${assetType}-${uuidv4()}.${ext}`;
                finalBuffer = buffer;
            } else if (assetType === 'favicon') {
                // Favicon için PNG formatında kaydet (dynamic import — ES modül uyumlu)
                fileName = `${assetType}-${uuidv4()}.png`;
                try {
                    const sharpMod = (await import('sharp')).default;
                    finalBuffer = await sharpMod(buffer).png({ compressionLevel: 6 }).toBuffer();
                } catch {
                    // sharp yoksa orijinal buffer kullan, uzantıyı koru
                    finalBuffer = buffer;
                    fileName = `${assetType}-${uuidv4()}.${ext}`;
                }
            } else {
                fileName = `${assetType}-${uuidv4()}.webp`;
                finalBuffer = await toWebP(buffer, 90);
            }
            const filePath = path.join(/*turbopackIgnore: true*/ uploadDir, fileName);
            try {
                fs.writeFileSync(filePath, finalBuffer);
                return NextResponse.json({ success: true, path: `/uploads/site/${fileName}` });
            } catch (err) {
                return NextResponse.json({ error: 'Dosya yüklenemedi: ' + err.message }, { status: 500 });
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

            // ── Kullanıcı Görselleri: DB + dosya sistemi (avatars) birleşik ──
            if (categoryFilter === 'user_images') {
                // Sistem varsayılan görselleri — bunları listede gösterme / silme
                const SYSTEM_DEFAULTS = new Set([
                    '/default-avatar.png',
                    '/avatar.png',
                    '/default-cover.png',
                    '/default-cover.jpg',
                    '/demo/cover1.jpg',
                ]);

                // 1) DB'deki tüm avatar ve kapak URL'lerini çek (varsayılanlar hariç)
                const rows = db.prepare('SELECT id, username, avatar_url, cover_url FROM users WHERE avatar_url IS NOT NULL OR cover_url IS NOT NULL').all();
                const dbPaths = new Set();
                const userMedia = [];

                // Helper: get file stats for a local path stored in DB
                const getLocalStats = (urlPath) => {
                    try {
                        const isExtUrl = urlPath.startsWith('http://') || urlPath.startsWith('https://');
                        if (isExtUrl) return { size: 0, sizeFormatted: 'Harici', modified: new Date(0).toISOString() };
                        const rel = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
                        const fullPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', rel);
                        if (fs.existsSync(fullPath)) {
                            const stat = fs.statSync(fullPath);
                            return { size: stat.size, sizeFormatted: formatBytes(stat.size), modified: stat.mtime.toISOString() };
                        }
                    } catch {}
                    return { size: 0, sizeFormatted: '—', modified: new Date(0).toISOString() };
                };

                for (const u of rows) {
                    if (u.avatar_url && !SYSTEM_DEFAULTS.has(u.avatar_url)) {
                        dbPaths.add(u.avatar_url);
                        const fname = u.avatar_url.split('/').pop() || u.avatar_url;
                        const stats = getLocalStats(u.avatar_url);
                        userMedia.push({
                            name: `${u.username} — Avatar (${fname})`,
                            path: u.avatar_url,
                            category: 'user_images',
                            imageType: 'avatar',
                            username: u.username,
                            userId: u.id,
                            ...stats,
                        });
                    }
                    if (u.cover_url && !SYSTEM_DEFAULTS.has(u.cover_url)) {
                        dbPaths.add(u.cover_url);
                        const fname = u.cover_url.split('/').pop() || u.cover_url;
                        const stats = getLocalStats(u.cover_url);
                        userMedia.push({
                            name: `${u.username} — Kapak (${fname})`,
                            path: u.cover_url,
                            category: 'user_images',
                            imageType: 'cover',
                            username: u.username,
                            userId: u.id,
                            ...stats,
                        });
                    }
                }

                // 2) Dosya sistemindeki /uploads/avatars/ dizinindeki sahipsiz dosyaları ekle
                const avatarsDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', 'avatars');
                if (fs.existsSync(avatarsDir)) {
                    try {
                        const scanOrphans = (dirPath) => {
                            for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
                                const full = path.join(dirPath, entry.name);
                                if (entry.isDirectory()) {
                                    scanOrphans(full);
                                } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(entry.name)) {
                                    const relativePath = full.replace(path.join(/*turbopackIgnore: true*/ process.cwd(), 'public'), '').replace(/\\/g, '/');
                                    if (!dbPaths.has(relativePath)) {
                                        // DB'de kayıtlı değil — sahipsiz dosya
                                        try {
                                            const stat = fs.statSync(full);
                                            userMedia.push({
                                                name: `[Sahipsiz] ${entry.name}`,
                                                path: relativePath,
                                                category: 'user_images',
                                                imageType: 'orphan',
                                                username: null,
                                                userId: null,
                                                size: stat.size,
                                                sizeFormatted: formatBytes(stat.size),
                                                modified: stat.mtime.toISOString(),
                                            });
                                        } catch {}
                                    }
                                }
                            }
                        };
                        scanOrphans(avatarsDir);
                    } catch {}
                }

                const total = userMedia.length;
                const offset = (page - 1) * limit;
                const paginatedMedia = userMedia.slice(offset, offset + limit);
                const hasMore = offset + limit < total;
                return NextResponse.json({ media: paginatedMedia, total, hasMore });
            }
            
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
                            // Avatarlar artık user_images kategorisinde — burada atla
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
            // Avatarlar artık user_images'ta — sadece covers ve pages tara
            scanDir(path.join(uploadsBase, 'covers'), 'covers');
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
            const users = db.prepare('SELECT id, username, email, role, yomi_points, created_at, banned_until FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);

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
                ORDER BY ch.chapter_number DESC
            `).all(seriesId);

            return NextResponse.json({ series, chapters });
        }

        const users = db.prepare('SELECT id, username, email, role, yomi_points, banned_until, created_at FROM users ORDER BY created_at DESC').all();
        const recentComments = db.prepare(`
      SELECT c.id, c.content, c.created_at, u.username, c.user_id, u.banned_until,
        c.chapter_id,
        COALESCE(ch.title, 'Series Comment') as chapter_title,
        COALESCE(s.title, s2.title) as series_title,
        COALESCE(s.slug, s2.slug) as series_slug,
        ch.chapter_number
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN chapters ch ON c.chapter_id = ch.id
      LEFT JOIN series s ON ch.series_id = s.id
      LEFT JOIN series s2 ON c.series_id = s2.id
      WHERE c.parent_id IS NULL
      ORDER BY c.created_at DESC LIMIT 200
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
