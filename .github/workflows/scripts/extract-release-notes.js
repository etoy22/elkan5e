import fs from 'fs';

const filePath = 'CHANGELOG.md';
const outputPath = 'release-notes.md';

try {
	const changelog = fs.readFileSync(filePath, 'utf8');
	const lines = changelog.split('\n');

	const startIndex = lines.findIndex((line) => line.startsWith('# v'));
	if (startIndex === -1) throw new Error('No version section found.');

	const versionLines = lines.slice(startIndex + 1);
	const nextVersionIndex = versionLines.findIndex((line) => line.startsWith('# v'));
	const releaseNotes =
		nextVersionIndex !== -1 ? versionLines.slice(0, nextVersionIndex) : versionLines;

	const formattedNotes = [];
	let inClassesSection = false;

	releaseNotes.forEach((line) => {
		if (line.startsWith('## ')) {
			formattedNotes.push(`**${line.slice(3).trim()}**`);
			inClassesSection = line.toLowerCase().includes('classes');
		} else if (inClassesSection && line.startsWith('**[')) {
			formattedNotes.push(`* ${line.slice(2, -3)}`);
		} else if (inClassesSection && line.startsWith('  -')) {
			formattedNotes.push(`  *${line.trim().slice(1)}`);
		} else if (inClassesSection && line.startsWith('-')) {
			formattedNotes.push(`  *${line.trim().slice(1)}`);
		} else if (line.startsWith('-')) {
			formattedNotes.push(`*${line.slice(1)}`);
		} else if (line.trim() === '') {
			formattedNotes.push('');
		} else {
			formattedNotes.push(line);
		}
	});

	fs.writeFileSync(outputPath, formattedNotes.join('\n'), 'utf8');
	console.error('Release notes written to release-notes.md');
} catch (error) {
	console.warn(`Failed to extract release notes: ${error.message}`);
	fs.writeFileSync(outputPath, '', 'utf8');
	console.error('Wrote blank release-notes.md instead.');
}
