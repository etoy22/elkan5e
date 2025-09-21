import fetch from 'node-fetch';
import { pathToFileURL } from 'url';

export function buildPayload({ repo, version, minimum, verified, maximum }) {
	if (!repo) throw new Error('GITHUB_REPOSITORY not set');
	if (!version) throw new Error('VERSION not set');
	if (!minimum) throw new Error('MINIMUM compatibility not set');
	if (!verified) throw new Error('VERIFIED compatibility not set');

	const repoUrl = `https://github.com/${repo}`;
	const payload = {
		id: 'elkan5e',
		release: {
			version,
			manifest: `${repoUrl}/releases/download/${version}/module.json`,
			download: `${repoUrl}/releases/download/${version}/module.zip`,
			notes: `${repoUrl}/releases/tag/${version}`,
			compatibility: {
				minimum,
				verified,
			},
		},
	};

	if (maximum && maximum.trim() !== '') {
		payload.release.compatibility.maximum = maximum;
	}

	return payload;
}

export async function releaseToFoundry({
	env = process.env,
	fetchImpl = fetch,
	consoleImpl = console,
} = {}) {
	const token = env.FOUNDRY_API_TOKEN;
	const repo = env.GITHUB_REPOSITORY;
	const version = env.VERSION;
	const minimum = env.MINIMUM;
	const verified = env.VERIFIED;
	const maximum = env.MAXIMUM;
	const test = env.TEST;

	if (!token) throw new Error('FOUNDRY_API_TOKEN not set');

	const payload = buildPayload({ repo, version, minimum, verified, maximum });

	consoleImpl.log('Payload to Foundry API:');
	consoleImpl.log(JSON.stringify(payload, null, 2));

	if (test === 'true' || test === '1') {
		consoleImpl.log('Test mode enabled - skipping Foundry API request.');
		return { skipped: true, payload };
	}

	const response = await fetchImpl('https://api.foundryvtt.com/_api/packages/release_version', {
		method: 'POST',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	const responseText = await response.text();

	consoleImpl.log('Foundry API response:');
	consoleImpl.log(responseText);

	if (!response.ok) {
		throw new Error(`Foundry API request failed: ${response.status} ${response.statusText}`);
	}

	consoleImpl.log('Foundry release successful!');

	return { skipped: false, payload, responseText };
}

async function main() {
	try {
		await releaseToFoundry();
	} catch (error) {
		console.error('Error releasing to Foundry:', error);
		process.exit(1);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	void main();
}
