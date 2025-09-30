import process from "node:process";
import { Buffer } from "node:buffer";

function getEnv(name, { required = false, defaultValue = undefined } = {}) {
	const value = process.env[name];
	if (!value || value.length === 0) {
		if (required) {
			throw new Error(`Environment variable ${name} is required.`);
		}
		return defaultValue;
	}
	return value;
}

function parseBoolean(value) {
	if (!value) return false;
	const normalised = value.trim().toLowerCase();
	return ["true", "1", "yes", "y", "on"].includes(normalised);
}

function uniqueIssueKeys(fromText) {
	if (!fromText) return [];
	const matches = fromText.match(/\b[A-Z][A-Z0-9]+-\d+\b/g);
	return matches ? Array.from(new Set(matches)) : [];
}

function cleanMultiline(value) {
	return value ? value.replace(/\r\n/g, "\n").trim() : "";
}

async function postJson(url, payload, headers, dryRun) {
	if (dryRun) {
		console.log(`::notice::[DRY RUN] Tracking Jira update for ${url}`);
		console.log(JSON.stringify(payload, null, 2));
	}

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			...headers,
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Jira request failed ${response.status} ${response.statusText}: ${text}`);
	}

	console.log(`::notice::Successful POST ${url}`);
}

async function main() {
	const baseUrl = getEnv("JIRA_BASE_URL", { required: true }).replace(/\/$/, "");
	const userEmail = getEnv("JIRA_USER_EMAIL", { required: true });
	const apiToken = getEnv("JIRA_API_TOKEN", { required: true });
	const dryRun = parseBoolean(getEnv("JIRA_DRY_RUN", { defaultValue: "false" }));

	const releaseVersion = getEnv("RELEASE_VERSION", { required: true });
	const releaseNotes = cleanMultiline(getEnv("RELEASE_NOTES", { defaultValue: "" }));
	const releaseUrl = getEnv("RELEASE_URL", { defaultValue: "" });
	const releaseState = getEnv("RELEASE_STATE", { defaultValue: "unreleased" });

	const pipelineUrl = getEnv("PIPELINE_URL", { defaultValue: releaseUrl });
	const pipelineId = getEnv("PIPELINE_ID", { defaultValue: "elkan5e/pipeline" });
	const pipelineName = getEnv("PIPELINE_NAME", { defaultValue: pipelineId });

	const environmentId = getEnv("DEPLOYMENT_ENVIRONMENT_ID", { required: true });
	const environmentName = getEnv("DEPLOYMENT_ENVIRONMENT_NAME", { required: true });
	const environmentType = getEnv("DEPLOYMENT_ENVIRONMENT_TYPE", { required: true });

	const deploymentSequenceNumber = Number(
		getEnv("DEPLOYMENT_SEQUENCE_NUMBER", { defaultValue: Date.now().toString() }),
	);
	const deploymentUpdateSequenceNumber = Number(
		getEnv("DEPLOYMENT_UPDATE_SEQUENCE_NUMBER", { defaultValue: deploymentSequenceNumber.toString() }),
	);

	const issueKeys = uniqueIssueKeys(releaseNotes);
	if (issueKeys.length === 0) {
		console.log("::notice::No Jira issue keys detected in release notes. Skipping Jira update.");
		return;
	}

	const headers = {
		Authorization: `Basic ${Buffer.from(`${userEmail}:${apiToken}`).toString("base64")}`,
	};

	const deploymentPayload = {
		deployments: [
			{
				schemaVersion: "1.0",
				deploymentSequenceNumber,
				updateSequenceNumber: deploymentUpdateSequenceNumber,
				displayName: `Elkan 5e ${releaseVersion}`,
				description: releaseNotes.split("\n")[0] ?? "",
				issueKeys,
				url: pipelineUrl || releaseUrl,
				pipeline: pipelineId
					? {
						id: pipelineId,
						displayName: pipelineName,
						url: pipelineUrl || releaseUrl,
					}
					: undefined,
				environment: {
					id: environmentId,
					displayName: environmentName,
					type: environmentType,
				},
				associations: issueKeys.map((key) => ({ associationType: "ISSUE", values: [{ issueIdOrKey: key }] })),
			},
		],
	};

	const releasePayload = {
		releases: [
			{
				schemaVersion: "1.0",
				id: releaseVersion,
				displayName: releaseVersion,
				url: releaseUrl,
				released: releaseState === "released",
				status: releaseState,
				releaseDate: new Date().toISOString(),
				description: releaseNotes,
				issueKeys,
			},
		],
	};

	await postJson(`${baseUrl}/rest/deployments/0.1/bulk`, deploymentPayload, headers, dryRun);
	await postJson(`${baseUrl}/rest/release/1.0/bulk`, releasePayload, headers, dryRun);
}

main().catch((error) => {
	console.error("::error::Failed to update Jira:", error);
	process.exit(1);
});
