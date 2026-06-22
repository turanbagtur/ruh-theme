import { getDb } from '@/lib/db';

class BatchWriteQueue {
    constructor() {
        this.queue = [];
        this.trafficQueue = [];
        this.isProcessing = false;
        this.isTrafficProcessing = false;
        this.intervalId = null;
        this.trafficIntervalId = null;

        if (typeof window === 'undefined') {
            this.intervalId = setInterval(() => this.processQueue(), 10000);
            // Trafik logları 10 saniyede bir toplu yazılır (anlık INSERT yerine)
            this.trafficIntervalId = setInterval(() => this.processTrafficQueue(), 10000);
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

    /** Pushes a traffic log record to the memory queue (batch insert için) */
    pushTraffic(path, visitorHash, referrer, userAgent) {
        this.trafficQueue.push({ path, visitorHash, referrer, userAgent });
    }

    /** Flushes the current reading history queue to the database via transaction */
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

    /** Flushes the traffic log queue to the database via transaction */
    processTrafficQueue() {
        if (this.trafficQueue.length === 0 || this.isTrafficProcessing) return;

        this.isTrafficProcessing = true;
        const batch = this.trafficQueue.splice(0, this.trafficQueue.length);

        try {
            const db = getDb();
            const tx = db.transaction((records) => {
                const stmt = db.prepare(`
                    INSERT INTO site_traffic_log (path, visitor_hash, referrer, user_agent)
                    VALUES (?, ?, ?, ?)
                `);
                for (const record of records) {
                    stmt.run(record.path, record.visitorHash, record.referrer ?? null, record.userAgent);
                }
            });
            tx(batch);
        } catch (error) {
            console.error('TrafficQueue Error:', error);
            this.trafficQueue.unshift(...batch);
        } finally {
            this.isTrafficProcessing = false;
        }
    }
}

const globalForQueue = globalThis;
export const batchQueue = globalForQueue.batchQueue || new BatchWriteQueue();
if (process.env.NODE_ENV !== 'production') globalForQueue.batchQueue = batchQueue;