import fs from "fs";
import path from "path";

const FEATURE_ROOT = "packs/_source/elkan5e-creature-features";
const CREATURE_ROOT = "packs/_source/elkan5e-creatures";
const EXCLUDED_NAMES = new Set(["Shapechanger", "Multiattack", "Slam", "Claws", "Charge"]);
const EQUIPMENT_ROOTS = ["packs/_source/elkan5e-equipment", "packs/_source/elkan5e-magic-items"];
const REPORT_PATH = "helperCode/logs/sync-features-report.log";

function loadJson(file) {
	const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
	return JSON.parse(text);
}

function saveJson(file, data) {
	fs.writeFileSync(file, JSON.stringify(data, null, "\t"));
}

function ensureDirFor(file) {
	const dir = path.dirname(file);
	fs.mkdirSync(dir, { recursive: true });
}

function walkJsonFiles(dir, list = []) {
	return fs.readdirSync(dir, { withFileTypes: true }).reduce((acc, entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walkJsonFiles(full, acc);
		if (entry.isFile() && entry.name.endsWith(".json")) acc.push(full);
		return acc;
	}, list);
}

const clone = (v) => JSON.parse(JSON.stringify(v));

function buildFeatureDescriptions() {
	const files = walkJsonFiles(FEATURE_ROOT);
	const byKey = new Map();

	for (const file of files) {
		const feature = loadJson(file);
		const desc = feature?.system?.description;
		if (!desc) continue;

		const identifier = feature?.system?.identifier;
		const name = feature?.name;

		if (identifier) byKey.set(identifier, desc);
		if (name) byKey.set(name, desc);
	}

	return byKey;
}

function buildBaseItems() {
	const files = EQUIPMENT_ROOTS.flatMap((r) => walkJsonFiles(r));
	const byId = new Map();
	for (const file of files) {
		const data = loadJson(file);
		const ident = data?.system?.identifier;
		if (ident) byId.set(ident, data);
	}
	return byId;
}

function syncFeatures() {
	const featureMap = buildFeatureDescriptions();
	const BASE_ITEMS = buildBaseItems();
	const creatureFiles = walkJsonFiles(CREATURE_ROOT);

	let updatedFiles = 0;
	let updatedItems = 0;
	let updatedWeapons = 0;
	let updatedArmor = 0;
	const skipped = [];

	for (const file of creatureFiles) {
		const data = loadJson(file);
		let changed = false;

		// Feature descriptions
		for (const item of data?.items || []) {
			if (!item?.system) continue;
			if (EXCLUDED_NAMES.has(item?.name)) continue;

			const keys = [];
			if (item.system.identifier) keys.push(item.system.identifier);
			if (item.name) keys.push(item.name);

			let matchDesc = null;
			for (const key of keys) {
				if (featureMap.has(key)) {
					matchDesc = featureMap.get(key);
					break;
				}
			}

			if (!matchDesc) continue;

			const currentDesc = item.system.description;
			if (JSON.stringify(currentDesc) !== JSON.stringify(matchDesc)) {
				item.system.description = clone(matchDesc);
				changed = true;
				updatedItems++;
			}
		}

		// Weapons: copy over from equipment if identifiers match and damage/range/activities match
		for (const item of data?.items || []) {
			if (!item?.system || item?.type !== "weapon") continue;
			const ident = item?.system?.identifier;
			if (!ident) {
				skipped.push({ file, name: item?.name, type: "weapon", reason: "no identifier" });
				continue;
			}
			// natural weapons keep as-is
			if (item?.system?.type?.value === "natural") {
				skipped.push({ file, name: item?.name, type: "weapon", reason: "natural weapon" });
				continue;
			}
			const base = BASE_ITEMS.get(ident);
			if (!base) {
				skipped.push({
					file,
					name: item?.name,
					type: "weapon",
					reason: "no matching base item",
				});
				continue;
			}

			const keepFields = {
				img: item.img,
				flags: item.flags,
				_id: item._id,
				_key: item._key,
				folder: item.folder,
				quantity: item?.system?.quantity,
				container: item?.system?.container,
				attuned: item?.system?.attuned,
			};

			const sameDamage =
				JSON.stringify(item?.system?.damage ?? null) ===
				JSON.stringify(base?.system?.damage ?? null);
			const sameRange =
				JSON.stringify(item?.system?.range ?? null) ===
				JSON.stringify(base?.system?.range ?? null);
			const sameActivities =
				JSON.stringify(item?.system?.activities ?? null) ===
				JSON.stringify(base?.system?.activities ?? null);

			if (!sameDamage || !sameRange || !sameActivities) {
				const reasons = [];
				if (!sameDamage) reasons.push("damage");
				if (!sameRange) reasons.push("range");
				if (!sameActivities) reasons.push("activities");
				skipped.push({
					file,
					name: item?.name,
					type: "weapon",
					reason: `differs in ${reasons.join(", ")}`,
				});
				continue;
			}

			const newItem = clone(base);
			Object.assign(newItem, keepFields);
			if (!newItem.system) newItem.system = {};
			newItem.system.equipped = true;
			item._id = newItem._id;
			item._key = newItem._key;
			item.img = newItem.img;
			item.flags = newItem.flags;
			item.folder = newItem.folder;
			item.system = newItem.system;
			changed = true;
			updatedWeapons++;
		}

		// Armor: copy over from equipment if identifiers match
		for (const item of data?.items || []) {
			if (!item?.system || item?.type !== "armor") continue;
			const ident = item?.system?.identifier;
			if (!ident) {
				skipped.push({ file, name: item?.name, type: "armor", reason: "no identifier" });
				continue;
			}
			const base = BASE_ITEMS.get(ident);
			if (!base) {
				skipped.push({
					file,
					name: item?.name,
					type: "armor",
					reason: "no matching base item",
				});
				continue;
			}

			const keepFields = {
				img: item.img,
				flags: item.flags,
				_id: item._id,
				_key: item._key,
				folder: item.folder,
				quantity: item?.system?.quantity,
				container: item?.system?.container,
				attuned: item?.system?.attuned,
			};

			const newItem = clone(base);
			Object.assign(newItem, keepFields);
			if (!newItem.system) newItem.system = {};
			newItem.system.equipped = true;

			item._id = newItem._id;
			item._key = newItem._key;
			item.img = newItem.img;
			item.flags = newItem.flags;
			item.folder = newItem.folder;
			item.system = newItem.system;
			changed = true;
			updatedArmor++;
		}

		if (changed) {
			saveJson(file, data);
			updatedFiles++;
		}
	}

	console.log(
		`Feature descriptions synced on ${updatedItems} items; weapons synced on ${updatedWeapons} items; armor synced on ${updatedArmor} items across ${updatedFiles} creature files.`,
	);

	// Report skipped
	const lines = [];
	lines.push(`Feature sync report ${new Date().toISOString()}`);
	lines.push(
		`Feature descriptions synced: ${updatedItems}, weapons synced: ${updatedWeapons}, armor synced: ${updatedArmor}, creature files touched: ${updatedFiles}`,
	);
	if (skipped.length) {
		lines.push("Skipped items:");
		const normalized = skipped.map((s) => {
			const base = s.file.replace(/^.*packs[_/\\]_source[_/\\]elkan5e-creatures[_/\\]/, "");
			return { ...s, displayFile: base };
		});
		const byReason = new Map();
		for (const s of normalized) {
			const key = s.reason;
			if (!byReason.has(key)) byReason.set(key, []);
			byReason.get(key).push(s);
		}
		const sortedReasons = Array.from(byReason.keys()).sort();
		for (const reason of sortedReasons) {
			lines.push(`  Reason: ${reason}`);
			const list = byReason.get(reason).sort((a, b) => {
				if (a.displayFile === b.displayFile)
					return (a.name || "").localeCompare(b.name || "");
				return a.displayFile.localeCompare(b.displayFile);
			});
			for (const s of list) {
				lines.push(`  - ${s.displayFile} :: ${s.type} ${s.name || "<unnamed>"}`);
			}
		}
	} else {
		lines.push("Skipped items: none");
	}
	const report = lines.join("\n") + "\n";
	ensureDirFor(REPORT_PATH);
	fs.writeFileSync(REPORT_PATH, report, "utf8");
}

syncFeatures();
