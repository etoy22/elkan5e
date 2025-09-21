import { execSync } from 'child_process';
import fs from 'fs';

function cleanVersion(ver) {
	// normalize fancy dashes to ASCII hyphen and strip trailing ./-/space
	return ver.replace(/[–—‒−]/g, '-').replace(/[.\s-]+$/g, '');
}

function main() {
	try {
		// Subject only; take first line just in case
		const raw = execSync('git log -1 --pretty=%s').toString();
		const firstLine = raw.split(/\r?\n/)[0].trim();

		// Pull out version if it's embedded (e.g., "release: v1.13.0")
		// Allows optional suffix blocks like -alpha, -beta, -rc.1, -test
		const embedRegex = /(^|\s)([vV]\d+(?:\.\d+)+(?:\s*-\s*[\w.]+)*)($|\s)/;
		const m2 = embedRegex.exec(firstLine);
		const candidate = cleanVersion((m2?.[2] ?? firstLine));

		const versionRegex = /^([vV])(\d+(?:\.\d+)+)((?:\s*-\s*[\w.]+)*)$/;
		const match = candidate.match(versionRegex);

		if (!match) {
			console.log(JSON.stringify({
				should_continue: false,
				error: "Invalid commit message: expected something like 'v1.13.0' optionally followed by '-alpha|-beta|-test|-rc.1'.",
				commit_subject: firstLine
			}));
			process.exit(0);
		}

		const prefix = match[1].toLowerCase();
		const versionNumbers = match[2];
		const suffixes = (match[3] || '')
			.split('-').map(s => s.trim().toLowerCase()).filter(Boolean);

		const isTest = suffixes.includes('test');
		const prerelease = suffixes.some(s => s !== 'test');

		const moduleJson = JSON.parse(fs.readFileSync('module.json', 'utf8'));
		const comp = moduleJson.compatibility || {};
		const { minimum, verified, maximum } = comp;

		const output = {
			version: prefix + versionNumbers,   // => "v1.13.0"
			compatibility: { minimum, verified, maximum },
			should_continue: true,
			prerelease,
			test: isTest,
		};

		console.log(JSON.stringify(output));
		process.exit(0);
	} catch (err) {
		console.error('::error::Script failed: ' + (err.message || err));
		process.exit(1);
	}
}
main();