import fs from "fs";
import path from "path";

const CREATURES_ROOT = "packs/_source/elkan5e-creatures";
const SUMMONED_ROOT = "packs/_source/elkan5e-summoned-creatures";

function loadJson(file) {
	const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
	return JSON.parse(text);
}

function saveJson(file, data) {
	fs.writeFileSync(file, JSON.stringify(data, null, "\t"));
}

function walkJsonFiles(dir, list = []) {
	return fs.readdirSync(dir, { withFileTypes: true }).reduce((acc, entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walkJsonFiles(full, acc);
		if (entry.isFile() && entry.name.endsWith(".json")) acc.push(full);
		return acc;
	}, list);
}

function syncSummonedCreatures() {
	const baseFiles = walkJsonFiles(CREATURES_ROOT);
	const summonedFiles = walkJsonFiles(SUMMONED_ROOT);

	const baseByName = new Map();
	for (const file of baseFiles) {
		const name = path.basename(file, ".json");
		baseByName.set(name, file);
	}

	let synced = 0;
	for (const file of summonedFiles) {
		const name = path.basename(file, ".json");
		const basePath = baseByName.get(name);
		if (!basePath || name === "_folder") continue;

		const base = loadJson(basePath);
		const target = loadJson(file);

		const merged = { ...base, _id: target._id, _key: target._key };
		saveJson(file, merged);
		synced++;
	}

	console.log(`Summoned creatures synced: ${synced}`);
}

syncSummonedCreatures();
