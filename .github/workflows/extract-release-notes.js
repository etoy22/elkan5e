const fs = require('fs');

const filePath = 'CHANGELOG.md';

try {
  const changelog = fs.readFileSync(filePath, 'utf8');
  const lines = changelog.split('\n');

  // Find the start of the latest version section
  const startIndex = lines.findIndex((line) => line.startsWith('# v'));
  if (startIndex === -1) {
    throw new Error('No version section found in CHANGELOG.md');
  }

  // Extract lines for the latest version
  const versionLines = lines.slice(startIndex + 1);
  const nextVersionIndex = versionLines.findIndex((line) => line.startsWith('# v'));
  const releaseNotes = nextVersionIndex !== -1 ? versionLines.slice(0, nextVersionIndex) : versionLines;

  // Format the release notes
  const formattedNotes = [];
  let inClassesSection = false;

  releaseNotes.forEach((line) => {
    if (line.startsWith('## ')) {
      // Convert headings to bold
      formattedNotes.push(`**${line.slice(3).trim()}**`);
      inClassesSection = line.toLowerCase().includes('classes');
    } else if (inClassesSection && line.startsWith('**[')) {
      // Handle subheadings under "Classes" (e.g., Monk, Sorcerer)
      formattedNotes.push(`- ${line.slice(2,-3)}`);
    } else if (inClassesSection && line.startsWith('  -')) {
      // Indent nested list items under "Classes"
      formattedNotes.push(`  ${line.trim()}`);
    } else if (inClassesSection && line.startsWith('-')) {
      // Handle nested list items under subheadings in "Classes"
      formattedNotes.push(`  ${line.trim()}`);
    } else if (line.startsWith('-')) {
      // Keep list items as is
      formattedNotes.push(line);
    } else if (line.trim() === '') {
      // Preserve empty lines
      formattedNotes.push('');
    } else {
      formattedNotes.push(line);
    }
  });

  console.log(formattedNotes.join('\n'));
} catch (error) {
  console.error('Error reading or processing the file:', error.message);
  process.exit(1);
}
