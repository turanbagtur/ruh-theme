import { seedDatabase } from './seed.js';
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
    seedDatabase(db);
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
    if (!seriesCols.find(c => c.name === 'type')) {
      db.exec("ALTER TABLE series ADD COLUMN type TEXT DEFAULT 'manga'");
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

    // Scraper system tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS scraper_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id INTEGER NOT NULL,
        source_url TEXT NOT NULL,
        source_site TEXT,
        last_checked DATETIME DEFAULT NULL,
        auto_sync INTEGER DEFAULT 1,
        last_chapter_found REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS scraper_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id INTEGER NOT NULL,
        source_url TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        chapters_found INTEGER DEFAULT 0,
        chapters_imported INTEGER DEFAULT 0,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS scraper_pending_chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id INTEGER NOT NULL,
        job_id INTEGER,
        chapter_number REAL NOT NULL,
        chapter_title TEXT,
        source_url TEXT,
        pages_json TEXT DEFAULT '[]',
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_scraper_pending_series ON scraper_pending_chapters(series_id, status);
      CREATE INDEX IF NOT EXISTS idx_scraper_sources_series ON scraper_sources(series_id);
    `);

    // Migration: add language column to scraper_sources
    const scraperSourceCols = db.prepare("PRAGMA table_info(scraper_sources)").all();
    if (!scraperSourceCols.find(c => c.name === 'language')) {
      db.exec("ALTER TABLE scraper_sources ADD COLUMN language TEXT DEFAULT 'en'");
    }

    // Feature: Reading List (Okuma Listesi) — Okuyorum / Bitti / Plan
    db.exec(`
      CREATE TABLE IF NOT EXISTS reading_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        series_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'plan',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
        UNIQUE(user_id, series_id)
      );
      CREATE INDEX IF NOT EXISTS idx_reading_lists_user ON reading_lists(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_reading_lists_series ON reading_lists(series_id);
    `);

    // Feature: User Badges / Achievements
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        badge_id TEXT NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, badge_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
    `);

    // Feature: add is_spoiler column to comments
    const commentCols2 = db.prepare("PRAGMA table_info(comments)").all();
    if (!commentCols2.find(c => c.name === 'is_spoiler')) {
      db.exec('ALTER TABLE comments ADD COLUMN is_spoiler INTEGER DEFAULT 0');
    }

    // Feature: soft-delete and edit tracking for comments
    const commentCols3 = db.prepare("PRAGMA table_info(comments)").all();
    if (!commentCols3.find(c => c.name === 'is_deleted')) {
      db.exec('ALTER TABLE comments ADD COLUMN is_deleted INTEGER DEFAULT 0');
    }
    if (!commentCols3.find(c => c.name === 'edited_at')) {
      db.exec('ALTER TABLE comments ADD COLUMN edited_at TEXT');
    }

    // Performance: clean up old series_views_log entries (keep only last 7 days)
    // This prevents the table from growing indefinitely and slowing down the trending query
    try {
      db.prepare("DELETE FROM series_views_log WHERE created_at < datetime('now', '-7 days')").run();
    } catch {}

    // Fix: remove duplicate scraper_pending_chapters (keep the one with lowest id per series+chapter_number)
    try {
      db.exec(`
        DELETE FROM scraper_pending_chapters
        WHERE id NOT IN (
          SELECT MIN(id) FROM scraper_pending_chapters
          GROUP BY series_id, chapter_number
        )
      `);
    } catch {}

    // Custom Pages table
    db.exec(`
      CREATE TABLE IF NOT EXISTS custom_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        show_in_footer INTEGER DEFAULT 1,
        show_in_navbar INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Default menu settings
    db.exec(`
      INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('navbar_menu', '[{"label":"Home","url":"/"},{"label":"Browse","url":"/series"},{"label":"Ranking","url":"/ranking"},{"label":"Requests","url":"/requests"}]');
      INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('footer_menu', '[{"label":"Privacy Policy","url":"/privacy"},{"label":"Terms & Conditions","url":"/terms"},{"label":"Browse","url":"/series"}]');
    `);

    // Seed built-in pages (Privacy Policy & Terms) into custom_pages so admin can edit them
    const privacyContent = '<h2>1. Information We Collect</h2><p>When you create an account, we collect your username, email address, and an encrypted version of your password. We do not store passwords in plain text.</p><h2>2. How We Use Your Information</h2><p>We use your information to provide and maintain your account, enable you to save favorites and reading progress, and improve our services.</p><h2>3. Data Storage &amp; Security</h2><p>Your data is stored securely. Passwords are hashed using bcrypt, authentication uses JWT tokens with 7-day expiry, and all connections are encrypted via HTTPS in production.</p><h2>4. Cookies &amp; Local Storage</h2><p>We use browser local storage to maintain your login session. We do not use tracking cookies or third-party analytics.</p><h2>5. Your Rights</h2><p>You may access, update, or request deletion of your personal data by contacting the administrator.</p><h2>6. Contact</h2><p>If you have questions about this privacy policy, please contact the site administrator.</p>';
    const termsContent = '<h2>1. Acceptance of Terms</h2><p>By accessing and using this site, you agree to be bound by these Terms and Conditions.</p><h2>2. User Accounts</h2><ul><li>You must provide accurate information when creating an account</li><li>You are responsible for maintaining the security of your account credentials</li><li>You must be at least 13 years old to create an account</li></ul><h2>3. Acceptable Use</h2><p>You agree not to upload infringing content, use the service for illegal purposes, or abuse other users.</p><h2>4. Comments &amp; Community</h2><p>We reserve the right to remove any comments that violate our acceptable use policy.</p><h2>5. Limitation of Liability</h2><p>The service is provided as-is without warranties. We are not liable for any damages arising from use of the service.</p><h2>6. Contact</h2><p>For questions about these terms, please contact the site administrator.</p>';

    try {
      db.prepare("INSERT OR IGNORE INTO custom_pages (slug, title, content, is_active, show_in_footer, show_in_navbar) VALUES ('privacy', 'Privacy Policy', ?, 1, 1, 0)").run(privacyContent);
      db.prepare("INSERT OR IGNORE INTO custom_pages (slug, title, content, is_active, show_in_footer, show_in_navbar) VALUES ('terms', 'Terms & Conditions', ?, 1, 1, 0)").run(termsContent);
    } catch {}

    // Migration: banned_until kolonu — SQLite ALTER TABLE IF NOT EXISTS desteklemez, try/catch kullan
    try {
      db.exec(`ALTER TABLE users ADD COLUMN banned_until TEXT DEFAULT NULL`);
    } catch (e) {
      // Kolon zaten varsa hata görmezden gel
    }

    // Migration: bug_reports table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bug_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Migration: add content column to chapters (for novels)
    const chapterCols = db.prepare("PRAGMA table_info(chapters)").all();
    if (!chapterCols.find(c => c.name === 'content')) {
      db.exec('ALTER TABLE chapters ADD COLUMN content TEXT DEFAULT NULL');
    }

    // Migration: add paragraph_index column to comments (for novel inline comments)
    const commentCols = db.prepare("PRAGMA table_info(comments)").all();
    if (!commentCols.find(c => c.name === 'paragraph_index')) {
      db.exec('ALTER TABLE comments ADD COLUMN paragraph_index INTEGER DEFAULT NULL');
    }

    // Seed default settings for Discord and Bug Report
    db.exec(`
      INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('discord_enabled', '0');
      INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('discord_url', '');
      INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('bug_report_enabled', '0');
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
      type TEXT DEFAULT 'manga',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id INTEGER NOT NULL,
      chapter_number REAL NOT NULL,
      title TEXT,
      content TEXT DEFAULT NULL,
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
      paragraph_index INTEGER DEFAULT NULL,
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

    CREATE TABLE IF NOT EXISTS bug_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT
    );
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('donation_enabled', '0');
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('donation_text', 'Support us to keep the servers alive!');
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('paypal_url', '');
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('kofi_url', '');
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('discord_enabled', '0');
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('discord_url', '');
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES ('bug_report_enabled', '0');

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
    CREATE INDEX IF NOT EXISTS idx_series_created_at ON series(created_at);
    CREATE INDEX IF NOT EXISTS idx_series_slug ON series(slug);
    CREATE INDEX IF NOT EXISTS idx_chapters_series_id ON chapters(series_id);
    CREATE INDEX IF NOT EXISTS idx_chapters_created_at ON chapters(created_at);
    CREATE INDEX IF NOT EXISTS idx_chapters_chapter_number ON chapters(chapter_number);
    CREATE INDEX IF NOT EXISTS idx_comments_series_id ON comments(series_id);
    CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON comments(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
  `);

  // admin_logs tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      admin_username TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
  `);
}

export default getDb;
