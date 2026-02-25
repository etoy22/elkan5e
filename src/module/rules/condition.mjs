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

function normalizeStatusEffectEntry(key, existingStatus) {
	if (!existingStatus) return { id: key };
	if (typeof existingStatus === "string") return { id: key, img: existingStatus };
	const normalized = { ...existingStatus };
	if (!normalized.id) normalized.id = key;
	return normalized;
}

function getStatusEffectEntry(key) {
	const list = CONFIG.DND5E.statusEffects;
	if (Array.isArray(list)) {
		return list.find((entry) => {
			if (typeof entry === "string") return entry === key;
			const entryKey = entry?.key ?? entry?.id ?? entry?.statusId ?? entry?.name;
			return entryKey === key;
		});
	}
	return list?.[key];
}

function setStatusEffectEntry(key, data) {
	const list = CONFIG.DND5E.statusEffects;
	if (Array.isArray(list)) {
		const index = list.findIndex((entry) => {
			if (typeof entry === "string") return entry === key;
			const entryKey = entry?.key ?? entry?.id ?? entry?.statusId ?? entry?.name;
			return entryKey === key;
		});
		if (index === -1) list.push(data);
		else list[index] = data;
		return;
	}
	list[key] = data;
}

function removeStatusEffectEntry(key) {
	const list = CONFIG.DND5E.statusEffects;
	if (Array.isArray(list)) {
		for (let i = list.length - 1; i >= 0; i -= 1) {
			const entry = list[i];
			if (typeof entry === "string") {
				if (entry === key) list.splice(i, 1);
				continue;
			}
			const entryKey = entry?.key ?? entry?.id ?? entry?.statusId ?? entry?.name;
			if (entryKey === key) list.splice(i, 1);
		}
		return;
	}
	delete list?.[key];
}

function applyStatusIcons() {
	for (const key of STATUS_ICON_KEYS) {
		const icon = statusIconPath(key);
		const conditionType = CONFIG.DND5E.conditionTypes?.[key];
		if (conditionType) conditionType.img = icon;
		const existingStatus = getStatusEffectEntry(key);
		if (!existingStatus) continue;
		const normalized = normalizeStatusEffectEntry(key, existingStatus);
		setStatusEffectEntry(key, {
			...normalized,
			img: icon,
		});
	}
}


const RULES_REF = (id) =>
	`Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.${id}`;
const HAZARD_RULES_REF = (id) =>
	`Compendium.elkan5e.elkan5e-rules.JournalEntry.e7rUhwl4HkTVE0Qs.JournalEntryPage.${id}`;

// You can add `changes` to any of these.
const CONDITION_DEFS = [

	{
		_id: "dnd5eblinded0000",
		id: "blinded",
		reference: RULES_REF("SXTqmewRrCwPS8yW"),
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "!Boolean(canSense)" },
			{ key: "system.abilities.dex.save.roll.mode", mode: 5, value: "-1" },
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "!Boolean(target?.canSense)" },
			{ key: "flags.midi-qol.noOpportunityAttack", mode: 5, value: "1" },
		]},
	{ name: "Charmed", id: "charmed", reference: RULES_REF("ieDILSkRbu9r8pmZ"), _id: "dnd5echarmed0000"},
	{
		_id: "dnd5econfused000",
		id: "confused",
		reference: RULES_REF("WJFtNc5UraHVrV5V"),
		changes: [
			{
				key: "flags.midi-qol.OverTime",
				mode: 2,
				value: "turn=start, label=Confused Effect, macro=Compendium.elkan5e.elkan5e-macros.Macro.HW9jG0cdn6BmhzyE",
			},
		]},
	{ id: "cursed", reference: RULES_REF("Vpwu9GQC6HVNZFze"), _id: "dnd5ecursed00000"},
	{ id: "dazed", reference: RULES_REF("0BYyVwipnS55gVFq"), _id: "dnd5edazed000000"},
	{
		_id: "dnd5edeafened000",
		id: "deafened",
		reference: RULES_REF("AHgIwuNdpp0wKF2y"),
		changes: [{ key: "system.abilities.dex.save.roll.mode", mode: 5, value: "-1" }]},
	{ id: "diseased", reference: RULES_REF("diseasedRule"), _id: "dnd5ediseased000"},
	{ id: "drained", reference: RULES_REF("ZnhMIMgPZv1QDxzZ"), _id: "dnd5edrained0000"},
	{ id: "exhaustion", reference: RULES_REF("mPzXN6MW8L6ePFmq"), image: false, _id: "dnd5eexhaustion0"},
	{
		_id: "dnd5efrightened0",
		id: "frightened",
		reference: RULES_REF("ruwpm6lorwoPJsmt"),
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.check.all", mode: 5, value: "1" },
		]},
	{ id: "goaded", reference: RULES_REF("IVZ318d1P8WBcDxN"), _id: "dnd5egoaded00000"},
	{ id: "grappled", reference: RULES_REF("zaI1nuc41wANKoFX"), _id: "dnd5egrappled000"},
	{
		_id: "dnd5ehasted00000",
		id: "hasted",
		reference: RULES_REF("8dnyv0szJi7dCz74"),
		changes: [
			{ key: "system.attributes.ac.bonus", mode: 2, value: "+2" },
			{ key: "system.abilities.dex.bonuses.save", mode: 2, value: "+2" },
			{ key: "system.attributes.movement.all", mode: 0, value: "*2" },
		]},
	{
		_id: "dnd5eincapacitat",
		id: "incapacitated",
		reference: RULES_REF("PXI4uoXj7x6IsDXt"),
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
		_id: "dnd5einvisible00",
		id: "invisible",
		reference: RULES_REF("GfTD899cLRZxGG1H"),
		changes: [
			{ key: "flags.midi-qol.advantage.attack.all", mode: 5, value: "!Boolean(target?.canSee)" },
			{ key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 5, value: "!Boolean(canSee)" },
			{ key: "system.skills.ste.roll.mode", mode: 5, value: "1" },
			{ key: "flags.midi-qol.noOpportunityAttack", mode: 5, value: "!Boolean(canSee)" },
		]},
	{
		_id: "dnd5eparalyzed00",
		id: "paralyzed",
		reference: RULES_REF("w5RoCYZIujGYuiYt"),
		changes: [
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.critical.mwak", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.critical.msak", mode: 5, value: "1" },
		]},
	{
		_id: "dnd5epetrified00",
		id: "petrified",
		reference: RULES_REF("n0BX8pLecgm7E3uH"),
		changes: [
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" },
			{ key: "system.traits.dr.all", mode: 0, value: "physical" },
			{ key: "system.traits.dr.all", mode: 0, value: "magical" },
			{ key: "system.traits.di.value", mode: 2, value: "poison" },
			{ key: "system.traits.ci.value", mode: 2, value: "poisoned" },
			{ key: "system.traits.ci.value", mode: 2, value: "diseased" },
		]},
	{
		_id: "dnd5epoisoned000",
		id: "poisoned",
		reference: RULES_REF("fzEf89TZ1WN90bFv"),
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.check.all", mode: 5, value: "1" },
		]},
	{
		_id: "dnd5eprone000000",
		id: "prone",
		reference: RULES_REF("y8L5Uq1jMVDsQjaS"),
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.advantage.attack.mwak", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.advantage.attack.msak", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.disadvantage.attack.rwak", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.disadvantage.attack.rsak", mode: 5, value: "1" },
		]},
	{
		_id: "dnd5erestrained0",
		id: "restrained",
		reference: RULES_REF("DiWd3u4HCD7JEw8V"),
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" },
			{ key: "system.abilities.dex.save.roll.mode", mode: 5, value: "-1" },
			{ key: "flags.midi-qol.fail.spell.somatic", mode: 5, value: "1" },
		]},
	{
		_id: "dnd5esilenced000",
		id: "silenced",
		reference: RULES_REF("F51xrE7Mj8VeM3b8"),
		changes: [{ key: "flags.midi-qol.fail.spell.verbal", mode: 5, value: "1" }]},
	{
		_id: "dnd5esiphoned000",
		id: "siphoned",
		reference: RULES_REF("SthB8javJuFySiBg"),
		changes: [
			{ key: "flags.midi-qol.grants.advantage.ability.save.all", mode: 5, value: "1" },
			{
				key: "flags.midi-qol.onUseMacroName",
				mode: 0,
				value: "Compendium.elkan5e.elkan5e-macros.Macro.4X80aHI9r8I9aSKG, preDamageApplication",
			},
		]},
	{
		_id: "dnd5eslowed00000",
		id: "slowed",
		reference: RULES_REF("kkbgHooTzrtu4q8T"),
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.noReactions", mode: 5, value: "1" },
			{ key: "system.attributes.ac.bonus", mode: 2, value: "-2" },
			{ key: "system.abilities.dex.bonuses.save", mode: 2, value: "-2" },
		]},
	{
		_id: "dnd5estunned0000",
		id: "stunned",
		reference: RULES_REF("JV8kbMo0p5S1YXUR"),
		changes: [{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" }]},
	{
		_id: "dnd5esurprised00",
		id: "surprised",
		reference: RULES_REF("QOZeW0m8RCdVg6UE"),
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
				showIcon: true},
			core: { statusId: "surprised" }}},
	{ id: "transformed", reference: RULES_REF("2kJ5SzS51DN33kWJ"), _id: "dnd5etransformed"},
	{
		_id: "dnd5eunconscious",
		id: "unconscious",
		reference: RULES_REF("ZwhWWUPJvpFCz8sK"),
		changes: [
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.noReactions", mode: 5, value: "1" },
		]},
	{
		_id: "dnd5eweakened000",
		id: "weakened",
		reference: RULES_REF("iJT3cWvyTNBv1L5h"),
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
		]},
	{ id: "concentrating", reference: RULES_REF("4ZOHN6tGvj54J6Kv"), special: "CONCENTRATING", _id: "dnd5econcentrati"},
];

const STATUS_DEFS = [

	{
		id: "bleeding",
		_id: "dnd5ebleeding000",
		pseudo: true,
		icon: "modules/elkan5e/icons/statuses/bleeding.svg",
		flags: {
			core: { statusId: "bleeding" }}},
	{
		_id: "dnd5eburning0000",
		pseudo: true,
		id: "burning",
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
				showIcon: true},
			core: {
				statusId: "burning"}}},
	{
		_id: "dnd5edehydration",
		pseudo: true,
		id: "dehydration",
		reference: HAZARD_RULES_REF("xZRo576gFkVzqTAA"),
		icon: "modules/elkan5e/icons/hazards/dehydration.svg",
		statuses: ["exhaustion"]},
	{
		_id: "dnd5emalnutritio",
		pseudo: true,
		id: "malnutrition",
		reference: HAZARD_RULES_REF("IxUkC78G9mRb3xQO"),
		icon: "modules/elkan5e/icons/hazards/malnutrition.svg",
		statuses: ["exhaustion"]},
	{
		_id: "dnd5efalling0000",
		pseudo: true,
		id: "falling",
		reference: HAZARD_RULES_REF("TDbwlHfW1Kd4sLIZ"),
		icon: "modules/elkan5e/icons/hazards/falling.svg"},
	{
		_id: "dnd5esuffocation",
		pseudo: true,
		id: "suffocation",
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
				suffocation: true}}},
	{
		_id: "dnd5ecoverHalf00",
		pseudo: true,
		id: "coverHalf",
		reference: RULES_REF("1BmTbnT3xDPqv9dq"),
		icon: "modules/elkan5e/icons/conditions/cover-half.svg",
		order: 2,
		exclusiveGroup: "cover",
		coverBonus: 2},
	{
		_id: "dnd5ecoverThreeQ",
		pseudo: true,
		id: "coverThreeQuarters",
		reference: RULES_REF("1BmTbnT3xDPqv9dq"),
		icon: "modules/elkan5e/icons/conditions/cover-three-quarters.svg",
		order: 3,
		exclusiveGroup: "cover",
		coverBonus: 5},
	{
		_id: "dnd5ecoverTotal0",
		pseudo: true,
		id: "coverTotal",
		reference: RULES_REF("hY5s70xMeG5ISFUA"),
		icon: "modules/elkan5e/icons/conditions/cover-full.svg",
		order: 4,
		exclusiveGroup: "cover",
		changes: [{ key: "flags.midi-qol.neverTarget", mode: 2, value: "10" }]},
	{
		_id: "dnd5eobscuredlig",
		pseudo: true,
		id: "obscuredlightly",
		reference: RULES_REF("Jq7kMUlHodqSbYDD"),
		exclusiveGroup: "obscured",
		order: 5,
		changes: [{ key: "system.skills.ste.roll.mode", mode: 5, value: "1" }]},
	{
		_id: "dnd5eobscuredhea",
		pseudo: true,
		id: "obscuredheavily",
		reference: RULES_REF("UC5VK6i6vqWEUfMn"),
		exclusiveGroup: "obscured",
		order: 6,
		changes: [
			{ key: "flags.midi-qol.advantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.ability.check.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.ability.save.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.skill.all", mode: 5, value: "1" },
		]},
	{
		id: "dodging",
		_id: "dnd5edodging0000",
		pseudo: true,
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.check.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.save.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.skill.all", mode: 5, value: "1" },
		],
		flags: {
			dae: {
				transfer: false,
				stackable: "none",
				specialDuration: ["turnStart"],
				disableIncapacitated: true,
				showIcon: true},
			core: { statusId: "dodging" }}},
	{
		id: "concentrating",
		_id: "dnd5econcentrati",
		pseudo: true,
		icon: "modules/elkan5e/icons/conditions/concentrating.svg",
		flags: {
			core: { statusId: "concentrating" }}},
	{ id: "dead", pseudo: true, special: "DEFEATED", _id: "dnd5edead0000000"},
	{ id: "hiding", pseudo: true, _id: "dnd5ehiding00000"},
	{
		id: "squeezing",
		_id: "dnd5esqueezing00",
		pseudo: true,
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "system.abilities.dex.save.roll.mode", mode: 5, value: "-1" },
			{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 5, value: "1" },
			{ key: "system.attributes.movement.all", mode: 0, value: "*0.5" },
		]},
	{
		id: "advantage",
		_id: "dnd5eadvantage00",
		img: "icons/svg/upgrade.svg",
		pseudo: true,
		exclusiveGroup: "elkan-advantage-mode",
		order: 9998,
		changes: [
			{ key: "flags.midi-qol.advantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.ability.check.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.ability.save.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.advantage.skill.all", mode: 5, value: "1" },
		],
		flags: { core: { statusId: "advantage" } }},
	{
		id: "disadvantage",
		_id: "dnd5edisadvantag",
		img: "icons/svg/downgrade.svg",
		pseudo: true,
		exclusiveGroup: "elkan-advantage-mode",
		order: 9999,
		changes: [
			{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.check.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.ability.save.all", mode: 5, value: "1" },
			{ key: "flags.midi-qol.disadvantage.skill.all", mode: 5, value: "1" },
		],
		flags: { core: { statusId: "disadvantage" } }},
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

function mirrorStatusEffect(key, def, ct) {
	if (!ct.statusOnly && !def.mirrorStatusEffect) return;
	const existingStatus = getStatusEffectEntry(key);
	const normalized = normalizeStatusEffectEntry(key, existingStatus);
	setStatusEffectEntry(key, {
		...normalized,
		...ct,
	});
}

function applyConditionDef(def, { statusOnly: forcedStatusOnly } = {}) {
	const key = def.id;
	const statusOnly = forcedStatusOnly ?? def.statusOnly ?? Boolean(def.pseudo);
	const registerConditionType = !statusOnly;
	const ct = registerConditionType ? (CONFIG.DND5E.conditionTypes[key] ??= {}) : {};
	ct.name = game.i18n.localize(`elkan5e.conditions.${key}`);

	const reference =
		def.reference ?? (def.id ? RULES_REF(def.id) : undefined);
	if (reference) ct.reference = reference;
	if (def.icon) {
		ct.img = def.icon;
	} else if (def.image !== false) {
		ct.img = imgFor(key, ct.img);
	}
	if (def.changes?.length) ct.changes = mergeChanges(ct.changes, def.changes);
	if (def.flags) ct.flags = mergeFlags(ct.flags, def.flags);
	if (Array.isArray(def.statuses) && def.statuses.length) {
		ct.statuses = foundry.utils.duplicate(def.statuses);
	}
	// Pass through any extra definition fields (e.g., id, special) unless explicitly handled above.
	const passthrough = { ...def };
	delete passthrough.icon;
	delete passthrough.image;
	delete passthrough.reference;
	delete passthrough.changes;
	delete passthrough.flags;
	delete passthrough.statuses;
	delete passthrough.exclusiveGroup;
	delete passthrough.coverBonus;
	delete passthrough.pseudo;
	delete passthrough.statusOnly;
	delete passthrough.mirrorStatusEffect;
	foundry.utils.mergeObject(ct, passthrough, {
		inplace: true,
		recursive: true,
		insertKeys: true,
		overwrite: true,
	});

	if (def.pseudo != null) ct.pseudo = def.pseudo;
	if (statusOnly) ct.statusOnly = true;

	if (def.exclusiveGroup != null) ct.exclusiveGroup = def.exclusiveGroup;
	if (def.coverBonus != null) ct.coverBonus = def.coverBonus;

	if (!registerConditionType) {
		if (CONFIG.DND5E.conditionTypes?.[key]) {
			delete CONFIG.DND5E.conditionTypes[key];
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

function ensureDaeAutoFields() {
	const daeModule = game.modules.get("dae");
	if (!daeModule?.active) return;
	const addAutoFields = globalThis.DAE?.addAutoFields;
	if (typeof addAutoFields !== "function") return;

	try {
		addAutoFields(["flags.elkan5e.burning"]);
	} catch (err) {
		console.warn("Elkan 5e | Failed to register DAE auto fields", err);
	}
}



export function conditions() {
	const conditionsSetting = game.settings.get("elkan5e", "conditionsSettings");

	// Remove extras (a|d)
	const removeExtras = conditionsSetting === "a" || conditionsSetting === "d";
	const applyElkan = conditionsSetting === "a" || conditionsSetting === "b";

	if (removeExtras) {
		for (const key of CONDITION_TYPE_REMOVE) delete CONFIG.DND5E.conditionTypes[key];
		for (const key of STATUS_EFFECT_REMOVE) removeStatusEffectEntry(key);
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
		const effects = CONFIG.DND5E.conditionEffects;
		if (effects) {
			effects.abilityCheckDisadvantage?.delete?.("exhaustion-1");
			effects.halfMovement?.delete?.("exhaustion-2");
			effects.abilitySaveDisadvantage?.delete?.("exhaustion-3");
			effects.halfHealth?.delete?.("exhaustion-4");
			effects.noMovement?.delete?.("exhaustion-5");
			effects.attackDisadvantage?.delete?.("blinded");
			effects.dexteritySaveDisadvantage?.delete?.("blinded");
			effects.halfMovement?.delete?.("blinded");
			effects.dexteritySaveDisadvantage?.delete?.("deafened");
		}
	}

	for (const def of CONDITION_DEFS) {
		const key = def.id;
		if (removeExtras && REMOVABLE_CONDITION_KEYS.has(key)) continue;
		const ct = applyConditionDef(def);
		mirrorStatusEffect(key, def, ct);
	}
	for (const def of STATUS_DEFS) {
		const key = def.id;
		const ct = applyConditionDef(def, { statusOnly: true });
		mirrorStatusEffect(key, def, ct);
	}
	applyStatusIcons();
}

export function conditionsReady() {
	for (const def of CONDITION_DEFS) {
		const key = def.id;
		const ct = applyConditionDef(def);

		// Mirror into statusEffects for backwards compat
		mirrorStatusEffect(key, def, ct);
	}
	for (const def of STATUS_DEFS) {
		const key = def.id;
		const ct = applyConditionDef(def);
		mirrorStatusEffect(key, def, ct);
	}
	applyStatusIcons();

	ensureMidiInvisibleVisionRule();
	ensureDaeAutoFields();
}

