const db = require('better-sqlite3')('./data/manga.db');
try {
  const result = db.prepare('INSERT INTO comments (user_id, chapter_id, series_id, content, parent_id, is_spoiler, paragraph_index) VALUES (?, ?, ?, ?, ?, ?, ?)').run(1, '33', null, 'test', null, 0, null);
  console.log(result);
  const comment = db.prepare(`
            SELECT c.*, u.username, u.avatar_url, u.yomi_points,
            (SELECT rank FROM (SELECT id, DENSE_RANK() OVER (ORDER BY yomi_points DESC) as rank FROM users) WHERE id = c.user_id) as leaderboard_rank,
            ch.title as chapter_title, s.title as series_title
            FROM comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN chapters ch ON c.chapter_id = ch.id
            LEFT JOIN series s ON (ch.series_id = s.id OR c.series_id = s.id)
            WHERE c.id = ?
        `).get(result.lastInsertRowid);
  console.log(comment);
} catch (e) {
  console.error(e.message);
}
