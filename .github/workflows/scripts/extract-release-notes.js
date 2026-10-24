import fs from 'fs';

const filePath = 'CHANGELOG.md';
const outputPath = 'release-notes.md';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isVersionHeading = (line) => /^#\s+v\d/i.test(line);

try {
	const version = (process.env.VERSION || '').trim();
	if (!version) throw new Error('VERSION is not set.');

	// Match "# v1.14.5" (optionally followed by a suffix like " -beta"), but not "# v1.14.5.1"
	const headingRegex = new RegExp(`^#\\s+${escapeRegex(version)}(?=$|[\\s-])`, 'i');

	const changelog = fs.readFileSync(filePath, 'utf8');
	const lines = changelog.replace(/\r\n/g, '\n').split('\n');

	const startIndex = lines.findIndex((line) => headingRegex.test(line.trim()));
	if (startIndex === -1) {
		throw new Error(`No "# ${version}" section found in ${filePath}.`);
	}

	const nextVersionChunk = lines.slice(startIndex + 1).findIndex(isVersionHeading);
	const endIndex =
		nextVersionChunk !== -1 ? startIndex + 1 + nextVersionChunk : lines.length;
	let releaseNotesLines = lines.slice(startIndex + 1, endIndex);
	while (releaseNotesLines[0]?.trim() === '') {
		releaseNotesLines = releaseNotesLines.slice(1);
	}

	const formattedNotes = releaseNotesLines.join('\n').trimEnd();
	if (!formattedNotes) throw new Error(`The "# ${version}" section in ${filePath} is empty.`);

	fs.writeFileSync(outputPath, `${formattedNotes}\n`, 'utf8');
	console.error(`Release notes for ${version} written to ${outputPath}`);
} catch (error) {
	console.error(`::warning::No release notes passed along: ${error.message}`);
	fs.writeFileSync(outputPath, '', 'utf8');
}
