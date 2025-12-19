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

function loadJson(file) {
	return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveJson(file, data) {
	fs.writeFileSync(file, JSON.stringify(data, null, "\t"));
}

function buildSpellLevelMap() {
	const map = new Map();
	for (const [dir, lvl] of SPELL_LEVEL_DIRS) {
		const dirPath = path.join(SPELLS_ROOT, dir);
		if (!fs.existsSync(dirPath)) continue;
		for (const file of fs.readdirSync(dirPath)) {
			if (!file.endsWith(".json")) continue;
			const json = loadJson(path.join(dirPath, file));
			if (json?._id) map.set(json._id, lvl);
		}
	}
	return map;
}

function buildClassSpellMap() {
	const data = loadJson(SPELLS_BY_CLASS_PATH);
	const map = new Map();
	for (const page of data.pages || []) {
		if (page.type !== "spells") continue;
		map.set(page.name.toLowerCase(), page.system.spells || []);
	}
	return map;
}

function buildSchoolSpellMap() {
	const data = loadJson(SPELLS_BY_SCHOOL_PATH);
	const map = new Map();
	for (const page of data.pages || []) {
		if (page.type !== "spells") continue;
		map.set(page.name.toLowerCase(), page.system.spells || []);
	}
	return map;
}

function uuidToId(uuid) {
	const parts = uuid.split(".");
	return parts[parts.length - 1];
}

function filterByLevel(spells, levelMap, maxLevel) {
	return spells.filter((uuid) => {
		const lvl = levelMap.get(uuidToId(uuid));
		return lvl !== undefined && lvl <= maxLevel;
	});
}

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
			_id: crypto.randomUUID(),
		};
		data.pages.push(page);
	}
	return page;
}

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
			_id: crypto.randomUUID(),
		};
		data.pages.push(page);
	}
	return page;
}

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

function updateWizardSchools(data, classSpellMap, schoolMap) {
	const wizardSpells = new Set(classSpellMap.get("wizard") || []);
	const subclasses = [
		["Abjurer", "abjuration spells", "abjurer"],
		["Evoker", "evocation spells", "evoker"],
		["Illusionist", "illusion spells", "illusionist"],
		["Necromancer", "necromancy spells", "necromancer"],
	];
	for (const [name, schoolKey, identifier] of subclasses) {
		const schoolSpells = schoolMap.get(schoolKey) || [];
		const filtered = schoolSpells.filter((uuid) => !wizardSpells.has(uuid));
		const page = ensurePage(data, name, identifier);
		page.system.spells = filtered;
	}
}

function walkJsonFiles(dir, list = []) {
	return fs.readdirSync(dir, { withFileTypes: true }).reduce((acc, entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walkJsonFiles(full, acc);
		if (entry.isFile() && entry.name.endsWith(".json")) acc.push(full);
		return acc;
	}, list);
}

function updateSchools(data) {
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
			schoolLists[school].push(uuid);
		}
	}

	for (const [code, name] of Object.entries(schoolNames)) {
		const page = ensureSchoolPage(data, name, name.toLowerCase().replace(/\s+/g, "-"));
		page.system.spells = schoolLists[code] || [];
	}
}

function updateSubclassGrantPages(subclassData) {
	const skipNames = new Set([
		"Abjurer",
		"Evoker",
		"Illusionist",
		"Necromancer",
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

function run() {
	const levelMap = buildSpellLevelMap();
	const classSpellMap = buildClassSpellMap();
	const schoolMap = buildSchoolSpellMap();
	const subclassData = loadJson(SPELLS_BY_SUBCLASS_PATH);
	const schoolData = loadJson(SPELLS_BY_SCHOOL_PATH);

	updateSpellswordAndMysticTrickster(subclassData, classSpellMap, levelMap);
	updateWizardSchools(subclassData, classSpellMap, schoolMap);
	updateSubclassGrantPages(subclassData, classSpellMap);
	updateSchools(schoolData);

	saveJson(SPELLS_BY_SUBCLASS_PATH, subclassData);
	saveJson(SPELLS_BY_SCHOOL_PATH, schoolData);
	console.log("Spell lists updated: subclass and school spell pages refreshed.");
}

run();
