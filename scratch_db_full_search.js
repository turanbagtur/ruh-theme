const db = require('better-sqlite3')('data/manga.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

for (const t of tables) {
    const tableName = t.name;
    try {
        const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
        for (const col of columns) {
            const colName = col.name;
            const query = `SELECT * FROM ${tableName} WHERE CAST(${colName} AS TEXT) LIKE '%iznelme%' OR CAST(${colName} AS TEXT) LIKE '%izlenme%' OR CAST(${colName} AS TEXT) LIKE '%bö.%' OR CAST(${colName} AS TEXT) LIKE '%Bö.%'`;
            const matches = db.prepare(query).all();
            if (matches.length > 0) {
                console.log(`Found in table ${tableName}, column ${colName}:`, matches);
            }
        }
    } catch (e) {
        console.error(`Error searching table ${tableName}:`, e.message);
    }
}
console.log('Search finished.');
