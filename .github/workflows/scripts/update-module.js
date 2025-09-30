import fs from 'fs';
import { pathToFileURL } from 'url';

function buildReleaseAssetUrl(currentUrl, version, filename, fallbackBase) {
	if (!version) throw new Error('VERSION argument is required');

	const downloadSegment = '/releases/download/';
	if (currentUrl && currentUrl.includes(downloadSegment)) {
		const [prefix] = currentUrl.split(downloadSegment, 1);
		return `${prefix}${downloadSegment}${version}/${filename}`;
	}

	if (fallbackBase) {
		const base = fallbackBase.endsWith('/') ? fallbackBase.slice(0, -1) : fallbackBase;
		return `${base}/releases/download/${version}/${filename}`;
	}

	return currentUrl;
}

export function updateModuleJson(
	version,
	compatibility,
	{
		filePath = 'module.json',
		readFileSync = fs.readFileSync,
		writeFileSync = fs.writeFileSync,
	} = {},
) {
	const moduleJson = JSON.parse(readFileSync(filePath, 'utf8'));

	moduleJson.version = version;

	if (!moduleJson.compatibility) moduleJson.compatibility = {};
	moduleJson.compatibility.minimum = compatibility.minimum;
	moduleJson.compatibility.verified = compatibility.verified;

	const repoUrl = moduleJson.url;
	moduleJson.manifest = buildReleaseAssetUrl(
		moduleJson.manifest,
		version,
		'module.json',
		repoUrl,
	);
	moduleJson.download = buildReleaseAssetUrl(
		moduleJson.download,
		version,
		'module.zip',
		repoUrl,
	);

	writeFileSync(filePath, JSON.stringify(moduleJson, null, 2), 'utf8');
	return moduleJson;
}

function main() {
	const version = process.argv[2];
	const compatibility = {
		minimum: process.argv[3],
		verified: process.argv[4],
	};

	if (!version) {
		throw new Error('VERSION argument is required');
	}

	updateModuleJson(version, compatibility);
	console.log(`Updated module.json with version ${version} and compatibility.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
