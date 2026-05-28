const fs = require('fs');
const file = 'app/admin-panel/page.js';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  const l = line.toLowerCase();
  if (l.includes('chapter') && !l.includes('chapters') && !l.includes('chapter_number') && !l.includes('chapter_title') && !l.includes('chapterid')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
console.log('Done.');
process.exit(0);
