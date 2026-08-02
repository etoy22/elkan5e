import fs from "fs";
import path from "path";
import crypto from "node:crypto";

const FEATURE_ROOT = "packs/_source/elkan5e-creature-features";
const CREATURE_ROOT = "packs/_source/elkan5e-creatures";
const EXCLUDED_NAMES = new Set(["Shapechanger", "Multiattack", "Slam", "Claws", "Charge"]);
const EQUIPMENT_ROOTS = ["packs/_source/elkan5e-equipment"];
const SPELL_ROOT = "packs/_source/elkan5e-spells";
const REPORT_PATH = "scripts/logs/sync-features-report.log";

/**
 * Utility function for random Id.
 *
 * @returns Operation result.
 */
function randomId() {
	return crypto.randomBytes(9).toString("base64url").slice(0, 16);
}

/**
 * Utility function for ensure Item Identity.
 *
 * @param {*} item - Item document to process.
 * @returns Operation result.
 */
function ensureItemIdentity(item) {
	const id = item?._id && item._id.length <= 16 ? item._id : item?._id || randomId();
	const key = item?._key || (id ? `!items!${id}` : undefined);
	return { id, key };
}

/**
 * Utility function for load Json.
 *
 * @param {*} file - Filesystem path to process.
 * @returns Operation result.
 */
function loadJson(file) {
	const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
	return JSON.parse(text);
}

/**
 * Utility function for save Json.
 *
 * @param {*} file - Filesystem path to process.
 * @param {*} data - Data object used for processing.
 */
function saveJson(file, data) {
	fs.writeFileSync(file, JSON.stringify(data, null, "\t"));
}

/**
 * Utility function for ensure Dir For.
 *
 * @param {*} file - Filesystem path to process.
 */
function ensureDirFor(file) {
	const dir = path.dirname(file);
	fs.mkdirSync(dir, { recursive: true });
}

/**
 * Utility function for walk Json Files.
 *
 * @param {*} dir - Directory path to process.
 * @param {*} list - List.
 * @returns Operation result.
 */
function walkJsonFiles(dir, list = []) {
	return fs.readdirSync(dir, { withFileTypes: true }).reduce((acc, entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walkJsonFiles(full, acc);
		if (entry.isFile() && entry.name.endsWith(".json")) acc.push(full);
		return acc;
	}, list);
}

const clone = (v) => JSON.parse(JSON.stringify(v));

/**
 * Utility function for build Feature Descriptions.
 *
 * @returns Operation result.
 */
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

/**
 * Utility function for build Base Items.
 *
 * @returns Operation result.
 */
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

/**
 * Utility function for build Cantrips.
 *
 * @returns Operation result.
 */
function buildCantrips() {
	const files = walkJsonFiles(SPELL_ROOT);
	const byKey = new Map();
	for (const file of files) {
		const data = loadJson(file);
		if (data?.type !== "spell") continue;
		if (data?.system?.level !== 0) continue;
		const identifier = data?.system?.identifier;
		const name = data?.name;
		if (identifier && !byKey.has(identifier)) byKey.set(identifier, data);
		if (name && !byKey.has(name)) byKey.set(name, data);
	}
	return byKey;
}

/**
 * Scales a spell's activities (healing/damage dice) up to reflect casting
 * it at a higher slot level than the canonical base spell.
 *
 * @param {*} activities - Activities object to mutate in place.
 * @param {*} levelDiff - Whole slot levels above the base spell's level.
 */
function applySpellLevelScaling(activities, levelDiff) {
	if (!levelDiff || levelDiff <= 0) return;
	for (const act of Object.values(activities || {})) {
		const healingScaling = act?.healing?.scaling;
		if (healingScaling?.mode === "whole" && healingScaling.number) {
			act.healing.number = (act.healing.number || 0) + healingScaling.number * levelDiff;
		} else if (healingScaling?.mode === "half" && healingScaling.number) {
			act.healing.number =
				(act.healing.number || 0) + healingScaling.number * Math.floor(levelDiff / 2);
		}

		const parts = act?.damage?.parts;
		if (!Array.isArray(parts)) continue;
		for (const part of parts) {
			const scaling = part?.scaling;
			if (scaling?.mode === "whole" && scaling.number) {
				part.number = (part.number || 0) + scaling.number * levelDiff;
			} else if (scaling?.mode === "half" && scaling.number) {
				part.number = (part.number || 0) + scaling.number * Math.floor(levelDiff / 2);
			}
		}
	}
}

/**
 * Utility function for build Spell Index.
 *
 * @returns Operation result.
 */
function buildSpellIndex() {
	const files = walkJsonFiles(SPELL_ROOT);
	const byKey = new Map();
	for (const file of files) {
		const data = loadJson(file);
		if (data?.type !== "spell") continue;
		const identifier = data?.system?.identifier;
		const name = data?.name;
		if (identifier && !byKey.has(identifier)) byKey.set(identifier, data);
		if (name && !byKey.has(name)) byKey.set(name, data);
	}
	return byKey;
}

/**
 * Utility function for sync Features.
 *
 * @returns Operation result.
 */
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
	let updatedSpells = 0;
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
			// Keep the creature's prepared/known mode regardless of the base cantrip's own setting.
			newItem.system.preparation = clone(
				item?.system?.preparation ?? newItem.system?.preparation ?? {},
			);

			const current = {
				name: item.name,
				type: item.type,
				img: item.img,
				flags: item.flags,
				effects: item.effects,
				system: item.system,
			};
			const replacement = {
				name: newItem.name,
				type: newItem.type,
				img: newItem.img,
				flags: newItem.flags,
				effects: newItem.effects,
				system: newItem.system,
			};

			if (JSON.stringify(current) !== JSON.stringify(replacement)) {
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
		}

		// Spells (non-cantrip): merge with canonical spell pack using configured rules.
		// Two shapes are expected here: the regular spell, and an upcast variant whose
		// name carries a "(Nth Level)" suffix (e.g. "Fireball (5th Level)") - both merge
		// against the same canonical base spell, keeping their own name/level.
		for (const item of data?.items || []) {
			if (!item || item?.type !== "spell") continue;
			if (item?.system?.level === 0) continue;

			const LEVEL_SUFFIX = /[-\s]?\(?(?:\d+(?:st|nd|rd|th)[-\s]+level|level[-\s]+\d+)\)?$/i;
			const rawIdent = item?.system?.identifier || item?.name || "";
			const ident = rawIdent.replace(LEVEL_SUFFIX, "");
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
			// Keep the creature's own identifier (e.g. "cure-wounds-(3rd-level)") rather
			// than the canonical base spell's plain identifier.
			if (item?.system?.identifier) merged.system.identifier = item.system.identifier;

			// Canonical targets/helper fields/consumption/materials/properties/itemCondition
			if (base?.system?.activities) merged.system.activities = clone(base.system.activities);
			// Cast at a higher slot level than the base spell: scale healing/damage dice up.
			const levelDiff =
				(item?.system?.level ?? base?.system?.level ?? 0) - (base?.system?.level ?? 0);
			applySpellLevelScaling(merged.system.activities, levelDiff);
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

			const current = {
				img: item.img,
				flags: item.flags,
				folder: item.folder,
				name: item.name,
				system: item.system,
			};
			const replacement = {
				img: merged.img,
				flags: merged.flags,
				folder: merged.folder,
				name: merged.name,
				system: merged.system,
			};

			if (JSON.stringify(current) !== JSON.stringify(replacement)) {
				item._id = merged._id;
				item._key = merged._key;
				item.img = merged.img;
				item.flags = merged.flags;
				item.folder = merged.folder;
				item.name = merged.name;
				item.system = merged.system;
				changed = true;
				updatedSpells++;
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
		`Feature descriptions synced on ${updatedItems} items; cantrips synced on ${updatedCantrips} items; spells synced on ${updatedSpells} items; weapons synced on ${updatedWeapons} items; armor synced on ${updatedArmor} items across ${updatedFiles} creature files.`,
	);

	// Report skipped
	const lines = [];
	lines.push(`Feature sync report ${new Date().toISOString()}`);
	lines.push(
		`Feature descriptions synced: ${updatedItems}, cantrips synced: ${updatedCantrips}, spells synced: ${updatedSpells}, weapons synced: ${updatedWeapons}, armor synced: ${updatedArmor}, creature files touched: ${updatedFiles}`,
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
	const previous = fs.existsSync(REPORT_PATH) ? fs.readFileSync(REPORT_PATH, "utf8") : "";
	fs.writeFileSync(REPORT_PATH, report + (previous ? "\n" + previous : ""), "utf8");
}

syncFeatures();
