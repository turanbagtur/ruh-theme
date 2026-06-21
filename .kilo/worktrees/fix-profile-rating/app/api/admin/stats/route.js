import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import os from 'os';

// Get directory size recursively
async function getDirSize(dirPath) {
    let totalSize = 0;
    try {
        const entries = await readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            try {
                if (entry.isDirectory()) {
                    totalSize += await getDirSize(fullPath);
                } else {
                    const stats = await stat(fullPath);
                    totalSize += stats.size;
                }
            } catch {
                // Skip files we can't access
            }
        }
    } catch {
        // Directory doesn't exist or can't be read
    }
    return totalSize;
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function GET(request) {
    try {
        const result = getVerifiedUser(request);
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }
        const { user: tokenUser } = result;

        const db = getDb();
        const dbUser = db.prepare('SELECT role FROM users WHERE id = ?').get(tokenUser.id);
        if (!dbUser || !['admin', 'manager'].includes(dbUser.role)) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        // Get storage info
        const publicDir = path.join(process.cwd(), 'public');
        const uploadsDir = path.join(publicDir, 'uploads');
        const dbPath = path.join(process.cwd(), 'data.db');

        let uploadsSize = 0;
        let dbSize = 0;

        try {
            uploadsSize = await getDirSize(uploadsDir);
        } catch {}

        try {
            const dbStats = await stat(dbPath);
            dbSize = dbStats.size;
        } catch {}

        const totalStorage = uploadsSize + dbSize;

        // Get database stats
        const dbStats = {
            totalSeries: db.prepare('SELECT COUNT(*) as count FROM series').get().count,
            totalChapters: db.prepare('SELECT COUNT(*) as count FROM chapters').get().count,
            totalPages: db.prepare('SELECT COUNT(*) as count FROM pages').get().count,
            totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
            totalComments: db.prepare('SELECT COUNT(*) as count FROM comments').get().count,
        };

        // Get backup info
        const backupsDir = path.join(process.cwd(), 'backups');
        let backups = [];
        let backupsSize = 0;
        try {
            const backupFiles = await readdir(backupsDir);
            for (const file of backupFiles) {
                const filePath = path.join(backupsDir, file);
                const stats = await stat(filePath);
                backups.push({
                    name: file,
                    size: stats.size,
                    sizeFormatted: formatBytes(stats.size),
                    createdAt: stats.birthtime,
                });
                backupsSize += stats.size;
            }
            // Sort by newest first
            backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch {}

        // CPU usage: sample over 100ms for accuracy
        async function getCpuUsage() {
            const cpus1 = os.cpus();
            await new Promise(r => setTimeout(r, 100));
            const cpus2 = os.cpus();
            let totalIdle = 0, totalTick = 0;
            for (let i = 0; i < cpus1.length; i++) {
                const t1 = Object.values(cpus1[i].times).reduce((a, b) => a + b, 0);
                const t2 = Object.values(cpus2[i].times).reduce((a, b) => a + b, 0);
                const idle1 = cpus1[i].times.idle;
                const idle2 = cpus2[i].times.idle;
                totalIdle += idle2 - idle1;
                totalTick += t2 - t1;
            }
            return totalTick > 0 ? Math.round((1 - totalIdle / totalTick) * 100) : 0;
        }

        const cpuPercent = await getCpuUsage();

        // RAM usage
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ramPercent = Math.round((usedMem / totalMem) * 100);

        return NextResponse.json({
            storage: {
                uploads: { bytes: uploadsSize, formatted: formatBytes(uploadsSize) },
                database: { bytes: dbSize, formatted: formatBytes(dbSize) },
                backups: { bytes: backupsSize, formatted: formatBytes(backupsSize), count: backups.length },
                total: { bytes: totalStorage, formatted: formatBytes(totalStorage) },
            },
            database: dbStats,
            backups,
            serverTime: new Date().toISOString(),
            cpuUsage: String(cpuPercent),
            ramUsage: String(ramPercent),
            ramDetails: {
                total: formatBytes(totalMem),
                used: formatBytes(usedMem),
                free: formatBytes(freeMem),
            },
        });
    } catch (error) {
        console.error('GET /api/admin/stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch server stats' }, { status: 500 });
    }
}
