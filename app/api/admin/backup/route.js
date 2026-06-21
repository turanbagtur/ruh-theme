import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser, hasAdminPanelAccess } from '@/lib/auth';
import { readdir, readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// Backup directory
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 7; // Keep last 7 backups

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get all backups
export async function GET(request) {
    try {
        const db = getDb();
        const result = getVerifiedUser(request, db);
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { user: tokenUser } = result;

        if (!tokenUser || !hasAdminPanelAccess(tokenUser, db)) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        // Ensure backup directory exists
        if (!existsSync(BACKUP_DIR)) {
            await mkdir(BACKUP_DIR, { recursive: true });
        }

        const entries = await readdir(BACKUP_DIR);
        const backups = [];

        for (const entry of entries) {
            if (entry.endsWith('.json')) {
                const filePath = path.join(BACKUP_DIR, entry);
                try {
                    const content = await readFile(filePath, 'utf-8');
                    const data = JSON.parse(content);
                    backups.push({
                        id: entry.replace('.json', ''),
                        name: entry,
                        path: filePath,
                        createdAt: data.createdAt,
                        size: data.size,
                        sizeFormatted: formatBytes(data.size),
                        seriesCount: data.data?.series?.length || 0,
                        chaptersCount: data.data?.chapters?.length || 0,
                        usersCount: data.data?.users?.length || 0,
                        commentsCount: data.data?.comments?.length || 0,
                    });
                } catch {}
            }
        }

        // Sort by newest first
        backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return NextResponse.json({ backups });
    } catch (error) {
        console.error('GET /api/admin/backup error:', error);
        return NextResponse.json({ error: 'Yedekler getirilemedi' }, { status: 500 });
    }
}

// Create new backup
export async function POST(request) {
    try {
        const db = getDb();
        const result = getVerifiedUser(request, db);
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { user: tokenUser } = result;

        if (!tokenUser || !hasAdminPanelAccess(tokenUser, db)) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        // Ensure backup directory exists
        if (!existsSync(BACKUP_DIR)) {
            await mkdir(BACKUP_DIR, { recursive: true });
        }

        if (action === 'create') {
            // Export all data
            const backupId = `backup_${Date.now()}`;
            const timestamp = new Date().toISOString();

            // Helper to safely query a table (returns [] if table doesn't exist)
            function safeQuery(sql) {
                try { return db.prepare(sql).all(); } catch { return []; }
            }

            // Get all data from database
            const series = safeQuery('SELECT * FROM series');
            const chapters = safeQuery('SELECT * FROM chapters');
            const users = safeQuery('SELECT id, username, email, role, yomi_points, created_at FROM users');
            const comments = safeQuery('SELECT * FROM comments');
            const favorites = safeQuery('SELECT * FROM favorites');
            const readingLists = safeQuery('SELECT * FROM reading_lists');
            const announcements = safeQuery('SELECT * FROM announcements');
            const appSettings = safeQuery('SELECT * FROM app_settings');
            const userRatings = safeQuery('SELECT * FROM user_ratings');

            const backupData = {
                version: '1.0',
                createdAt: timestamp,
                data: {
                    series,
                    chapters,
                    users,
                    comments,
                    favorites,
                    readingLists,
                    announcements,
                    appSettings,
                    userRatings,
                }
            };

            const backupPath = path.join(BACKUP_DIR, `${backupId}.json`);
            const jsonContent = JSON.stringify(backupData, null, 2);
            await writeFile(backupPath, jsonContent);

            // Calculate file size
            const { stat } = await import('fs/promises');
            const stats = await stat(backupPath);

            // Clean up old backups (keep only MAX_BACKUPS)
            const entries = await readdir(BACKUP_DIR);
            const backupFiles = [];
            for (const e of entries) {
                if (e.endsWith('.json')) {
                    try {
                        const content = await readFile(path.join(BACKUP_DIR, e), 'utf-8');
                        const data = JSON.parse(content);
                        backupFiles.push({
                            name: e,
                            path: path.join(BACKUP_DIR, e),
                            createdAt: new Date(data.createdAt)
                        });
                    } catch {}
                }
            }
            backupFiles.sort((a, b) => b.createdAt - a.createdAt);

            if (backupFiles.length > MAX_BACKUPS) {
                const toDelete = backupFiles.slice(MAX_BACKUPS);
                for (const file of toDelete) {
                    await unlink(file.path).catch(() => {});
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Yedek başarıyla oluşturuldu',
                backup: {
                    id: backupId,
                    name: `${backupId}.json`,
                    createdAt: timestamp,
                    size: stats.size,
                    sizeFormatted: formatBytes(stats.size),
                    seriesCount: series.length,
                    chaptersCount: chapters.length,
                }
            });
        }

        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    } catch (error) {
        console.error('POST /api/admin/backup error:', error);
        return NextResponse.json({ error: 'Yedekleme başarısız' }, { status: 500 });
    }
}

// Restore or delete backup
export async function DELETE(request) {
    try {
        const db = getDb();
        const result = getVerifiedUser(request, db);
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { user: tokenUser } = result;

        if (!tokenUser || !hasAdminPanelAccess(tokenUser, db)) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const backupId = searchParams.get('id');

        if (action === 'delete' && backupId) {
            const backupPath = path.join(BACKUP_DIR, `${backupId}.json`);
            if (existsSync(backupPath)) {
                await unlink(backupPath);
                return NextResponse.json({ success: true, message: 'Yedek silindi' });
            }
            return NextResponse.json({ error: 'Yedek bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    } catch (error) {
        console.error('DELETE /api/admin/backup error:', error);
        return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
    }
}
