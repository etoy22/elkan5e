import fs from "node:fs";
import path from "node:path";

const rootDir = path.join(process.cwd(), "packs/_source/elkan5e-magic-items/srd-items-not-finished-converting");
const ringFolderId = "2Mw09hFMP9eIPMhO";

const entries = fs.readdirSync(rootDir, { withFileTypes: true });
let updated = 0;

for (const entry of entries) {
	if (!entry.isFile() || !entry.name.startsWith("ring-") || !entry.name.endsWith(".json")) continue;
	const filePath = path.join(rootDir, entry.name);
	let data;
	try {
		data = JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch (error) {
		console.warn(`Skipping ${entry.name}: ${error.message}`);
		continue;
	}
	if (data.folder === ringFolderId) continue;
	data.folder = ringFolderId;
	fs.writeFileSync(filePath, JSON.stringify(data, null, "\t") + "\n");
	updated++;
}

console.log(`Updated folder id for ${updated} ring files.`);
