import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { createRateLimiter } from '@/lib/ratelimit';

const getRateLimiter  = createRateLimiter(30, 60 * 1000); // 30 req/min
const postRateLimiter = createRateLimiter(10, 60 * 1000); // 10 req/min

const QUESTS = [
    { id: 'daily_login', title: 'Günlük Giriş',    desc: 'Giriş yaparak günlük ödülünü kazan',              icon: 'sun',  target: 1,  reward: 10 },
    { id: 'read_3',      title: 'Hevesli Okuyucu', desc: 'Bugün 3 farklı bölüm oku',                        icon: 'book', target: 3,  reward: 30 },
    { id: 'comment_1',   title: 'Sosyal Kelebek',  desc: 'Herhangi bir bölüm veya seriye yorum bırak',      icon: 'chat', target: 1,  reward: 15 },
];

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

export async function GET(request) {
    const rl = getRateLimiter(request);
    if (!rl.success) {
        return NextResponse.json({ error: 'Too many requests.' }, {
            status: 429, headers: { 'Retry-After': String(rl.retryAfter) },
        });
    }

    try {
        const db  = getDb();
        const result = getVerifiedUser(request, db);
        if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
        const { user } = result;

        const today = getTodayStr();

        // Single-query progress fetch (no N+1)
        const chaptersToday = db.prepare(
            `SELECT COUNT(*) as cnt FROM read_history WHERE user_id = ? AND created_at >= ? AND created_at < date(?, '+1 day')`
        ).get(user.id, today, today)?.cnt || 0;

        const commentsToday = db.prepare(
            `SELECT COUNT(*) as cnt FROM comments WHERE user_id = ? AND created_at >= ? AND created_at < date(?, '+1 day')`
        ).get(user.id, today, today)?.cnt || 0;

        const dailyLoginDone = db.prepare(
            `SELECT 1 FROM users WHERE id = ? AND DATE(last_daily_login) = ?`
        ).get(user.id, today);

        // Fetch all quest claim records for today in one query
        const claimedRows = db.prepare(
            `SELECT quest_id, claimed FROM quest_progress WHERE user_id = ? AND quest_date = ?`
        ).all(user.id, today);
        const claimMap = Object.fromEntries(claimedRows.map(r => [r.quest_id, r.claimed === 1]));

        const progressMap = {
            daily_login: dailyLoginDone ? 1 : 0,
            read_3:      chaptersToday,
            comment_1:   commentsToday,
        };

        const quests = QUESTS.map(q => ({
            ...q,
            progress:  Math.min(progressMap[q.id] || 0, q.target),
            completed: (progressMap[q.id] || 0) >= q.target,
            claimed:   claimMap[q.id] || false,
        }));

        return NextResponse.json({ quests });
    } catch (error) {
        console.error('GET /api/users/quests error:', error);
        return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 });
    }
}

export async function POST(request) {
    const rl = postRateLimiter(request);
    if (!rl.success) {
        return NextResponse.json({ error: 'Too many requests.' }, {
            status: 429, headers: { 'Retry-After': String(rl.retryAfter) },
        });
    }

    try {
        const db  = getDb();
        const result = getVerifiedUser(request, db);
        if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
        const { user } = result;

        const body = await request.json();
        const { questId } = body || {};
        if (!questId) return NextResponse.json({ error: 'questId required' }, { status: 400 });

        const quest = QUESTS.find(q => q.id === questId);
        if (!quest)  return NextResponse.json({ error: 'Invalid quest' }, { status: 400 });

        const today = getTodayStr();

        // Check if already claimed (atomic check in transaction)
        const tx = db.transaction(() => {
            const existing = db.prepare(
                'SELECT claimed FROM quest_progress WHERE user_id = ? AND quest_id = ? AND quest_date = ?'
            ).get(user.id, questId, today);

            if (existing?.claimed === 1) return { alreadyClaimed: true };

            // Verify completion
            let progress = 0;
            if (questId === 'daily_login') {
                progress = db.prepare('SELECT 1 FROM users WHERE id = ? AND DATE(last_daily_login) = ?').get(user.id, today) ? 1 : 0;
            } else if (questId === 'read_3') {
                progress = db.prepare(
                    `SELECT COUNT(*) as cnt FROM read_history WHERE user_id = ? AND created_at >= ? AND created_at < date(?, '+1 day')`
                ).get(user.id, today, today)?.cnt || 0;
            } else if (questId === 'comment_1') {
                progress = db.prepare(
                    `SELECT COUNT(*) as cnt FROM comments WHERE user_id = ? AND created_at >= ? AND created_at < date(?, '+1 day')`
                ).get(user.id, today, today)?.cnt || 0;
            }

            if (progress < quest.target) return { notCompleted: true };

            db.prepare(`
                INSERT INTO quest_progress (user_id, quest_id, progress, completed, claimed, quest_date)
                VALUES (?, ?, ?, 1, 1, ?)
                ON CONFLICT(user_id, quest_id, quest_date) DO UPDATE SET claimed = 1, completed = 1, progress = ?
            `).run(user.id, questId, progress, today, progress);

            const newPoints = db.prepare(
                'UPDATE users SET yomi_points = COALESCE(yomi_points, 0) + ? WHERE id = ? RETURNING yomi_points'
            ).get(quest.reward, user.id)?.yomi_points;

            return { success: true, newPoints };
        });

        const txResult = tx();

        if (txResult.alreadyClaimed) {
            return NextResponse.json({ error: 'Bu görev bugün zaten talep edildi.' }, { status: 400 });
        }
        if (txResult.notCompleted) {
            return NextResponse.json({ error: 'Görev henüz tamamlanmadı.' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            reward: quest.reward,
            newTotal: txResult.newPoints,
            message: `+${quest.reward} Yomi Puan kazanıldı!`,
        });
    } catch (error) {
        console.error('POST /api/users/quests error:', error);
        return NextResponse.json({ error: 'Failed to claim quest reward' }, { status: 500 });
    }
}