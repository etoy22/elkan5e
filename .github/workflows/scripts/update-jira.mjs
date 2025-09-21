import { Buffer } from 'node:buffer';
import process from 'node:process';

function requiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`Missing required environment variable: ${name}`);
        process.exit(1);
    }
    return value;
}

function optionalEnv(name, fallback) {
    const value = process.env[name];
    return value && value.length > 0 ? value : fallback;
}

function unique(items) {
    return Array.from(new Set(items));
}

function normaliseBaseUrl(url) {
    return url.endsWith('/') ? url.slice(0, -1) : url;
}

function parseIssueKeys(text) {
    if (!text) {
        return [];
    }
    const matches = text.match(/[A-Z][A-Z0-9]+-\d+/g);
    return matches ? unique(matches.map((key) => key.toUpperCase())) : [];
}

function mapEnvironmentType(raw) {
    const allowed = new Set([
        'production',
        'staging',
        'testing',
        'development',
        'unmapped',
    ]);
    const normalised = (raw || '').toLowerCase();
    if (allowed.has(normalised)) {
        return normalised;
    }
    return 'unmapped';
}

function asNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function isTruthy(value) {
    if (!value) {
        return false;
    }
    const normalised = value.toString().trim().toLowerCase();
    return normalised === '1' || normalised === 'true' || normalised === 'yes' || normalised === 'y' || normalised === 'on';
}

async function postJson(url, body, headers) {
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Request to ${url} failed: ${response.status} ${response.statusText}\n${details}`);
    }
}

async function main() {
    const baseUrl = normaliseBaseUrl(requiredEnv('JIRA_BASE_URL'));
    const email = requiredEnv('JIRA_USER_EMAIL');
    const token = requiredEnv('JIRA_API_TOKEN');

    const releaseVersion = requiredEnv('RELEASE_VERSION');
    const releaseUrl = requiredEnv('RELEASE_URL');

    const releaseNotes = optionalEnv('RELEASE_NOTES', '');
    const releaseDescription = optionalEnv('RELEASE_DESCRIPTION', releaseNotes || `Release ${releaseVersion}`);

    const runId = optionalEnv('GITHUB_RUN_ID', `${Date.now()}`);
    const runNumber = asNumber(optionalEnv('GITHUB_RUN_NUMBER', runId), Date.now());
    const nowIso = new Date().toISOString();

    const repository = optionalEnv('GITHUB_REPOSITORY', '');
    const workflowName = optionalEnv('GITHUB_WORKFLOW', 'GitHub Actions');
    const pipelineUrl = optionalEnv('PIPELINE_URL', repository && runId ? `https://github.com/${repository}/actions/runs/${runId}` : releaseUrl);
    const pipelineId = optionalEnv('PIPELINE_ID', repository ? `${repository}/${workflowName}` : workflowName);
    const pipelineName = optionalEnv('PIPELINE_NAME', workflowName);

    const environmentId = optionalEnv('DEPLOYMENT_ENVIRONMENT_ID', optionalEnv('DEPLOYMENT_ENVIRONMENT_KEY', optionalEnv('DEPLOYMENT_ENVIRONMENT_NAME', 'production')));
    const environmentName = optionalEnv('DEPLOYMENT_ENVIRONMENT_NAME', environmentId);
    const environmentType = mapEnvironmentType(optionalEnv('DEPLOYMENT_ENVIRONMENT_TYPE', optionalEnv('TARGET_ENVIRONMENT_TYPE', optionalEnv('TARGET_ENVIRONMENT', 'production'))));

    const deploymentState = optionalEnv('DEPLOYMENT_STATE', 'successful');
    const deploymentDisplayName = optionalEnv('DEPLOYMENT_DISPLAY_NAME', `Deploy ${releaseVersion}`);
    const deploymentUrl = optionalEnv('DEPLOYMENT_URL', pipelineUrl);
    const deploymentDescription = optionalEnv('DEPLOYMENT_DESCRIPTION', `Deployment for ${releaseVersion}`);

    const releaseState = optionalEnv('RELEASE_STATE', 'released');
    const releaseDisplayName = optionalEnv('RELEASE_DISPLAY_NAME', `Release ${releaseVersion}`);

    const issueKeys = parseIssueKeys(releaseNotes);
    const dryRun = isTruthy(optionalEnv('JIRA_DRY_RUN', ''));

    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
        'User-Agent': optionalEnv('JIRA_USER_AGENT', 'elkan5e-ci-jira-integration/1.1'),
    };

    const deploymentPayload = {
        deployments: [
            {
                schemaVersion: '1.0',
                deploymentSequenceNumber: asNumber(optionalEnv('DEPLOYMENT_SEQUENCE_NUMBER', ''), runNumber),
                updateSequenceNumber: asNumber(optionalEnv('DEPLOYMENT_UPDATE_SEQUENCE_NUMBER', ''), runNumber),
                displayName: deploymentDisplayName,
                url: deploymentUrl,
                description: deploymentDescription,
                lastUpdated: nowIso,
                state: deploymentState,
                pipeline: {
                    id: pipelineId,
                    displayName: pipelineName,
                    url: pipelineUrl,
                },
                environment: {
                    id: environmentId,
                    displayName: environmentName,
                    type: environmentType,
                },
                associations: issueKeys.length
                    ? [
                          {
                              associationType: 'issueIdOrKeys',
                              values: issueKeys,
                          },
                      ]
                    : [],
            },
        ],
    };

    const releasePayload = {
        releases: [
            {
                schemaVersion: '1.0',
                id: optionalEnv('RELEASE_ID', `${pipelineId}-${releaseVersion}`),
                displayName: releaseDisplayName,
                url: releaseUrl,
                description: releaseDescription,
                lastUpdated: nowIso,
                releaseDate: optionalEnv('RELEASE_DATE', nowIso),
                state: releaseState,
                associations: issueKeys.length
                    ? [
                          {
                              associationType: 'issueIdOrKeys',
                              values: issueKeys,
                          },
                      ]
                    : [],
                version: {
                    id: optionalEnv('RELEASE_VERSION_ID', releaseVersion),
                    name: releaseVersion,
                    description: optionalEnv('VERSION_DESCRIPTION', releaseDescription),
                    url: releaseUrl,
                    released: releaseState === 'released',
                    releaseDate: optionalEnv('VERSION_RELEASE_DATE', nowIso.split('T')[0]),
                },
            },
        ],
    };

    if (dryRun) {
        console.log('[JIRA] Dry run enabled; skipping API calls.');
        console.log('[JIRA] Deployment payload preview:', JSON.stringify(deploymentPayload, null, 2));
        console.log('[JIRA] Release payload preview:', JSON.stringify(releasePayload, null, 2));
        return;
    }

    await postJson(`${baseUrl}/rest/deployments/0.1/bulk`, deploymentPayload, headers);
    await postJson(`${baseUrl}/rest/releases/0.1/bulk`, releasePayload, headers);

    console.log('Successfully sent deployment and release updates to Jira.');
}

try {
    await main();
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
}
