import fs from "fs";
import path from "path";
import crypto from "node:crypto";

const FEATURE_ROOT = "packs/_source/elkan5e-creature-features";
const CREATURE_ROOT = "packs/_source/elkan5e-creatures";
const EXCLUDED_NAMES = new Set(["Shapechanger", "Multiattack", "Slam", "Claws", "Charge"]);
const EQUIPMENT_ROOTS = ["packs/_source/elkan5e-equipment", "packs/_source/elkan5e-magic-items"];
const SPELL_ROOT = "packs/_source/elkan5e-spells";
const REPORT_PATH = "helperCode/logs/sync-features-report.log";

function randomId() {
	return crypto.randomBytes(9).toString("base64url").slice(0, 16);
}

function ensureItemIdentity(item) {
	const id = item?._id && item._id.length <= 16 ? item._id : item?._id || randomId();
	const key = item?._key || (id ? `!items!${id}` : undefined);
	return { id, key };
}

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

function buildCantrips() {
	const files = walkJsonFiles(SPELL_ROOT);
	const byKey = new Map();
	for (const file of files) {
		const data = loadJson(file);
		if (data?.type !== "spell") continue;
		if (data?.system?.level !== 0) continue;
		const key = data?.system?.identifier || data?.name;
		if (key) byKey.set(key, data);
	}
	return byKey;
}

function buildSpellIndex() {
	const files = walkJsonFiles(SPELL_ROOT);
	const byKey = new Map();
	for (const file of files) {
		const data = loadJson(file);
		if (data?.type !== "spell") continue;
		const key = data?.system?.identifier || data?.name;
		if (key && !byKey.has(key)) byKey.set(key, data);
	}
	return byKey;
}

function syncFeatures() {
	const featureMap = buildFeatureDescriptions();
	const BASE_ITEMS = buildBaseItems();
	const CANTRIPS = buildCantrips();
	const SPELLS = buildSpellIndex();
	const creatureFiles = walkJsonFiles(CREATURE_ROOT);

	let updatedFiles = 0;
	let updatedItems = 0;
	let updatedWeapons = 0;
	let updatedArmor = 0;
	let updatedCantrips = 0;
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

		// Cantrips: replace with canonical spell pack version
		for (const item of data?.items || []) {
			if (!item || item?.type !== "spell") continue;
			if (item?.system?.level !== 0) continue;

			const ident = item?.system?.identifier || item?.name;
			if (!ident) {
				skipped.push({
					file,
					name: item?.name,
					type: "spell",
					reason: "cantrip without identifier",
				});
				continue;
			}

			const base = CANTRIPS.get(ident);
			if (!base) {
				skipped.push({
					file,
					name: item?.name,
					type: "spell",
					reason: "no matching base cantrip",
				});
				continue;
			}

			const keepFields = {
				_id: item._id,
				_key: item._key,
				folder: item.folder,
			};

			const newItem = clone(base);
			Object.assign(newItem, keepFields);
			newItem._id = keepFields._id;
			newItem._key = keepFields._key;

			item._id = newItem._id;
			item._key = newItem._key;
			item.folder = newItem.folder;
			item.name = newItem.name;
			item.type = newItem.type;
			item.img = newItem.img;
			item.flags = newItem.flags;
			item.effects = newItem.effects;
			item.system = newItem.system;
			changed = true;
			updatedCantrips++;
		}

		// Spells (non-cantrip): merging is deferred for now.
		// Spells (non-cantrip): merge with canonical spell pack using configured rules
		for (const item of data?.items || []) {
			if (!item || item?.type !== "spell") continue;
			if (item?.system?.level === 0) continue;

			// Skip Level-tagged variants
			if (/\(Level\s+\d+\)/i.test(item?.name || "")) {
				skipped.push({
					file,
					name: item?.name,
					type: "spell",
					reason: "level-tagged variant - skip merge",
				});
				continue;
			}

			const ident = item?.system?.identifier || item?.name;
			let lookupKey = ident;
			if (!lookupKey) {
				skipped.push({
					file,
					name: item?.name,
					type: "spell",
					reason: "spell without identifier",
				});
				continue;
			}

			// Alias: Charm Person -> charm-person
			if (lookupKey.toLowerCase() === "charm person") lookupKey = "charm-person";

			const base = SPELLS.get(lookupKey);
			if (!base) {
				skipped.push({
					file,
					name: item?.name,
					type: "spell",
					reason: "no matching base spell",
				});
				continue;
			}

			const merged = clone(base);

			// Always keep identity fields
			const { id, key } = ensureItemIdentity(item);
			merged._id = id;
			merged._key = key;
			merged.img = lookupKey === "charm-person" ? merged.img : item.img;
			merged.flags = item.flags;
			merged.folder = item.folder;
			merged.name = item.name;

			// Keep prep mode and uses from creature
			merged.system.uses = clone(item?.system?.uses ?? merged.system?.uses ?? {});
			merged.system.preparation = clone(
				item?.system?.preparation ?? merged.system?.preparation ?? {},
			);
			// If the creature spell has a max uses value, always preserve it
			if (item?.system?.uses?.max !== undefined && item.system.uses.max !== "") {
				merged.system.uses = clone(item.system.uses);
			}
			if (item?.system?.level !== undefined) merged.system.level = item.system.level;

			// Canonical targets/helper fields/consumption/materials/properties/itemCondition
			if (base?.system?.activities) merged.system.activities = clone(base.system.activities);
			if (base?.system?.materials) merged.system.materials = clone(base.system.materials);
			if (base?.system?.properties) merged.system.properties = clone(base.system.properties);
			if (base?.system?.itemCondition)
				merged.system.itemCondition = clone(base.system.itemCondition);

			// Preserve creature consumptions when base lacks them (match by activity id)
			const creatureActs = item?.system?.activities ? clone(item.system.activities) : {};
			const mergedActs = merged.system.activities || {};
			const actIds = Object.keys(mergedActs);
			for (const actId of actIds) {
				const baseAct = mergedActs[actId];
				const creatureAct = creatureActs[actId];
				if (!creatureAct) continue;
				const creatureTargets = creatureAct?.consumption?.targets;
				const baseTargets = baseAct?.consumption?.targets;
				if (
					(!baseTargets || baseTargets.length === 0) &&
					creatureTargets &&
					creatureTargets.length
				) {
					if (!baseAct.consumption) baseAct.consumption = {};
					baseAct.consumption.targets = creatureTargets;
				}
			}
			// If only one activity total and it lacks consumption.targets, but creature had them, copy them
			if (actIds.length === 1) {
				const actId = actIds[0];
				const baseAct = mergedActs[actId];
				const creatureAct = creatureActs[actId];
				const creatureTargets = creatureAct?.consumption?.targets;
				const baseTargets = baseAct?.consumption?.targets;
				if (
					(!baseTargets || baseTargets.length === 0) &&
					creatureTargets &&
					creatureTargets.length
				) {
					if (!baseAct.consumption) baseAct.consumption = {};
					baseAct.consumption.targets = creatureTargets;
				}
			}

			item._id = merged._id;
			item._key = merged._key;
			item.img = merged.img;
			item.flags = merged.flags;
			item.folder = merged.folder;
			item.name = merged.name;
			item.system = merged.system;
			changed = true;
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
				...ensureItemIdentity(item),
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
			newItem._id = keepFields._id;
			newItem._key = keepFields._key;
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
				...ensureItemIdentity(item),
				folder: item.folder,
				quantity: item?.system?.quantity,
				container: item?.system?.container,
				attuned: item?.system?.attuned,
			};

			const newItem = clone(base);
			Object.assign(newItem, keepFields);
			if (!newItem.system) newItem.system = {};
			newItem.system.equipped = true;
			newItem._id = keepFields._id;
			newItem._key = keepFields._key;

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
		`Feature descriptions synced on ${updatedItems} items; cantrips synced on ${updatedCantrips} items; weapons synced on ${updatedWeapons} items; armor synced on ${updatedArmor} items across ${updatedFiles} creature files.`,
	);

	// Report skipped
	const lines = [];
	lines.push(`Feature sync report ${new Date().toISOString()}`);
	lines.push(
		`Feature descriptions synced: ${updatedItems}, cantrips synced: ${updatedCantrips}, weapons synced: ${updatedWeapons}, armor synced: ${updatedArmor}, creature files touched: ${updatedFiles}`,
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
