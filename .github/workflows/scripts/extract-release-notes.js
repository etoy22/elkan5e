import fs from 'fs';

const stripBold = (line) => line.trim().replace(/^\*\*(.*)\*\*$/, '$1');

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
		const trimmed = line.trim();
		if (trimmed.startsWith('## ')) {
			formattedNotes.push(`**${trimmed.slice(3).trim()}**`);
			inClassesSection = line.toLowerCase().includes('classes');
		} else if (inClassesSection && trimmed.startsWith('**')) {
			formattedNotes.push(`* ${stripBold(trimmed)}`);
		} else if (inClassesSection && trimmed.startsWith('  -')) {
			formattedNotes.push(`  *${trimmed.slice(1)}`);
		} else if (inClassesSection && trimmed.startsWith('-')) {
			formattedNotes.push(`  *${trimmed.slice(1)}`);
		} else if (trimmed.startsWith('-')) {
			formattedNotes.push(`*${trimmed.slice(1)}`);
		} else if (trimmed === '') {
			formattedNotes.push('');
		} else {
			formattedNotes.push(trimmed);
		}
	});

	fs.writeFileSync(outputPath, formattedNotes.join('\n'), 'utf8');
	console.error('Release notes written to release-notes.md');
} catch (error) {
	console.warn(`Failed to extract release notes: ${error.message}`);
	fs.writeFileSync(outputPath, '', 'utf8');
	console.error('Wrote blank release-notes.md instead.');
}
