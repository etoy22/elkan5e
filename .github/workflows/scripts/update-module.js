// .github/workflows/scripts/update-module-json.js
// Usage: node update-module-json.js <version>
// Rewrites manifest/download URLs in module.json to point at the new release tag.
const fs = require("fs");
const path = require("path");

function main() {
	const version = process.argv[2];
	if (!version) {
		console.error("Missing version argument.");
		process.exit(1);
	}
	const modulePath = path.resolve(process.cwd(), "module.json");
	if (!fs.existsSync(modulePath)) {
		console.error("module.json not found at project root.");
		process.exit(1);
	}
	const raw = fs.readFileSync(modulePath, "utf8");
	let json;
	try { json = JSON.parse(raw); }
	catch (e) {
		console.error("Failed to parse module.json:", e.message);
		process.exit(1);
	}

	const tag = `v${version}`;
	json.manifest = `https://github.com/etoy22/elkan5e/releases/download/${tag}/module.json`;
	json.download = `https://github.com/etoy22/elkan5e/releases/download/${tag}/module.zip`;

	fs.writeFileSync(modulePath, JSON.stringify(json, null, 2) + "\n", "utf8");
	console.log("Updated module.json manifest & download for", tag);
}

main();