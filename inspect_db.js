const Database = require('better-sqlite3');
const db = new Database('./data/manga.db');
const settings = db.prepare("SELECT * FROM app_settings").all();
console.log('Total settings count:', settings.length);
settings.forEach(s => {
  console.log(`${s.setting_key}: "${s.setting_value}"`);
});
process.exit(0);
