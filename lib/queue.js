import { getDb } from '@/lib/db';

class BatchWriteQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.intervalId = null;
        
        // Start processing queue every 10 seconds (in Node environment)
        if (typeof window === 'undefined') {
            this.intervalId = setInterval(() => this.processQueue(), 10000);
        }
    }

    /**
     * Pushes a reading history record to the memory queue
     */
    pushHistory(userId, chapterId) {
        // Prevent duplicate spam in the current queue block
        const existing = this.queue.find(x => x.userId === userId && x.chapterId === chapterId);
        if (!existing) {
            this.queue.push({ userId, chapterId });
        }
    }

    /**
     * Flushes the current queue to the database via transaction
     */
    processQueue() {
        if (this.queue.length === 0 || this.isProcessing) return;

        this.isProcessing = true;
        // Take an immutable snapshot of current queue size
        const batch = this.queue.splice(0, this.queue.length);
        
        try {
            const db = getDb();
            const tx = db.transaction((records) => {
                const stmt = db.prepare(`
                    INSERT INTO reading_history (user_id, chapter_id, updated_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP) 
                    ON CONFLICT(user_id, chapter_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
                `);
                
                for (const record of records) {
                    stmt.run(record.userId, record.chapterId);
                }
            });
            
            tx(batch);
        } catch (error) {
            console.error('BatchWriteQueue Error:', error);
            // Re-queue the failed batch to prevent data loss
            this.queue.unshift(...batch);
        } finally {
            this.isProcessing = false;
        }
    }
}

// Global singleton across hot-reloads in Next.js development
const globalForQueue = globalThis;
export const batchQueue = globalForQueue.batchQueue || new BatchWriteQueue();
if (process.env.NODE_ENV !== 'production') globalForQueue.batchQueue = batchQueue;
