const fs = require('fs');

const inputPath = process.argv[2] || 'release-notes.md';
const outputPath = process.argv[3] || 'release-notes-discord.txt';

const raw = fs.readFileSync(inputPath, 'utf8');
const lines = raw.replace(/\r\n/g, '\n').split('\n');
const output = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) {
    output.push('');
    continue;
  }

  const headingMatch = trimmed.match(/^#{2,6}\s+(.+)/);
  if (headingMatch) {
    output.push(`**${headingMatch[1].trim()}**`);
    continue;
  }

  const boldLinkMatch = trimmed.match(/^\*\*\[[^\]]+\]\([^)]+\)\*\*$/);
  if (boldLinkMatch) {
    output.push(`- ${trimmed}`);
    continue;
  }

  output.push(line.replace(/\s+$/, ''));
}

fs.writeFileSync(outputPath, output.join('\n'));
