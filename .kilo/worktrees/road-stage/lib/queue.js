import { getDb } from '@/lib/db';

class BatchWriteQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.intervalId = null;

        if (typeof window === 'undefined') {
            this.intervalId = setInterval(() => this.processQueue(), 10000);
        }
    }

    /** Pushes a reading history record to the memory queue */
    pushHistory(userId, chapterId, pageNumber = 1) {
        const existing = this.queue.find(x => x.userId === userId && x.chapterId === chapterId);
        if (existing) {
            // Update page number if already queued
            existing.pageNumber = pageNumber;
        } else {
            this.queue.push({ userId, chapterId, pageNumber });
        }
    }

    /** Flushes the current queue to the database via transaction */
    processQueue() {
        if (this.queue.length === 0 || this.isProcessing) return;

        this.isProcessing = true;
        const batch = this.queue.splice(0, this.queue.length);

        try {
            const db = getDb();
            const tx = db.transaction((records) => {
                const stmt = db.prepare(`
                    INSERT INTO reading_history (user_id, chapter_id, page_number, updated_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id, chapter_id)
                    DO UPDATE SET updated_at = CURRENT_TIMESTAMP, page_number = excluded.page_number
                `);
                for (const record of records) {
                    stmt.run(record.userId, record.chapterId, record.pageNumber ?? 1);
                }
            });
            tx(batch);
        } catch (error) {
            console.error('BatchWriteQueue Error:', error);
            this.queue.unshift(...batch);
        } finally {
            this.isProcessing = false;
        }
    }
}

const globalForQueue = globalThis;
export const batchQueue = globalForQueue.batchQueue || new BatchWriteQueue();
if (process.env.NODE_ENV !== 'production') globalForQueue.batchQueue = batchQueue;