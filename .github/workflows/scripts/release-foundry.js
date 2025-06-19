const fetch = require('node-fetch');

async function main() {
  try {
    const token = process.env.FOUNDRY_API_TOKEN;
    const repo = process.env.GITHUB_REPOSITORY;
    const version = process.env.VERSION;
    const minimum = process.env.MINIMUM;
    const verified = process.env.VERIFIED;
    const maximum = process.env.MAXIMUM;

    if (!token) throw new Error('FOUNDRY_API_TOKEN not set');
    if (!repo) throw new Error('GITHUB_REPOSITORY not set');
    if (!version) throw new Error('VERSION not set');
    if (!minimum) throw new Error('MINIMUM compatibility not set');
    if (!verified) throw new Error('VERIFIED compatibility not set');

    const repoUrl = `https://github.com/${repo}`;

    const payload = {
      id: "elkan5e",
      release: {
        version,
        manifest: `${repoUrl}/releases/download/${version}/module.json`,
        download: `${repoUrl}/releases/download/${version}/module.zip`,
        notes: `${repoUrl}/releases/tag/${version}`,
        compatibility: {
          minimum,
          verified
        }
      }
    };

    if (maximum && maximum.trim() !== '') {
      payload.release.compatibility.maximum = maximum;
    }

    console.log("Sending payload to Foundry API:");
    console.log(JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.foundryvtt.com/_api/packages/release_version', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    console.log("Foundry API response:");
    console.log(responseText);

    if (!response.ok) {
      throw new Error(`Foundry API request failed: ${response.status} ${response.statusText}`);
    }

    console.log("Foundry release successful!");
  } catch (error) {
    console.error("Error releasing to Foundry:", error);
    process.exit(1);
  }
}

main();
