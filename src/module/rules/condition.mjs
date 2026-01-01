/**
 * Adds the Elkan 5e conditions to Foundry.
 */

// Remove these in certain settings
const CONDITION_TYPE_REMOVE = ["bleeding"];
const STATUS_EFFECT_REMOVE = ["burrowing", "flying", "hovering", "marked", "sleeping", "ethereal"];
const STATUS_ICON_KEYS = ["burrowing", "flying", "hovering", "marked", "bleeding", "sleeping", "ethereal"];
const STATUS_ICON_FOLDER = "statuses";
const REMOVABLE_CONDITION_KEYS = new Set([
	"bleeding",
	"burning",
	"dehydration",
	"malnutrition",
	"falling",
	"suffocation",
	"dodging",
	"dead",
	"hiding",
	"squeezing",
	"advantage",
	"disadvantage",
]);

// Icons
const IMAGE_EXCLUSIONS = new Set(["stable"]);

const FILENAME_OVERRIDE = {
	obscuredlightly: "obscured-lightly.svg",
	obscuredheavily: "obscured-heavily.svg",
	coverhalf: "cover-half.svg",
	coverthreequarters: "cover-three-quarters.svg",
	covertotal: "cover-full.svg",
};


function imgFor(key, originalPath, folder = "conditions") {
	// normalize once
	const k = String(key ?? "").trim();

	// Always force icons for advantage / disadvantage
	if (k === "advantage") return "icons/svg/upgrade.svg";
	if (k === "disadvantage") return "icons/svg/downgrade.svg";

	// exclusions should also be checked in normalized form
	const lower = k.toLowerCase();
	if (IMAGE_EXCLUSIONS.has(lower)) return originalPath;

	// allow override lookup by exact key OR lowercase key
	const filename =
		FILENAME_OVERRIDE[k] ??
		FILENAME_OVERRIDE[lower] ??
		`${lower}.svg`;

	return `modules/elkan5e/icons/${folder}/${filename}`;
}


function statusIconPath(key) {
	return `modules/elkan5e/icons/${STATUS_ICON_FOLDER}/${key}.svg`;
}

function applyStatusIcons() {
	for (const key of STATUS_ICON_KEYS) {
		const icon = statusIconPath(key);
		const conditionType = CONFIG.DND5E.conditionTypes?.[key];
		if (conditionType) conditionType.img = icon;
		const existingStatus = CONFIG.DND5E.statusEffects?.[key];
		if (!existingStatus) continue;
		const normalized = typeof existingStatus === "string" ? { key: existingStatus } : existingStatus;
		CONFIG.DND5E.statusEffects[key] = {
			...normalized,
			key,
			img: icon,
		};
	}
}


const RULES_REF = (id) =>
	`Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.${id}`;
const HAZARD_RULES_REF = (id) =>
	`Compendium.elkan5e.elkan5e-rules.JournalEntry.e7rUhwl4HkTVE0Qs.JournalEntryPage.${id}`;

// You can add `changes` to any of these.
const CONDITION_DEFS = [
	{
		key: "blinded",
		id: "SXTqmewRrCwPS8yW",
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "!Boolean(canSense)" },
			{ key: "system.abilities.dex.save.roll.mode", mode: 5, value: "-1" },
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "!Boolean(target?.canSense)" },
			{ key: "flags.midi-qol.noOpportunityAttack", mode: 5, value: "1" },
		],
	},
	{ name: "Charmed", key: "charmed", id: "ieDILSkRbu9r8pmZ" },
	{
		key: "confused",
		id: "WJFtNc5UraHVrV5V",
		changes: [
			{
				key: "flags.midi-qol.OverTime",
				mode: 2,
				value: "turn=start, label=Confused Effect, macro=Compendium.elkan5e.elkan5e-macros.Macro.HW9jG0cdn6BmhzyE",
			},
		],
	},
	{ key: "cursed", id: "Vpwu9GQC6HVNZFze" },
	{ key: "dazed", id: "0BYyVwipnS55gVFq" },
	{
		key: "deafened",
		id: "AHgIwuNdpp0wKF2y",
		changes: [{ key: "system.abilities.dex.save.roll.mode", mode: 5, value: "-1" }],
	},
	{ key: "diseased", id: "diseasedRule" },
	{ key: "drained", id: "ZnhMIMgPZv1QDxzZ" },
	{ key: "exhaustion", id: "mPzXN6MW8L6ePFmq", image: false },
	{
		key: "frightened",
		id: "ruwpm6lorwoPJsmt",
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.check.all", mode: 5, value: "1" },
		],
	},
	{ key: "goaded", id: "IVZ318d1P8WBcDxN" },
	{ key: "grappled", id: "zaI1nuc41wANKoFX" },
	{
		key: "hasted",
		id: "8dnyv0szJi7dCz74",
		changes: [
			{ key: "system.attributes.ac.bonus", mode: 2, value: "+2" },
			{ key: "system.abilities.dex.bonuses.save", mode: 2, value: "+2" },
			{ key: "system.attributes.movement.all", mode: 0, value: "*2" },
		],
	},
	{
		key: "incapacitated",
		id: "PXI4uoXj7x6IsDXt",
		changes: [
			{ key: "flags.midi-qol.noActions", mode: 5, value: "1" },
			{ key: "flags.midi-qol.noBonusActions", mode: 5, value: "1" },
			{ key: "flags.midi-qol.noReactions", mode: 5, value: "1" },
			{ key: "system.attributes.movement.walk", mode: 5, value: "0" },
			{ key: "system.attributes.movement.fly", mode: 5, value: "0" },
			{ key: "system.attributes.movement.swim", mode: 5, value: "0" },
			{ key: "system.attributes.movement.climb", mode: 5, value: "0" },
			{ key: "system.attributes.movement.burrow", mode: 5, value: "0" },
			{ key: "flags.midi-qol.fail.ability.save.str", mode: 5, value: "1" },
			{ key: "flags.midi-qol.fail.ability.save.dex", mode: 5, value: "1" },
			{ key: "flags.midi-qol.fail.ability.check.str", mode: 5, value: "1" },
			{ key: "flags.midi-qol.fail.ability.check.dex", mode: 5, value: "1" },
		],
	},
	{
		key: "invisible",
		id: "GfTD899cLRZxGG1H",
		changes: [
			{ key: "flags.midi-qol.advantage.attack.all", mode: 5, value: "!Boolean(target?.canSee)" },
			{ key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 5, value: "!Boolean(canSee)" },
			{ key: "system.skills.ste.roll.mode", mode: 5, value: "1" },
			{ key: "flags.midi-qol.noOpportunityAttack", mode: 5, value: "!Boolean(canSee)" },
		],
	},
	{
		key: "paralyzed",
		id: "w5RoCYZIujGYuiYt",
		changes: [
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.critical.mwak", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.critical.msak", mode: 5, value: "1" },
		],
	},
	{
		key: "petrified",
		id: "n0BX8pLecgm7E3uH",
		changes: [
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" },
			{ key: "system.traits.dr.all", mode: 0, value: "physical" },
			{ key: "system.traits.dr.all", mode: 0, value: "magical" },
			{ key: "system.traits.di.value", mode: 2, value: "poison" },
			{ key: "system.traits.ci.value", mode: 2, value: "poisoned" },
			{ key: "system.traits.ci.value", mode: 2, value: "diseased" },
		],
	},
	{
		key: "poisoned",
		id: "fzEf89TZ1WN90bFv",
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.check.all", mode: 5, value: "1" },
		],
	},
	{
		key: "prone",
		id: "y8L5Uq1jMVDsQjaS",
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.advantage.attack.mwak", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.advantage.attack.msak", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.disadvantage.attack.rwak", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.disadvantage.attack.rsak", mode: 5, value: "1" },
		],
	},
	{
		key: "restrained",
		id: "DiWd3u4HCD7JEw8V",
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" },
			{ key: "system.abilities.dex.save.roll.mode", mode: 5, value: "-1" },
			{ key: "flags.midi-qol.fail.spell.somatic", mode: 5, value: "1" },
		],
	},
	{
		key: "silenced",
		id: "F51xrE7Mj8VeM3b8",
		changes: [{ key: "flags.midi-qol.fail.spell.verbal", mode: 5, value: "1" }],
	},
	{
		key: "siphoned",
		id: "SthB8javJuFySiBg",
		changes: [
			{ key: "flags.midi-qol.grants.advantage.ability.save.all", mode: 5, value: "1" },
			{
				key: "flags.midi-qol.onUseMacroName",
				mode: 0,
				value: "Compendium.elkan5e.elkan5e-macros.Macro.4X80aHI9r8I9aSKG, preDamageApplication",
			},
		],
	},
	{
		key: "slowed",
		id: "kkbgHooTzrtu4q8T",
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.noReactions", mode: 5, value: "1" },
			{ key: "system.attributes.ac.bonus", mode: 2, value: "-2" },
			{ key: "system.abilities.dex.bonuses.save", mode: 2, value: "-2" },
		],
	},
	{
		key: "stunned",
		id: "JV8kbMo0p5S1YXUR",
		changes: [{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" }],
	},
	{
		key: "surprised",
		id: "QOZeW0m8RCdVg6UE",
		changes: [
			{ key: "flags.midi-qol.noReactions", mode: 5, value: "1" },
			{ key: "system.abilities.dex.save.roll.mode", mode: 5, value: "-1" },
			{ key: "system.attributes.init.bonus", mode: 2, value: "-20" },
		],
		flags: {
			dae: {
				transfer: false,
				stackable: "none",
				specialDuration: ["turnEnd"],
				showIcon: true,
			},
			core: { statusId: "surprised" },
		},
	},
	{ key: "transformed", id: "2kJ5SzS51DN33kWJ" },
	{
		key: "unconscious",
		id: "ZwhWWUPJvpFCz8sK",
		changes: [
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.noReactions", mode: 5, value: "1" },
		],
	},
	{
		key: "weakened",
		id: "iJT3cWvyTNBv1L5h",
		changes: [
			{ key: "system.abilities.dex.check.roll.mode", mode: 5, value: "-1" },
			{ key: "system.abilities.dex.save.roll.mode", mode: 5, value: "-1" },
			{ key: "system.abilities.str.check.roll.mode", mode: 5, value: "-1" },
			{ key: "system.abilities.str.save.roll.mode", mode: 5, value: "-1" },
			{
				key: "flags.midi-qol.onUseMacroName",
				mode: 0,
				value: "Compendium.elkan5e.elkan5e-macros.Macro.1NtnoPvTQj1IEHCa, preDamageApplication",
			},
		],
	},
	{ key: "concentrating", id: "4ZOHN6tGvj54J6Kv" },
	{
		key: "coverHalf",
		id: "1BmTbnT3xDPqv9dq",
		order: 2,
		exclusiveGroup: "cover",
		coverBonus: 2,
	},
	{
		key: "coverThreeQuarters",
		id: "1BmTbnT3xDPqv9dq",
		order: 3,
		exclusiveGroup: "cover",
		coverBonus: 5,
	},
	{
		key: "coverTotal",
		id: "hY5s70xMeG5ISFUA",
		order: 4,
		exclusiveGroup: "cover",
		changes: [{ key: "flags.midi-qol.neverTarget", mode: 2, value: "10" }],
	},
];

const STATUS_DEFS = [
	{
		key: "bleeding",
		pseudo: true,
		statusOnly: true,
		icon: "modules/elkan5e/icons/statuses/bleeding.svg",
		flags: {
			core: { statusId: "bleeding" },
		},
	},
	{
		key: "burning",
		pseudo: true,
		statusOnly: true,
		id: "znHHmhO6vGjmeugR",
		reference: HAZARD_RULES_REF("znHHmhO6vGjmeugR"),
		icon: "modules/elkan5e/icons/hazards/burning.svg",
		changes: [
			{
				key: "flags.midi-qol.OverTime",
				mode: 2,
				value:
					"turn=start,\nlabel=burning,\nactionSave=dialog,\nmacro=Compendium.elkan5e.elkan5e-macros.Macro.g6P9Rkg63Rz74KNe",
			},
			{
				key: "flags.elkan5e.burning",
				mode: 0,
				value: "1d8",
			},
		],
		flags: {
			dae: {
				transfer: false,
				stackable: "none",
				showIcon: true,
			},
			core: {
				statusId: "burning",
			},
		},
	},
	{
		key: "dehydration",
		pseudo: true,
		statusOnly: true,
		id: "xZRo576gFkVzqTAA",
		reference: HAZARD_RULES_REF("xZRo576gFkVzqTAA"),
		icon: "modules/elkan5e/icons/hazards/dehydration.svg",
		statuses: ["exhaustion"],
	},
	{
		key: "malnutrition",
		pseudo: true,
		statusOnly: true,
		id: "IxUkC78G9mRb3xQO",
		reference: HAZARD_RULES_REF("IxUkC78G9mRb3xQO"),
		icon: "modules/elkan5e/icons/hazards/malnutrition.svg",
		statuses: ["exhaustion"],
	},
	{
		key: "falling",
		pseudo: true,
		statusOnly: true,
		id: "TDbwlHfW1Kd4sLIZ",
		reference: HAZARD_RULES_REF("TDbwlHfW1Kd4sLIZ"),
		icon: "modules/elkan5e/icons/hazards/falling.svg",
	},
	{
		key: "suffocation",
		pseudo: true,
		statusOnly: true,
		id: "NJdquJJIddZbeKdw",
		reference: HAZARD_RULES_REF("NJdquJJIddZbeKdw"),
		icon: "modules/elkan5e/icons/hazards/suffocation.svg",
		changes: [
			{
				key: "flags.midi-qol.OverTime",
				mode: 2,
				value: "turn=end,label=Suffocating,macro=Compendium.elkan5e.elkan5e-macros.Macro.H5g2Kf9b8VqL4tYc",
			},
		],
		flags: {
			elkan5e: {
				suffocation: true,
			},
		},
	},
	{
		key: "dodging",
		pseudo: true,
		statusOnly: true,
		changes: [
			{ key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.ability.save.dex", mode: 5, value: "1" },
			{ key: "system.abilities.dex.save.roll.mode", mode: 5, value: "1" },
		],
		flags: {
			dae: {
				transfer: false,
				stackable: "none",
				specialDuration: ["turnStart"],
				disableIncapacitated: true,
				showIcon: true,
			},
			core: { statusId: "dodging" },
		},
	},
	{ key: "dead", pseudo: true, statusOnly: true },
	{ key: "hiding", pseudo: true, statusOnly: true },
	{ key: "squeezing", pseudo: true, statusOnly: true },
	{
		key: "advantage",
		img: "icons/svg/upgrade.svg",
		pseudo: true,
		statusOnly: true,
		exclusiveGroup: "elkan-advantage-mode",
		order: 9998,
		changes: [
			{ key: "flags.midi-qol.advantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.ability.check.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.ability.save.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.skill.all", mode: 5, value: "1" },
		],
		flags: { core: { statusId: "advantage" } },
	},
	{
		key: "disadvantage",
		img: "icons/svg/downgrade.svg",
		pseudo: true,
		statusOnly: true,
		exclusiveGroup: "elkan-advantage-mode",
		order: 9999,
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.check.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.save.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.skill.all", mode: 5, value: "1" },
		],
		flags: { core: { statusId: "disadvantage" } },
	},
];
function mergeChanges(existing = [], incoming = []) {
	const sig = (c) => `${c.key}|${c.mode}|${c.value}`;
	const map = new Map();
	for (const c of existing || []) map.set(sig(c), c);
	for (const c of incoming || []) map.set(sig(c), c);
	return [...map.values()];
}

function mergeFlags(a = {}, b = {}) {
	const out = foundry.utils.duplicate(a);
	return foundry.utils.mergeObject(out, b, {
		inplace: true,
		recursive: true,
		insertKeys: true,
		overwrite: true,
	});
}

function mergeAttributes(a = {}, b = {}) {
	const out = foundry.utils.duplicate(a);
	return foundry.utils.mergeObject(out, b, {
		inplace: true,
		recursive: true,
		insertKeys: true,
		overwrite: true,
	});
}


function mirrorStatusEffect(def, ct) {
	if (!def.statusOnly) return;
	const existingStatus = CONFIG.DND5E.statusEffects[def.key];
	const normalized =
		typeof existingStatus === "string" ? { key: existingStatus } : existingStatus ?? {};
	CONFIG.DND5E.statusEffects[def.key] = {
		...normalized,
		...ct,
		key: def.key,
	};
}

function initDnd5eConfig() {
	CONFIG.DND5E ??= {};
	CONFIG.DND5E.conditionTypes ??= {};
	CONFIG.DND5E.statusEffects ??= {};
	CONFIG.DND5E.conditionEffects ??= {};

	// Ensure these are Sets (core expects this)
	for (const k of [
		"abilityCheckDisadvantage",
		"halfMovement",
		"abilitySaveDisadvantage",
		"halfHealth",
		"noMovement",
		"attackDisadvantage",
		"dexteritySaveDisadvantage",
	]) {
		if (!(CONFIG.DND5E.conditionEffects[k] instanceof Set)) {
			CONFIG.DND5E.conditionEffects[k] = new Set();
		}
	}
}

function applyConditionDef(def) {
	const statusOnly = def.statusOnly ?? Boolean(def.pseudo);
	const registerConditionType = !statusOnly;
	const ct = registerConditionType ? (CONFIG.DND5E.conditionTypes[def.key] ??= {}) : {};
	ct.name = game.i18n.localize(`elkan5e.conditions.${def.key}`);

	const reference =
		def.reference ?? (def.id ? RULES_REF(def.id) : undefined);
	if (reference) ct.reference = reference;
	if (def.icon) {
		ct.img = def.icon;
	} else if (def.image !== false) {
		ct.img = imgFor(def.key, ct.img);
	}
	if (def.changes?.length) ct.changes = mergeChanges(ct.changes, def.changes);
	if (def.flags) ct.flags = mergeFlags(ct.flags, def.flags);
	if (def.attributes) ct.attributes = mergeAttributes(ct.attributes, def.attributes);
	if (Array.isArray(def.statuses) && def.statuses.length) {
		ct.statuses = foundry.utils.duplicate(def.statuses);
	}

	if (def.pseudo != null) ct.pseudo = def.pseudo;

	if (def.order != null && ct.order == null) ct.order = def.order;
	if (def.exclusiveGroup != null) ct.exclusiveGroup = def.exclusiveGroup;
	if (def.coverBonus != null) ct.coverBonus = def.coverBonus;

	if (!registerConditionType) {
		if (CONFIG.DND5E.conditionTypes?.[def.key]) {
			delete CONFIG.DND5E.conditionTypes[def.key];
		}
	}

	return ct;
}

function ensureMidiInvisibleVisionRule() {
	const midiModule = game.modules.get("midi-qol");
	if (!midiModule?.active) return;

	const applyRule = (cfg) => {
		if (!cfg?.optionalRules) return false;
		if (cfg.optionalRules.invisAdvantage === "vision") return false;
		cfg.optionalRules.invisAdvantage = "vision";
		return true;
	};

	let updated = false;

	const midiConfig = globalThis.MidiQOL?.currentConfigSettings;
	if (midiConfig) updated = applyRule(midiConfig) || updated;

	let storedConfig;
	if (game.user?.isGM && typeof game.settings?.get === "function") {
		try {
			storedConfig = foundry.utils.duplicate(game.settings.get("midi-qol", "ConfigSettings"));
			if (storedConfig) updated = applyRule(storedConfig) || updated;
		} catch (err) {
			console.warn("Elkan 5e | Failed to read midi-qol ConfigSettings", err);
		}
	}

	if (!updated) return;

	if (storedConfig && game.user?.isGM && typeof game.settings?.set === "function") {
		game.settings
			.set("midi-qol", "ConfigSettings", storedConfig)
			.catch((err) => console.warn("Elkan 5e | Failed to persist midi invisibility override", err));
	}
}



export function conditions() {
	initDnd5eConfig();

	const conditionsSetting = game.settings.get("elkan5e", "conditionsSettings");

	// Remove extras (a|d)
	const removeExtras = conditionsSetting === "a" || conditionsSetting === "d";
	const applyElkan = conditionsSetting === "a" || conditionsSetting === "b";

	if (removeExtras) {
		for (const key of CONDITION_TYPE_REMOVE) delete CONFIG.DND5E.conditionTypes[key];
		for (const key of STATUS_EFFECT_REMOVE) delete CONFIG.DND5E.statusEffects[key];
	}

	// Augment/tweak (a|b)
	if (applyElkan) {
		// Adjust exhaustion
		if (CONFIG.DND5E.conditionTypes.exhaustion) {
			CONFIG.DND5E.conditionTypes.exhaustion.pseudo = false;
			CONFIG.DND5E.conditionTypes.exhaustion.reduction = { rolls: 2, speed: 5 };
			CONFIG.DND5E.conditionTypes.exhaustion.changes = [{ key: "system.bonuses.spell.dc", mode: 0, value: "-2" }];
		}

		// Undo some core effects you override with midi flags
		CONFIG.DND5E.conditionEffects.abilityCheckDisadvantage.delete("exhaustion-1");
		CONFIG.DND5E.conditionEffects.halfMovement.delete("exhaustion-2");
		CONFIG.DND5E.conditionEffects.abilitySaveDisadvantage.delete("exhaustion-3");
		CONFIG.DND5E.conditionEffects.halfHealth.delete("exhaustion-4");
		CONFIG.DND5E.conditionEffects.noMovement.delete("exhaustion-5");
		CONFIG.DND5E.conditionEffects.attackDisadvantage.delete("blinded");
		CONFIG.DND5E.conditionEffects.dexteritySaveDisadvantage.delete("blinded");
		CONFIG.DND5E.conditionEffects.halfMovement.delete("blinded");
		CONFIG.DND5E.conditionEffects.dexteritySaveDisadvantage.delete("deafened");
	}

	for (const def of CONDITION_DEFS) {
		if (removeExtras && REMOVABLE_CONDITION_KEYS.has(def.key)) continue;
		const ct = applyConditionDef(def);
		mirrorStatusEffect(def, ct);
	}
	for (const def of STATUS_DEFS) {
		const ct = applyConditionDef(def);
		mirrorStatusEffect(def, ct);
	}
	applyStatusIcons();
}

export function conditionsReady() {
	initDnd5eConfig();

	for (const def of CONDITION_DEFS) {
		const ct = applyConditionDef(def);

		// Mirror into statusEffects for backwards compat
		mirrorStatusEffect(def, ct);
	}
	for (const def of STATUS_DEFS) {
		const ct = applyConditionDef(def);
		mirrorStatusEffect(def, ct);
	}
	applyStatusIcons();

	ensureMidiInvisibleVisionRule();
}

