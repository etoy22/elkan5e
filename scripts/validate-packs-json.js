import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, '..', 'packs', '_source');

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(p));
    else if (path.extname(name.name) === '.json') out.push(p);
  }
  return out;
}

const files = walk(root);
let errorCount = 0;
for (const f of files) {
  try {
    const content = fs.readFileSync(f, 'utf8');
    JSON.parse(content);
  } catch (err) {
    console.error('PARSE ERROR:', f);
    console.error(err && err.message ? err.message : String(err));
    // print a short excerpt around the error position if possible
    try {
      const content = fs.readFileSync(f, 'utf8');
      const posMatch = /position (\d+)|line (\d+) column (\d+)/i.exec(err && err.message ? err.message : '');
      if (posMatch && posMatch[1]) {
        const pos = Number(posMatch[1]);
        const start = Math.max(0, pos - 80);
        const end = Math.min(content.length, pos + 80);
        console.error('\n--- context ---\n' + content.slice(start, end) + '\n--- end ---\n');
      } else {
        // fallback to show first 400 chars
        console.error('\n--- file start ---\n' + content.slice(0, 400) + '\n--- end ---\n');
      }
      // Also print the file with line numbers to make locating the issue easier
      console.error('\n--- file with line numbers ---');
      content.split(/\r?\n/).forEach((line, idx) => {
        const n = String(idx + 1).padStart(4, ' ');
        console.error(`${n}: ${line}`);
      });
      console.error('--- end file ---\n');
    } catch (e) {}
    errorCount++;
  }
}
if (errorCount === 0) console.log('All pack JSON files parsed OK');
else console.error(`${errorCount} file(s) failed to parse`);

// If there was an error, produce a detailed line-numbered dump for the problematic file(s)
// (helpful during debugging). Re-run to show context explicitly.
