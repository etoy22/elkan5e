import fs from 'fs';

const filePath = 'CHANGELOG.md';
const outputPath = 'release-notes.md';

try {
	const changelog = fs.readFileSync(filePath, 'utf8');
	const lines = changelog.split('\n');

	const startIndex = lines.findIndex((line) => line.startsWith('# v'));
	if (startIndex === -1) throw new Error('No version section found.');

	const nextVersionChunk = lines.slice(startIndex + 1).findIndex((line) => line.startsWith('# v'));
	const endIndex =
		nextVersionChunk !== -1 ? startIndex + 1 + nextVersionChunk : lines.length;
	let releaseNotesLines = lines.slice(startIndex, endIndex);

	if (releaseNotesLines[0]?.startsWith('# v')) {
		releaseNotesLines = releaseNotesLines.slice(1);
		while (releaseNotesLines[0] === '') {
			releaseNotesLines = releaseNotesLines.slice(1);
		}
	}

	const formattedNotes = releaseNotesLines.join('\n').trimEnd();

	fs.writeFileSync(outputPath, `${formattedNotes}\n`, 'utf8');
	console.error('Release notes written to release-notes.md');
} catch (error) {
	console.warn(`Failed to extract release notes: ${error.message}`);
	fs.writeFileSync(outputPath, '', 'utf8');
	console.error('Wrote blank release-notes.md instead.');
}
