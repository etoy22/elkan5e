const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "packs", "_source");
const EQUIPMENT_ROOT = path.join(SOURCE_ROOT, "elkan5e-equipment");
const MAGIC_ROOT = path.join(SOURCE_ROOT, "elkan5e-magic-items");

const MAGIC_WEAPON_TEXT =
	'<p><em>This weapon is unusually keen and easy to handle. It is most likely a magic weapon, though you can\'t identify the specific enchantment.</em></p>';
const MAGIC_ARMOR_TEXT =
	"<p><em>This armor is unusually strong and well-crafted. It is most likely magic, though you can't identify the specific enchantment.</em></p>";
const MAGIC_SHIELD_TEXT =
	"<p><em>This shield is unusually strong and well-crafted. It is most likely magic, though you can't identify the specific enchantment.</em></p>";

/** @type {Map<string, string>} */
const baseDescriptions = new Map();

const armorTypeSet = new Set(["light", "medium", "heavy", "shield"]);

function toKey(value) {
	return typeof value === "string"
		? value.trim().toLowerCase().replace(/\s+/g, "-")
		: undefined;
}

function walkFiles(dir) {
	/** @type {string[]} */
	const results = [];
	if (!fs.existsSync(dir)) return results;
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name.startsWith(".")) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...walkFiles(full));
		} else if (entry.isFile() && entry.name.endsWith(".json")) {
			results.push(full);
		}
	}
	return results;
}

function recordBaseDescription(item, filePath) {
	const relative = path.relative(EQUIPMENT_ROOT, filePath);
	if (relative.startsWith("..")) return;

	const segments = relative.split(path.sep);
	const [topLevel] = segments;

	if (topLevel === "weapons") {
		if (segments.length !== 3) return;
	} else if (topLevel === "armor") {
		if (segments.length !== 2) return;
	} else {
		return;
	}

	const filename = segments[segments.length - 1];
	if (!filename.endsWith(".json") || filename.startsWith("_")) return;

	if (isMagical(item)) return;

	const description = item?.system?.description?.value;
	if (typeof description !== "string" || !description.trim()) return;

	const keys = new Set();
	const identifier = toKey(item?.system?.identifier);
	const baseItem = toKey(item?.system?.type?.baseItem);
	const nameKey = toKey(item?.name);

	if (identifier) keys.add(identifier);
	if (baseItem) keys.add(baseItem);
	if (nameKey) keys.add(nameKey);

	for (const key of keys) {
		if (!baseDescriptions.has(key)) {
			baseDescriptions.set(key, description);
		}
	}
}

function loadJson(filePath) {
	const raw = fs.readFileSync(filePath, "utf8");
	return JSON.parse(raw);
}

function saveJson(filePath, data) {
	const content = JSON.stringify(data, null, "\t") + "\n";
	fs.writeFileSync(filePath, content, "utf8");
}

function isWeapon(item) {
	return item?.type === "weapon";
}

function isArmor(item) {
	return (
		item?.type === "equipment" &&
		armorTypeSet.has(item?.system?.type?.value)
	);
}

function isMagical(item) {
	const properties = Array.isArray(item?.system?.properties)
		? new Set(item.system.properties.map(String))
		: new Set();
	if (properties.has("mgc")) return true;

	const magicalBonus = item?.system?.magicalBonus;
	if (magicalBonus !== undefined && magicalBonus !== null) {
		const numeric = Number(magicalBonus);
		if (!Number.isNaN(numeric) && numeric !== 0) return true;
	}

	const rarity = String(item?.system?.rarity ?? "").toLowerCase();
	if (rarity && rarity !== "common") return true;

	return false;
}

function getBaseDescription(item, fallback) {
	const keys = [
		toKey(item?.system?.identifier),
		toKey(item?.system?.type?.baseItem),
		toKey(item?.name),
	];

	for (const key of keys) {
		if (key && baseDescriptions.has(key)) {
			return baseDescriptions.get(key);
		}
	}

	return fallback;
}

function buildUnidentifiedDescription({ baseDescription, magical, category, subtype }) {
	const parts = ['<p><em><strong>Unidentified</strong></em></p>'];
	if (magical) {
		if (category === "weapon") {
			parts.push(MAGIC_WEAPON_TEXT);
		} else if (category === "armor") {
			if (subtype === "shield") {
				parts.push(MAGIC_SHIELD_TEXT);
			} else {
				parts.push(MAGIC_ARMOR_TEXT);
			}
		}
	}
	if (baseDescription) {
		parts.push(baseDescription);
	}
	return parts.join("");
}

function updateItem(filePath) {
	const item = loadJson(filePath);
	const category = isWeapon(item)
		? "weapon"
		: isArmor(item)
		? "armor"
		: null;

	let changed = false;

	if (category) {
		const originalDescription = item?.system?.description?.value ?? "";

		const magical = isMagical(item);
		const baseDescription = magical
			? getBaseDescription(item, originalDescription)
			: originalDescription;

		const originalName = (item?.name ?? "").trim();
		const cleanedName = originalName.replace(/\s*\+\d+\s*$/u, "");
		const displayName = cleanedName || originalName;
		const isHelm = /\bhelm\b/i.test(originalName);

		const newDescription = buildUnidentifiedDescription({
			baseDescription,
			magical,
			category,
			subtype: item?.system?.type?.value ?? "",
		});
		let newName = `Unidentified ${displayName}`.trim();
		let finalDescription = newDescription;

		if (isHelm) {
			newName = "Unidentified Helm";
			finalDescription = "";
		}

		if (!item.system) item.system = {};
		if (!item.system.unidentified || typeof item.system.unidentified !== "object") {
			item.system.unidentified = {};
		}

		const previousName = item.system.unidentified.name ?? "";
		const previousDescription = item.system.unidentified.description ?? "";

		if (previousName !== newName) {
			item.system.unidentified.name = newName;
			changed = true;
		}
		if (previousDescription !== finalDescription) {
			item.system.unidentified.description = finalDescription;
			changed = true;
		}
	}

	const desiredEffectName = item?.name ?? "";
	const itemImg = item?.img ?? "";
	if (Array.isArray(item?.effects)) {
		for (const effect of item.effects) {
			if (!effect || typeof effect !== "object") continue;
			if (desiredEffectName && effect.name !== desiredEffectName) {
				effect.name = desiredEffectName;
				changed = true;
			}
			if (effect.img !== itemImg) {
				effect.img = itemImg;
				changed = true;
			}
		}
	}

	if (!changed) return false;

	saveJson(filePath, item);
	return true;
}

// Build base description lookup from equipment data before making changes.
const equipmentFiles = walkFiles(EQUIPMENT_ROOT);
for (const file of equipmentFiles) {
	try {
		const item = loadJson(file);
		if (isWeapon(item) || isArmor(item)) {
			recordBaseDescription(item, file);
		}
	} catch (error) {
		console.warn(`Skipping base record for ${file}: ${error.message}`);
	}
}

const magicFiles = walkFiles(MAGIC_ROOT);

const targets = [...equipmentFiles, ...magicFiles];

let updatedCount = 0;
for (const file of targets) {
	try {
		if (updateItem(file)) {
			updatedCount += 1;
		}
	} catch (error) {
		console.error(`Failed to update ${file}: ${error.message}`);
	}
}

console.log(`Updated ${updatedCount} files.`);
