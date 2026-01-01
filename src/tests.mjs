import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { buildPayload, releaseToFoundry } from "../.github/workflows/scripts/release-foundry.js";
import { updateModuleJson } from "../.github/workflows/scripts/update-module.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workflowPath = resolve(__dirname, "../.github/workflows/main.yml");
const workflow = parse(readFileSync(workflowPath, "utf8"));

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

test("release-foundry-package job is wired to the release script", () => {
	const job = workflow.jobs?.["release-foundry-package"];
	assert.ok(job, "release-foundry-package job should exist");

	assert.deepEqual(job.needs, ["version-check", "create-github-release"]);
	assert.equal(
		job.if,
		"needs.version-check.outputs.should_continue == 'true' && needs.create-github-release.result == 'success' && needs.version-check.outputs.test != 'true'",
	);

	assert.equal(job.steps?.length, 3);
	assert.equal(job.steps[0].uses, "actions/checkout@v4");
	assert.equal(job.steps[1].name, "Install node dependencies");
	assert.equal(job.steps[1].run, "npm install node-fetch@2");
	assert.equal(job.steps[2].name, "Release Foundry Package");
	assert.equal(job.steps[2].run, "node .github/workflows/scripts/release-foundry.js");
	assert.deepEqual(job.steps[2].env, {
		FOUNDRY_API_TOKEN: "${{ secrets.FOUNDRY_API_TOKEN }}",
		GITHUB_REPOSITORY: "${{ github.repository }}",
		VERSION: "${{ needs.version-check.outputs.version }}",
		MINIMUM: "${{ needs.version-check.outputs.minimum }}",
		VERIFIED: "${{ needs.version-check.outputs.verified }}",
		TEST: "${{ needs.version-check.outputs.test }}",
	});
});

test("notify-discord job publishes release details to Discord", () => {
	const job = workflow.jobs?.["notify-discord"];
	assert.ok(job, "notify-discord job should exist");

	assert.deepEqual(job.needs, [
		"version-check",
		"extract-release-notes",
		"build-and-pack",
		"create-github-release",
	]);
	const notifyIf = (job.if ?? "").trim();
	assert.equal(
		notifyIf,
		"needs.version-check.outputs.should_continue == 'true' && needs.create-github-release.result == 'success' && needs.version-check.outputs.test != 'true' && env.DISCORD_WEBHOOK",
	);
	assert.deepEqual(job.env, {
		DISCORD_WEBHOOK: "${{ secrets.DISCORD_WEBHOOK }}",
		REPO_URL: "https://github.com/${{ github.repository }}",
		VERSION: "${{ needs.version-check.outputs.version }}",
		MINIMUM: "${{ needs.version-check.outputs.minimum }}",
		VERIFIED: "${{ needs.version-check.outputs.verified }}",
	});

	const stepNames = job.steps?.map((step) => step.name ?? step.uses);
	assert.deepEqual(stepNames, [
		"Download release notes artifact",
		"Show release notes in logs",
		"Read release notes content",
		"Prepare Discord payload",
		"Post to Discord",
	]);

	assert.equal(job.steps[0].uses, "actions/download-artifact@v4");
	assert.equal(job.steps[2].id, "read_release_notes");
	assert.equal(job.steps[3].id, "prepare_discord_payload");
	const postStep = job.steps[4].run ?? "";
	assert.ok(postStep.includes("set -eo pipefail"), "post step should enable pipefail");
	assert.ok(
		postStep.includes(
			'curl -sS -H \'Content-Type: application/json\' -X POST -d @"${payload_path}" "$DISCORD_WEBHOOK"',
		),
		"post step should invoke curl with payload and webhook",
	);
});

test("update-jira job requires Jira secrets before running", () => {
	const job = workflow.jobs?.["update-jira"];
	assert.ok(job, "update-jira job should exist");

	assert.deepEqual(job.needs, ["version-check", "extract-release-notes", "create-github-release"]);
	const updateIf = (job.if ?? "").trim();
	assert.equal(
		updateIf,
		"needs.version-check.outputs.should_continue == 'true' && needs.create-github-release.result == 'success' && env.JIRA_BASE_URL && env.JIRA_USER_EMAIL && env.JIRA_API_TOKEN",
	);

	assert.equal(job.env.JIRA_BASE_URL, "${{ secrets.JIRA_BASE_URL }}");
	assert.equal(job.env.JIRA_USER_EMAIL, "${{ secrets.JIRA_USER_EMAIL }}");
	assert.equal(job.env.JIRA_API_TOKEN, "${{ secrets.JIRA_API_TOKEN }}");
});

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
		{ minimum: "13", verified: "13.347" },
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
	assert.equal(
		written.manifest,
		"https://github.com/etoy22/elkan5e/releases/download/v1.2.3/module.json",
	);
	assert.equal(
		written.download,
		"https://github.com/etoy22/elkan5e/releases/download/v1.2.3/module.zip",
	);
});
