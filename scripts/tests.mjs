import "./match-items-tests.mjs";
import "./wild-surge-tests.mjs";
import "./skill-critical-tests.mjs";
import "./condition-damage-tests.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPayload, releaseToFoundry } from "../.github/workflows/scripts/release-foundry.js";
import { updateModuleJson } from "../.github/workflows/scripts/update-module.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packsRoot = resolve(__dirname, "../packs/_source");

const baseEnv = Object.freeze({
	FOUNDRY_API_TOKEN: "token-123",
	GITHUB_REPOSITORY: "etoy22/elkan5e",
	VERSION: "v1.2.3",
	MINIMUM: "12",
	VERIFIED: "12.1",
	MAXIMUM: "12.2",
});

function createConsoleMock() {
	return {
		logCalls: [],
		log(...args) {
			this.logCalls.push(args.join(" "));
		},
	};
}

function walkJsonFiles(dir) {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const entryPath = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walkJsonFiles(entryPath));
		else if (extname(entry.name) === ".json") out.push(entryPath);
	}
	return out;
}

test("buildPayload includes repository links and compatibility", () => {
	const payload = buildPayload({
		repo: baseEnv.GITHUB_REPOSITORY,
		version: baseEnv.VERSION,
		minimum: baseEnv.MINIMUM,
		verified: baseEnv.VERIFIED,
		maximum: baseEnv.MAXIMUM,
	});

	assert.equal(payload.id, "elkan5e");
	assert.equal(payload.release.version, baseEnv.VERSION);
	assert.equal(
		payload.release.manifest,
		`https://github.com/${baseEnv.GITHUB_REPOSITORY}/releases/download/${baseEnv.VERSION}/module.json`,
	);
	assert.equal(
		payload.release.download,
		`https://github.com/${baseEnv.GITHUB_REPOSITORY}/releases/download/${baseEnv.VERSION}/module.zip`,
	);
	assert.equal(
		payload.release.notes,
		`https://github.com/${baseEnv.GITHUB_REPOSITORY}/releases/tag/${baseEnv.VERSION}`,
	);
	assert.deepEqual(payload.release.compatibility, {
		minimum: baseEnv.MINIMUM,
		verified: baseEnv.VERIFIED,
		maximum: baseEnv.MAXIMUM,
	});
});

test("buildPayload omits maximum compatibility when empty", () => {
	const payload = buildPayload({
		repo: baseEnv.GITHUB_REPOSITORY,
		version: baseEnv.VERSION,
		minimum: baseEnv.MINIMUM,
		verified: baseEnv.VERIFIED,
		maximum: "   ",
	});

	assert.deepEqual(payload.release.compatibility, {
		minimum: baseEnv.MINIMUM,
		verified: baseEnv.VERIFIED,
	});
});

test("releaseToFoundry throws when the Foundry API token is missing", async () => {
	await assert.rejects(
		() =>
			releaseToFoundry({
				env: {
					...baseEnv,
					FOUNDRY_API_TOKEN: "",
				},
			}),
		/FOUNDRY_API_TOKEN not set/,
	);
});

test("releaseToFoundry does not call the API when test mode is enabled", async () => {
	let fetchCalled = false;
	const consoleMock = createConsoleMock();
	const result = await releaseToFoundry({
		env: {
			...baseEnv,
			TEST: "true",
		},
		fetchImpl: async () => {
			fetchCalled = true;
		},
		consoleImpl: consoleMock,
	});

	assert.equal(fetchCalled, false);
	assert.equal(result.skipped, true);
	assert.deepEqual(
		result.payload,
		buildPayload({
			repo: baseEnv.GITHUB_REPOSITORY,
			version: baseEnv.VERSION,
			minimum: baseEnv.MINIMUM,
			verified: baseEnv.VERIFIED,
			maximum: baseEnv.MAXIMUM,
		}),
	);
	assert.ok(consoleMock.logCalls.includes("Test mode enabled - skipping Foundry API request."));
});

test("releaseToFoundry posts the release payload to the Foundry API", async () => {
	let receivedUrl;
	let receivedOptions;
	const consoleMock = createConsoleMock();
	const result = await releaseToFoundry({
		env: baseEnv,
		fetchImpl: async (url, options) => {
			receivedUrl = url;
			receivedOptions = options;
			return {
				ok: true,
				status: 200,
				statusText: "OK",
				async text() {
					return "Release queued";
				},
			};
		},
		consoleImpl: consoleMock,
	});

	const expectedPayload = buildPayload({
		repo: baseEnv.GITHUB_REPOSITORY,
		version: baseEnv.VERSION,
		minimum: baseEnv.MINIMUM,
		verified: baseEnv.VERIFIED,
		maximum: baseEnv.MAXIMUM,
	});

	assert.equal(receivedUrl, "https://api.foundryvtt.com/_api/packages/release_version");
	assert.equal(receivedOptions.method, "POST");
	assert.deepEqual(receivedOptions.headers, {
		Authorization: baseEnv.FOUNDRY_API_TOKEN,
		"Content-Type": "application/json",
	});
	assert.deepEqual(JSON.parse(receivedOptions.body), expectedPayload);
	assert.equal(result.skipped, false);
	assert.equal(result.responseText, "Release queued");
	assert.ok(consoleMock.logCalls.at(-1)?.includes("Foundry release successful!"));
});

test("updateModuleJson synchronises manifest and download URLs with the version", () => {
	const initialModule = {
		version: "v0.9.9",
		compatibility: { minimum: "12", verified: "12.5" },
		url: "https://github.com/etoy22/elkan5e",
		manifest: "https://github.com/etoy22/elkan5e/releases/download/v0.9.9/module.json",
		download: "https://github.com/etoy22/elkan5e/releases/download/v0.9.9/module.zip",
	};

	let written;
	updateModuleJson(
		"v1.2.3",
		{ minimum: "13", verified: "13.347", maximum: "13.348" },
		{
			readFileSync: () => JSON.stringify(initialModule),
			writeFileSync: (_, data) => {
				written = JSON.parse(data);
			},
		},
	);

	assert.equal(written.version, "v1.2.3");
	assert.equal(written.compatibility.minimum, "13");
	assert.equal(written.compatibility.verified, "13.347");
	assert.equal(written.compatibility.maximum, "13.348");
	assert.equal(
		written.manifest,
		"https://github.com/etoy22/elkan5e/releases/download/v1.2.3/module.json",
	);
	assert.equal(
		written.download,
		"https://github.com/etoy22/elkan5e/releases/download/v1.2.3/module.zip",
	);
});

test("Brawler upgrades the existing unarmed strike", () => {
	const brawler = JSON.parse(
		readFileSync(join(packsRoot, "elkan5e-feats", "level-1-feats", "brawler.json"), "utf8"),
	);
	const modification = Object.values(brawler.system.advancement).find(
		(advancement) => advancement.type === "ModifyItem",
	);
	assert.ok(modification);

	const unarmedStrike = modification.configuration.changes.find((change) =>
		change.identifiers.includes("unarmed-strike"),
	);
	assert.ok(unarmedStrike);

	const effect = brawler.effects.find((entry) => entry._id === unarmedStrike._id);
	assert.ok(effect);
	assert.deepEqual(
		effect.system.changes
			.filter((change) => change.key === "system.damage.base.denomination")
			.map(({ type, value }) => ({ type, value })),
		[{ type: "upgrade", value: 6 }],
	);
	assert.deepEqual(
		Object.values(brawler.system.activities).map((activity) => activity.name),
		["Improvised Attack"],
	);
});

test("class saving-throw grants are not preselected", () => {
	const classPackRoot = join(packsRoot, "elkan5e-class");
	const classFiles = walkJsonFiles(classPackRoot).filter(
		(filePath) => dirname(dirname(filePath)) === classPackRoot,
	);
	const classItems = classFiles
		.map((filePath) => JSON.parse(readFileSync(filePath, "utf8")))
		.filter((item) => item.type === "class");

	for (const classItem of classItems) {
		const savingThrows = Object.values(classItem.system.advancement).find(
			(advancement) =>
				advancement.type === "Trait" &&
				advancement.level === 1 &&
				advancement.configuration.grants.some((grant) => grant.startsWith("saves:")),
		);
		assert.ok(savingThrows, `${classItem.name} should grant saving throws`);
		assert.deepEqual(
			savingThrows.value.chosen,
			[],
			`${classItem.name} saves should apply initially`,
		);
	}
});
