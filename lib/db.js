import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/manga.db';

let db;

export function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
    migrateDatabase(db);
  }
  return db;
}

// Generate URL-safe slug from a title
export function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars
    .replace(/[\s_]+/g, '-')    // spaces/underscores → hyphens
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .replace(/^-|-$/g, '');     // trim leading/trailing hyphens
}

function migrateDatabase(db) {
  try {
    const cols = db.prepare("PRAGMA table_info(comments)").all();
    const hasSeries = cols.find(c => c.name === 'series_id');
    const chapterCol = cols.find(c => c.name === 'chapter_id');

    // Need full table recreation if chapter_id is NOT NULL or series_id missing
    if (!hasSeries || (chapterCol && chapterCol.notnull)) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS comments_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    chapter_id INTEGER DEFAULT NULL,
                    series_id INTEGER DEFAULT NULL,
                    content TEXT NOT NULL,
                    parent_id INTEGER DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
                    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
                    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
                );
                INSERT OR IGNORE INTO comments_new (id, user_id, chapter_id, content, parent_id, created_at)
                    SELECT id, user_id, chapter_id, content, parent_id, created_at FROM comments;
                DROP TABLE comments;
                ALTER TABLE comments_new RENAME TO comments;
            `);
    }

    // Migration: add published and slug columns to series
    const seriesCols = db.prepare("PRAGMA table_info(series)").all();
    if (!seriesCols.find(c => c.name === 'published')) {
      db.exec('ALTER TABLE series ADD COLUMN published INTEGER DEFAULT 1');
    }
    if (!seriesCols.find(c => c.name === 'slug')) {
      db.exec('ALTER TABLE series ADD COLUMN slug TEXT DEFAULT NULL');
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_series_slug ON series(slug)');
      // Backfill slugs for existing series
      const allSeries = db.prepare('SELECT id, title FROM series').all();
      for (const s of allSeries) {
        let base = generateSlug(s.title);
        if (!base) base = `series-${s.id}`;
        let slug = base;
        let counter = 1;
        while (db.prepare('SELECT id FROM series WHERE slug = ? AND id != ?').get(slug, s.id)) {
          slug = `${base}-${counter++}`;
        }
        db.prepare('UPDATE series SET slug = ? WHERE id = ?').run(slug, s.id);
      }
    }

    // Migration: create series_views_log table if it doesn't exist (without viewer_hash — added below)
    db.exec(`
      CREATE TABLE IF NOT EXISTS series_views_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_series_views_log_series ON series_views_log(series_id);
      CREATE INDEX IF NOT EXISTS idx_series_views_log_date ON series_views_log(created_at);
    `);

    // Migration: add viewer_hash column to series_views_log if missing (MUST be separate — table may already exist without it)
    const viewsLogCols = db.prepare("PRAGMA table_info(series_views_log)").all();
    if (!viewsLogCols.find(c => c.name === 'viewer_hash')) {
      db.exec('ALTER TABLE series_views_log ADD COLUMN viewer_hash TEXT DEFAULT NULL');
    }
    // Create viewer index only AFTER ensuring column exists
    db.exec('CREATE INDEX IF NOT EXISTS idx_series_views_log_viewer ON series_views_log(series_id, viewer_hash, created_at)');

    // Migration: create announcements table
    db.exec(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        link_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: Gamification (Yomi Points) & Reactions
    const userCols = db.prepare("PRAGMA table_info(users)").all();
    if (!userCols.find(c => c.name === 'yomi_points')) {
      db.exec('ALTER TABLE users ADD COLUMN yomi_points INTEGER DEFAULT 0');
    }
    if (!userCols.find(c => c.name === 'last_daily_login')) {
      db.exec('ALTER TABLE users ADD COLUMN last_daily_login DATETIME DEFAULT NULL');
    }
    if (!userCols.find(c => c.name === 'last_avatar_update')) {
      db.exec('ALTER TABLE users ADD COLUMN last_avatar_update DATETIME DEFAULT NULL');
    }

    // Read History (to prevent farming points from same chapter)
    db.exec(`
      CREATE TABLE IF NOT EXISTS read_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        chapter_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
        UNIQUE(user_id, chapter_id)
      );
    `);

    // Reading History (tracks last-read chapter per user for "Continue Reading")
    db.exec(`
      CREATE TABLE IF NOT EXISTS reading_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        chapter_id INTEGER NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
        UNIQUE(user_id, chapter_id)
      );
    `);

    // Server-Side Series Reactions
    db.exec(`
      CREATE TABLE IF NOT EXISTS series_reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        emoji TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(series_id, user_id, emoji)
      );
    `);

    // Notifications table
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'reply',
        message TEXT NOT NULL,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    `);

    // Quest progress tracking
    db.exec(`
      CREATE TABLE IF NOT EXISTS quest_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        quest_id TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        claimed INTEGER DEFAULT 0,
        quest_date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, quest_id, quest_date)
      );
    `);

    // Global App Settings
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT
      );
      INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('donation_enabled', '0');
      INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('donation_text', 'Support us to keep the servers alive!');
      INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('paypal_url', '');
      INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('kofi_url', '');
    `);

  } catch (e) { console.error('Migration error:', e.message); }
}

function initializeDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT DEFAULT '/default-avatar.png',
      role TEXT DEFAULT 'user',
      yomi_points INTEGER DEFAULT 0,
      last_daily_login DATETIME DEFAULT NULL,
      last_avatar_update DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      cover_url TEXT,
      author TEXT,
      artist TEXT,
      status TEXT DEFAULT 'ongoing',
      genres TEXT DEFAULT '[]',
      rating REAL DEFAULT 0,
      views INTEGER DEFAULT 0,
      published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id INTEGER NOT NULL,
      chapter_number REAL NOT NULL,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_id INTEGER NOT NULL,
      page_number INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      width INTEGER DEFAULT 0,
      height INTEGER DEFAULT 0,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      language_code TEXT NOT NULL,
      translated_image_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
      UNIQUE(page_id, language_code)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_id INTEGER DEFAULT NULL,
      series_id INTEGER DEFAULT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
      FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      comment_id INTEGER NOT NULL,
      emoji TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      UNIQUE(user_id, comment_id, emoji)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      series_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
      UNIQUE(user_id, series_id)
    );

    CREATE TABLE IF NOT EXISTS reading_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_id INTEGER NOT NULL,
      page_number INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
      UNIQUE(user_id, chapter_id)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_name TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      service TEXT NOT NULL DEFAULT 'torii',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS series_views_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id INTEGER NOT NULL,
      viewer_hash TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      link_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT
    );
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('donation_enabled', '0');
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('donation_text', 'Support us to keep the servers alive!');
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('paypal_url', '');
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('kofi_url', '');

    -- Performance indices
    CREATE INDEX IF NOT EXISTS idx_chapters_series ON chapters(series_id);
    CREATE INDEX IF NOT EXISTS idx_pages_chapter ON pages(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_translations_page ON translations(page_id);
    CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(page_id, language_code);
    CREATE INDEX IF NOT EXISTS idx_comments_chapter ON comments(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_comments_series ON comments(series_id);
    CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_series ON favorites(series_id);
    CREATE INDEX IF NOT EXISTS idx_reactions_comment ON reactions(comment_id);
    CREATE INDEX IF NOT EXISTS idx_series_published ON series(published);
    CREATE INDEX IF NOT EXISTS idx_series_views_log_series ON series_views_log(series_id);
    CREATE INDEX IF NOT EXISTS idx_series_views_log_date ON series_views_log(created_at);
  `);
}

export default getDb;
