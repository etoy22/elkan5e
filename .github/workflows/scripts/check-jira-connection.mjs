import process from "node:process";

function getEnv(name, { required = false } = {}) {
	const rawValue = process.env[name];
	const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
	if (!value || value.length === 0) {
		if (required) {
			throw new Error(`Environment variable ${name} is required.`);
		}
		return undefined;
	}
	return value;
}

async function checkConnection() {
	const baseUrl = getEnv("JIRA_BASE_URL", { required: true }).replace(/\/$/, "");
	const userEmail = getEnv("JIRA_USER_EMAIL", { required: true });
	const apiToken = getEnv("JIRA_API_TOKEN", { required: true });

	const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			Authorization: `Basic ${Buffer.from(`${userEmail}:${apiToken}`).toString("base64")}`,
		},
	});

	const body = await response.text();
	if (!response.ok) {
		console.error("::error::Failed to connect to Jira.");
		console.error(`Status: ${response.status} ${response.statusText}`);
		if (body) {
			console.error("Response:", body);
		}
		process.exit(1);
	}

	try {
		const json = JSON.parse(body);
		console.log("::notice::Jira connection successful.");
		if (json.displayName) {
			console.log(`Authenticated as: ${json.displayName} (${json.emailAddress || "email hidden"})`);
		}
	} catch (parseError) {
		console.log("::notice::Jira connection successful (non-JSON response).");
		console.log(body);
	}
}

checkConnection().catch((error) => {
	console.error("::error::Jira connection test failed:", error);
	process.exit(1);
});
