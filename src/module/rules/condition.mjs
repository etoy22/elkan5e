/**
 * Adds the Elkan 5e conditions to Foundry.
 */

// Remove these in certain settings
const CONDITION_TYPE_REMOVE = ["bleeding"];
const STATUS_EFFECT_REMOVE = ["burrowing", "flying", "hovering", "marked", "sleeping"];

// Icons
const IMAGE_EXCLUSIONS = new Set(["stable"]);

const FILENAME_OVERRIDE = {
	obscuredlightly: "obscured-lightly.svg",
	obscuredheavily: "obscured-heavily.svg",
	coverhalf: "cover-half.svg",
	coverthreequarters: "cover-three-quarters.svg",
	covertotal: "cover-full.svg",
};


function imgFor(key, originalPath) {
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

	return `modules/elkan5e/icons/conditions/${filename}`;
}


const RULES_REF = (id) =>
	`Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.${id}`;

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
		key: "obscuredheavily",
		id: "UC5VK6i6vqWEUfMn",
		exclusiveGroup: "obscured",
		changes: [
			{ key: "flags.midi-qol.advantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "system.skills.ste.roll.mode", mode: 5, value: "1" },
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
		key: "obscuredlightly",
		id: "Jq7kMUlHodqSbYDD",
		exclusiveGroup: "obscured",
		changes: [{ key: "system.skills.ste.roll.mode", mode: 5, value: "1" }],
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
	{ key: "transformed" },
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
		key: "dodging",
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
	{ key: "dead", pseudo: true },
	{ key: "hiding", pseudo: true },
	{ key: "squeezing", pseudo: true },
	{
		key: "burning",
		pseudo: true,
		changes: [
			{
				key: "flags.midi-qol.OverTime",
				mode: 2,
				value: "turn=start, label=Fire Damage (Burning), macro=Compendium.elkan5e.elkan5e-macros.Macro.bOwWbVCVSw2VRVKT",
			},
		],
	},
	{
		key: "ethereal",
		changes: [{ key: "system.traits.senses.truesight.value", mode: 0, value: "9999" }],
		flags: { "midi-qol": { ethereal: true } },
	},
	{
		key: "dehydration",
		pseudo: true,
		selectable: false,
		changes: [
			{
				key: "flags.midi-qol.OverTime",
				mode: 2,
				value: "turn=start, label=Dehydration Damage, macro=Compendium.elkan5e.elkan5e-macros.Macro.VPKm7C7z1TLQQx0P",
			},
		],
	},
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
	},
	{
		key: "advantage",
		img: "icons/svg/upgrade.svg",
		pseudo: true,
		exclusiveGroup: "elkan-advantage-mode",
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
		exclusiveGroup: "elkan-advantage-mode",
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
	const ct = (CONFIG.DND5E.conditionTypes[def.key] ??= {});
	ct.name = game.i18n.localize(`elkan5e.conditions.${def.key}`);

	if (def.id) ct.reference = RULES_REF(def.id);
	if (def.image !== false) ct.img = imgFor(def.key, ct.img);
	if (def.changes?.length) ct.changes = mergeChanges(ct.changes, def.changes);
	if (def.flags) ct.flags = mergeFlags(ct.flags, def.flags);

	if (def.order != null && ct.order == null) ct.order = def.order;
	if (def.exclusiveGroup != null) ct.exclusiveGroup = def.exclusiveGroup;
	if (def.coverBonus != null) ct.coverBonus = def.coverBonus;

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
	if (conditionsSetting === "a" || conditionsSetting === "d") {
		for (const key of CONDITION_TYPE_REMOVE) delete CONFIG.DND5E.conditionTypes[key];
		for (const key of STATUS_EFFECT_REMOVE) delete CONFIG.DND5E.statusEffects[key];
	}

	// Augment/tweak (a|b)
	if (conditionsSetting === "a" || conditionsSetting === "b") {
		// Ensure these aren't treated as pseudo in core when you want them selectable
		for (const key of ["transformed", "cursed", "silenced", "surprised"]) {
			if (CONFIG.DND5E.conditionTypes[key]) CONFIG.DND5E.conditionTypes[key].pseudo = false;
		}

		// Adjust exhaustion
		if (CONFIG.DND5E.conditionTypes.exhaustion) {
			CONFIG.DND5E.conditionTypes.exhaustion.pseudo = false;
			CONFIG.DND5E.conditionTypes.exhaustion.reduction = { rolls: 2, speed: 5 };
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

		for (const def of CONDITION_DEFS) applyConditionDef(def);
	}
}

export function conditionsReady() {
	initDnd5eConfig();

	for (const def of CONDITION_DEFS) {
		const ct = applyConditionDef(def);

		// Mirror into statusEffects for backwards compat
		CONFIG.DND5E.statusEffects[def.key] = {
			...CONFIG.DND5E.statusEffects[def.key],
			...ct,
			key: def.key,
		};
	}

	ensureMidiInvisibleVisionRule();
}
