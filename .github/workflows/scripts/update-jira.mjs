import process from "node:process";
import { Buffer } from "node:buffer";

function getEnv(name, { required = false, defaultValue = undefined } = {}) {
	const rawValue = process.env[name];
	const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
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

function cleanMultiline(value) {
	return value ? value.replace(/\r\n/g, "\n").trim() : "";
}

async function postJson(url, payload, headers, dryRun) {
	if (dryRun) {
		console.log(`::notice::[DRY RUN] Tracking Jira update for ${url}`);
		console.log(JSON.stringify(payload, null, 2));
		return;
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
		if (response.status === 401) {
			console.error(
				"::error::Jira rejected the request with 401 Unauthorized. Verify JIRA_BASE_URL, JIRA_USER_EMAIL, and JIRA_API_TOKEN secrets and ensure the user has required permissions.",
			);
		}
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

	const headers = {
		Authorization: `Basic ${Buffer.from(`${userEmail}:${apiToken}`).toString("base64")}`,
	};

	const releaseSummary = releaseNotes.split("\n")[0] ?? "";

	const deploymentPayload = {
		deployments: [
			{
				schemaVersion: "1.0",
				deploymentSequenceNumber,
				updateSequenceNumber: deploymentUpdateSequenceNumber,
				displayName: `Elkan 5e ${releaseVersion}`,
				description: releaseSummary,
				issueKeys: [],
				associations: [],
				url: pipelineUrl || releaseUrl,
				pipeline: {
					id: pipelineId,
					displayName: pipelineName,
					url: pipelineUrl || releaseUrl,
				},
				environment: {
					id: environmentId,
					displayName: environmentName,
					type: environmentType,
				},
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
				issueKeys: [],
			},
		],
	};

	const [deploymentResult, releaseResult] = await Promise.allSettled([
		postJson(`${baseUrl}/rest/deployments/0.1/bulk`, deploymentPayload, headers, dryRun),
		postJson(`${baseUrl}/rest/release/1.0/bulk`, releasePayload, headers, dryRun),
	]);

	const failures = [];
	if (deploymentResult.status === "rejected") {
		failures.push(new Error(`Deployment update failed: ${deploymentResult.reason?.message ?? deploymentResult.reason}`));
	}
	if (releaseResult.status === "rejected") {
		failures.push(new Error(`Release update failed: ${releaseResult.reason?.message ?? releaseResult.reason}`));
	}

	if (failures.length > 0) {
		for (const failure of failures) {
			console.error(`::error::${failure.message}`);
		}
		throw failures[0];
	}
}

main().catch((error) => {
	console.error("::error::Failed to update Jira:", error);
	process.exit(1);
});
