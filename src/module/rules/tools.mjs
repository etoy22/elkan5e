/**
 * Changes Foundry's tools to fit that of Elkan 5e. This is the only
 * one that we had to do a full replacement
 */
const TOOLS_TO_REMOVE_SRD = [
	"sculpt",
	"tailor",
	"game",
	"brass",
	"keyboard",
	"percussion",
	"string",
	"wind",
	"vocal",
	"fashion",
];
const TOOLS_TO_REMOVE_LEGACY = [
	"carpenter",
	"card",
	"cartographer",
	"chess",
	"cobbler",
	"dice",
	"glassblower",
	"potter",
	"weaver",
	"brass",
	"keyboard",
	"percussion",
	"string",
	"wind",
	"vocal",
	"fashion",
];

const TOOLS_TO_REMOVE = [
	"brewer",
	"carpenter",
	"card",
	"cartographer",
	"chess",
	"cobbler",
	"dice",
	"glassblower",
	"potter",
	"weaver",
	"herb",
	"forg",
	"tailor",
	"bagpipes",
	"flute",
	"drum",
	"dulcimer",
	"horn",
	"lute",
	"lyre",
	"panflute",
	"shawm",
	"viol",
];

const TOOLS = {
	alchemist: { id: "Compendium.elkan5e.elkan5e-equipment.Item.5TRgfcXqzHRvcYql" },
	brass: { id: "Compendium.elkan5e.elkan5e-equipment.Item.wYJIoj2Cc6paR1l5" },
	keyboard: { id: "Compendium.elkan5e.elkan5e-equipment.Item.dYeakzaHyN4ajpdX" },
	percussion: { id: "Compendium.elkan5e.elkan5e-equipment.Item.Ty9cLS7SN5YAiiES" },
	string: { id: "Compendium.elkan5e.elkan5e-equipment.Item.kxrPi9bBrsNf7LGW" },
	wind: { id: "Compendium.elkan5e.elkan5e-equipment.Item.XPuBMG9JIyJuqRbT" },
	vocal: { id: "Compendium.elkan5e.elkan5e-equipment.Item.9KOZArOUMbYym1PI" },
	bagpipes: { id: "Compendium.elkan5e.elkan5e-equipment.Item.bltntEoiFJvXR939" },
	brewer: { id: "Compendium.elkan5e.elkan5e-equipment.Item.sETCxXco4DFwc95F" },
	calligrapher: { id: "Compendium.elkan5e.elkan5e-equipment.Item.PSBsNmH0WWBmwTMY" },
	cook: { id: "Compendium.elkan5e.elkan5e-equipment.Item.oUY4OJSPtFBSuMJ5" },
	disg: { id: "Compendium.elkan5e.elkan5e-equipment.Item.ArsBY1Z7YMKYCWp5" },
	drum: { id: "Compendium.elkan5e.elkan5e-equipment.Item.VLTPhQqTAOk2LPHW" },
	dulcimer: { id: "Compendium.elkan5e.elkan5e-equipment.Item.v72QLYutEG6w5ZRI" },
	fashion: { id: "Compendium.elkan5e.elkan5e-equipment.Item.tRhjq67DVUwHu63D" },
	flute: { id: "Compendium.elkan5e.elkan5e-equipment.Item.uDJgqlZsYrqLrNEX" },
	forg: { id: "Compendium.elkan5e.elkan5e-equipment.Item.dFa31G5pfZ3FGcjk" },
	game: { id: "Compendium.elkan5e.elkan5e-equipment.Item.xC669rfIiGBpAALC" },
	herb: { id: "Compendium.elkan5e.elkan5e-equipment.Item.LQiHNDl73EtsWxj1" },
	horn: { id: "Compendium.elkan5e.elkan5e-equipment.Item.PgP06DVVwXZNPMOW" },
	jeweler: { id: "Compendium.elkan5e.elkan5e-equipment.Item.0xX2toS9DTCJapez" },
	leatherworker: { id: "Compendium.elkan5e.elkan5e-equipment.Item.SMTANmxywrhJQVmr" },
	lute: { id: "Compendium.elkan5e.elkan5e-equipment.Item.yQy1cBGK6P3eD4GZ" },
	lyre: { id: "Compendium.elkan5e.elkan5e-equipment.Item.BrCG6C5mCLPahCml" },
	mason: { id: "Compendium.elkan5e.elkan5e-equipment.Item.daNXsoFk7oYAeDRt" },
	navg: { id: "Compendium.elkan5e.elkan5e-equipment.Item.lExi8Y6jXHBv8vd2" },
	painter: { id: "Compendium.elkan5e.elkan5e-equipment.Item.qZe6ua1j3TtX3QGv" },
	panflute: { id: "Compendium.elkan5e.elkan5e-equipment.Item.VC36HOskyNfD6DXV" },
	pois: { id: "Compendium.elkan5e.elkan5e-equipment.Item.PGHsgtscRcDrKt6j" },
	sculpt: { id: "Compendium.elkan5e.elkan5e-equipment.Item.6x1yyzDnWGRNRwJD" },
	shawm: { id: "Compendium.elkan5e.elkan5e-equipment.Item.ZN6lVBJAeNqt4EE9" },
	smith: { id: "Compendium.elkan5e.elkan5e-equipment.Item.aFpNp019JYV5bcgI" },
	tailor: { id: "Compendium.elkan5e.elkan5e-equipment.Item.C3PHE8sJKlVZs9bH" },
	thief: { id: "Compendium.elkan5e.elkan5e-equipment.Item.LMnHshpVe3ciVIwF" },
	tinker: { id: "Compendium.elkan5e.elkan5e-equipment.Item.2Yeb51C04CmAhbsv" },
	viol: { id: "Compendium.elkan5e.elkan5e-equipment.Item.rrNz3sZQQdb8ygRW" },
	woodcarver: { id: "Compendium.elkan5e.elkan5e-equipment.Item.FDsEsGSSPWhqwjlE" },
};

const SRD_TOOL_TYPES = {
	alchemist: "art",
	bagpipes: "music",
	brass: "music",
	brewer: "art",
	calligrapher: "art",
	carpenter: "art",
	cartographer: "art",
	cobbler: "art",
	cook: "art",
	fashion: "art",
	glassblower: "art",
	game: "game",
	jeweler: "art",
	keyboard: "music",
	leatherworker: "art",
	mason: "art",
	painter: "art",
	potter: "art",
	sculpt: "art",
	smith: "art",
	tailor: "art",
	tinker: "art",
	weaver: "art",
	wind: "music",
	vocal: "music",
	woodcarver: "art",
	dice: "game",
	dragonchess: "game",
	card: "game",
	threedragonante: "game",
	percussion: "music",
	string: "music",
	drum: "music",
	dulcimer: "music",
	flute: "music",
	lute: "music",
	lyre: "music",
	horn: "music",
	panflute: "music",
	shawm: "music",
	viol: "music",
	disg: "art",
	forg: "art",
	herb: "art",
	navg: "art",
	pois: "art",
	thief: "art",
};

const LEGACY_TOOL_TYPES = {
	painter: "art",
	sculpt: "art",
	bagpipes: "music",
	brass: "music",
	drum: "music",
	dulcimer: "music",
	flute: "music",
	horn: "music",
	keyboard: "music",
	lute: "music",
	lyre: "music",
	panflute: "music",
	percussion: "music",
	shawm: "music",
	string: "music",
	viol: "music",
	vocal: "music",
	wind: "music",
	alchemist: "craft",
	brewer: "craft",
	calligrapher: "craft",
	cook: "craft",
	fashion: "craft",
	herb: "craft",
	jeweler: "craft",
	leatherworker: "craft",
	mason: "craft",
	pois: "craft",
	smith: "craft",
	tailor: "craft",
	tinker: "craft",
	woodcarver: "craft",
	disg: "explore",
	navg: "explore",
	thief: "explore",
	forg: "craft",
	game: "craft",
};

const ELKAN_TOOL_TYPES = {
	disg: "art",
	painter: "art",
	sculpt: "art",
	brass: "music",
	bagpipes: "music",
	keyboard: "music",
	percussion: "music",
	string: "music",
	wind: "music",
	vocal: "music",
	drum: "music",
	dulcimer: "music",
	flute: "music",
	horn: "music",
	lute: "music",
	lyre: "music",
	panflute: "music",
	shawm: "music",
	viol: "music",

	// Craft
	alchemist: "craft",
	brewer: "craft",
	calligrapher: "craft",
	cook: "craft",
	fashion: "craft",
	forg: "craft",
	herb: "craft",
	jeweler: "craft",
	leatherworker: "craft",
	mason: "craft",
	pois: "craft",
	smith: "craft",
	tailor: "craft",
	tinker: "craft",
	woodcarver: "craft",
	game: "craft",
	navg: "craft",
	thief: "craft",
};

function getToolType(key, toolSetting) {
	switch (toolSetting) {
		case 2:
			return SRD_TOOL_TYPES[key] ?? "";
		case 1:
			return LEGACY_TOOL_TYPES[key] ?? "";
		case 0:
			return ELKAN_TOOL_TYPES[key] ?? "";
		default:
			return "";
	}
}

export function tools() {
	const TOOL_SETTING = game.settings.get("elkan5e", "tool");

	console.log("Elkan 5e  |  Initializing Tools");

	// ------------------------------
	// REGISTER TOOLS AND UPDATE TYPE VALUES
	// ------------------------------
	for (const [key, value] of Object.entries(TOOLS)) {
		CONFIG.DND5E.tools[key] = value;
	}

	// ------------------------------
	// APPLY CONFIG CHANGES BY SETTING
	// ------------------------------
	if (TOOL_SETTING === 0) {
		// Elkan Tools
		CONFIG.DND5E.toolTypes.craft = "Crafting Tools";
		CONFIG.DND5E.toolProficiencies.craft = "Crafting Tools";
		delete CONFIG.DND5E.toolTypes.game;
		delete CONFIG.DND5E.toolProficiencies.game;
		for (const tool of TOOLS_TO_REMOVE) delete CONFIG.DND5E.tools[tool];
	}

	if (TOOL_SETTING === 1) {
		// Legacy Tools
		CONFIG.DND5E.toolTypes.craft = "Crafting Tools";
		CONFIG.DND5E.toolTypes.explore = "Exploration Tools";
		CONFIG.DND5E.toolProficiencies.craft = "Crafting Tools";
		CONFIG.DND5E.toolProficiencies.explore = "Exploration Tools";
		delete CONFIG.DND5E.toolTypes.game;
		delete CONFIG.DND5E.toolProficiencies.game;
		for (const tool of TOOLS_TO_REMOVE_LEGACY) delete CONFIG.DND5E.tools[tool];
	}

	if (TOOL_SETTING === 2) {
		// SRD Tools
		for (const tool of TOOLS_TO_REMOVE_SRD) delete CONFIG.DND5E.tools[tool];
	}
}

export async function updateToolTypes() {
	const TOOL_SETTING = game.settings.get("elkan5e", "tool");

	console.log("Elkan 5e | Starting updateToolTypes()");

	if (!TOOLS || Object.keys(TOOLS).length === 0) {
		console.warn("Elkan 5e | TOOLS object is empty or undefined!");
		return;
	}

	for (const [key, value] of Object.entries(TOOLS)) {
		const uuid = value.id;

		if (!uuid) {
			console.warn(`Elkan 5e | No UUID defined for ${key}`);
			continue;
		}

		let item;
		try {
			item = await fromUuid(uuid);
		} catch (err) {
			console.error(`Elkan 5e | romUuid() threw an error for ${key}`, err);
			continue;
		}

		if (!item) {
			console.warn(`Elkan 5e | Could not find item for ${key} (${uuid})`);
			continue;
		}

		const desiredType = getToolType(key, TOOL_SETTING);
		const currentType = foundry.utils.getProperty(item, "system.type.value") ?? "";

		if (!desiredType) {
			console.warn(`Elkan 5e | ⚠ getToolType() returned empty for ${key}. Check mapping.`);
		}

		if (currentType !== desiredType) {
			try {
				await item.update({ "system.type.value": desiredType });
			} catch (err) {
				console.error(`Elkan 5e | Failed to update ${item.name}`, err);
			}
		}
	}
}
