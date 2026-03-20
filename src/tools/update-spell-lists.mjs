import fs from "fs";
import path from "path";
import crypto from "node:crypto";

const SPELLS_ROOT = "packs/_source/elkan5e-spells";
const SPELLS_BY_CLASS_PATH = "packs/_source/elkan5e-rules/spell-lists/spells-by-class.json";
const SPELLS_BY_SCHOOL_PATH =
	"packs/_source/elkan5e-rules/spell-lists/spells-by-school-of-magic.json";
const SPELLS_BY_SUBCLASS_PATH = "packs/_source/elkan5e-rules/spell-lists/spells-by-subclass.json";
const SUBCLASS_ROOT = "packs/_source/elkan5e-subclass";
const SPELL_LEVEL_DIRS = [
	["cantrip", 0],
	["level-1", 1],
	["level-2", 2],
	["level-3", 3],
	["level-4", 4],
	["level-5", 5],
	["level-6", 6],
	["level-7", 7],
	["level-8", 8],
	["level-9", 9],
];
const CLASS_SPECIFIC_DIR = path.join(SPELLS_ROOT, "spells-class-specific-versions");

/**
 * Utility function for normalize Spell Level.
 *
 * @param {*} rawLevel - Raw Level.
 * @returns {unknown} Operation result.
 */
function normalizeSpellLevel(rawLevel) {
	const level = Number(rawLevel);
	if (!Number.isInteger(level)) return null;
	if (level < 0 || level > 9) return null;
	return level;
}

/**
 * Utility function for get Expected Spell Dir.
 *
 * @param {*} level - Level.
 * @returns {unknown} Operation result.
 */
function getExpectedSpellDir(level) {
	return level === 0 ? "cantrip" : `level-${level}`;
}

// Foundry-style short ID for new pages (16 chars, URL-safe)
/**
 * Utility function for random Id.
 *
 * @returns {unknown} Operation result.
 */
function randomId() {
	return crypto.randomBytes(9).toString("base64url").slice(0, 16);
}

/**
 * Utility function for load Json.
 *
 * @param {*} file - Filesystem path to process.
 * @returns {unknown} Operation result.
 */
function loadJson(file) {
	return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Utility function for save Json.
 *
 * @param {*} file - Filesystem path to process.
 * @param {*} data - Data object used for processing.
 * @returns {void} Operation result.
 */
function saveJson(file, data) {
	fs.writeFileSync(file, JSON.stringify(data, null, "\t"));
}

/**
 * Utility function for build Spell Level Map.
 *
 * @returns {unknown} Operation result.
 */
function buildSpellLevelMap() {
	const map = new Map();
	for (const [dir, lvl] of SPELL_LEVEL_DIRS) {
		const dirPath = path.join(SPELLS_ROOT, dir);
		if (!fs.existsSync(dirPath)) continue;
		for (const file of fs.readdirSync(dirPath)) {
			if (!file.endsWith(".json")) continue;
			const json = loadJson(path.join(dirPath, file));
			if (!json?._id) continue;

			const jsonLevel = normalizeSpellLevel(json?.system?.level);
			const resolvedLevel = jsonLevel ?? lvl;

			// Source of truth: level 0 spells are always cantrips.
			if (jsonLevel !== null && getExpectedSpellDir(jsonLevel) !== dir) {
				console.warn(
					`Spell directory mismatch for "${json.name ?? json._id}": expected ${getExpectedSpellDir(jsonLevel)}, found ${dir}`,
				);
			}

			map.set(json._id, resolvedLevel);
		}
	}
	return map;
}

/**
 * Utility function for build Class Spell Map.
 *
 * @returns {unknown} Operation result.
 */
function buildClassSpellMap() {
	const data = loadJson(SPELLS_BY_CLASS_PATH);
	const map = new Map();
	for (const page of data.pages || []) {
		if (page.type !== "spells") continue;
		map.set(page.name.toLowerCase(), page.system.spells || []);
	}
	return map;
}

/**
 * Utility function for build School Spell Map.
 *
 * @returns {unknown} Operation result.
 */
function buildSchoolSpellMap() {
	const data = loadJson(SPELLS_BY_SCHOOL_PATH);
	const map = new Map();
	for (const page of data.pages || []) {
		if (page.type !== "spells") continue;
		map.set(page.name.toLowerCase(), page.system.spells || []);
	}
	return map;
}

/**
 * Utility function for uuid To Id.
 *
 * @param {*} uuid - Identifier value.
 * @returns {unknown} Operation result.
 */
function uuidToId(uuid) {
	const parts = uuid.split(".");
	return parts[parts.length - 1];
}

/**
 * Utility function for filter By Level.
 *
 * @param {*} spells - Spells.
 * @param {*} levelMap - Level Map.
 * @param {*} maxLevel - Max Level.
 * @returns {unknown} Operation result.
 */
function filterByLevel(spells, levelMap, maxLevel) {
	return spells.filter((uuid) => {
		const lvl = levelMap.get(uuidToId(uuid));
		return lvl !== undefined && lvl <= maxLevel;
	});
}

/**
 * Utility function for ensure Page.
 *
 * @param {*} data - Data object used for processing.
 * @param {*} name - Name value used by the operation.
 * @param {*} identifier - Identifier.
 * @returns {unknown} Operation result.
 */
function ensurePage(data, name, identifier) {
	let page = data.pages.find((p) => p.name === name && p.type === "spells");
	if (!page) {
		page = {
			name,
			type: "spells",
			system: {
				type: "subclass",
				grouping: "level",
				description: { value: "" },
				spells: [],
				unlinkedSpells: [],
				identifier: identifier ?? name.toLowerCase().replace(/\s+/g, "-"),
			},
			title: { show: true, level: 1 },
			image: {},
			text: { format: 1 },
			video: { controls: true, volume: 0.5 },
			src: null,
			flags: {
				"monks-enhanced-journal": {
					appendix: false,
				},
			},
			_id: randomId(),
		};
		data.pages.push(page);
	}
	return page;
}

/**
 * Utility function for ensure School Page.
 *
 * @param {*} data - Data object used for processing.
 * @param {*} name - Name value used by the operation.
 * @param {*} identifier - Identifier.
 * @returns {unknown} Operation result.
 */
function ensureSchoolPage(data, name, identifier) {
	let page = data.pages.find((p) => p.name === name && p.type === "spells");
	if (!page) {
		page = {
			name,
			type: "spells",
			system: {
				type: "other",
				grouping: "level",
				description: { value: "" },
				spells: [],
				unlinkedSpells: [],
				identifier: identifier ?? name.toLowerCase().replace(/\s+/g, "-"),
			},
			title: { show: true, level: 1 },
			image: {},
			text: { format: 1 },
			video: { controls: true, volume: 0.5 },
			src: null,
			flags: {
				"monks-enhanced-journal": {
					appendix: false,
				},
			},
			_id: randomId(),
		};
		data.pages.push(page);
	}
	return page;
}

/**
 * Utility function for update Spellsword And Mystic Trickster.
 *
 * @param {*} data - Data object used for processing.
 * @param {*} classSpellMap - Class Spell Map.
 * @param {*} levelMap - Level Map.
 * @returns {void} Operation result.
 */
function updateSpellswordAndMysticTrickster(data, classSpellMap, levelMap) {
	for (const page of data.pages || []) {
		if (page.type !== "spells") continue;
		const match = page.name.match(/^(Spellsword|Mystic Trickster) \(([^)]+)\)/);
		if (!match) continue;
		const className = match[2].toLowerCase();
		const classSpells = classSpellMap.get(className);
		if (!classSpells) continue; // class without spell list
		const filtered = filterByLevel(classSpells, levelMap, 5);
		page.system.spells = filtered;
	}
}

/**
 * Utility function for update Wizard Schools.
 *
 * @param {*} data - Data object used for processing.
 * @param {*} classSpellMap - Class Spell Map.
 * @param {*} schoolMap - School Map.
 * @param {*} excludedSpellUuids - Excluded Spell Uuids.
 * @returns {void} Operation result.
 */
function updateWizardSchools(data, classSpellMap, schoolMap, excludedSpellUuids = new Set()) {
	const wizardSpells = new Set(classSpellMap.get("wizard") || []);
	const subclasses = [
		["Abjurer", "abjuration spells", "abjurer"],
		["Conjurer", "conjuration spells", "conjurer"],
		["Diviner", "divination spells", "diviner"],
		["Enchanter", "enchantment spells", "enchanter"],
		["Evoker", "evocation spells", "evoker"],
		["Illusionist", "illusion spells", "illusionist"],
		["Necromancer", "necromancy spells", "necromancer"],
		["Transmuter", "transmutation spells", "transmuter"],
	];
	for (const [name, schoolKey, identifier] of subclasses) {
		const schoolSpells = schoolMap.get(schoolKey) || [];
		const filtered = schoolSpells.filter(
			(uuid) => !wizardSpells.has(uuid) && !excludedSpellUuids.has(uuid),
		);
		const page = ensurePage(data, name, identifier);
		page.system.spells = filtered;
	}
}

/**
 * Utility function for walk Json Files.
 *
 * @param {*} dir - Directory path to process.
 * @param {*} list - List.
 * @returns {unknown} Operation result.
 */
function walkJsonFiles(dir, list = []) {
	return fs.readdirSync(dir, { withFileTypes: true }).reduce((acc, entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walkJsonFiles(full, acc);
		if (entry.isFile() && entry.name.endsWith(".json")) acc.push(full);
		return acc;
	}, list);
}

/**
 * Utility function for build Class Specific Spell Set.
 *
 * @returns {unknown} Operation result.
 */
function buildClassSpecificSpellSet() {
	if (!fs.existsSync(CLASS_SPECIFIC_DIR)) return new Set();
	const set = new Set();
	for (const file of walkJsonFiles(CLASS_SPECIFIC_DIR)) {
		const json = loadJson(file);
		if (json?._id) {
			set.add(`Compendium.elkan5e.elkan5e-spells.Item.${json._id}`);
		}
	}
	return set;
}

/**
 * Utility function for update Schools.
 *
 * @param {*} data - Data object used for processing.
 * @param {*} excludedSpellUuids - Excluded Spell Uuids.
 * @returns {void} Operation result.
 */
function updateSchools(data, excludedSpellUuids = new Set()) {
	const schoolNames = {
		abj: "Abjuration Spells",
		con: "Conjuration Spells",
		div: "Divination Spells",
		enc: "Enchantment Spells",
		evo: "Evocation Spells",
		ill: "Illusion Spells",
		nec: "Necromancy Spells",
		trs: "Transmutation Spells",
	};

	const schoolLists = Object.fromEntries(Object.keys(schoolNames).map((k) => [k, []]));

	for (const [dir] of SPELL_LEVEL_DIRS) {
		const dirPath = path.join(SPELLS_ROOT, dir);
		if (!fs.existsSync(dirPath)) continue;
		for (const file of fs.readdirSync(dirPath)) {
			if (!file.endsWith(".json")) continue;
			const spell = loadJson(path.join(dirPath, file));
			const school = spell?.system?.school;
			if (!school || !schoolLists[school]) continue;
			if (!spell._id) continue;
			const uuid = `Compendium.elkan5e.elkan5e-spells.Item.${spell._id}`;
			if (excludedSpellUuids.has(uuid)) continue;
			schoolLists[school].push(uuid);
		}
	}

	for (const [code, name] of Object.entries(schoolNames)) {
		const page = ensureSchoolPage(data, name, name.toLowerCase().replace(/\s+/g, "-"));
		page.system.spells = schoolLists[code] || [];
	}
}

/**
 * Utility function for update Subclass Grant Pages.
 *
 * @param {*} subclassData - Subclass Data.
 * @returns {void} Operation result.
 */
function updateSubclassGrantPages(subclassData) {
	const skipNames = new Set([
		"Abjurer",
		"Conjurer",
		"Diviner",
		"Enchanter",
		"Evoker",
		"Illusionist",
		"Necromancer",
		"Transmuter",
		"Spellsword (Bard)",
		"Spellsword (Cleric)",
		"Spellsword (Druid)",
		"Spellsword (Sorcerer)",
		"Spellsword (Warlock)",
		"Spellsword (Wizard)",
		"Mystic Trickster (Bard)",
		"Mystic Trickster (Cleric)",
		"Mystic Trickster (Druid)",
		"Mystic Trickster (Sorcerer)",
		"Mystic Trickster (Warlock)",
		"Mystic Trickster (Wizard)",
	]);

	const subclassFiles = walkJsonFiles(SUBCLASS_ROOT);
	for (const file of subclassFiles) {
		if (path.basename(file) === "_folder.json") continue;
		const data = loadJson(file);
		const spells = new Set();
		for (const adv of data.system?.advancement || []) {
			for (const item of adv.configuration?.items || []) {
				if (typeof item?.uuid === "string" && item.uuid.includes("elkan5e-spells")) {
					spells.add(item.uuid);
				}
			}
		}
		if (spells.size === 0) continue;
		if (skipNames.has(data.name)) continue;
		const page = ensurePage(
			subclassData,
			data.name,
			data.identifier || data.name.toLowerCase().replace(/\s+/g, "-"),
		);
		page.system.spells = Array.from(spells);
	}
}

/**
 * Utility function for run.
 *
 * @returns {void} Operation result.
 */
function run() {
	const levelMap = buildSpellLevelMap();
	const classSpellMap = buildClassSpellMap();
	const schoolMap = buildSchoolSpellMap();
	const excludedSpellUuids = buildClassSpecificSpellSet();
	const subclassData = loadJson(SPELLS_BY_SUBCLASS_PATH);
	const schoolData = loadJson(SPELLS_BY_SCHOOL_PATH);

	updateSpellswordAndMysticTrickster(subclassData, classSpellMap, levelMap);
	updateWizardSchools(subclassData, classSpellMap, schoolMap, excludedSpellUuids);
	updateSubclassGrantPages(subclassData, classSpellMap);
	updateSchools(schoolData, excludedSpellUuids);

	saveJson(SPELLS_BY_SUBCLASS_PATH, subclassData);
	saveJson(SPELLS_BY_SCHOOL_PATH, schoolData);
	console.log("Spell lists updated: subclass and school spell pages refreshed.");
}

run();
