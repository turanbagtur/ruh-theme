import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const QUESTS = [
    { id: 'daily_login', title: 'Daily Login', desc: 'Log in and claim your daily reward', icon: 'sun', target: 1, reward: 10 },
    { id: 'read_3', title: 'Avid Reader', desc: 'Read 3 different chapters today', icon: 'book', target: 3, reward: 30 },
    { id: 'comment_1', title: 'Social Butterfly', desc: 'Leave a comment on any chapter or series', icon: 'chat', target: 1, reward: 15 },
];

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const db = getDb();
        const today = getTodayStr();

        // Auto-calculate progress from actual activity
        const chaptersReadToday = db.prepare(`
            SELECT COUNT(*) as cnt FROM read_history 
            WHERE user_id = ? AND DATE(created_at) = ?
        `).get(user.id, today)?.cnt || 0;

        const commentsToday = db.prepare(`
            SELECT COUNT(*) as cnt FROM comments 
            WHERE user_id = ? AND DATE(created_at) = ?
        `).get(user.id, today)?.cnt || 0;

        const dailyLoginDone = db.prepare(`
            SELECT 1 FROM users WHERE id = ? AND DATE(last_daily_login) = ?
        `).get(user.id, today);

        const progressMap = {
            daily_login: dailyLoginDone ? 1 : 0,
            read_3: chaptersReadToday,
            comment_1: commentsToday,
        };

        const quests = QUESTS.map(q => {
            const progress = Math.min(progressMap[q.id] || 0, q.target);
            const completed = progress >= q.target;

            // Check if already claimed
            const claimed = db.prepare(
                'SELECT claimed FROM quest_progress WHERE user_id = ? AND quest_id = ? AND quest_date = ?'
            ).get(user.id, q.id, today);

            return {
                ...q,
                progress,
                completed,
                claimed: claimed?.claimed === 1,
            };
        });

        return NextResponse.json({ quests });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Claim a quest reward
export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { questId } = await request.json();
        if (!questId) return NextResponse.json({ error: 'questId required' }, { status: 400 });

        const quest = QUESTS.find(q => q.id === questId);
        if (!quest) return NextResponse.json({ error: 'Invalid quest' }, { status: 400 });

        const db = getDb();
        const today = getTodayStr();

        // Check if already claimed
        const existing = db.prepare(
            'SELECT claimed FROM quest_progress WHERE user_id = ? AND quest_id = ? AND quest_date = ?'
        ).get(user.id, questId, today);

        if (existing?.claimed === 1) {
            return NextResponse.json({ error: 'Already claimed today' }, { status: 400 });
        }

        // Verify completion
        let progress = 0;
        if (questId === 'daily_login') {
            const done = db.prepare('SELECT 1 FROM users WHERE id = ? AND DATE(last_daily_login) = ?').get(user.id, today);
            progress = done ? 1 : 0;
        } else if (questId === 'read_3') {
            progress = db.prepare('SELECT COUNT(*) as cnt FROM read_history WHERE user_id = ? AND DATE(created_at) = ?').get(user.id, today)?.cnt || 0;
        } else if (questId === 'comment_1') {
            progress = db.prepare('SELECT COUNT(*) as cnt FROM comments WHERE user_id = ? AND DATE(created_at) = ?').get(user.id, today)?.cnt || 0;
        }

        if (progress < quest.target) {
            return NextResponse.json({ error: 'Quest not completed yet' }, { status: 400 });
        }

        // Claim: insert/update quest_progress AND give YP reward
        const tx = db.transaction(() => {
            db.prepare(`
                INSERT INTO quest_progress (user_id, quest_id, progress, completed, claimed, quest_date) 
                VALUES (?, ?, ?, 1, 1, ?)
                ON CONFLICT(user_id, quest_id, quest_date) DO UPDATE SET claimed = 1, completed = 1, progress = ?
            `).run(user.id, questId, progress, today, progress);
            
            db.prepare('UPDATE users SET yomi_points = COALESCE(yomi_points, 0) + ? WHERE id = ?').run(quest.reward, user.id);
        });
        tx();

        const updatedUser = db.prepare('SELECT yomi_points FROM users WHERE id = ?').get(user.id);

        return NextResponse.json({ 
            success: true, 
            reward: quest.reward, 
            newTotal: updatedUser.yomi_points,
            message: `+${quest.reward} Yomi Points earned!`
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
