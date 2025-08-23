// .github/workflows/scripts/get-version-info.js
// Detects version/prerelease/test flags from commit message or PR title,
// and decides whether the pipeline should proceed.
//
// Outputs JSON to stdout:
// {
//   "version": "1.2.3",
//   "should_continue": true/false,
//   "test": true/false,
//   "prerelease": true/false,
//   "minimum": "",
//   "verified": ""
// }
//
import { execSync } from 'child_process';
import fs from 'fs';

function readEvent() {
	const p = process.env.GITHUB_EVENT_PATH;
	if (!p || !fs.existsSync(p)) return null;
	try { return JSON.parse(fs.readFileSync(p, "utf8")); }
	catch { return null; }
}

function latestCommitMessage() {
	try {
		return execSync("git log -1 --pretty=%B").toString().trim();
	} catch {
		return "";
	}
}

function extract(versionish) {
	if (!versionish) return null;
	// Accept leading 'v' optional, capture version portion "1.2.3" (and optionally .x segments).
	const m = versionish.match(/v?(\d+(?:\.\d+)+)/i);
	return m ? m[1] : null;
}

function hasFlag(text, flag) {
	if (!text) return false;
	// flags like -alpha, -beta, -test can be anywhere in message/title
	return new RegExp(`(?:\\s|^)-(?:${flag})(?=\\s|$|\\W)`, "i").test(text);
}

function main() {
	const event = readEvent();
	const eventName = process.env.GITHUB_EVENT_NAME || "";
	const ref = process.env.GITHUB_REF || "";
	const baseRef = event?.pull_request?.base?.ref || "";
	const prTitle = event?.pull_request?.title || "";
	const prMerged = !!event?.pull_request?.merged;
	const commitMsg = latestCommitMessage();
	const combinedText = `${commitMsg}\n${prTitle}`;

	// Find version in commit message or PR title
	const version = extract(commitMsg) || extract(prTitle) || "";

	// Flags
	const isTest = hasFlag(combinedText, "test");
	const isAlpha = hasFlag(combinedText, "alpha");
	const isBeta = hasFlag(combinedText, "beta");
	const prerelease = isAlpha || isBeta;

	// Decide whether to continue:
	// - Always continue for main pushes (including merged PRs that land on main)
	// - For PR events: continue when PR targets main AND is merged (action: closed with merged=true)
	// - Otherwise, do not continue (but the CI might still run tests if you add them)
	let should_continue = isTest;
	if (ref === "refs/heads/main") {
		should_continue = true;
	} else if (eventName === "pull_request" && baseRef === "main" && prMerged) {
		should_continue = true;
	}

	// If we don't have a version yet and we're supposed to continue, that's an error for release,
	// but we leave it to the workflow to fail later or you can enforce here.
	const out = {
		version,
		should_continue,
		test: isTest,
		prerelease,
		minimum: "",
		verified: ""
	};
	process.stdout.write(JSON.stringify(out, null, 2));
}

main();