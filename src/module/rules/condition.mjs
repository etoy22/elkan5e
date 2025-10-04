/**
 * Adds the Elkan 5e conditions to Foundry.
 */

const ct_rmv = ["bleeding", "burning", "dehydration", "falling", "malnutrition", "suffocation"];

// You can add `changes` to any of these.
const CONDITIONS_TYPES = [
	{
		key: "blinded",
		id: "SXTqmewRrCwPS8yW",
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.save.dex", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" },
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
		changes: [
			{ key: "flags.midi-qol.disadvantage.ability.save.dex", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.skill.all", mode: 5, value: "1" },
		],
	},
	{ key: "diseased" },
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
		changes: [
			{ key: "flags.midi-qol.advantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.skill.stealth", mode: 5, value: "1" },
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
			{ key: "flags.midi-qol.advantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.skill.stealth", mode: 5, value: "1" },
			{ key: "flags.midi-qol.noOpportunityAttack", mode: 5, value: "1" },
		],
	},
	{
		key: "obscuredlightly",
		id: "Jq7kMUlHodqSbYDD",
		changes: [{ key: "flags.midi-qol.advantage.skill.stealth", mode: 5, value: "1" }],
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
			{ key: "flags.midi-qol.disadvantage.ability.save.dex", mode: 5, value: "1" },
			{ key: "flags.midi-qol.fail.spell.somatic", mode: 5, value: "1" },
		],
	},
	{
		key: "silenced",
		id: "F51xrE7Mj8VeM3b8",
		changes: [
			{
				key: "flags.midi-qol.fail.spell.verbal",
				mode: 5,
				value: "1",
			},
		],
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
			{ key: "flags.midi-qol.disadvantage.ability.save.dex", mode: 5, value: "1" },
			{ key: "system.attributes.init.bonus", mode: 2, value: "-20" },
		],
		flags: {
			dae: {
				transfer: false,
				stackable: "none",
				specialDuration: ["turnEnd"],
				showIcon: true,
			},
			core: {
				statusId: "surprised",
			},
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
			{ key: "flags.midi-qol.disadvantage.ability.check.dex", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.save.dex", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.check.str", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.save.str", mode: 5, value: "1" },
			{
				key: "flags.midi-qol.onUseMacroName",
				mode: 0,
				value: "Compendium.elkan5e.elkan5e-macros.Macro.1NtnoPvTQj1IEHCa, preDamageApplication",
			},
		],
	},
	{ key: "concentrating", id: "4ZOHN6tGvj54J6Kv" },
];

const se_rmv = ["burrowing", "ethereal", "flying", "hovering", "marked", "sleeping"];
const STATUS_EFFECTS = [
	{ key: "concentrating", id: "4ZOHN6tGvj54J6Kv" },
	{ key: "coverHalf", id: "1BmTbnT3xDPqv9dq" },
	{ key: "coverThreeQuarters", id: "1BmTbnT3xDPqv9dq" },
	{ key: "coverTotal", id: "hY5s70xMeG5ISFUA" },
	{ key: "dead" },
	{
		key: "dodging",
		changes: [
			{ key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.ability.save.dex", mode: 5, value: "1" },
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
	{ key: "hiding" },
	{ key: "stable", image: false },
	{ key: "squeezing" },
];

// Special filenames
const FILENAME_OVERRIDE = {
	obscuredlightly: "obscured-lightly.svg",
	obscuredheavily: "obscured-heavily.svg",
};
const imgFor = (key) =>
	`modules/elkan5e/icons/conditions/${FILENAME_OVERRIDE[key] ?? `${key}.svg`}`;

const RULES_REF = (id) =>
	`Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.${id}`;

const COVER_IMG_MAP = {
	coverHalf: "cover-half.svg",
	coverThreeQuarters: "cover-three-quarters.svg",
	coverTotal: "cover-full.svg",
};

export function conditions() {
	const locCond = (key) => game.i18n.localize(`elkan5e.conditions.${key}`);
	const mergeChanges = (existing = [], incoming = []) => {
		const sig = (c) => `${c.key}|${c.mode}|${c.value}`;
		const map = new Map();
		for (const c of existing || []) map.set(sig(c), c);
		for (const c of incoming || []) map.set(sig(c), c);
		return [...map.values()];
	};
	const mergeFlags = (a = {}, b = {}) => {
		const out = foundry.utils.duplicate(a);
		return foundry.utils.mergeObject(out, b, {
			inplace: true,
			recursive: true,
			insertKeys: true,
			overwrite: true,
		});
	};

	const ensureConditionEntry = (def) => {
		const ct = (CONFIG.DND5E.conditionTypes[def.key] ??= {});
		// Localized name always wins
		ct.name = locCond(def.key);
		if (def.id) ct.reference = RULES_REF(def.id);
		if (def.image !== false) ct.img = imgFor(def.key);
		if (def.changes?.length) ct.changes = mergeChanges(ct.changes, def.changes);
		if (def.flags) ct.flags = mergeFlags(ct.flags, def.flags);
	};

	// Move statusEffects[key] -> conditionTypes[key], preserving SE props, then apply our def & i18n
	const migrateStatusToCondition = (def) => {
		const se = { ...(CONFIG.DND5E.statusEffects?.[def.key] ?? {}) };
		const existingCT = { ...(CONFIG.DND5E.conditionTypes?.[def.key] ?? {}) };

		let merged = { ...se, ...existingCT };

		merged.name = locCond(def.key);
		if (def.id) merged.reference = RULES_REF(def.id);
		if (def.image !== false) {
			merged.img = COVER_IMG_MAP[def.key]
				? `modules/elkan5e/icons/conditions/${COVER_IMG_MAP[def.key]}`
				: imgFor(def.key);
		}
		if (def.changes?.length) merged.changes = mergeChanges(existingCT.changes, def.changes);
		if (def.flags) merged.flags = mergeFlags(existingCT.flags, def.flags);

		CONFIG.DND5E.conditionTypes[def.key] = merged;
		delete CONFIG.DND5E.statusEffects[def.key];
	};

	CONFIG.DND5E ??= {};
	CONFIG.DND5E.conditionTypes ??= {};
	CONFIG.DND5E.statusEffects ??= {};
	CONFIG.DND5E.conditionEffects ??= {};
	for (const k of [
		"abilityCheckDisadvantage",
		"halfMovement",
		"abilitySaveDisadvantage",
		"halfHealth",
		"noMovement",
		"attackDisadvantage",
		"dexteritySaveDisadvantage",
	]) {
		if (!(CONFIG.DND5E.conditionEffects[k] instanceof Set))
			CONFIG.DND5E.conditionEffects[k] = new Set();
	}

	const conditionsSetting = game.settings.get("elkan5e", "conditionsSettings");

	// Remove extras (a|d)
	if (conditionsSetting === "a" || conditionsSetting === "d") {
		for (const c of ct_rmv) delete CONFIG.DND5E.conditionTypes[c];
		for (const c of se_rmv) delete CONFIG.DND5E.statusEffects[c];
	}

	// Augment/tweak (a|b)
	if (conditionsSetting === "a" || conditionsSetting === "b") {
		for (const k of ["transformed", "cursed", "silenced", "surprised"]) {
			if (CONFIG.DND5E.conditionTypes[k]) CONFIG.DND5E.conditionTypes[k].pseudo = false;
		}

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

		for (const def of CONDITIONS_TYPES) ensureConditionEntry(def);

		for (const def of STATUS_EFFECTS) {
			const se = (CONFIG.DND5E.statusEffects[def.key] ??= {});
			se.name = locCond(def.key);
			if (def.image !== false) {
				se.img = COVER_IMG_MAP[def.key]
					? `modules/elkan5e/icons/conditions/${COVER_IMG_MAP[def.key]}`
					: imgFor(def.key);
			}
			if (def.id) se.reference = RULES_REF(def.id);
			if (def.changes?.length) se.changes = mergeChanges(se.changes, def.changes);
			if (def.flags) se.flags = mergeFlags(se.flags, def.flags);
			if (def.order != null && se.order == null) se.order = def.order;
		}

		// Migrate these SE -> CT
		const MOVE_TO_CONDITIONS = [
			{ key: "concentrating", id: "4ZOHN6tGvj54J6Kv" },
			{ key: "coverHalf", id: "1BmTbnT3xDPqv9dq" },
			{ key: "coverThreeQuarters", id: "1BmTbnT3xDPqv9dq" },
			{ key: "coverTotal", id: "hY5s70xMeG5ISFUA" },
		];
		for (const def of MOVE_TO_CONDITIONS) migrateStatusToCondition(def);

		// Advantage & Disadvantage at end of statusEffects
		CONFIG.DND5E.statusEffects["advantage"] = {
			name: game.i18n.localize("elkan5e.conditions.advantage") || "Advantage",
			key: "advantage",
			img: "icons/svg/upgrade.svg",
			order: 998,
		};
		CONFIG.DND5E.statusEffects["disadvantage"] = {
			name: game.i18n.localize("elkan5e.conditions.disadvantage") || "Disadvantage",
			key: "disadvantage",
			img: "icons/svg/downgrade.svg",
			order: 999,
		};
	}
}

export function conditionsReady() {
	CONFIG.DND5E ??= {};
	CONFIG.DND5E.conditionTypes ??= {};
	CONFIG.DND5E.statusEffects ??= {};

	const locCond = (key) => game.i18n.localize(`elkan5e.conditions.${key}`);
	const mergeChanges = (existing = [], incoming = []) => {
		const sig = (c) => `${c.key}|${c.mode}|${c.value}`;
		const map = new Map();
		for (const c of existing || []) map.set(sig(c), c);
		for (const c of incoming || []) map.set(sig(c), c);
		return [...map.values()];
	};
	const mergeFlags = (a = {}, b = {}) => {
		const out = foundry.utils.duplicate(a);
		return foundry.utils.mergeObject(out, b, {
			inplace: true,
			recursive: true,
			insertKeys: true,
			overwrite: true,
		});
	};

	for (const def of CONDITIONS_TYPES) {
		const ct = (CONFIG.DND5E.conditionTypes[def.key] ??= {});
		ct.name = locCond(def.key);
		if (def.id) ct.reference = RULES_REF(def.id);
		if (def.image !== false) ct.img = imgFor(def.key);
		if (def.changes?.length) ct.changes = mergeChanges(ct.changes, def.changes);
		if (def.flags) ct.flags = mergeFlags(ct.flags, def.flags);

		// Also mirror into statusEffects for backwards compat
		CONFIG.DND5E.statusEffects[def.key] = {
			...CONFIG.DND5E.statusEffects[def.key],
			...ct,
			key: def.key,
		};
	}

	for (const def of STATUS_EFFECTS) {
		const se = (CONFIG.DND5E.statusEffects[def.key] ??= {});
		se.name = locCond(def.key);
		if (def.id) se.reference = RULES_REF(def.id);
		if (def.image !== false) {
			se.img = COVER_IMG_MAP?.[def.key]
				? `modules/elkan5e/icons/conditions/${COVER_IMG_MAP[def.key]}`
				: imgFor(def.key);
		}
		if (def.changes?.length) se.changes = mergeChanges(se.changes, def.changes);
		if (def.flags) se.flags = mergeFlags(se.flags, def.flags);
	}
}
