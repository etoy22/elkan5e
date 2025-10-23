import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve("packs/_source/elkan5e-magic-items/srd-items-not-finished-converting");

function hasDashOutsideParens(header) {
	let depth = 0;
	for (let i = 0; i < header.length; i += 1) {
		const char = header[i];
		if (char === "(") depth += 1;
		else if (char === ")") depth = Math.max(0, depth - 1);
		else if (char === "-" && depth === 0) {
			return true;
		}
	}
	return false;
}

function insertDash(header) {
	if (hasDashOutsideParens(header)) return header;
	let depth = 0;
	for (let i = 0; i < header.length; i += 1) {
		const char = header[i];
		if (char === "(") depth += 1;
		else if (char === ")") depth = Math.max(0, depth - 1);
		else if (char === "," && depth === 0) {
			const before = header.slice(0, i);
			const after = header.slice(i + 1).trimStart();
			return `${before} - ${after}`;
		}
	}
	return header;
}

function normalizeDescription(value) {
	if (typeof value !== "string") return value;
	const match = value.match(/^<p>(.*?)<\/p>/i);
	if (!match) return value;
	const header = match[1].trim();
	const headerMatch = header.match(/^<em>(.*)<\/em>$/i);
	const headerText = headerMatch ? headerMatch[1] : header;
	const normalizedText = insertDash(headerText);
	const needsWrap = !headerMatch;
	if (!needsWrap && normalizedText === headerText) return value;
	const wrapped = `<em>${normalizedText}</em>`;
	const rest = value.slice(match[0].length);
	return `<p>${wrapped}</p>${rest}`;
}

async function main() {
	const entries = await fs.readdir(ROOT_DIR, { withFileTypes: true });
	let updated = 0;
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
		const filePath = path.join(ROOT_DIR, entry.name);
		const raw = await fs.readFile(filePath, "utf8");
		let data;
		try {
			data = JSON.parse(raw);
		} catch (error) {
			console.error(`Failed to parse ${filePath}: ${error.message}`);
			continue;
		}
		const current = data?.system?.description?.value;
		const normalized = normalizeDescription(current);
		if (normalized === current) continue;
		data.system.description.value = normalized;
		await fs.writeFile(filePath, JSON.stringify(data, null, "\t") + "\n", "utf8");
		updated += 1;
		console.log(`Normalized header in ${entry.name}`);
	}
	console.log(`Header normalization complete. Updated ${updated} files.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
