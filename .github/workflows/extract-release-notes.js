const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Error: No file path provided.');
  process.exit(1);
}

try {
  const changelog = fs.readFileSync(filePath, 'utf8');
  const releaseNotes = changelog
    .split('\n')
    .filter((line, index, lines) => {
      if (line.startsWith('# v')) {
        return lines.slice(index).some((l) => l.startsWith('# v') && l !== line);
      }
      return true;
    })
    .slice(1) // Skip the version header
    .join('\n')
    .replace(/^## (.*)$/gm, '**$1**') // Wrap headings with **
    .replace(/^-/gm, ' -'); // Ensure proper formatting for list items

  console.log(releaseNotes);
} catch (error) {
  console.error('Error reading or processing the file:', error.message);
  process.exit(1);
}
